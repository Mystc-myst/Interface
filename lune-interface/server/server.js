// server.js (FINAL, most reliable dotenv loading for Windows + Node)
const express = require('express');
const cors = require('cors');
// Agent routes are disabled for offline diary usage
const luneRoutes = require('./routes/lune');

const dotenv = require('dotenv');
// Only ONE dotenv.config() call needed!
dotenv.config(); // Looks for .env in same folder as server.js

// --- Debug: print your key to verify env loads ---
// console.log('OpenAI key loaded:', process.env.OPENAI_API_KEY);

const app = express();
const port = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
const diaryRoutes = require('./routes/diary');
app.use('/diary', diaryRoutes);
app.use('/api/lune', luneRoutes); // <-- Lune chat API: /api/lune/send

// No database connection needed; diary entries are stored in diary.json

// --- Start Server ---
// app.listen(port, () => {
//   console.log(`Server is running on port: ${port}`);
// });

// Export app for testing purposes, and start server only if not in test.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

// --- 404 Handler (Not Found) ---
// This middleware should be placed after all your routes
app.use((req, res, next) => {
  res.status(404).json({ error: `Not Found - ${req.method} ${req.originalUrl}` });
});

// --- Global Error Handler ---
// This middleware should be the last one.
// Express recognizes it as an error handler by its four arguments.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  // Set a default status code if not already set (e.g., from an error object)
  const statusCode = err.statusCode || 500;
  // Send a JSON response
  res.status(statusCode).json({
    error: err.message || 'An unexpected error occurred.',
    // Optionally, include stack trace in development
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

module.exports = app;
