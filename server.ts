import type { Express } from 'express';
import express from 'express';
import cors from 'cors';
import bodyparser from 'body-parser';
import multer from 'multer';
import { promises as fs } from 'fs';
import path from 'path';
import screenshotRoutes from './server/api/screenshotRoutes.js';
import annotationRoutes from './server/api/annotationRoutes.js';
import pythonRoutes from './server/api/pythonRoutes.js';

const app: Express = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyparser.json());
app.use(bodyparser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/screenshots', screenshotRoutes);
app.use('/api/annotations', annotationRoutes);
app.use('/api/python', pythonRoutes);

// Static files
app.use('/dist', express.static(path.join(__dirname, 'dist')));
app.use('/data/screenshots', express.static(path.join(__dirname, 'data', 'screenshots')));

// Start server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`Airtest Template Manager Server`);
  console.log(`========================================`);
  console.log(`\nServer running at: http://localhost:${PORT}`);
  console.log(`Press Ctrl+C to stop\n`);
});

export default app;
