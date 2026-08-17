const mongoose = require('mongoose');
require('dotenv').config();

const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc';

const transformUser = (doc) => {
  const newDoc = { ...doc };
  if ('name' in doc && !('user_full_name' in doc)) {
    newDoc.user_full_name = doc.name;
    delete newDoc.name;
  }
  if ('email' in doc && !('user_email' in doc)) {
    newDoc.user_email = doc.email;
    delete newDoc.email;
  }
  if ('phone' in doc && !('user_phone_number' in doc)) {
    newDoc.user_phone_number = doc.phone;
    delete newDoc.phone;
  }
  if ('password' in doc && !('user_password_hash' in doc)) {
    newDoc.user_password_hash = doc.password;
    delete newDoc.password;
  }
  if ('role' in doc && !('user_role' in doc)) {
    newDoc.user_role = doc.role;
    delete newDoc.role;
  }
  if ('profilePhoto' in doc && !('user_profile_image_path' in doc)) {
    newDoc.user_profile_image_path = doc.profilePhoto;
    delete newDoc.profilePhoto;
  }
  if (!('user_is_verified' in doc)) {
    newDoc.user_is_verified = doc.role === 'admin' || doc.user_role === 'admin' || doc.user_is_verified === true;
  }
  if ('createdAt' in doc && !('user_created_at' in doc)) {
    newDoc.user_created_at = doc.createdAt;
    delete newDoc.createdAt;
  }
  if ('updatedAt' in doc && !('user_updated_at' in doc)) {
    newDoc.user_updated_at = doc.updatedAt;
    delete newDoc.updatedAt;
  }
  return newDoc;
};

const transformVehicle = (doc) => {
  const newDoc = { ...doc };
  if ('owner' in doc && !('user_id' in doc)) {
    newDoc.user_id = doc.owner;
    delete newDoc.owner;
  }
  if ('registrationNumber' in doc && !('vehicle_registration_number' in doc)) {
    newDoc.vehicle_registration_number = doc.registrationNumber;
    delete newDoc.registrationNumber;
  }
  if ('vehicleType' in doc && !('vehicle_type' in doc)) {
    newDoc.vehicle_type = doc.vehicleType;
    delete newDoc.vehicleType;
  } else if ('type' in doc && !('vehicle_type' in doc)) {
    newDoc.vehicle_type = doc.type;
    delete newDoc.type;
  }
  if ('make' in doc && !('vehicle_make' in doc)) {
    newDoc.vehicle_make = doc.make;
    delete newDoc.make;
  }
  if ('model' in doc && !('vehicle_model' in doc)) {
    newDoc.vehicle_model = doc.model;
    delete newDoc.model;
  }
  if ('year' in doc && !('vehicle_year' in doc)) {
    newDoc.vehicle_year = doc.year;
    delete newDoc.year;
  }
  if ('color' in doc && !('vehicle_color' in doc)) {
    newDoc.vehicle_color = doc.color;
    delete newDoc.color;
  }
  if ('createdAt' in doc && !('vehicle_created_at' in doc)) {
    newDoc.vehicle_created_at = doc.createdAt;
    delete newDoc.createdAt;
  }
  if ('updatedAt' in doc && !('vehicle_updated_at' in doc)) {
    newDoc.vehicle_updated_at = doc.updatedAt;
    delete newDoc.updatedAt;
  }
  return newDoc;
};

const transformDocument = (doc) => {
  const newDoc = { ...doc };
  if ('vehicle' in doc && !('vehicle_id' in doc)) {
    newDoc.vehicle_id = doc.vehicle;
    delete newDoc.vehicle;
  }
  if ('documentType' in doc && !('vehicle_document_type' in doc)) {
    newDoc.vehicle_document_type = doc.documentType;
    delete newDoc.documentType;
  } else if ('type' in doc && !('vehicle_document_type' in doc)) {
    newDoc.vehicle_document_type = doc.type;
    delete newDoc.type;
  }
  if ('documentNumber' in doc && !('vehicle_document_number' in doc)) {
    newDoc.vehicle_document_number = doc.documentNumber;
    delete newDoc.documentNumber;
  }
  if ('fileUrl' in doc && !('vehicle_document_file_path' in doc)) {
    newDoc.vehicle_document_file_path = doc.fileUrl;
    delete newDoc.fileUrl;
  } else if ('filePath' in doc && !('vehicle_document_file_path' in doc)) {
    newDoc.vehicle_document_file_path = doc.filePath;
    delete newDoc.filePath;
  }
  if ('issueDate' in doc && !('vehicle_document_issue_date' in doc)) {
    newDoc.vehicle_document_issue_date = doc.issueDate;
    delete newDoc.issueDate;
  }
  if ('expiryDate' in doc && !('vehicle_document_expiry_date' in doc)) {
    newDoc.vehicle_document_expiry_date = doc.expiryDate;
    delete newDoc.expiryDate;
  }
  if ('uploadDate' in doc && !('vehicle_document_uploaded_at' in doc)) {
    newDoc.vehicle_document_uploaded_at = doc.uploadDate;
    delete newDoc.uploadDate;
  } else if ('createdAt' in doc && !('vehicle_document_uploaded_at' in doc)) {
    newDoc.vehicle_document_uploaded_at = doc.createdAt;
    delete newDoc.createdAt;
  }
  return newDoc;
};

const transformServiceCenter = (doc) => {
  const newDoc = { ...doc };
  if ('manager' in doc && !('user_id' in doc)) {
    newDoc.user_id = doc.manager;
    delete newDoc.manager;
  } else if ('user' in doc && !('user_id' in doc)) {
    newDoc.user_id = doc.user;
    delete newDoc.user;
  }
  if ('businessName' in doc && !('service_center_name' in doc)) {
    newDoc.service_center_name = doc.businessName;
    delete newDoc.businessName;
  } else if ('name' in doc && !('service_center_name' in doc)) {
    newDoc.service_center_name = doc.name;
    delete newDoc.name;
  }
  if ('businessAddress' in doc && !('service_center_address' in doc)) {
    newDoc.service_center_address = doc.businessAddress;
    delete newDoc.businessAddress;
  } else if ('address' in doc && !('service_center_address' in doc)) {
    newDoc.service_center_address = doc.address;
    delete newDoc.address;
  }
  if ('latitude' in doc && !('service_center_latitude' in doc)) {
    newDoc.service_center_latitude = doc.latitude;
    delete newDoc.latitude;
  }
  if ('longitude' in doc && !('service_center_longitude' in doc)) {
    newDoc.service_center_longitude = doc.longitude;
    delete newDoc.longitude;
  }
  if ('phone' in doc && !('service_center_phone_number' in doc)) {
    newDoc.service_center_phone_number = doc.phone;
    delete newDoc.phone;
  }
  if ('rating' in doc && !('service_center_rating' in doc)) {
    newDoc.service_center_rating = doc.rating;
    delete newDoc.rating;
  }
  const isVerified = doc.approvalStatus === 'approved' || doc.status === 'approved' || doc.isVerified === true || doc.service_center_is_verified === true;
  newDoc.service_center_is_verified = isVerified;

  if ('createdAt' in doc && !('service_center_created_at' in doc)) {
    newDoc.service_center_created_at = doc.createdAt;
    delete newDoc.createdAt;
  }
  return newDoc;
};

const transformSparePart = (doc) => {
  const newDoc = { ...doc };
  if ('name' in doc && !('spare_part_name' in doc)) {
    newDoc.spare_part_name = doc.name;
    delete newDoc.name;
  }
  if ('category' in doc && !('spare_part_category' in doc)) {
    newDoc.spare_part_category = doc.category;
    delete newDoc.category;
  }
  if ('compatibleVehicles' in doc && !('spare_part_vehicle_compatibility' in doc)) {
    newDoc.spare_part_vehicle_compatibility = Array.isArray(doc.compatibleVehicles) ? doc.compatibleVehicles.join(', ') : doc.compatibleVehicles;
    delete newDoc.compatibleVehicles;
  } else if ('compatibility' in doc && !('spare_part_vehicle_compatibility' in doc)) {
    newDoc.spare_part_vehicle_compatibility = doc.compatibility;
    delete newDoc.compatibility;
  }
  if ('type' in doc && !('spare_part_type' in doc)) {
    newDoc.spare_part_type = doc.type;
    delete newDoc.type;
  }
  if ('price' in doc && !('spare_part_price' in doc)) {
    newDoc.spare_part_price = doc.price;
    delete newDoc.price;
  }
  if ('stock' in doc && !('spare_part_availability_status' in doc)) {
    newDoc.spare_part_availability_status = doc.stock > 0 ? 'in_stock' : 'out_of_stock';
    delete newDoc.stock;
  } else if ('availability' in doc && !('spare_part_availability_status' in doc)) {
    newDoc.spare_part_availability_status = doc.availability;
    delete newDoc.availability;
  }
  if ('createdAt' in doc && !('spare_part_created_at' in doc)) {
    newDoc.spare_part_created_at = doc.createdAt;
    delete newDoc.createdAt;
  }
  return newDoc;
};

const transformRoadsideRequest = (doc) => {
  const newDoc = { ...doc };
  if ('user' in doc && !('user_id' in doc)) {
    newDoc.user_id = doc.user;
    delete newDoc.user;
  }
  if ('vehicle' in doc && !('vehicle_id' in doc)) {
    newDoc.vehicle_id = doc.vehicle;
    delete newDoc.vehicle;
  }
  if ('issueDescription' in doc && !('roadside_request_type' in doc)) {
    newDoc.roadside_request_type = doc.issueDescription;
  } else if ('type' in doc && !('roadside_request_type' in doc)) {
    newDoc.roadside_request_type = doc.type;
    delete newDoc.type;
  }
  if ('latitude' in doc && !('roadside_request_latitude' in doc)) {
    newDoc.roadside_request_latitude = doc.latitude;
    delete newDoc.latitude;
  }
  if ('longitude' in doc && !('roadside_request_longitude' in doc)) {
    newDoc.roadside_request_longitude = doc.longitude;
    delete newDoc.longitude;
  }
  if ('priorityScore' in doc && !('roadside_request_priority_score' in doc)) {
    newDoc.roadside_request_priority_score = doc.priorityScore;
    delete newDoc.priorityScore;
  }
  if ('status' in doc && !('roadside_request_status' in doc)) {
    newDoc.roadside_request_status = doc.status;
    delete newDoc.status;
  }
  if ('createdAt' in doc && !('roadside_request_created_at' in doc)) {
    newDoc.roadside_request_created_at = doc.createdAt;
    delete newDoc.createdAt;
  }
  return newDoc;
};

const transformAppointment = (doc) => {
  const newDoc = { ...doc };
  if ('customer' in doc && !('user_id' in doc)) {
    newDoc.user_id = doc.customer;
    delete newDoc.customer;
  } else if ('user' in doc && !('user_id' in doc)) {
    newDoc.user_id = doc.user;
    delete newDoc.user;
  }
  if ('vehicle' in doc && !('vehicle_id' in doc)) {
    newDoc.vehicle_id = doc.vehicle;
    delete newDoc.vehicle;
  }
  if ('serviceCenter' in doc && !('service_center_id' in doc)) {
    newDoc.service_center_id = doc.serviceCenter;
    delete newDoc.serviceCenter;
  }
  if ('serviceType' in doc && !('appointment_service_type' in doc)) {
    newDoc.appointment_service_type = doc.serviceType;
    delete newDoc.serviceType;
  }
  if ('date' in doc && !('appointment_date' in doc)) {
    newDoc.appointment_date = doc.date;
    delete newDoc.date;
  }
  if ('time' in doc && !('appointment_time_slot' in doc)) {
    newDoc.appointment_time_slot = doc.time;
    delete newDoc.time;
  } else if ('timeSlot' in doc && !('appointment_time_slot' in doc)) {
    newDoc.appointment_time_slot = doc.timeSlot;
    delete newDoc.timeSlot;
  }
  if ('status' in doc && !('appointment_status' in doc)) {
    newDoc.appointment_status = doc.status;
    delete newDoc.status;
  }
  if ('createdAt' in doc && !('appointment_created_at' in doc)) {
    newDoc.appointment_created_at = doc.createdAt;
    delete newDoc.createdAt;
  }
  return newDoc;
};

const transformNotification = (doc) => {
  const newDoc = { ...doc };
  if ('user' in doc && !('user_id' in doc)) {
    newDoc.user_id = doc.user;
    delete newDoc.user;
  }
  if ('createdAt' in doc && !('notification_created_at' in doc)) {
    newDoc.notification_created_at = doc.createdAt;
    delete newDoc.createdAt;
  }
  return newDoc;
};

const MIGRATIONS = [
  { oldName: 'users', newName: 'tbl_users', transform: transformUser, uniqueKey: 'user_email' },
  { oldName: 'vehicles', newName: 'tbl_vehicles', transform: transformVehicle, uniqueKey: 'vehicle_registration_number' },
  { oldName: 'documents', newName: 'tbl_vehicle_documents', transform: transformDocument },
  { oldName: 'servicecenters', newName: 'tbl_service_centers', transform: transformServiceCenter },
  { oldName: 'spareparts', newName: 'tbl_spare_parts', transform: transformSparePart },
  { oldName: 'roadsiderequests', newName: 'tbl_roadside_requests', transform: transformRoadsideRequest },
  { oldName: 'appointments', newName: 'tbl_appointments', transform: transformAppointment },
  { oldName: 'notifications', newName: 'tbl_notifications', transform: transformNotification }
];

const NEW_COLLECTIONS = ['tbl_service_history', 'tbl_damage_reports'];

const runMigration = async () => {
  try {
    console.log(`Connecting to MongoDB at ${mongoUri}...`);
    const conn = await mongoose.connect(mongoUri);
    const db = conn.connection.db;

    for (const item of MIGRATIONS) {
      const { oldName, newName, transform, uniqueKey } = item;
      const collectionsInDb = (await db.listCollections().toArray()).map(c => c.name);

      if (collectionsInDb.includes(oldName)) {
        console.log(`Processing legacy collection '${oldName}' -> '${newName}'...`);
        const oldColl = db.collection(oldName);
        const docs = await oldColl.find({}).toArray();

        if (docs.length > 0) {
          const newColl = db.collection(newName);
          for (const rawDoc of docs) {
            const transformedDoc = transform(rawDoc);
            try {
              if (uniqueKey && transformedDoc[uniqueKey]) {
                await newColl.updateOne(
                  { [uniqueKey]: transformedDoc[uniqueKey] },
                  { $set: transformedDoc },
                  { upsert: true }
                );
              } else {
                await newColl.updateOne(
                  { _id: transformedDoc._id },
                  { $set: transformedDoc },
                  { upsert: true }
                );
              }
            } catch (err) {
              console.warn(`  Warning during insert/update into ${newName}:`, err.message);
            }
          }
          console.log(`  Migrated ${docs.length} document(s) into '${newName}'.`);
        }

        console.log(`  Dropping legacy collection '${oldName}'...`);
        await db.dropCollection(oldName);
      } else {
        console.log(`Legacy collection '${oldName}' not found or already migrated.`);
      }

      // Also transform any existing docs in target collection
      const collectionsAfterDrop = (await db.listCollections().toArray()).map(c => c.name);
      if (collectionsAfterDrop.includes(newName)) {
        const targetColl = db.collection(newName);
        const docs = await targetColl.find({}).toArray();
        for (const rawDoc of docs) {
          const transformedDoc = transform(rawDoc);
          await targetColl.updateOne(
            { _id: transformedDoc._id },
            { $set: transformedDoc }
          );
        }
      }
    }

    for (const newColl of NEW_COLLECTIONS) {
      const collectionsInDb = (await db.listCollections().toArray()).map(c => c.name);
      if (!collectionsInDb.includes(newColl)) {
        console.log(`Creating missing collection '${newColl}'...`);
        await db.createCollection(newColl);
      }
    }

    console.log('\n✅ Database migration successfully executed! All legacy collections dropped and migrated into tbl_* tables.');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

runMigration();
