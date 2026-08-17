const mongoose = require('mongoose');
require('dotenv').config();
const seedDatabase = require('../config/seed');

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc';

const run = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for seeding...');
    await seedDatabase();
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
    process.exit(0);
  }
};

run();
