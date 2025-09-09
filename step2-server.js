// Step 2: Express server with file operations
console.log('Step 2: Starting Express server with file operations...');

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
app.use(express.json());

// Create uploads directory
const uploadDir = path.join(__dirname, 'uploads');
console.log('Creating uploads directory:', uploadDir);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  console.log('Uploads directory created');
} else {
  console.log('Uploads directory already exists');
}

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    step: '2 - Express with file operations'
  });
});

const PORT = process.env.PORT || 4000;
console.log(`Starting server on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Step 2 server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

console.log('Step 2 server setup complete');
