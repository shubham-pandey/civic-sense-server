// Fixed server based on step-by-step debugging
console.log('Starting Fixed Civic Sense API Server...');
console.log('Node.js version:', process.version);
console.log('Platform:', process.platform);
console.log('Architecture:', process.arch);

const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

console.log('Dependencies loaded successfully');

try {
  const app = express();
  console.log('Express app created');
  
  app.use(cors());
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

  // Configure multer
  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname || '.jpg');
      const name = `${Date.now()}_${Math.random().toString(36).slice(2)}${ext}`;
      cb(null, name);
    }
  });
  const upload = multer({ storage });
  app.use('/uploads', express.static(uploadDir));

  // Health check endpoint
  app.get('/health', (req, res) => {
    try {
      // Test database connection
      db.prepare('SELECT 1').get();
      res.status(200).json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        database: 'connected'
      });
    } catch (error) {
      console.error('Health check failed:', error);
      res.status(500).json({ 
        status: 'error', 
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  });

  // Initialize database with better error handling
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
    
    // Try to create database with better error handling
    db = new Database(dbPath, { verbose: console.log });
    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    console.error('Error details:', error.message);
    console.error('Stack trace:', error.stack);
    
    // Try alternative database path
    const altDbPath = path.join('/tmp', 'data.db');
    console.log('Trying alternative database path:', altDbPath);
    try {
      db = new Database(altDbPath);
      console.log('Database initialized at alternative path');
    } catch (altError) {
      console.error('Alternative database path also failed:', altError);
      process.exit(1);
    }
  }

  // Create database tables
  try {
    console.log('Creating database tables...');
    db.exec(`CREATE TABLE IF NOT EXISTS reports (
      id TEXT PRIMARY KEY,
      description TEXT,
      imageUrl TEXT,
      lat REAL,
      lng REAL,
      status TEXT,
      category TEXT,
      priority TEXT,
      department TEXT,
      assignedTo TEXT,
      createdAt INTEGER
    );`);
    console.log('Reports table created/verified');

    db.exec(`CREATE TABLE IF NOT EXISTS timeline (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      reportId TEXT,
      status TEXT,
      note TEXT,
      at INTEGER
    );`);
    console.log('Timeline table created/verified');
  } catch (error) {
    console.error('Database table creation failed:', error);
    console.error('Error details:', error.message);
    process.exit(1);
  }

  // Add database migration
  try {
    const columns = db.prepare("PRAGMA table_info(reports)").all();
    const hasAssigned = columns.some(c => c.name === 'assignedTo');
    if (!hasAssigned) {
      db.exec('ALTER TABLE reports ADD COLUMN assignedTo TEXT');
      console.log('Added assignedTo column to reports table');
    }
  } catch (error) {
    console.log('Database migration completed (or not needed)');
  }

  // Basic routing function
  function computeRouting({ description = '', category = '' }) {
    const text = `${category} ${description}`.toLowerCase();
    let department = 'General';
    let priority = 'medium';
    if (text.includes('pothole') || text.includes('road')) department = 'Roads';
    if (text.includes('garbage') || text.includes('trash')) department = 'Sanitation';
    if (text.includes('light') || text.includes('streetlight')) department = 'Lighting';
    if (text.includes('water') || text.includes('leak')) department = 'Water';
    if (text.includes('urgent') || text.includes('hazard')) priority = 'high';
    if (text.includes('minor')) priority = 'low';
    return { department, priority };
  }

  // API Routes
  app.get('/reports', (req, res) => {
    try {
      const { category, priority, status, q, minLat, maxLat, minLng, maxLng } = req.query || {};
      let where = [];
      let params = {};
      if (category) { where.push('category = @category'); params.category = String(category); }
      if (priority) { where.push('priority = @priority'); params.priority = String(priority); }
      if (status) { where.push('status = @status'); params.status = String(status); }
      if (q) { where.push('(description LIKE @q OR department LIKE @q OR assignedTo LIKE @q)'); params.q = `%${String(q)}%`; }
      if (minLat) { where.push('lat >= @minLat'); params.minLat = parseFloat(minLat); }
      if (maxLat) { where.push('lat <= @maxLat'); params.maxLat = parseFloat(maxLat); }
      if (minLng) { where.push('lng >= @minLng'); params.minLng = parseFloat(minLng); }
      if (maxLng) { where.push('lng <= @maxLng'); params.maxLng = parseFloat(maxLng); }
      const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
      const sql = `SELECT * FROM reports ${whereSql} ORDER BY createdAt DESC`;
      const stmt = db.prepare(sql);
      res.json(stmt.all(params));
    } catch (error) {
      console.error('Error fetching reports:', error);
      res.status(500).json({ error: 'failed_to_fetch' });
    }
  });

  app.get('/reports/:id', (req, res) => {
    try {
      const r = db.prepare('SELECT * FROM reports WHERE id = ?').get(req.params.id);
      if (!r) return res.status(404).json({ error: 'not_found' });
      const timeline = db.prepare('SELECT status, note, at FROM timeline WHERE reportId = ? ORDER BY at ASC').all(req.params.id);
      res.json({ ...r, timeline });
    } catch (error) {
      console.error('Error fetching report:', error);
      res.status(500).json({ error: 'failed_to_fetch' });
    }
  });

  app.post('/reports', upload.single('image'), (req, res) => {
    try {
      const id = Math.random().toString(36).slice(2);
      const description = req.body.description || '';
      const lat = parseFloat(req.body.lat);
      const lng = parseFloat(req.body.lng);
      const category = req.body.category || null;
      const providedPriority = req.body.priority || null;
      const imageUrl = req.file ? `/uploads/${req.file.filename}` : (req.body.imageUrl || null);
      const { department, priority } = computeRouting({ description, category });
      const finalPriority = providedPriority || priority;
      const createdAt = Date.now();
      const status = 'submitted';
      const assignedTo = null;

      const insert = db.prepare(`INSERT INTO reports (id, description, imageUrl, lat, lng, status, category, priority, department, assignedTo, createdAt)
        VALUES (@id, @description, @imageUrl, @lat, @lng, @status, @category, @priority, @department, @assignedTo, @createdAt)`);
      insert.run({ id, description, imageUrl, lat, lng, status, category, priority: finalPriority, department, assignedTo, createdAt });

      const tInsert = db.prepare(`INSERT INTO timeline (reportId, status, note, at) VALUES (@reportId, @status, @note, @at)`);
      tInsert.run({ reportId: id, status: 'submitted', note: 'Report submitted', at: createdAt });

      res.json({ id, imageUrl, status, department, priority: finalPriority, createdAt });
    } catch (error) {
      console.error('Error creating report:', error);
      res.status(500).json({ error: 'failed_to_create' });
    }
  });

  app.post('/reports/:id/update', (req, res) => {
    try {
      const { status, priority, department, assignedTo, note } = req.body || {};
      const upd = db.prepare('UPDATE reports SET status = COALESCE(?, status), priority = COALESCE(?, priority), department = COALESCE(?, department), assignedTo = COALESCE(?, assignedTo) WHERE id = ?');
      upd.run(status || null, priority || null, department || null, assignedTo || null, req.params.id);
      const tInsert = db.prepare('INSERT INTO timeline (reportId, status, note, at) VALUES (?, ?, ?, ?)');
      tInsert.run(req.params.id, status || 'updated', note || '', Date.now());
      res.json({ ok: true });
    } catch (error) {
      console.error('Error updating report:', error);
      res.status(500).json({ error: 'failed_to_update' });
    }
  });

  app.post('/reports/:id/assign', (req, res) => {
    try {
      const { assignedTo, note } = req.body || {};
      const upd = db.prepare('UPDATE reports SET assignedTo = ? WHERE id = ?');
      upd.run(assignedTo || null, req.params.id);
      const tInsert = db.prepare('INSERT INTO timeline (reportId, status, note, at) VALUES (?, ?, ?, ?)');
      tInsert.run(req.params.id, 'acknowledged', note || `Assigned to ${assignedTo || 'unassigned'}`, Date.now());
      res.json({ ok: true });
    } catch (error) {
      console.error('Error assigning report:', error);
      res.status(500).json({ error: 'failed_to_assign' });
    }
  });

  const PORT = process.env.PORT || 4000;
  console.log(`Starting server on port ${PORT}...`);

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ Fixed server running on http://0.0.0.0:${PORT}`);
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

} catch (error) {
  console.error('❌ Server startup failed:', error);
  console.error('Error stack:', error.stack);
  process.exit(1);
}
