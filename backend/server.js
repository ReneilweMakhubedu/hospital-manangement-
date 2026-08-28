const express = require('express');
const path = require('path');
const dotenv = require('dotenv');
const cors = require('cors');

dotenv.config();

const { initDatabase } = require('./database');

const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// Middleware
// ===============================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ===============================
// API Routes
// ===============================
app.use('/api/signup', require('./routes/signup'));
app.use('/api/login', require('./routes/login'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/doctor', require('./routes/doctor'));
app.use('/api/patient', require('./routes/patient'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/pharmacy', require('./routes/pharmacy'));
app.use('/api/queue', require('./routes/queue'));

// ===============================
// Root Route
// ===============================
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Hospital Management System API',
    status: 'Server is running',
    port: PORT
  });
});

// ===============================
// Health Check
// ===============================
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'API is running successfully'
  });
});

// ===============================
// Handle Unknown API Routes
// ===============================
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl
  });
});

// ===============================
// Error Handler
// ===============================
app.use((err, req, res, next) => {
  console.error('Server error:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// ===============================
// Initialize Database
// ===============================
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log('======================================');
      console.log(' Hospital Management System API');
      console.log('======================================');
      console.log(` Server running on port ${PORT}`);
      console.log(` http://localhost:${PORT}`);
      console.log(' Database initialized successfully');
      console.log(' Queue API enabled');
      console.log('======================================');
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });