const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const { swaggerUi, swaggerSpec } = require('./config/swaggerConfig');
const { baseLimiter, authLimiter, jobPostLimiter, bidLimiter } = require('./middlewares/rateLimitMiddleware');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

// Initialize Express
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Apply basic rate limiter to all requests
app.use(baseLimiter);

// Swagger API Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes with specific rate limiters
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/jobs/create', jobPostLimiter);
app.use('/api/bids', bidLimiter);

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/jobs', require('./routes/jobRoutes'));
app.use('/api/bids', require('./routes/bidRoutes'));

// Default route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Job Portal API',
    documentation: 'Visit /api-docs for API documentation'
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: err.message || 'Something went wrong!',
  });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`API documentation available at http://localhost:${PORT}/api-docs`);
}); 