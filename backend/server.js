const express = require('express');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') });

// Initialize database
connectDB();

const app = express();

// 1. Security Middlewares
// Use helmet for basic security headers (adjust content security policy to allow bootstrap icons/fonts/scripts)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net"],
        styleSrc: ["'self'", "'unsafe-inline'", "cdn.jsdelivr.net", "fonts.googleapis.com"],
        fontSrc: ["'self'", "cdn.jsdelivr.net", "fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "blob:", "*"],
        connectSrc: ["'self'", "*"]
      }
    },
    crossOriginEmbedderPolicy: false
  })
);

// Enable CORS
const allowedOrigin = process.env.ALLOWED_ORIGIN;
app.use(
  cors({
    origin: allowedOrigin && allowedOrigin !== '*' ? allowedOrigin : true,
    credentials: true
  })
);

// Request body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 2. Rate Limiting for API routes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes.'
  }
});

// Apply rate limiter to all API endpoints
app.use('/api', apiLimiter);

// 3. Mount Routes
app.use('/api', require('./routes/campaignRoutes'));
app.use('/api', require('./routes/donationRoutes'));

// 4. Static Asset Exposing
// Serve uploads folder securely
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '../frontend')));

// 5. 404 Handler for Page Views and API Routes
app.use((req, res, next) => {
  // If request is for an API endpoint, return JSON
  if (req.originalUrl.startsWith('/api')) {
    res.status(404);
    return next(new Error('API route not found'));
  }
  // Otherwise, serve custom 404 page
  res.status(404).sendFile(path.join(__dirname, '../frontend/404.html'));
});

// 6. Centralized Error Handler Middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
