# Civic Sense API Server

This is the API server for the Civic Sense civic reporting system.

## Features

- RESTful API endpoints for report management
- SQLite database for data storage
- File upload handling for images
- CORS support for cross-origin requests
- Report routing and prioritization
- Timeline tracking for report updates

## API Endpoints

- `GET /reports` - List all reports
- `GET /reports/:id` - Get specific report
- `POST /reports` - Create new report
- `POST /reports/:id/update` - Update report status
- `POST /reports/:id/assign` - Assign report to staff

## Deployment

This server is configured for deployment on Railway.

### Environment Variables

- `NODE_ENV` - Environment (production)
- `PORT` - Server port (default: 4000)

### Railway Configuration

The `railway.json` file contains the deployment configuration for Railway.

## Local Development

```bash
# Install dependencies
npm install

# Start the server
npm start

# Development mode
npm run dev
```

## Database

Uses SQLite database (`data.db`) for data storage. The database is automatically created with the required tables on first run.

## File Uploads

Uploaded files are stored in the `uploads/` directory and served at `/uploads/` endpoint.

---

**Part of the Civic Sense civic reporting system**
