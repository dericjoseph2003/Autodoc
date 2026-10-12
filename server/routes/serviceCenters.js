const express = require('express');
const router = express.Router();
const ServiceCenter = require('../models/ServiceCenter');
const { protect, authorize } = require('../middleware/auth');
const {
  registerServiceCenter,
  approveServiceCenter,
  deactivateServiceCenter,
  updateApprovalStatus,
  getPendingServiceCenters,
  getServiceCenterDetail,
  getMyServiceCenter,
  updateServiceCenterServices
} = require('../controllers/serviceCenterController');

// Helper: Haversine distance in kilometers
const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
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
 * Helper to normalize ServiceCenter document to clean JSON structure
 */
const formatServiceCenter = (sc, distanceKm = null) => {
  const scObj = sc.toObject ? sc.toObject({ virtuals: true }) : sc;
  const idStr = String(scObj._id || scObj.id || scObj.serviceCenterId || '');
  const result = {
    ...scObj,
    id: idStr,
    _id: idStr,
    serviceCenterId: scObj.serviceCenterId || idStr,
    name: scObj.name || scObj.service_center_name || scObj.businessName,
    service_center_name: scObj.service_center_name || scObj.name || scObj.businessName,
    businessName: scObj.businessName || scObj.service_center_name || scObj.name,
    type: scObj.type || scObj.workshopCategory || scObj.businessType || 'Multi-brand Service Center',
    location: scObj.location && scObj.location.address ? scObj.location : {
      address: scObj.service_center_address || scObj.businessAddress || '',
      city: scObj.city || '',
      lat: scObj.service_center_latitude || 0,
      lng: scObj.service_center_longitude || 0
    },
    status: scObj.status || scObj.approvalStatus || 'Pending',
    contact: scObj.contact && scObj.contact.phone ? scObj.contact : {
      phone: scObj.service_center_phone_number || scObj.phone || '',
      email: scObj.email || ''
    },
    rating: scObj.rating !== undefined ? scObj.rating : (scObj.service_center_rating || 0)
  };

  if (distanceKm !== null) {
    result.distanceKm = distanceKm;
  }

  return result;
};

/**
 * GET /api/service-centers/nearby?lat=&lng=&radiusKm=
 * Search nearby service centers within radiusKm sorted by distance
 */
router.get('/nearby', async (req, res) => {
  try {
    const { lat, lng, radiusKm = 50 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        message: 'Please provide lat and lng query parameters'
      });
    }

    const userLat = Number(lat);
    const userLng = Number(lng);
    const maxRadius = Number(radiusKm);

    const centers = await ServiceCenter.find({
      $or: [
        { status: { $in: ['Approved', 'approved'] } },
        { approvalStatus: { $in: ['Approved', 'approved'] } }
      ]
    });

    const nearbyCenters = centers
      .map((sc) => {
        const scLat = sc.location?.lat || sc.service_center_latitude || 0;
        const scLng = sc.location?.lng || sc.service_center_longitude || 0;
        const dist = calculateDistanceKm(userLat, userLng, scLat, scLng);
        return formatServiceCenter(sc, dist);
      })
      .filter((sc) => sc.distanceKm <= maxRadius)
      .sort((a, b) => a.distanceKm - b.distanceKm);

    res.json({
      success: true,
      count: nearbyCenters.length,
      data: nearbyCenters,
      serviceCenters: nearbyCenters
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/service-centers/pending
 * Admin only: get pending service centers
 */
router.get('/pending', protect, authorize('admin'), getPendingServiceCenters);

/**
 * GET /api/service-centers/:id/detail
 * Admin only: get service center detail
 */
router.get('/:id/detail', protect, authorize('admin'), getServiceCenterDetail);

/**
 * GET /api/service-centers
 * List all Approved centers
 */
router.get('/', async (req, res) => {
  try {
    const { status, city } = req.query;

    let query = {};
    if (status) {
      query.$or = [{ status }, { approvalStatus: status }];
    } else {
      query.$or = [
        { status: { $in: ['Approved', 'approved'] } },
        { approvalStatus: { $in: ['Approved', 'approved'] } },
        { service_center_is_verified: true }
      ];
    }

    if (city) {
      query.$or = [
        { 'location.city': new RegExp(city, 'i') },
        { city: new RegExp(city, 'i') }
      ];
    }

    const centers = await ServiceCenter.find(query);
    const formatted = centers.map((sc) => formatServiceCenter(sc));

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
      serviceCenters: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

const { getAvailableSlots } = require('../controllers/appointmentController');

/**
 * GET /api/service-centers/:id/available-slots?date=
 * Get available time slots for a service center on a given date
 */
router.get('/:id/available-slots', getAvailableSlots);

/**
 * GET /api/service-centers/:id
 * Get single service center details by ID or serviceCenterId
 */

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let center = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      center = await ServiceCenter.findById(id);
    }
    if (!center) {
      center = await ServiceCenter.findOne({
        $or: [{ serviceCenterId: id }, { service_center_name: id }]
      });
    }

    if (!center) {
      return res.status(404).json({ success: false, message: 'Service center not found' });
    }

    const formatted = formatServiceCenter(center);
    res.json({
      success: true,
      data: formatted,
      serviceCenter: formatted
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/service-centers/my-center
 * Get profile for logged-in service center
 */
router.get('/my-center', protect, getMyServiceCenter);

/**
 * Protected Admin / Registration Routes
 */
router.post('/', protect, authorize('service_center', 'admin'), registerServiceCenter);
router.patch('/:id/approve', protect, authorize('admin'), approveServiceCenter);
router.patch('/:id/deactivate', protect, authorize('admin'), deactivateServiceCenter);
router.put('/:id/approval', protect, authorize('admin'), updateApprovalStatus);
router.put('/:id/services', protect, authorize('service_center', 'admin'), updateServiceCenterServices);

module.exports = router;
