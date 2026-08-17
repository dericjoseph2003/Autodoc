const mongoose = require('mongoose');
const dotenv = require('dotenv');
const seedDatabase = require('../config/seed');

dotenv.config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc';

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log('Connected to MongoDB. Starting database seed...');
    await seedDatabase();
    console.log('Database seed finished successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Error connecting to database:', err.message);
    process.exit(1);
  });
