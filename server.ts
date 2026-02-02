import { config } from 'dotenv';
config();

import type { Express } from 'express';
import express from 'express';
import cors from 'cors';
import bodyparser from 'body-parser';
import path from 'path';
import screenshotRoutes from './server/api/screenshotRoutes';
import annotationRoutes from './server/api/annotationRoutes';
import pythonRoutes from './server/api/pythonRoutes';

const app: Express = express();
const API_PORT = process.env.API_PORT;

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
app.use('/data/screenshots', express.static(path.join(__dirname, 'data', 'screenshots')));
app.use('/', express.static(path.join(__dirname, 'dist')));

// Start server
app.listen(Number(API_PORT), '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`Airtest Template Manager Server`);
  console.log(`========================================`);
  console.log(`\nServer running at: http://localhost:${API_PORT}`);
  console.log(`Press Ctrl+C to stop\n`);
});

export default app;
