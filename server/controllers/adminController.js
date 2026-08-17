const User = require('../models/User');
const ServiceCenter = require('../models/ServiceCenter');
const Vehicle = require('../models/Vehicle');
const Appointment = require('../models/Appointment');
const RoadsideRequest = require('../models/RoadsideRequest');

/**
 * Get Admin Dashboard Stats
 * GET /api/admin/dashboard-stats
 */
const getDashboardStats = async (req, res, next) => {
  try {
    const totalUsers = await User.countDocuments({});
    const totalOwners = await User.countDocuments({ user_role: 'owner' });
    const totalServiceCenters = await ServiceCenter.countDocuments({
      $or: [{ approvalStatus: 'approved' }, { service_center_is_verified: true }]
    });
    const pendingApprovals = await ServiceCenter.countDocuments({ approvalStatus: 'pending' });
    const activeRoadsideRequests = await RoadsideRequest.countDocuments({
      roadside_request_status: { $ne: 'resolved' }
    });
    const totalVehiclesRegistered = await Vehicle.countDocuments({});

    const todayStr = new Date().toLocaleDateString();
    const appointmentsToday = await Appointment.countDocuments({ appointment_date: todayStr });

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const newUsersThisWeek = await User.countDocuments({
      $or: [
        { user_created_at: { $gte: sevenDaysAgo } },
        { createdAt: { $gte: sevenDaysAgo } }
      ]
    });

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalOwners,
        totalServiceCenters,
        pendingApprovals,
        activeRoadsideRequests,
        totalVehiclesRegistered,
        appointmentsToday,
        newUsersThisWeek
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get 10 Most Recent Users
 * GET /api/admin/recent-users
 */
const getRecentUsers = async (req, res, next) => {
  try {
    const recentUsers = await User.find({})
      .select('-user_password_hash -password')
      .sort({ user_created_at: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      users: recentUsers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get 5 Most Recent Pending Service Centers
 * GET /api/admin/pending-summary
 */
const getPendingServiceCentersSummary = async (req, res, next) => {
  try {
    const pendingCenters = await ServiceCenter.find({ approvalStatus: 'pending' })
      .populate('user_id', 'user_full_name user_email user_phone_number')
      .sort({ service_center_created_at: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      serviceCenters: pendingCenters
    });
  } catch (error) {
    next(error);
  }
};

/**
 * List All Users (Admin only)
 * GET /api/admin/users
 */
const listAllUsers = async (req, res, next) => {
  try {
    const users = await User.find({})
      .select('-user_password_hash -password')
      .sort({ user_created_at: -1 });

    res.status(200).json({
      success: true,
      users
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardStats,
  getRecentUsers,
  getPendingServiceCentersSummary,
  listAllUsers
};
