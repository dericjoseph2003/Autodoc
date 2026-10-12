const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const ServiceCenter = require('../models/ServiceCenter');
const Inventory = require('../models/Inventory');
const Part = require('../models/Part');
const User = require('../models/User');

const seedInventory = async () => {
  // 1. Ensure all parts exist in the Part catalog
  const partsSeedPath = path.join(__dirname, 'parts-seed.json');
  if (fs.existsSync(partsSeedPath)) {
    const partsData = JSON.parse(fs.readFileSync(partsSeedPath, 'utf8'));
    await Part.deleteMany({});
    await Part.insertMany(partsData);
    console.log(`Successfully seeded ${partsData.length} parts into Part catalog.`);
  }

  // 2. Clear ServiceCenter and Inventory collections
  const serviceCentersData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'service-centers-seed.json'), 'utf8')
  );
  const inventoryData = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'inventory-seed.json'), 'utf8')
  );

  console.log('Clearing ServiceCenter and Inventory collections...');
  await ServiceCenter.deleteMany({});
  await Inventory.deleteMany({});

  // Attach user_id to service centers if matching User exists in database
  const serviceCentersToInsert = [];
  for (const scData of serviceCentersData) {
    const contactEmail = scData.contact?.email || scData.email;
    let userId = scData.user_id || null;

    if (!userId && contactEmail) {
      const matchedUser = await User.findOne({ user_email: contactEmail.toLowerCase().trim() });
      if (matchedUser) {
        userId = matchedUser._id;
      }
    }

    serviceCentersToInsert.push({
      ...scData,
      user_id: userId
    });
  }

  console.log('Inserting service centers...');
  const insertedServiceCenters = await ServiceCenter.insertMany(serviceCentersToInsert);
  console.log(`Successfully inserted ${insertedServiceCenters.length} service centers.`);

  console.log('Inserting inventory records...');
  const insertedInventory = await Inventory.insertMany(inventoryData);
  console.log(`Successfully inserted ${insertedInventory.length} inventory records.`);

  // 3. Reference Verification Step
  console.log('\n--- Verifying References ---');
  const existingParts = await Part.find({}, 'sku').lean();
  const validPartSkus = new Set(existingParts.map((p) => p.sku));

  const existingServiceCenters = await ServiceCenter.find({}, 'serviceCenterId').lean();
  const validCenterIds = new Set(existingServiceCenters.map((sc) => sc.serviceCenterId));

  let unresolvableCount = 0;
  for (const inv of insertedInventory) {
    if (!validPartSkus.has(inv.partSku)) {
      console.error(`❌ Unresolved reference: partSku '${inv.partSku}' not found in Part catalog!`);
      unresolvableCount++;
    }
    if (!validCenterIds.has(inv.serviceCenterId)) {
      console.error(`❌ Unresolved reference: serviceCenterId '${inv.serviceCenterId}' not found in ServiceCenter collection!`);
      unresolvableCount++;
    }
  }

  if (unresolvableCount > 0) {
    throw new Error(`Reference validation failed with ${unresolvableCount} unresolvable reference(s). Aborting.`);
  } else {
    console.log(`✅ Reference Verification Passed: All ${insertedInventory.length} inventory records reference valid Part.sku and ServiceCenter.serviceCenterId.`);
  }

  return {
    serviceCentersCount: insertedServiceCenters.length,
    inventoryCount: insertedInventory.length,
  };
};

if (require.main === module) {
  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc';
  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log('Connected to MongoDB for seeding inventory...');
      await seedInventory();
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = seedInventory;
