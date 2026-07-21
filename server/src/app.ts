import express from 'express';
import cors from 'cors';
import { errorHandler } from './middlewares/error';
import { rateLimiter } from './middlewares/rateLimiter';
import keysRouter from './routes/keys';
import paymentsRouter from './routes/payments';
import floatRouter from './routes/float';
import webhooksRouter from './routes/webhooks';

const app = express();

// Configure CORS - Allow access from local dev server and standard frontend addresses
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', '*'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-api-key']
}));

// Parse JSON payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Register global rate limiter
app.use(rateLimiter);

// Health Check API
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'UP',
    timestamp: new Date().toISOString(),
    service: 'Tamupay API Gateway Server'
  });
});

// Register API Routes
app.use('/api/v1/keys', keysRouter);
app.use('/api/v1/payments', paymentsRouter);
app.use('/api/v1/float', floatRouter);
app.use('/api/v1/webhooks', webhooksRouter);

// Base fallbacks for 404 Route NotFound
app.use('*', (req, res, next) => {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`
  });
});

// Error handling middleware
app.use(errorHandler);

export default app;
