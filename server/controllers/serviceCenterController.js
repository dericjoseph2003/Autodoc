const ServiceCenter = require('../models/ServiceCenter');
const User = require('../models/User');
const { createNotificationInternal } = require('./notificationController');

/**
 * Register a Service Center profile
 * POST /api/service-centers
 */
const registerServiceCenter = async (req, res, next) => {
  try {
    const {
      businessName, service_center_name,
      businessAddress, service_center_address,
      latitude, service_center_latitude,
      longitude, service_center_longitude,
      phone, service_center_phone_number,
      city,
      pincode,
      businessRegistrationNumber,
      servicesOffered,
      businessDocumentUrl,
      contactPersonName,
      operatingHours
    } = req.body;

    const nameInput = service_center_name || businessName;
    const addressInput = service_center_address || businessAddress;
    const latInput = service_center_latitude !== undefined ? service_center_latitude : latitude;
    const lngInput = service_center_longitude !== undefined ? service_center_longitude : longitude;
    const phoneInput = service_center_phone_number || phone || '';

    if (!nameInput || !addressInput || !city || !pincode || !businessRegistrationNumber || !servicesOffered || !businessDocumentUrl) {
      return res.status(400).json({
        success: false,
        message: 'Please provide service_center_name/businessName, service_center_address/businessAddress, city, pincode, businessRegistrationNumber, servicesOffered, and businessDocumentUrl'
      });
    }

    const currentUserId = req.user._id || req.user.user_id || req.user.id;
    const existingCenter = await ServiceCenter.findOne({ user_id: currentUserId });
    if (existingCenter) {
      return res.status(400).json({
        success: false,
        message: 'This user account is already linked to a registered service center'
      });
    }

    const serviceCenter = await ServiceCenter.create({
      user_id: currentUserId,
      service_center_name: nameInput,
      service_center_address: addressInput,
      service_center_latitude: latInput || 0,
      service_center_longitude: lngInput || 0,
      service_center_phone_number: phoneInput,
      city,
      pincode,
      businessRegistrationNumber,
      servicesOffered: Array.isArray(servicesOffered) ? servicesOffered : [servicesOffered],
      businessDocumentUrl,
      contactPersonName: contactPersonName || '',
      operatingHours: operatingHours || '9:00 AM - 6:00 PM',
      approvalStatus: 'pending',
      status: 'pending',
      service_center_is_verified: false
    });

    await createNotificationInternal(
      currentUserId,
      'Service Center Registration Pending',
      `Your service center '${nameInput}' registration has been submitted and is pending admin approval.`,
      'system'
    );

    res.status(201).json({
      success: true,
      serviceCenter
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Approve a Service Center (Admin only)
 * PATCH /api/service-centers/:id/approve
 */
const approveServiceCenter = async (req, res, next) => {
  try {
    const serviceCenter = await ServiceCenter.findById(req.params.id);
    if (!serviceCenter) {
      return res.status(404).json({
        success: false,
        message: 'Service center not found'
      });
    }

    serviceCenter.approvalStatus = 'approved';
    serviceCenter.status = 'approved';
    serviceCenter.service_center_is_verified = true;
    await serviceCenter.save();

    await createNotificationInternal(
      serviceCenter.user_id,
      'Service Center Approved',
      `Congratulations! Your service center '${serviceCenter.service_center_name}' has been approved by the admin.`,
      'system'
    );

    res.status(200).json({
      success: true,
      message: 'Service center approved successfully',
      serviceCenter
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Deactivate a Service Center (Admin only)
 * PATCH /api/service-centers/:id/deactivate
 */
const deactivateServiceCenter = async (req, res, next) => {
  try {
    const serviceCenter = await ServiceCenter.findById(req.params.id);
    if (!serviceCenter) {
      return res.status(404).json({
        success: false,
        message: 'Service center not found'
      });
    }

    serviceCenter.approvalStatus = 'rejected';
    serviceCenter.status = 'deactivated';
    serviceCenter.service_center_is_verified = false;
    await serviceCenter.save();

    await createNotificationInternal(
      serviceCenter.user_id,
      'Service Center Deactivated',
      `Your service center '${serviceCenter.service_center_name}' has been deactivated by the admin.`,
      'system'
    );

    res.status(200).json({
      success: true,
      message: 'Service center deactivated successfully',
      serviceCenter
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List Service Centers
 * GET /api/service-centers
 */
const listServiceCenters = async (req, res, next) => {
  try {
    let query = {};
    const isAdmin = req.user && req.user.user_role === 'admin';

    if (!isAdmin) {
      query.$or = [{ status: 'approved' }, { approvalStatus: 'approved' }, { service_center_is_verified: true }];
    } else if (req.query.status) {
      query.status = req.query.status;
    }

    const serviceCenters = await ServiceCenter.find(query).populate('user_id', 'user_full_name user_email user_phone_number');

    res.status(200).json({
      success: true,
      count: serviceCenters.length,
      serviceCenters
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Service Center Approval Status (Admin only)
 * PUT /api/service-centers/:id/approval
 */
const updateApprovalStatus = async (req, res, next) => {
  try {
    const { approvalStatus, rejectionReason } = req.body;
 
    if (!approvalStatus || !['approved', 'rejected'].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid approvalStatus (approved or rejected)'
      });
    }
 
    const serviceCenter = await ServiceCenter.findById(req.params.id);
    if (!serviceCenter) {
      return res.status(404).json({
        success: false,
        message: 'Service center not found'
      });
    }

    if (serviceCenter.approvalStatus === 'approved' || serviceCenter.approvalStatus === 'rejected') {
      return res.status(400).json({
        success: false,
        message: `This service center status is already finalized as '${serviceCenter.approvalStatus}' and cannot be changed again.`
      });
    }
 
    serviceCenter.approvalStatus = approvalStatus;
    serviceCenter.status = approvalStatus === 'approved' ? 'approved' : 'deactivated';
    serviceCenter.service_center_is_verified = approvalStatus === 'approved';

    if (approvalStatus === 'rejected') {
      serviceCenter.rejectionReason = rejectionReason || 'No reason provided';
    } else {
      serviceCenter.rejectionReason = undefined;
    }

    await serviceCenter.save();
 
    await createNotificationInternal(
      serviceCenter.user_id,
      'Service Center Status Updated',
      `Your service center '${serviceCenter.service_center_name}' status has been updated to '${approvalStatus}'.${
        approvalStatus === 'rejected' ? ` Reason: ${serviceCenter.rejectionReason}` : ''
      }`,
      'system'
    );
 
    res.status(200).json({
      success: true,
      message: `Service center approval status updated to ${approvalStatus}`,
      serviceCenter
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Pending Service Centers (Admin only)
 * GET /api/service-centers/pending
 */
const getPendingServiceCenters = async (req, res, next) => {
  try {
    const pendingCenters = await ServiceCenter.find({ approvalStatus: 'pending' })
      .populate('user_id', 'user_full_name user_email user_phone_number');

    res.status(200).json({
      success: true,
      count: pendingCenters.length,
      serviceCenters: pendingCenters
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get Service Center Detail by ID (Admin only)
 * GET /api/service-centers/:id/detail
 */
const getServiceCenterDetail = async (req, res, next) => {
  try {
    const serviceCenter = await ServiceCenter.findById(req.params.id)
      .populate('user_id', 'user_full_name user_email user_phone_number');

    if (!serviceCenter) {
      return res.status(404).json({
        success: false,
        message: 'Service center not found'
      });
    }

    res.status(200).json({
      success: true,
      serviceCenter
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerServiceCenter,
  approveServiceCenter,
  deactivateServiceCenter,
  listServiceCenters,
  updateApprovalStatus,
  getPendingServiceCenters,
  getServiceCenterDetail
};
