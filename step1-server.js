// Step 1: Basic Express server without database
console.log('Step 1: Starting basic Express server...');

const express = require('express');
const app = express();

// Basic middleware
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    step: '1 - Basic Express'
  });
});

const PORT = process.env.PORT || 4000;
console.log(`Starting server on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Step 1 server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

console.log('Step 1 server setup complete');
