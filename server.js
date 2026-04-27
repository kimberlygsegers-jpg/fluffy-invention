const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Import routes
const chatRoutes = require('./routes/chat');
const workoutRoutes = require('./routes/workouts');
const nutritionRoutes = require('./routes/nutrition');
const scheduleRoutes = require('./routes/schedule');
const measurementsRoutes = require('./routes/measurements');
const nutritionRecommendationsRoutes = require('./routes/nutrition-recommendations');
const workoutCompletionsRoutes = require('./routes/workout-completions');

// Use routes
app.use('/api/chat', chatRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/nutrition', nutritionRoutes);
app.use('/api/schedule', scheduleRoutes);
app.use('/api/measurements', measurementsRoutes);
app.use('/api/nutrition-recommendations', nutritionRecommendationsRoutes);
app.use('/api/workout-completions', workoutCompletionsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`\nAccess the app:`);
  console.log(`  Local:   http://localhost:${PORT}`);
  console.log(`  Network: http://172.20.10.7:${PORT}`);
  console.log(`\nTo use on your phone:`);
  console.log(`  1. Make sure your phone is on the same WiFi network`);
  console.log(`  2. Open: http://172.20.10.7:${PORT}`);
});
