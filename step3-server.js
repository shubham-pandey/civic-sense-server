// Step 3: Express server with SQLite database
console.log('Step 3: Starting Express server with SQLite database...');

const express = require('express');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

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

// Initialize database
const dbPath = path.join(__dirname, 'data.db');
console.log('Initializing database at:', dbPath);

let db;
try {
  // Ensure the directory exists
  const dbDir = path.dirname(dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
    console.log('Created database directory:', dbDir);
  }
  
  db = new Database(dbPath);
  console.log('Database initialized successfully');
} catch (error) {
  console.error('Database initialization failed:', error);
  process.exit(1);
}

// Create basic table
try {
  console.log('Creating basic table...');
  db.exec(`CREATE TABLE IF NOT EXISTS test (
    id INTEGER PRIMARY KEY,
    name TEXT
  );`);
  console.log('Test table created/verified');
} catch (error) {
  console.error('Table creation failed:', error);
  process.exit(1);
}

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    // Test database connection
    db.prepare('SELECT 1').get();
    res.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      step: '3 - Express with SQLite',
      database: 'connected'
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      error: error.message 
    });
  }
});

const PORT = process.env.PORT || 4000;
console.log(`Starting server on port ${PORT}...`);

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Step 3 server running on http://0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

console.log('Step 3 server setup complete');
