// Simple test script to verify server startup
const express = require('express');
const path = require('path');
const Database = require('better-sqlite3');

console.log('Testing server components...');

// Test database
try {
  const dbPath = path.join(__dirname, 'data.db');
  console.log('Testing database at:', dbPath);
  const db = new Database(dbPath);
  console.log('✅ Database connection successful');
  db.close();
} catch (error) {
  console.error('❌ Database test failed:', error);
  process.exit(1);
}

// Test express app
try {
  const app = express();
  app.get('/test', (req, res) => {
    res.json({ status: 'ok' });
  });
  console.log('✅ Express app created successfully');
} catch (error) {
  console.error('❌ Express app test failed:', error);
  process.exit(1);
}

console.log('✅ All tests passed!');
process.exit(0);
