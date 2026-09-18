import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import studentRoutes from './routes/student.routes.js';
import examRoutes from './routes/exam.routes.js';
import questionRoutes from './routes/question.routes.js';
import aiRoutes from './routes/ai.routes.js';
import subjectRoutes from './routes/subject.routes.js';
import attemptRoutes from './routes/attempt.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import accessibilityRoutes from './routes/accessibility.routes.js';
import notificationRoutes from './routes/notification.routes.js';
import studyMaterialRoutes from './routes/studyMaterial.routes.js';
import pyqRoutes from './routes/pyq.routes.js';

dotenv.config();
dotenv.config({ path: './server/.env' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '25mb' }));
app.use(express.raw({ type: ['audio/*', 'application/octet-stream'], limit: '25mb' }));

// Request logging in development
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'SIGHT-EXAM AI Core API Engine',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    features: [
      'Accessible Examinations',
      'AI Question Generation',
      'Candidate PwD Accommodations',
      'Speech Audit Logging',
      'WCAG 2.1 AAA Compliant',
    ],
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/exams', examRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/accessibility', accessibilityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/study-materials', studyMaterialRoutes);
app.use('/api/pyqs', pyqRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ error: `API route '${req.method} ${req.originalUrl}' not found` });
});

// Global Error Handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`====================================================`);
  console.log(`🚀 SIGHT-EXAM AI Backend running on http://localhost:${PORT}`);
  console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`====================================================`);
});
