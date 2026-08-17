const Appointment = require('../models/Appointment');

/**
 * Create Appointment
 * POST /api/appointments
 * Owner or admin can book an appointment for a vehicle at a service center.
 */
const createAppointment = async (req, res, next) => {
  try {
    const {
      vehicle, vehicle_id,
      serviceCenter, service_center_id,
      date, appointment_date,
      time, timeSlot, appointment_time_slot,
      serviceType, appointment_service_type,
      customer, user_id
    } = req.body;

    const inputVehicleId = vehicle_id || vehicle;
    const inputServiceCenterId = service_center_id || serviceCenter;
    const inputDate = appointment_date || date;
    const inputTimeSlot = appointment_time_slot || timeSlot || time;
    const inputServiceType = appointment_service_type || serviceType;
    const currentUserId = user_id || customer || req.user._id || req.user.user_id || req.user.id;

    if (!inputVehicleId || !inputServiceCenterId || !inputDate || !inputTimeSlot || !inputServiceType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide vehicle_id, service_center_id, appointment_date, appointment_time_slot, and appointment_service_type'
      });
    }

    const appointment = await Appointment.create({
      vehicle_id: inputVehicleId,
      service_center_id: inputServiceCenterId,
      user_id: currentUserId,
      appointment_date: inputDate,
      appointment_time_slot: inputTimeSlot,
      appointment_service_type: inputServiceType,
      appointment_status: 'pending'
    });

    res.status(201).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

/**
 * List Appointments
 * GET /api/appointments
 * - Owner: sees their own appointments
 * - Service Center: sees appointments at their center
 * - Admin: sees all appointments
 */
const listAppointments = async (req, res, next) => {
  try {
    let query = {};
    const currentUserId = req.user._id || req.user.user_id || req.user.id;

    if (req.user.user_role === 'owner') {
      query.user_id = currentUserId;
    } else if (req.user.user_role === 'service_center') {
      const ServiceCenter = require('../models/ServiceCenter');
      const sc = await ServiceCenter.findOne({ user_id: currentUserId });
      if (!sc) {
        return res.status(200).json({ success: true, appointments: [] });
      }
      query.service_center_id = sc._id;
    }

    const appointments = await Appointment.find(query)
      .populate('vehicle_id', 'vehicle_make vehicle_model vehicle_registration_number vehicle_year')
      .populate('service_center_id', 'service_center_name contactPersonName')
      .populate('user_id', 'user_full_name user_phone_number user_email')
      .sort({ appointment_created_at: -1 });

    res.status(200).json({ success: true, appointments });
  } catch (error) {
    next(error);
  }
};

/**
 * Update Appointment Status
 * PATCH /api/appointments/:id/status
 * Service Center or Admin can update status.
 */
const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { status, appointment_status } = req.body;
    const targetStatus = appointment_status || status;
    const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];

    if (!targetStatus || !validStatuses.includes(targetStatus)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${validStatuses.join(', ')}`
      });
    }

    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    appointment.appointment_status = targetStatus;
    await appointment.save();

    res.status(200).json({ success: true, appointment });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  listAppointments,
  updateAppointmentStatus
};
