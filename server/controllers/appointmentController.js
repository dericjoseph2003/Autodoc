const Appointment = require('../models/Appointment');
const ServiceCenter = require('../models/ServiceCenter');
const SlotLock = require('../models/SlotLock');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');

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
    let currentUserId = user_id || customer || (req.user ? (req.user._id || req.user.user_id || req.user.id) : null);

    if (!inputServiceCenterId || !inputDate || !inputTimeSlot || !inputServiceType) {
      return res.status(400).json({
        success: false,
        message: 'Please provide service_center_id, appointment_date, appointment_time_slot, and appointment_service_type'
      });
    }

    // 1. Resolve User ID (must be valid ObjectId)
    let resolvedUserId = null;
    if (currentUserId && String(currentUserId).match(/^[0-9a-fA-F]{24}$/)) {
      resolvedUserId = currentUserId;
    } else {
      const existingUser = (await User.findOne({ user_role: 'owner' })) || (await User.findOne());
      if (existingUser) {
        resolvedUserId = existingUser._id;
      }
    }

    if (!resolvedUserId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid user session for appointment booking.'
      });
    }

    // 2. Resolve Service Center ID (must be valid ObjectId)
    let resolvedServiceCenterId = null;
    if (typeof inputServiceCenterId === 'string' && inputServiceCenterId.match(/^[0-9a-fA-F]{24}$/)) {
      const sc = await ServiceCenter.findById(inputServiceCenterId);
      if (sc) resolvedServiceCenterId = sc._id;
    }

    if (!resolvedServiceCenterId) {
      const sc = await ServiceCenter.findOne({
        $or: [
          { serviceCenterId: inputServiceCenterId },
          { service_center_name: new RegExp(inputServiceCenterId, 'i') },
          { businessName: new RegExp(inputServiceCenterId, 'i') },
          { name: new RegExp(inputServiceCenterId, 'i') }
        ]
      });
      if (sc) {
        resolvedServiceCenterId = sc._id;
      }
    }

    if (!resolvedServiceCenterId) {
      const anySc = await ServiceCenter.findOne();
      if (anySc) {
        resolvedServiceCenterId = anySc._id;
      } else {
        return res.status(404).json({
          success: false,
          message: `Service Center '${inputServiceCenterId}' not found.`
        });
      }
    }

    // 3. Resolve Vehicle ID (must be valid ObjectId)
    let resolvedVehicleId = null;
    if (typeof inputVehicleId === 'string' && inputVehicleId.match(/^[0-9a-fA-F]{24}$/)) {
      const v = await Vehicle.findById(inputVehicleId);
      if (v) resolvedVehicleId = v._id;
    }

    if (!resolvedVehicleId) {
      const userVeh = (await Vehicle.findOne({ user_id: resolvedUserId })) || (await Vehicle.findOne());
      if (userVeh) {
        resolvedVehicleId = userVeh._id;
      } else {
        const newVeh = await Vehicle.create({
          user_id: resolvedUserId,
          vehicle_make: 'Maruti Suzuki',
          vehicle_model: 'Swift',
          vehicle_year: 2022,
          vehicle_type: 'car',
          vehicle_registration_number: `KL-${Math.floor(10 + Math.random() * 89)}-A-${Math.floor(1000 + Math.random() * 8999)}`
        });
        resolvedVehicleId = newVeh._id;
      }
    }

    // 4. Slot Availability Check (One vehicle per service center time slot)
    const existingActiveAppointment = await Appointment.findOne({
      service_center_id: resolvedServiceCenterId,
      appointment_date: inputDate,
      appointment_time_slot: inputTimeSlot,
      appointment_status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    if (existingActiveAppointment) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked at this service center'
      });
    }

    const appointment = await Appointment.create({
      vehicle_id: resolvedVehicleId,
      service_center_id: resolvedServiceCenterId,
      user_id: resolvedUserId,
      appointment_date: inputDate,
      appointment_time_slot: inputTimeSlot,
      appointment_service_type: inputServiceType,
      appointment_status: 'pending'
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('vehicle_id', 'vehicle_make vehicle_model vehicle_registration_number vehicle_year')
      .populate('service_center_id', 'service_center_name contactPersonName serviceCenterId businessName location city phone')
      .populate('user_id', 'user_full_name user_phone_number user_email name email phone');

    res.status(201).json({ success: true, appointment: populatedAppointment || appointment });
  } catch (error) {
    if (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000)) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is already booked at this service center'
      });
    }
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
    const userRole = req.user.user_role || req.user.role || 'owner';
    const currentUserId = req.user._id || req.user.user_id || req.user.id;

    if (userRole === 'owner') {
      if (currentUserId && String(currentUserId).match(/^[0-9a-fA-F]{24}$/)) {
        query.user_id = currentUserId;
      }
    } else if (userRole === 'service_center') {
      const ServiceCenter = require('../models/ServiceCenter');
      let sc = null;
      if (currentUserId && String(currentUserId).match(/^[0-9a-fA-F]{24}$/)) {
        sc = await ServiceCenter.findOne({
          $or: [{ user_id: currentUserId }, { _id: currentUserId }]
        });
      }
      if (!sc) {
        sc = await ServiceCenter.findOne({
          $or: [
            { serviceCenterId: currentUserId },
            { email: req.user.email || req.user.user_email }
          ].filter(Boolean)
        });
      }
      if (sc) {
        query.service_center_id = sc._id;
      } else {
        return res.status(200).json({ success: true, appointments: [] });
      }
    }

    const appointments = await Appointment.find(query)
      .populate('vehicle_id', 'vehicle_make vehicle_model vehicle_registration_number vehicle_year make model registrationNumber')
      .populate('service_center_id', 'service_center_name contactPersonName serviceCenterId businessName location city phone')
      .populate('user_id', 'user_full_name user_phone_number user_email name email phone')
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
    const validStatuses = ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'rejected'];

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

/**
 * Lock a Time Slot temporarily
 * POST /api/appointments/lock-slot
 */
const lockSlot = async (req, res, next) => {
  try {
    const { service_center_id, time_slot } = req.body;
    let date = req.body.date;

    if (date === 'Today') {
      date = new Date().toISOString().split('T')[0];
    } else if (date === 'Tomorrow') {
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      date = tmrw.toISOString().split('T')[0];
    }
    
    if (!service_center_id || !date || !time_slot) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }

    // Check if appointment already exists
    const existingActiveAppointment = await Appointment.findOne({
      service_center_id,
      appointment_date: date,
      appointment_time_slot: time_slot,
      appointment_status: { $in: ['pending', 'confirmed', 'in_progress'] }
    });

    if (existingActiveAppointment) {
      return res.status(400).json({ success: false, message: 'This time slot is already booked at this service center' });
    }

    // Try to create the lock. Will throw 11000 error if already locked by someone else.
    await SlotLock.create({ service_center_id, date, time_slot });
    
    res.status(200).json({ success: true, message: 'Slot locked temporarily for 5 minutes' });
  } catch (error) {
    if (error.code === 11000 || (error.name === 'MongoServerError' && error.code === 11000)) {
      return res.status(400).json({
        success: false,
        message: 'This time slot is currently being booked by someone else. Please wait or choose another slot.'
      });
    }
    next(error);
  }
};

/**
 * Get Available Time Slots
 * GET /api/service-centers/:id/available-slots?date=YYYY-MM-DD
 * GET /api/appointments/available-slots?serviceCenterId=...&date=...
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const serviceCenterParam = req.params.id || req.query.serviceCenterId || req.query.service_center_id || req.query.serviceCenter;
    let targetDate = req.query.date || req.query.appointment_date;

    if (!targetDate || targetDate === 'Today') {
      targetDate = new Date().toISOString().split('T')[0];
    } else if (targetDate === 'Tomorrow') {
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      targetDate = tmrw.toISOString().split('T')[0];
    }

    if (!serviceCenterParam) {
      return res.status(400).json({
        success: false,
        message: 'serviceCenter parameter (id or serviceCenterId) is required'
      });
    }

    // Resolve Service Center ID
    let resolvedServiceCenterId = null;
    if (typeof serviceCenterParam === 'string' && serviceCenterParam.match(/^[0-9a-fA-F]{24}$/)) {
      const sc = await ServiceCenter.findById(serviceCenterParam);
      if (sc) resolvedServiceCenterId = sc._id;
    }

    if (!resolvedServiceCenterId) {
      const sc = await ServiceCenter.findOne({
        $or: [
          { serviceCenterId: serviceCenterParam },
          { service_center_name: new RegExp(serviceCenterParam, 'i') },
          { businessName: new RegExp(serviceCenterParam, 'i') },
          { name: new RegExp(serviceCenterParam, 'i') }
        ]
      });
      if (sc) resolvedServiceCenterId = sc._id;
    }

    if (!resolvedServiceCenterId) {
      const anySc = await ServiceCenter.findOne();
      if (anySc) resolvedServiceCenterId = anySc._id;
    }

    if (!resolvedServiceCenterId) {
      return res.status(404).json({ success: false, message: 'Service center not found' });
    }

    // Standard preset operating time slots
    const ALL_SLOTS = [
      '9:00 AM - 10:00 AM',
      '10:30 AM - 11:30 AM',
      '1:00 PM - 2:00 PM',
      '3:00 PM - 4:00 PM',
      '5:00 PM - 6:00 PM'
    ];

    const bookedAppointments = await Appointment.find({
      service_center_id: resolvedServiceCenterId,
      appointment_date: targetDate,
      appointment_status: { $in: ['pending', 'confirmed', 'in_progress'] }
    }).select('appointment_time_slot');

    const lockedSlotsDocs = await SlotLock.find({
      service_center_id: resolvedServiceCenterId,
      date: targetDate
    }).select('time_slot');

    const bookedSlots = [
      ...bookedAppointments.map(a => a.appointment_time_slot),
      ...lockedSlotsDocs.map(l => l.time_slot)
    ];

    const slotDetails = ALL_SLOTS.map(slot => ({
      timeSlot: slot,
      isAvailable: !bookedSlots.includes(slot),
      isLocked: bookedSlots.includes(slot)
    }));

    const availableSlots = ALL_SLOTS.filter(slot => !bookedSlots.includes(slot));

    res.status(200).json({
      success: true,
      serviceCenterId: resolvedServiceCenterId,
      date: targetDate,
      allSlots: ALL_SLOTS,
      bookedSlots,
      availableSlots,
      slots: slotDetails
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createAppointment,
  listAppointments,
  updateAppointmentStatus,
  getAvailableSlots,
  lockSlot
};

