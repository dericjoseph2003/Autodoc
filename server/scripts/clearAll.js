const mongoose = require('mongoose');

const clearDb = async (uri) => {
  try {
    const conn = await mongoose.createConnection(uri).asPromise();
    console.log(`Connected to: ${uri}`);
    
    const dbCollections = await conn.db.listCollections().toArray();
    for (const collInfo of dbCollections) {
      const collectionName = collInfo.name;
      if (collectionName.startsWith('system.')) continue;
      
      await conn.db.collection(collectionName).deleteMany({});
      console.log(`  Cleared collection: ${collectionName}`);
    }
    await conn.close();
  } catch (err) {
    console.error(`Error clearing ${uri}:`, err.message);
  }
};

const run = async () => {
  await clearDb('mongodb://localhost:27017/autodoc');
  await clearDb('mongodb://localhost:27017/test');
  process.exit(0);
};

run();
