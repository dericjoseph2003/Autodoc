const DamageReport = require('../models/DamageReport');

const listDamageReports = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.user_role === 'owner') {
      query.user_id = req.user._id || req.user.user_id || req.user.id;
    }
    if (req.query.vehicle_id) query.vehicle_id = req.query.vehicle_id;

    const reports = await DamageReport.find(query)
      .populate('vehicle_id', 'vehicle_make vehicle_model vehicle_registration_number')
      .populate('user_id', 'user_full_name user_email')
      .sort({ damage_report_created_at: -1 });

    res.status(200).json({ success: true, count: reports.length, damageReports: reports });
  } catch (error) {
    next(error);
  }
};

const createDamageReport = async (req, res, next) => {
  try {
    const { vehicle_id, damage_report_image_path, damage_report_damage_type, damage_report_severity_level, damage_report_estimated_repair_cost, damage_report_confidence_score } = req.body;
    const currentUserId = req.user._id || req.user.user_id || req.user.id;

    if (!vehicle_id || !damage_report_image_path) {
      return res.status(400).json({ success: false, message: 'vehicle_id and damage_report_image_path are required' });
    }

    const report = await DamageReport.create({
      vehicle_id,
      user_id: currentUserId,
      damage_report_image_path,
      damage_report_damage_type: damage_report_damage_type || 'Unknown',
      damage_report_severity_level: damage_report_severity_level || 'Moderate',
      damage_report_estimated_repair_cost: damage_report_estimated_repair_cost || 0,
      damage_report_confidence_score: damage_report_confidence_score || 0.85
    });

    res.status(201).json({ success: true, damageReport: report });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  listDamageReports,
  createDamageReport
};
