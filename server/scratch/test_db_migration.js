const mongoose = require('mongoose');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Document = require('../models/Document');
const ServiceCenter = require('../models/ServiceCenter');
const SparePart = require('../models/SparePart');
const RoadsideRequest = require('../models/RoadsideRequest');
const Appointment = require('../models/Appointment');
const ServiceHistory = require('../models/ServiceHistory');
const DamageReport = require('../models/DamageReport');
const Notification = require('../models/Notification');

const runTests = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc';
  await mongoose.connect(mongoUri);
  console.log('Connected to MongoDB for verification tests...\n');

  // 1. Verify Users
  const users = await User.find({});
  console.log(`[tbl_users] Found ${users.length} user(s):`);
  users.forEach(u => {
    console.log(`  - user_id: ${u.user_id}, name: ${u.user_full_name}, email: ${u.user_email}, role: ${u.user_role}, verified: ${u.user_is_verified}`);
  });

  // 2. Verify Service Centers
  const centers = await ServiceCenter.find({}).populate('user_id', 'user_full_name user_email');
  console.log(`\n[tbl_service_centers] Found ${centers.length} service center(s):`);
  centers.forEach(c => {
    console.log(`  - service_center_id: ${c.service_center_id}, name: ${c.service_center_name}, user_id: ${c.user_id?.user_email}, verified: ${c.service_center_is_verified}`);
  });

  // 3. Verify Vehicle Creation & Query
  let testOwner = users.find(u => u.user_role === 'owner');
  let testVehicle = await Vehicle.findOne({ user_id: testOwner._id });
  if (!testVehicle) {
    testVehicle = await Vehicle.create({
      user_id: testOwner._id,
      vehicle_make: 'Honda',
      vehicle_model: 'City',
      vehicle_year: 2024,
      vehicle_type: 'car',
      vehicle_registration_number: 'MH12AB9999',
      vehicle_color: 'White'
    });
    console.log(`\n[tbl_vehicles] Created test vehicle: ${testVehicle.vehicle_make} ${testVehicle.vehicle_model} (${testVehicle.vehicle_registration_number})`);
  } else {
    console.log(`\n[tbl_vehicles] Found existing vehicle: ${testVehicle.vehicle_make} ${testVehicle.vehicle_model} (${testVehicle.vehicle_registration_number})`);
  }

  // 4. Verify Document Creation
  let testDoc = await Document.findOne({ vehicle_id: testVehicle._id });
  if (!testDoc) {
    testDoc = await Document.create({
      vehicle_id: testVehicle._id,
      vehicle_document_type: 'RC',
      vehicle_document_number: 'RC-123456',
      vehicle_document_file_path: '/uploads/rc_sample.pdf',
      status: 'active'
    });
    console.log(`\n[tbl_vehicle_documents] Created test document: ${testDoc.vehicle_document_type} for vehicle_id: ${testDoc.vehicle_id}`);
  }

  // 5. Verify Appointment Creation
  let testCenter = centers[0];
  if (testCenter) {
    let testAppt = await Appointment.findOne({ vehicle_id: testVehicle._id });
    if (!testAppt) {
      testAppt = await Appointment.create({
        user_id: testOwner._id,
        vehicle_id: testVehicle._id,
        service_center_id: testCenter._id,
        appointment_service_type: 'Oil Change',
        appointment_date: '2026-08-20',
        appointment_time_slot: '10:00 AM',
        appointment_status: 'pending'
      });
      console.log(`\n[tbl_appointments] Created test appointment: ${testAppt.appointment_service_type} on ${testAppt.appointment_date}`);
    }
  }

  // 6. Verify ServiceHistory Creation
  if (testCenter) {
    let historyCount = await ServiceHistory.countDocuments({});
    if (historyCount === 0) {
      const history = await ServiceHistory.create({
        vehicle_id: testVehicle._id,
        service_center_id: testCenter._id,
        service_history_description: 'Full Synthetic Oil Change and Filter replacement',
        service_history_cost: 3500,
        service_history_serviced_at: new Date()
      });
      console.log(`\n[tbl_service_history] Created service history record ID: ${history.service_history_id}, cost: ${history.service_history_cost}`);
    }
  }

  // 7. Verify DamageReport Creation
  let reportCount = await DamageReport.countDocuments({});
  if (reportCount === 0) {
    const report = await DamageReport.create({
      vehicle_id: testVehicle._id,
      user_id: testOwner._id,
      damage_report_image_path: '/uploads/bumper_scratch.jpg',
      damage_report_damage_type: 'Front Bumper Dent',
      damage_report_severity_level: 'Minor',
      damage_report_estimated_repair_cost: 4500,
      damage_report_confidence_score: 0.92
    });
    console.log(`\n[tbl_damage_reports] Created damage report ID: ${report.damage_report_id}, type: ${report.damage_report_damage_type}`);
  }

  console.log('\n✅ All database schema & model verification tests passed!');
  await mongoose.disconnect();
};

runTests().catch(console.error);
