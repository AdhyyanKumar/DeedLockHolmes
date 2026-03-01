const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth.routes');
const propertyRoutes = require('./routes/property.routes');
const verificationRoutes = require('./routes/verification.routes');
const analyticsRoutes = require('./routes/analytics.routes');
const aiRoutes = require('./routes/ai.routes');

// Import services to test connections
const solanaService = require('./services/solana.service');
const mongoService = require('./services/mongo.service');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://deed-lock-holmes.vercel.app',
  credentials: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/properties', propertyRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    const networkInfo = await solanaService.getNetworkInfo();
    
    res.json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      solana: {
        network: networkInfo.network,
        programId: networkInfo.programId,
        connected: true
      },
      database: {
        provider: "mongodb",
        database: process.env.MONGODB_DB_NAME || "deedlock_holmes",
        connected: mongoService.connection !== null
      },
      gemini: {
        configured: !!process.env.GEMINI_API_KEY
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      error: error.message
    });
  }
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    name: 'Solana Property Registry API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      properties: '/api/properties',
      verification: '/api/verification',
      analytics: '/api/analytics',
      ai: '/api/ai'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: err.message || 'Internal server error'
  });
});

// Start server
const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
  console.log('\n🚀 ========================================');
  console.log('   Solana Property Registry Backend');
  console.log('========================================== 🚀\n');
  console.log(`✓ Server running on port ${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ Solana Network: ${process.env.SOLANA_NETWORK}`);
  console.log(`✓ Program ID: ${process.env.PROGRAM_ID}`);
  console.log('\n📍 API Endpoints:');
  console.log(`   - Health: http://localhost:${PORT}/api/health`);
  console.log(`   - Properties: http://localhost:${PORT}/api/properties`);
  console.log(`   - Verification: http://localhost:${PORT}/api/verification`);
  console.log(`   - Analytics: http://localhost:${PORT}/api/analytics`);
  console.log(`   - AI: http://localhost:${PORT}/api/ai`);
  console.log('\n🔗 Testing connections...\n');

  // Test Solana connection
  try {
    const networkInfo = await solanaService.getNetworkInfo();
    console.log('✓ Solana connected');
    console.log(`  Network: ${networkInfo.network}`);
    console.log(`  Program: ${networkInfo.programId}`);
  } catch (error) {
    console.error('✗ Solana connection failed:', error.message);
  }

  // MongoDB connection is lazy. It will connect on first DB-backed request.
  console.log("MongoDB connection deferred until first DB operation.");

  console.log('\n✅ Backend ready!\n');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  mongoService.disconnect();
  process.exit(0);
});


