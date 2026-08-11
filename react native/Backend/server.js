const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./src/config/db');
const authRoutes = require('./src/routes/authRoutes');

// Load environment variables
dotenv.config();

// Connect to MongoDB database
connectDB();

const app = express();

// Middleware
const allowedOrigins = [
  'http://localhost:8081',
  'http://localhost:8082',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps (no origin header)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS: Origin not allowed'));
    },
    credentials: true,
  })
);
app.use(express.json());

// Health Check Route
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Backend Server is Running!' });
});

// Auth API Routes
app.use('/api/auth', authRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
