const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc';

const clearDatabase = async () => {
  try {
    await mongoose.connect(mongoUri);
    console.log('MongoDB connected for cleaning...');

    const collections = Object.keys(mongoose.connection.collections);
    for (const collectionName of collections) {
      await mongoose.connection.collections[collectionName].deleteMany({});
      console.log(`Cleared collection: ${collectionName}`);
    }

    console.log('Database cleared successfully!');
  } catch (err) {
    console.error('Error clearing database:', err.message);
  } finally {
    await mongoose.disconnect();
    console.log('MongoDB disconnected.');
    process.exit(0);
  }
};

clearDatabase();
