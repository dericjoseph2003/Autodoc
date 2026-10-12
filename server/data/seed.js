const seedInventory = require('./seed-inventory');

module.exports = {
  seedInventory
};

if (require.main === module) {
  const mongoose = require('mongoose');
  const path = require('path');
  require('dotenv').config({ path: path.join(__dirname, '../.env') });

  const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc';
  mongoose
    .connect(mongoUri)
    .then(async () => {
      console.log('Connected to MongoDB via server/data/seed.js...');
      await seedInventory();
      await mongoose.disconnect();
      console.log('Done.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Error in seed.js:', err);
      process.exit(1);
    });
}
