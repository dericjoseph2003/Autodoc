const express = require('express');
const router = express.Router();
const Part = require('../models/Part');
const Inventory = require('../models/Inventory');
const ServiceCenter = require('../models/ServiceCenter');

// Helper: Haversine distance calculation in km
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

/**
 * GET /api/parts
 * Query params: search, category, vehicle, page, limit, lowStockOnly, serviceCenter
 */
router.get('/', async (req, res) => {
  try {
    const { search, category, vehicle, page = 1, limit = 50, lowStockOnly, serviceCenter } = req.query;
    const query = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (serviceCenter) {
      const scMatch = await ServiceCenter.findOne({
        $or: [
          { serviceCenterId: serviceCenter },
          ...(serviceCenter.match(/^[0-9a-fA-F]{24}$/) ? [{ _id: serviceCenter }, { user_id: serviceCenter }] : [])
        ]
      });

      const scObjectId = scMatch ? scMatch._id : (serviceCenter.match(/^[0-9a-fA-F]{24}$/) ? serviceCenter : null);
      const scCode = scMatch ? scMatch.serviceCenterId : serviceCenter;

      const invRecords = await Inventory.find({
        $or: [
          { serviceCenterId: scCode },
          ...(scObjectId ? [{ serviceCenterId: String(scObjectId) }] : [])
        ]
      });
      const invSkus = invRecords.map((i) => i.partSku);

      const scOrConditions = [];
      if (scObjectId) {
        scOrConditions.push({ serviceCenter: scObjectId });
      }
      if (invSkus.length > 0) {
        scOrConditions.push({ sku: { $in: invSkus } });
      }

      if (scOrConditions.length > 0) {
        query.$or = scOrConditions;
      } else {
        query._id = null;
      }
    }

    if (vehicle) {
      const vehicleRegex = new RegExp(vehicle, 'i');
      query.compatibleVehicles = vehicleRegex;
    }

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { brand: searchRegex },
        { sku: searchRegex },
        { category: searchRegex },
        { compatibleVehicles: searchRegex }
      ];
    }

    let rawParts = await Part.find(query)
      .populate('serviceCenter', 'service_center_name city phone address')
      .sort({ createdAt: -1 })
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit));

    if (lowStockOnly === 'true') {
      rawParts = rawParts.filter((p) => p.stockQuantity <= p.reorderLevel);
    }

    // Format parts to ensure every part has an explicit id property
    const formattedParts = rawParts.map((p) => {
      const obj = p.toObject ? p.toObject({ virtuals: true }) : { ...p };
      obj.id = obj.id || (obj._id ? obj._id.toString() : obj.sku);
      return obj;
    });

    // Show parts uniquely (deduplicated by id/sku)
    const uniqueMap = new Map();
    for (const p of formattedParts) {
      const uniqueKey = p.id || p.sku;
      if (uniqueKey && !uniqueMap.has(uniqueKey)) {
        uniqueMap.set(uniqueKey, p);
      }
    }
    const uniqueParts = Array.from(uniqueMap.values());

    res.json({
      success: true,
      data: uniqueParts,
      parts: uniqueParts,
      spareParts: uniqueParts,
      total: uniqueParts.length,
      page: Number(page),
      limit: Number(limit)
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});

/**
 * GET /api/parts/low-stock
 * Dashboard "Inventory Parts" alert count & data
 */
router.get('/low-stock', async (req, res) => {
  try {
    const parts = await Part.find({ isActive: true });
    const lowStock = parts.filter((p) => p.stockQuantity <= p.reorderLevel);
    res.json({ success: true, count: lowStock.length, data: lowStock, parts: lowStock });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});

/**
 * GET /api/parts/compare/:sku
 * Price comparison for a part across all service centers stocking it (legacy route)
 */
router.get('/compare/:sku', async (req, res) => {
  try {
    const { sku } = req.params;
    const searchRegex = new RegExp(sku.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), 'i');

    const matchingParts = await Part.find({
      isActive: true,
      $or: [{ sku: searchRegex }, { name: searchRegex }]
    }).populate('serviceCenter', 'service_center_name city phone service_center_address service_center_latitude service_center_longitude service_center_rating');

    res.json({
      success: true,
      count: matchingParts.length,
      offers: matchingParts.map(p => ({
        partId: p._id,
        sku: p.sku,
        name: p.name,
        brand: p.brand,
        sellingPrice: p.sellingPrice,
        availabilityStatus: p.stockQuantity > 0 ? 'in_stock' : 'out_of_stock',
        warranty: p.warranty || '12 Months Warranty',
        serviceCenter: p.serviceCenter || null
      }))
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/parts/:sku/availability
 * Cross-center availability endpoint for a given part SKU.
 * Returns every service center stocking it with stockQuantity, sellingPrice, and distance (if lat/lng provided).
 * Sorted by sellingPrice ascending by default.
 */
router.get('/:sku/availability', async (req, res) => {
  try {
    const { sku } = req.params;
    const { lat, lng, sortBy } = req.query;

    const part = await Part.findOne({
      sku: { $regex: new RegExp(`^${sku.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i') }
    });

    if (!part) {
      return res.status(404).json({
        success: false,
        message: `Part with SKU '${sku}' not found in catalog`
      });
    }

    const inventoryRecords = await Inventory.find({ partSku: part.sku });

    if (inventoryRecords.length === 0) {
      return res.json({
        success: true,
        sku: part.sku,
        partName: part.name,
        count: 0,
        availability: [],
        data: []
      });
    }

    const centerIds = inventoryRecords.map((inv) => inv.serviceCenterId);
    const serviceCenters = await ServiceCenter.find({
      $or: [
        { serviceCenterId: { $in: centerIds } },
        { _id: { $in: centerIds.filter((id) => id.match(/^[0-9a-fA-F]{24}$/)) } }
      ]
    });

    const centersMap = {};
    for (const sc of serviceCenters) {
      const idKey = sc.serviceCenterId || sc._id.toString();
      centersMap[idKey] = sc;
    }

    const hasCoords = lat !== undefined && lng !== undefined && !isNaN(Number(lat)) && !isNaN(Number(lng));
    const userLat = hasCoords ? Number(lat) : null;
    const userLng = hasCoords ? Number(lng) : null;

    const resultList = inventoryRecords.map((inv) => {
      const sc = centersMap[inv.serviceCenterId] || null;
      let centerData = null;
      let distanceKm = null;

      if (sc) {
        const scObj = sc.toObject ? sc.toObject({ virtuals: true }) : sc;
        const scLat = scObj.location?.lat || scObj.service_center_latitude || 0;
        const scLng = scObj.location?.lng || scObj.service_center_longitude || 0;

        if (hasCoords) {
          distanceKm = calculateDistanceKm(userLat, userLng, scLat, scLng);
        }

        centerData = {
          serviceCenterId: scObj.serviceCenterId || scObj._id,
          name: scObj.name || scObj.service_center_name || scObj.businessName,
          type: scObj.type || 'Multi-brand Service Center',
          location: scObj.location && scObj.location.address ? scObj.location : {
            address: scObj.service_center_address || '',
            city: scObj.city || '',
            lat: scLat,
            lng: scLng
          },
          status: scObj.status || scObj.approvalStatus || 'Approved',
          contact: scObj.contact && scObj.contact.phone ? scObj.contact : {
            phone: scObj.service_center_phone_number || scObj.phone || '',
            email: scObj.email || ''
          },
          rating: scObj.rating !== undefined ? scObj.rating : (scObj.service_center_rating || 0)
        };
      } else {
        centerData = {
          serviceCenterId: inv.serviceCenterId,
          name: inv.serviceCenterId,
          type: 'Multi-brand Service Center'
        };
      }

      const item = {
        inventoryId: inv._id,
        serviceCenterId: inv.serviceCenterId,
        serviceCenter: centerData,
        stockQuantity: inv.stockQuantity,
        reorderLevel: inv.reorderLevel,
        sellingPrice: inv.sellingPrice,
        isLowStock: inv.stockQuantity <= inv.reorderLevel,
        lastRestockedAt: inv.lastRestockedAt
      };

      if (distanceKm !== null) {
        item.distanceKm = distanceKm;
      }

      return item;
    });

    // Sorting: default sellingPrice ascending. If sortBy === 'distance', sort by distanceKm.
    if (sortBy === 'distance' && hasCoords) {
      resultList.sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0));
    } else {
      resultList.sort((a, b) => a.sellingPrice - b.sellingPrice);
    }

    res.json({
      success: true,
      sku: part.sku,
      partName: part.name,
      part: {
        sku: part.sku,
        name: part.name,
        brand: part.brand,
        category: part.category,
        catalogPrice: part.sellingPrice
      },
      count: resultList.length,
      availability: resultList,
      data: resultList
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/parts/:id/stock-alert
 * Subscribe for back-in-stock notification
 */
router.post('/:id/stock-alert', async (req, res) => {
  try {
    const { id } = req.params;
    const part = await Part.findById(id);
    if (!part) return res.status(404).json({ success: false, error: 'Part not found' });

    res.json({
      success: true,
      message: `Stock alert registered for ${part.name}. You will be notified when back in stock!`
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/parts/:id
 */
router.get('/:id', async (req, res) => {
  try {
    const part = await Part.findById(req.params.id);
    if (!part) return res.status(404).json({ success: false, error: 'Part not found' });
    res.json({ success: true, part, data: part });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/parts
 */
router.post('/', async (req, res) => {
  try {
    const body = { ...req.body };

    if (!body.name && body.spare_part_name) body.name = body.spare_part_name;
    if (!body.sellingPrice && body.spare_part_price) body.sellingPrice = Number(body.spare_part_price);
    if (!body.costPrice && body.sellingPrice) body.costPrice = Math.round(body.sellingPrice * 0.8);
    if (!body.category && body.spare_part_category) body.category = body.spare_part_category;
    if (body.stock !== undefined && body.stockQuantity === undefined) body.stockQuantity = Number(body.stock);

    if (!body.sku) {
      const prefix = (body.category || 'PART').substring(0, 3).toUpperCase();
      const rand = Math.floor(1000 + Math.random() * 9000);
      body.sku = `${prefix}-${rand}`;
    }

    if (!body.brand) {
      body.brand = 'Generic';
    }

    const part = new Part(body);
    await part.save();
    res.status(201).json({ success: true, data: part, part, sparePart: part });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message, message: err.message });
  }
});

/**
 * PUT /api/parts/:id
 */
router.put('/:id', async (req, res) => {
  try {
    const body = { ...req.body };
    if (!body.name && body.spare_part_name) body.name = body.spare_part_name;
    if (!body.sellingPrice && body.spare_part_price) body.sellingPrice = Number(body.spare_part_price);

    const part = await Part.findByIdAndUpdate(req.params.id, body, {
      new: true,
      runValidators: true,
    });
    if (!part) return res.status(404).json({ success: false, error: 'Part not found' });
    res.json({ success: true, data: part, part, sparePart: part });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message, message: err.message });
  }
});

/**
 * PATCH /api/parts/:id/stock
 */
router.patch('/:id/stock', async (req, res) => {
  try {
    const { delta } = req.body;
    const part = await Part.findById(req.params.id);
    if (!part) return res.status(404).json({ success: false, error: 'Part not found' });

    part.stockQuantity = Math.max(0, part.stockQuantity + Number(delta || 0));
    await part.save();
    res.json({ success: true, data: part, part, sparePart: part });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message, message: err.message });
  }
});

/**
 * DELETE /api/parts/:id
 */
router.delete('/:id', async (req, res) => {
  try {
    const part = await Part.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!part) return res.status(404).json({ success: false, error: 'Part not found' });
    res.json({ success: true, message: 'Part deactivated', data: part, part });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message, message: err.message });
  }
});

module.exports = router;
