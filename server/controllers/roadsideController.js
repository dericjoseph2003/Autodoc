const RoadsideRequest = require('../models/RoadsideRequest');

/**
 * Create Roadside Request
 * POST /api/roadside-requests
 * Owner submits an emergency roadside request.
 */
const createRoadsideRequest = async (req, res, next) => {
  try {
    const {
      location,
      vehicleDescription,
      issueDescription,
      type, roadside_request_type,
      vehicle_id, vehicle,
      latitude, roadside_request_latitude,
      longitude, roadside_request_longitude,
      priorityScore, roadside_request_priority_score
    } = req.body;

    const inputType = roadside_request_type || type || issueDescription || 'breakdown';
    const currentUserId = req.user._id || req.user.user_id || req.user.id;
    const inputVehicleId = vehicle_id || vehicle || null;

    if (!location && !inputType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide roadside_request_type and location'
      });
    }

    const request = await RoadsideRequest.create({
      user_id: currentUserId,
      vehicle_id: inputVehicleId,
      roadside_request_type: inputType,
      roadside_request_latitude: roadside_request_latitude !== undefined ? roadside_request_latitude : (latitude || 0),
      roadside_request_longitude: roadside_request_longitude !== undefined ? roadside_request_longitude : (longitude || 0),
      roadside_request_priority_score: roadside_request_priority_score !== undefined ? roadside_request_priority_score : (priorityScore || 0),
      roadside_request_status: 'pending',
      location: location || 'Live Location',
      vehicleDescription: vehicleDescription || 'Vehicle',
      issueDescription: issueDescription || inputType
    });

    res.status(201).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

/**
 * List Roadside Requests
 * GET /api/roadside-requests
 * - Owner: sees their own requests
 * - Service Center / Admin: sees all pending and active requests
 */
const listRoadsideRequests = async (req, res, next) => {
  try {
    let query = {};
    const currentUserId = req.user._id || req.user.user_id || req.user.id;

    if (req.user.user_role === 'owner') {
      query.user_id = currentUserId;
    }

    const requests = await RoadsideRequest.find(query)
      .populate('user_id', 'user_full_name user_phone_number user_email')
      .populate('vehicle_id', 'vehicle_make vehicle_model vehicle_registration_number')
      .sort({ roadside_request_created_at: -1 });

    res.status(200).json({ success: true, requests });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Roadside Request Status
 * PATCH /api/roadside-requests/:id/status
 * Service Center or Admin can update status.
 */
const updateRoadsideStatus = async (req, res, next) => {
  try {
    const { status, roadside_request_status } = req.body;
    const targetStatus = roadside_request_status || status;
    const validStatuses = ['pending', 'active', 'assigned', 'in_progress', 'resolved'];

    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const request = await RoadsideRequest.findById(req.params.id);
    if (!request) {
      return res.status(404).json({ success: false, message: 'Roadside request not found' });
    }

    request.roadside_request_status = targetStatus;
    await request.save();

    res.status(200).json({ success: true, request });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoadsideRequest,
  listRoadsideRequests,
  updateRoadsideStatus
};
