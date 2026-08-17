const SparePart = require('../models/SparePart');

/**
 * List Spare Parts
 * GET /api/spare-parts
 * Publicly accessible — returns all spare parts.
 * Optionally filter by ?serviceCenter=<id> or ?category=<cat>
 */
const listSpareParts = async (req, res, next) => {
  try {
    const query = {};

    if (req.query.serviceCenter) {
      query.serviceCenter = req.query.serviceCenter;
    }
    const cat = req.query.spare_part_category || req.query.category;
    if (cat) {
      query.spare_part_category = cat;
    }

    const spareParts = await SparePart.find(query)
      .populate('serviceCenter', 'service_center_name city')
      .sort({ spare_part_created_at: -1 });

    res.status(200).json({ success: true, spareParts });
  } catch (error) {
    next(error);
  }
};

/**
 * Create Spare Part
 * POST /api/spare-parts
 * Admin or Service Center can create a spare part listing.
 */
const createSparePart = async (req, res, next) => {
  try {
    const {
      name, spare_part_name,
      partNumber,
      category, spare_part_category,
      description,
      price, spare_part_price,
      stock, availability, spare_part_availability_status,
      compatibility, compatibleVehicles, spare_part_vehicle_compatibility,
      type, spare_part_type,
      imageUrl
    } = req.body;

    const inputName = spare_part_name || name;
    const inputPrice = spare_part_price !== undefined ? spare_part_price : price;
    const inputCategory = spare_part_category || category || 'Other';
    const inputType = spare_part_type || type || 'OEM';
    const inputCompatibility = spare_part_vehicle_compatibility || compatibility || (Array.isArray(compatibleVehicles) ? compatibleVehicles.join(', ') : 'All');
    const inputAvailability = spare_part_availability_status || availability || (stock > 0 ? 'in_stock' : 'out_of_stock');

    if (!inputName || inputPrice === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least spare_part_name and spare_part_price'
      });
    }

    let serviceCenterId = req.body.serviceCenter || null;
    if (req.user.user_role === 'service_center' && !serviceCenterId) {
      const ServiceCenter = require('../models/ServiceCenter');
      const currentUserId = req.user._id || req.user.user_id || req.user.id;
      const sc = await ServiceCenter.findOne({ user_id: currentUserId });
      if (sc) serviceCenterId = sc._id;
    }

    const sparePart = await SparePart.create({
      spare_part_name: inputName,
      partNumber,
      spare_part_category: inputCategory,
      description,
      spare_part_price: inputPrice,
      spare_part_availability_status: inputAvailability,
      spare_part_vehicle_compatibility: inputCompatibility,
      spare_part_type: inputType,
      serviceCenter: serviceCenterId,
      imageUrl: imageUrl || null
    });

    res.status(201).json({ success: true, sparePart });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listSpareParts,
  createSparePart
};
