const Vehicle = require('../models/Vehicle');
const Document = require('../models/Document');
const { createNotificationInternal } = require('./notificationController');
const fs = require('fs');
const path = require('path');

/**
 * Register a new vehicle
 * POST /api/vehicles
 */
const createVehicle = async (req, res, next) => {
  try {
    const {
      make, vehicle_make,
      model, vehicle_model,
      year, vehicle_year,
      vehicleType, vehicle_type,
      registrationNumber, vehicle_registration_number,
      color, vehicle_color,
      fuelType, chassisNumber, owner, user_id
    } = req.body;

    const inputMake = vehicle_make || make;
    const inputModel = vehicle_model || model;
    const inputYear = vehicle_year || year;
    const inputType = vehicle_type || vehicleType;
    const inputReg = vehicle_registration_number || registrationNumber;
    const inputColor = vehicle_color || color;

    if (!inputMake || !inputModel || !inputYear || !inputType || !inputReg) {
      return res.status(400).json({
        success: false,
        message: 'Please provide make/vehicle_make, model/vehicle_model, year/vehicle_year, vehicleType/vehicle_type, and registrationNumber/vehicle_registration_number'
      });
    }

    let vehicleOwner = req.user._id || req.user.user_id || req.user.id;
    if (req.user.user_role === 'admin' && (user_id || owner)) {
      vehicleOwner = user_id || owner;
    }

    const normalizedReg = inputReg.trim().toUpperCase();
    const existingVehicle = await Vehicle.findOne({ vehicle_registration_number: normalizedReg });
    if (existingVehicle) {
      return res.status(400).json({
        success: false,
        message: 'A vehicle with this registration number already exists'
      });
    }

    const vehicle = await Vehicle.create({
      user_id: vehicleOwner,
      vehicle_make: inputMake,
      vehicle_model: inputModel,
      vehicle_year: inputYear,
      vehicle_type: inputType,
      vehicle_registration_number: normalizedReg,
      vehicle_color: inputColor,
      fuelType,
      chassisNumber
    });

    await createNotificationInternal(
      vehicleOwner,
      'Vehicle Registered Successfully',
      `Your ${inputMake} ${inputModel} (${normalizedReg}) has been registered in AutoDoc.`,
      'info'
    );

    res.status(201).json({
      success: true,
      vehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get all vehicles
 * GET /api/vehicles
 */
const getVehicles = async (req, res, next) => {
  try {
    let query = {};

    if (req.user.user_role !== 'admin') {
      query.user_id = req.user._id || req.user.user_id || req.user.id;
    } else if (req.query.user_id || req.query.owner) {
      query.user_id = req.query.user_id || req.query.owner;
    }

    const vehicles = await Vehicle.find(query).populate('user_id', 'user_full_name user_email user_phone_number');

    res.status(200).json({
      success: true,
      count: vehicles.length,
      vehicles
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get single vehicle by ID
 * GET /api/vehicles/:id
 */
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id).populate('user_id', 'user_full_name user_email user_phone_number');
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const currentUserId = (req.user._id || req.user.user_id || req.user.id).toString();
    const ownerId = (vehicle.user_id._id || vehicle.user_id).toString();

    if (ownerId !== currentUserId && req.user.user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not the owner of this vehicle'
      });
    }

    res.status(200).json({
      success: true,
      vehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update vehicle details
 * PUT /api/vehicles/:id
 */
const updateVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const currentUserId = (req.user._id || req.user.user_id || req.user.id).toString();
    const ownerId = vehicle.user_id.toString();

    if (ownerId !== currentUserId && req.user.user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to update this vehicle'
      });
    }

    const {
      make, vehicle_make,
      model, vehicle_model,
      year, vehicle_year,
      vehicleType, vehicle_type,
      registrationNumber, vehicle_registration_number,
      color, vehicle_color,
      fuelType, chassisNumber
    } = req.body;

    if (vehicle_make || make) vehicle.vehicle_make = vehicle_make || make;
    if (vehicle_model || model) vehicle.vehicle_model = vehicle_model || model;
    if (vehicle_year || year) vehicle.vehicle_year = vehicle_year || year;
    if (vehicle_type || vehicleType) vehicle.vehicle_type = vehicle_type || vehicleType;
    if (vehicle_color || color) vehicle.vehicle_color = vehicle_color || color;
    if (fuelType) vehicle.fuelType = fuelType;
    if (chassisNumber) vehicle.chassisNumber = chassisNumber;

    const newReg = vehicle_registration_number || registrationNumber;
    if (newReg) {
      const normalizedReg = newReg.trim().toUpperCase();
      if (normalizedReg !== vehicle.vehicle_registration_number) {
        const dupVehicle = await Vehicle.findOne({ vehicle_registration_number: normalizedReg });
        if (dupVehicle) {
          return res.status(400).json({
            success: false,
            message: 'Another vehicle already uses this registration number'
          });
        }
        vehicle.vehicle_registration_number = normalizedReg;
      }
    }

    const updatedVehicle = await vehicle.save();

    res.status(200).json({
      success: true,
      vehicle: updatedVehicle
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete vehicle and its associated documents
 * DELETE /api/vehicles/:id
 */
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({
        success: false,
        message: 'Vehicle not found'
      });
    }

    const currentUserId = (req.user._id || req.user.user_id || req.user.id).toString();
    const ownerId = vehicle.user_id.toString();

    if (ownerId !== currentUserId && req.user.user_role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You are not authorized to delete this vehicle'
      });
    }

    const documents = await Document.find({ vehicle_id: vehicle._id });
    for (const doc of documents) {
      const filePath = doc.vehicle_document_file_path || doc.fileUrl;
      if (filePath) {
        const filename = path.basename(filePath);
        const localPath = path.join(__dirname, '../uploads', filename);
        if (fs.existsSync(localPath)) {
          try {
            fs.unlinkSync(localPath);
          } catch (err) {
            console.error(`Failed to delete physical file: ${localPath}`, err);
          }
        }
      }
    }
    await Document.deleteMany({ vehicle_id: vehicle._id });

    await Vehicle.findByIdAndDelete(vehicle._id);

    await createNotificationInternal(
      vehicle.user_id,
      'Vehicle Deleted',
      `Your registered vehicle ${vehicle.vehicle_make} ${vehicle.vehicle_model} (${vehicle.vehicle_registration_number}) has been deleted.`,
      'info'
    );

    res.status(200).json({
      success: true,
      message: 'Vehicle and all associated documents deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createVehicle,
  getVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle
};
