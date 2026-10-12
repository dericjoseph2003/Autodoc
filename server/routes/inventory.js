const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Part = require('../models/Part');
const ServiceCenter = require('../models/ServiceCenter');

/**
 * Helper to join Inventory items with Part catalog details
 */
const attachPartDetails = async (inventoryItems) => {
  if (!inventoryItems || inventoryItems.length === 0) return [];

  const skus = [...new Set(inventoryItems.map((item) => item.partSku))];
  const parts = await Part.find({ sku: { $in: skus } }).lean();

  const partsMap = {};
  for (const part of parts) {
    partsMap[part.sku] = part;
  }

  return inventoryItems.map((item) => {
    const itemObj = item.toObject ? item.toObject({ virtuals: true }) : { ...item };
    const partObj = partsMap[itemObj.partSku] || null;

    if (partObj) {
      itemObj.part = {
        name: partObj.name,
        brand: partObj.brand,
        category: partObj.category,
        imageUrl: partObj.imageUrl || '',
        unit: partObj.unit || 'piece',
        costPrice: partObj.costPrice,
        catalogSellingPrice: partObj.sellingPrice,
        compatibleVehicleIds: partObj.compatibleVehicleIds || []
      };
    } else {
      itemObj.part = null;
    }

    return itemObj;
  });
};

/**
 * GET /api/inventory/low-stock
 * Query params: serviceCenterId
 * Returns low-stock items for a service center (or all centers if unspecified)
 */
router.get('/low-stock', async (req, res) => {
  try {
    const { serviceCenterId } = req.query;
    const query = {};

    if (serviceCenterId) {
      query.serviceCenterId = serviceCenterId;
    }

    const allItems = await Inventory.find(query);
    const lowStockItems = allItems.filter((item) => item.stockQuantity <= item.reorderLevel);
    const joined = await attachPartDetails(lowStockItems);

    res.json({
      success: true,
      count: joined.length,
      data: joined,
      inventory: joined
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/inventory
 * Query params: serviceCenterId, lowStockOnly
 * Returns a center's full inventory joined with Part details
 */
router.get('/', async (req, res) => {
  try {
    const { serviceCenterId, lowStockOnly } = req.query;
    const query = {};

    if (serviceCenterId) {
      query.serviceCenterId = serviceCenterId;
    }

    let items = await Inventory.find(query).sort({ updatedAt: -1 });

    if (lowStockOnly === 'true') {
      items = items.filter((item) => item.stockQuantity <= item.reorderLevel);
    }

    const joined = await attachPartDetails(items);

    res.json({
      success: true,
      count: joined.length,
      data: joined,
      inventory: joined
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/inventory/:id
 * Single inventory item by ID
 */
router.get('/:id', async (req, res) => {
  try {
    const item = await Inventory.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }

    const [joined] = await attachPartDetails([item]);
    res.json({ success: true, data: joined, inventory: joined });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * POST /api/inventory
 * Add a new inventory record { serviceCenterId, partSku, stockQuantity, reorderLevel, sellingPrice }
 */
router.post('/', async (req, res) => {
  try {
    const { serviceCenterId, partSku, stockQuantity, reorderLevel, sellingPrice, lastRestockedAt } = req.body;

    if (!serviceCenterId || !partSku || stockQuantity === undefined || sellingPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide serviceCenterId, partSku, stockQuantity, and sellingPrice'
      });
    }

    // Verify partSku exists in Part catalog
    const partExists = await Part.findOne({ sku: partSku });
    if (!partExists) {
      return res.status(400).json({
        success: false,
        message: `Part SKU '${partSku}' does not exist in the Part catalog`
      });
    }

    // Verify serviceCenterId exists
    const centerExists = await ServiceCenter.findOne({
      $or: [{ serviceCenterId }, { _id: serviceCenterId.match(/^[0-9a-fA-F]{24}$/) ? serviceCenterId : null }]
    });
    if (!centerExists) {
      return res.status(400).json({
        success: false,
        message: `Service center '${serviceCenterId}' does not exist`
      });
    }

    // Check for duplicate (serviceCenterId, partSku)
    const existingRecord = await Inventory.findOne({ serviceCenterId, partSku });
    if (existingRecord) {
      return res.status(400).json({
        success: false,
        message: `An inventory record for center '${serviceCenterId}' and partSku '${partSku}' already exists`
      });
    }

    const inventory = new Inventory({
      serviceCenterId,
      partSku,
      stockQuantity: Number(stockQuantity),
      reorderLevel: reorderLevel !== undefined ? Number(reorderLevel) : 5,
      sellingPrice: Number(sellingPrice),
      lastRestockedAt: lastRestockedAt || Date.now()
    });

    await inventory.save();
    const [joined] = await attachPartDetails([inventory]);

    res.status(201).json({
      success: true,
      message: 'Inventory record created successfully',
      data: joined,
      inventory: joined
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * PUT /api/inventory/:id
 * Edit an inventory record
 */
router.put('/:id', async (req, res) => {
  try {
    const { stockQuantity, reorderLevel, sellingPrice, lastRestockedAt } = req.body;

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }

    if (stockQuantity !== undefined) inventory.stockQuantity = Number(stockQuantity);
    if (reorderLevel !== undefined) inventory.reorderLevel = Number(reorderLevel);
    if (sellingPrice !== undefined) inventory.sellingPrice = Number(sellingPrice);
    if (lastRestockedAt !== undefined) inventory.lastRestockedAt = lastRestockedAt;

    await inventory.save();
    const [joined] = await attachPartDetails([inventory]);

    res.json({
      success: true,
      message: 'Inventory record updated successfully',
      data: joined,
      inventory: joined
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/inventory/:id/stock
 * Adjust stockQuantity by delta (floored at 0)
 */
router.patch('/:id/stock', async (req, res) => {
  try {
    const { delta } = req.body;
    if (delta === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide delta in body' });
    }

    const inventory = await Inventory.findById(req.params.id);
    if (!inventory) {
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }

    const newQuantity = Math.max(0, inventory.stockQuantity + Number(delta));
    inventory.stockQuantity = newQuantity;
    if (Number(delta) > 0) {
      inventory.lastRestockedAt = new Date();
    }

    await inventory.save();
    const [joined] = await attachPartDetails([inventory]);

    res.json({
      success: true,
      message: `Stock adjusted by ${delta}. New stock: ${newQuantity}`,
      data: joined,
      inventory: joined
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/inventory/:id
 * Remove a part from a service center's inventory
 */
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Inventory.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Inventory record not found' });
    }

    res.json({
      success: true,
      message: 'Inventory record removed successfully',
      data: deleted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
