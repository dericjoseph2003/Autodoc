const { MongoClient } = require('mongodb');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });


// Source: Local MongoDB (Compass)
const LOCAL_URI = process.env.LOCAL_MONGO_URI || 'mongodb://localhost:27017';

// Target: MongoDB Atlas
const ATLAS_URI = process.env.MONGO_URI;

// Databases to migrate
const DATABASES_TO_MIGRATE = ['autodoc', 'test'];

async function copyCollection(srcDb, dstDb, colName) {
  const srcCol = srcDb.collection(colName);
  const dstCol = dstDb.collection(colName);

  const localCount = await srcCol.countDocuments();
  console.log(`\n📦 Migrating collection: '${colName}' (Local items: ${localCount})...`);

  // 1. Copy documents
  if (localCount > 0) {
    const docs = await srcCol.find({}).toArray();
    
    // Drop existing target collection if any to prevent duplicate key errors on clean migration
    try {
      await dstCol.drop();
    } catch (e) {
      // Ignore if collection doesn't exist
    }

    const insertResult = await dstCol.insertMany(docs, { ordered: true });
    console.log(`   ✅ Inserted ${insertResult.insertedCount} documents into Atlas.`);
  } else {
    // Ensure collection exists even if empty
    await dstDb.createCollection(colName).catch(() => {});
    console.log(`   ℹ️ Collection is empty (0 documents). Created empty collection on Atlas.`);
  }

  // 2. Copy indexes (excluding default _id_ index)
  try {
    const indexes = await srcCol.indexes();
    let copiedIndexCount = 0;

    for (const idx of indexes) {
      if (idx.name === '_id_') continue;

      const keys = idx.key;
      const options = { name: idx.name };
      if (idx.unique) options.unique = true;
      if (idx.sparse) options.sparse = true;
      if (idx.expireAfterSeconds !== undefined) options.expireAfterSeconds = idx.expireAfterSeconds;
      if (idx.weights) options.weights = idx.weights;
      if (idx.default_language) options.default_language = idx.default_language;

      try {
        await dstCol.createIndex(keys, options);
        copiedIndexCount++;
      } catch (idxErr) {
        console.warn(`   ⚠️ Warning copying index '${idx.name}' on '${colName}':`, idxErr.message);
      }
    }
    console.log(`   🔑 Indexes preserved: ${copiedIndexCount}`);
  } catch (err) {
    console.warn(`   ⚠️ Could not read/copy indexes for '${colName}':`, err.message);
  }

  // 3. Verify counts
  const atlasCount = await dstCol.countDocuments();
  if (localCount === atlasCount) {
    console.log(`   🎯 Verification PASSED: ${atlasCount}/${localCount} documents matched.`);
    return { name: colName, status: 'SUCCESS', localCount, atlasCount };
  } else {
    console.error(`   ❌ Verification FAILED: Local=${localCount}, Atlas=${atlasCount}`);
    return { name: colName, status: 'MISMATCH', localCount, atlasCount };
  }
}

async function migrateDatabase(localClient, atlasClient, dbName) {
  console.log(`\n======================================================`);
  console.log(`🚀 Starting Migration for Database: '${dbName}'`);
  console.log(`======================================================`);

  const srcDb = localClient.db(dbName);
  const dstDb = atlasClient.db(dbName);

  const collections = await srcDb.listCollections().toArray();
  console.log(`Found ${collections.length} collection(s) in local '${dbName}'.`);

  const results = [];
  for (const col of collections) {
    // Skip system collections
    if (col.name.startsWith('system.')) continue;
    const res = await copyCollection(srcDb, dstDb, col.name);
    results.push(res);
  }

  return results;
}

async function main() {
  console.log('Connecting to Local MongoDB (Compass)...');
  const localClient = new MongoClient(LOCAL_URI);
  await localClient.connect();
  console.log('✅ Connected to Local MongoDB.');

  console.log('Connecting to MongoDB Atlas Cluster...');
  const atlasClient = new MongoClient(ATLAS_URI, { serverSelectionTimeoutMS: 15000 });
  await atlasClient.connect();
  console.log('✅ Connected to MongoDB Atlas.');

  const summary = {};

  for (const dbName of DATABASES_TO_MIGRATE) {
    const dbResults = await migrateDatabase(localClient, atlasClient, dbName);
    summary[dbName] = dbResults;
  }

  await localClient.close();
  await atlasClient.close();

  console.log(`\n======================================================`);
  console.log(`🏁 MIGRATION COMPLETE SUMMARY:`);
  console.log(`======================================================`);
  let hasFailures = false;

  for (const [dbName, colResults] of Object.entries(summary)) {
    console.log(`\nDatabase: ${dbName}`);
    for (const r of colResults) {
      const icon = r.status === 'SUCCESS' ? '✅' : '❌';
      console.log(`  ${icon} ${r.name.padEnd(25)} : ${r.atlasCount} / ${r.localCount} docs (${r.status})`);
      if (r.status !== 'SUCCESS') hasFailures = true;
    }
  }

  if (hasFailures) {
    console.error(`\n❌ Some collections had mismatches. Please inspect above logs.`);
    process.exit(1);
  } else {
    console.log(`\n🎉 ALL COLLECTIONS & DOCUMENTS MIGRATED TO ATLAS WITH ZERO DATA LOSS!`);
  }
}

main().catch(err => {
  console.error('\n❌ Fatal Migration Error:', err);
  process.exit(1);
});
