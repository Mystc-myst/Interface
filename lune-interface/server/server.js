// server.js: Main entry point for the Express backend application.

// Import necessary modules.
const express = require('express'); // Express framework for building web applications.
const cors = require('cors');     // CORS middleware to enable Cross-Origin Resource Sharing.
const dotenv = require('dotenv'); // Module to load environment variables from a .env file.

// Import route handlers.
// The comment "Agent routes are disabled for offline diary usage" seems outdated, as luneRoutes is actively used below.
const luneRoutes = require('./routes/lune'); // Routes for Lune AI agent interactions.
const diaryRoutes = require('./routes/diary'); // Routes for diary management.

// Load environment variables from .env file into process.env.
// dotenv.config() should ideally be called as early as possible.
dotenv.config(); // Looks for .env in the current directory (where server.js is located).

// --- Optional Debugging ---
// Uncomment to verify if specific environment variables are loaded, e.g., an API key.
// console.log('OpenAI key loaded:', process.env.OPENAI_API_KEY);

// Initialize the Express application.
const app = express();
// Define the port the server will listen on. Uses environment variable or defaults to 5001.
const port = process.env.PORT || 5001;

// --- Core Middleware ---
// Enable CORS for all routes, allowing requests from different origins (e.g., the React frontend).
app.use(cors());
// Parse incoming requests with JSON payloads. Makes `req.body` available.
app.use(express.json());

// --- Application Routes ---
// Mount the diary routes. All requests to '/diary' will be handled by diaryRoutes.
app.use('/diary', diaryRoutes);
// Mount the Lune AI agent routes. All requests to '/api/lune' will be handled by luneRoutes.
// This includes endpoints like '/api/lune/send' for chat messages.
app.use('/api/lune', luneRoutes);

// Informational comment: Data persistence for diary entries is managed via a JSON file (diary.json),
// not a traditional database. This is handled within the route/controller logic (e.g., diaryStore.js).
// No database connection needed; diary entries are stored in diary.json

// --- Server Startup Logic ---
// The server is started only if this script is run directly (i.e., not imported as a module).
// This allows the `app` object to be exported for testing purposes without starting the server during tests.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

// --- 404 Handler (Not Found) ---
// This middleware is placed after all defined routes.
// If no route matches the request by this point, this handler will execute.
app.use((req, res, next) => {
  // Respond with a 404 status and a JSON error message.
  res.status(404).json({ error: `Not Found - ${req.method} ${req.originalUrl}` });
});

// --- Global Error Handler ---
// This is an Express error-handling middleware, recognized by its four arguments (err, req, res, next).
// It should be the last piece of middleware added. Catches errors from any route handlers.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  // Log the error to the console for debugging.
  console.error('Global error handler caught:', err);
  // Determine the status code: use the error's statusCode if available, otherwise default to 500 (Internal Server Error).
  const statusCode = err.statusCode || 500;
  // Send a JSON response with the error message.
  res.status(statusCode).json({
    error: err.message || 'An unexpected error occurred.',
    // Optionally, include the stack trace in the response during development for easier debugging.
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Export the Express app instance.
// This is useful for integration testing or if other modules need access to the configured app.
module.exports = app;
