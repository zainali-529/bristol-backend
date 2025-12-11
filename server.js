const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const colors = require('colors');
require('dotenv').config();

// Import database connection
const connectDB = require('./config/database');
const config = require('./config/config');

// Connect to MongoDB
connectDB();

// Initialize Express app
const app = express();

// Middleware
// Configure Helmet to work with CORS
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginEmbedderPolicy: false
})); // Security headers

// CORS Configuration - Allow multiple origins in development
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [
    'http://localhost:5173',  // Vite default port
    'http://localhost:3000', // Alternative frontend port
    'http://localhost:5174',
    'https://bristol-user-frontend.vercel.app',
    'https://bristol-admin-frontend.vercel.app', // Alternative Vite port
    config.CLIENT_URL]
  : [
      config.CLIENT_URL
    ];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'X-Request-ID',
    'Accept',
    'Origin'
  ],
  exposedHeaders: ['Content-Length', 'Content-Type']
})); // Enable CORS
app.use(morgan('combined')); // Logging
app.use(express.json({ limit: '10mb' })); // Body parser for JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Body parser for URL encoded data

// Basic route for testing
app.get('/', (req, res) => {
  res.json({
    message: 'Bristol Utilities Backend API',
    status: 'Server is running successfully!',
    timestamp: new Date().toISOString()
  });
});
// API Routes
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Import routes
// Public routes (User Site)
app.use('/api/contacts', require('./routes/contacts'));
app.use('/api/quotes', require('./routes/quotes'));
app.use('/api/services', require('./routes/services'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/why-trust-us', require('./routes/whyTrustUs'));
app.use('/api/how-we-work', require('./routes/howWeWork'));
app.use('/api/faqs', require('./routes/faqs'));
app.use('/api/news', require('./routes/news'));
app.use('/api/team-members', require('./routes/teamMembers'));
app.use('/api/documents', require('./routes/documents'));
app.use('/api/energy-prices', require('./routes/energyPrices'));
app.use('/api/theme', require('./routes/themes'));
app.use('/api/hero', require('./routes/hero'));
app.use('/api/industries', require('./routes/industries'));
app.use('/api/testimonials', require('./routes/testimonials'));
app.use('/api/tickets', require('./routes/tickets'));
app.use('/api/docs', require('./routes/docs'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/feature-access', require('./routes/featureAccess'));

// Admin authentication routes
app.use('/api/admin/auth', require('./routes/adminAuth'));

// Developer authentication routes
app.use('/api/developer/auth', require('./routes/developerAuth'));

// Admin dashboard routes (requires authentication)
app.use('/api/admin/dashboard', require('./routes/dashboard'));

// Future routes (uncomment when you create route files)
// app.use('/api/auth', require('./routes/auth'));
// app.use('/api/users', require('./routes/users'));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: config.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
});

// Handle 404 routes
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Start server
const PORT = config.PORT;
const server = app.listen(PORT, () => {
  console.log(`Server running in ${config.NODE_ENV} mode on port ${PORT}`.yellow.bold);
  console.log(`API Health Check: http://localhost:${PORT}/api/health`.blue.underline);
});

const { initializeSocket } = require('./services/socketService');
initializeSocket(server);
