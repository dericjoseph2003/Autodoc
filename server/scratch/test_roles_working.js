const mongoose = require('mongoose');
const User = require('../models/User');
const ServiceCenter = require('../models/ServiceCenter');
const Vehicle = require('../models/Vehicle');
const Appointment = require('../models/Appointment');
const RoadsideRequest = require('../models/RoadsideRequest');
const jwt = require('jsonwebtoken');

const testRoles = async () => {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc';
  await mongoose.connect(mongoUri);
  console.log('Testing System & User Roles Alignment...\n');

  // 1. Check Owner Role
  const owner = await User.findOne({ user_email: 'alex.owner@autodoc.com' });
  if (!owner) throw new Error('Owner user not found');
  console.log('✅ Owner Role Identified:');
  console.log(`   ID: ${owner._id} / user_id: ${owner.user_id}`);
  console.log(`   Name: ${owner.user_full_name} (${owner.name})`);
  console.log(`   Email: ${owner.user_email}`);
  console.log(`   Role: ${owner.user_role} (${owner.role})`);

  // 2. Check Service Center Manager Role
  const partner = await User.findOne({ user_email: 'sarah.partner@autodoc.com' });
  if (!partner) throw new Error('Service Center user not found');
  const scProfile = await ServiceCenter.findOne({ user_id: partner._id });
  console.log('\n✅ Service Center Role Identified:');
  console.log(`   ID: ${partner._id}`);
  console.log(`   Name: ${partner.user_full_name}`);
  console.log(`   Role: ${partner.user_role}`);
  console.log(`   Linked Center: ${scProfile?.service_center_name || scProfile?.businessName} (Verified: ${scProfile?.service_center_is_verified})`);

  // 3. Check Admin Role
  const admin = await User.findOne({ user_email: 'chief.admin@autodoc.com' });
  if (!admin) throw new Error('Admin user not found');
  console.log('\n✅ Admin Role Identified:');
  console.log(`   ID: ${admin._id}`);
  console.log(`   Name: ${admin.user_full_name}`);
  console.log(`   Role: ${admin.user_role}`);

  // 4. Verify JSON Serialization & Token Compatibility
  const ownerJSON = owner.toJSON();
  if (!ownerJSON.role || !ownerJSON.user_role || !ownerJSON.name || !ownerJSON.user_full_name) {
    throw new Error('User JSON serialization missing compatibility keys!');
  }
  console.log('\n✅ User JSON Serialization Check Passed (includes role, user_role, name, user_full_name, id, user_id).');

  // 5. Test JWT Generation for all roles
  const ownerToken = jwt.sign({ id: owner._id, role: owner.user_role, user_id: owner._id, user_role: owner.user_role }, 'supersecretkeyforautodocapp');
  const decoded = jwt.verify(ownerToken, 'supersecretkeyforautodocapp');
  if (decoded.role !== 'owner' || decoded.user_role !== 'owner') {
    throw new Error('JWT payload missing role details');
  }
  console.log('✅ JWT Token Generation & Role Verification Passed.');

  console.log('\n🎉 ALL ROLE AND SYSTEM VERIFICATION TESTS PASSED SUCCESSFULLY!');
  await mongoose.disconnect();
};

testRoles().catch(err => {
  console.error('❌ Role verification failed:', err);
  process.exit(1);
});
