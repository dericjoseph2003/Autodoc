const ServiceHistory = require('../models/ServiceHistory');

const listServiceHistory = async (req, res, next) => {
  try {
    const query = {};
    if (req.query.vehicle_id) query.vehicle_id = req.query.vehicle_id;
    if (req.query.service_center_id) query.service_center_id = req.query.service_center_id;

    const history = await ServiceHistory.find(query)
      .populate('vehicle_id', 'vehicle_make vehicle_model vehicle_registration_number')
      .populate('service_center_id', 'service_center_name')
      .sort({ service_history_serviced_at: -1 });

    res.status(200).json({ success: true, count: history.length, serviceHistory: history });
  } catch (error) {
    next(error);
  }
};

const createServiceHistory = async (req, res, next) => {
  try {
    const { vehicle_id, service_center_id, appointment_id, service_history_description, service_history_cost, service_history_serviced_at } = req.body;
    if (!vehicle_id || !service_center_id) {
      return res.status(400).json({ success: false, message: 'vehicle_id and service_center_id are required' });
    }

    const record = await ServiceHistory.create({
      vehicle_id,
      service_center_id,
      appointment_id: appointment_id || null,
      service_history_description: service_history_description || '',
      service_history_cost: service_history_cost || 0,
      service_history_serviced_at: service_history_serviced_at ? new Date(service_history_serviced_at) : new Date()
    });

    res.status(201).json({ success: true, serviceHistory: record });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listServiceHistory,
  createServiceHistory
};
