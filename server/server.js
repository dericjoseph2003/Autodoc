const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Route Imports
const usersRoutes = require('./routes/users');
const vehiclesRoutes = require('./routes/vehicles');
const serviceCentersRoutes = require('./routes/serviceCenters');
const notificationsRoutes = require('./routes/notifications');
const documentsRoutes = require('./routes/documents');
const appointmentsRoutes = require('./routes/appointments');
const roadsideRequestsRoutes = require('./routes/roadsideRequests');
const sparePartsRoutes = require('./routes/spareParts');
const adminRoutes = require('./routes/admin');
const serviceHistoryRoutes = require('./routes/serviceHistory');
const damageReportsRoutes = require('./routes/damageReports');

// Middleware Imports
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve uploaded documents statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Root Route
app.get('/', (req, res) => {
  res.json({ message: 'Autodoc API is running...' });
});

// API Routes
app.use('/api/users', usersRoutes);
app.use('/api/vehicles', vehiclesRoutes);
app.use('/api/service-centers', serviceCentersRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/appointments', appointmentsRoutes);
app.use('/api/roadside-requests', roadsideRequestsRoutes);
app.use('/api/spare-parts', sparePartsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/service-history', serviceHistoryRoutes);
app.use('/api/damage-reports', damageReportsRoutes);

// Global Error Handler
app.use(errorHandler);

// Connect to MongoDB
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/autodoc';
const seedDatabase = require('./config/seed');

mongoose
  .connect(mongoUri)
  .then(async () => {
    console.log('MongoDB connected successfully.');
    await seedDatabase();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    console.log('Server will continue running without database connection.');
  });

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
