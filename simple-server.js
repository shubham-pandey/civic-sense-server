// Simple server with basic health check
console.log('Starting Simple Civic Sense API Server...');

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(cors());
app.use(express.json());

// Create uploads directory
const uploadDir = path.join(__dirname, 'uploads');
console.log('Creating uploads directory:', uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Uploads directory created');
}

// Simple health check endpoint (no database dependency)
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    message: 'Simple server is running'
  });
});

// Basic reports endpoint (no database)
app.get('/reports', (req, res) => {
  console.log('Reports endpoint requested');
  res.json([]);
});

// Basic report creation endpoint (no database)
app.post('/reports', (req, res) => {
  console.log('Report creation requested');
  res.json({ 
    id: 'test-' + Date.now(),
    message: 'Report created (simple mode)',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 4000;
console.log(`Starting server on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Simple server running on http://0.0.0.0:${PORT}`);
  console.log(`✅ Health check available at http://0.0.0.0:${PORT}/health`);
  console.log(`✅ Reports API available at http://0.0.0.0:${PORT}/reports`);
});

// Handle server errors
server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('Process terminated');
    process.exit(0);
  });
});

console.log('Simple server setup complete');
