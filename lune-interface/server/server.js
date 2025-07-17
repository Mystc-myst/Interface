/**
 * @file server.js
 * @description Main entry point for the Express backend application.
 */

const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');
const dotenv = require('dotenv');
const luneRoutes = require('./routes/lune');
const diaryRoutes = require('./routes/diary');

// Load environment variables from .env file.
dotenv.config();

// Initialize Express app and HTTP server.
const app = express();
const server = http.createServer(app);

// Initialize Socket.io server.
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust for production
    methods: ["GET", "POST"]
  }
});

// Define the port the server will listen on.
const port = process.env.PORT || 5001;

// Core Middleware
app.use(cors());
app.use(express.json());

// Application Routes
// Pass the io object to the diary routes to enable real-time updates.
app.use('/diary', diaryRoutes(io));
app.use('/api/lune', luneRoutes);

// Socket.io connection handler.
io.on('connection', (socket) => {
  console.log('a user connected');
  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Server Startup Logic
if (require.main === module) {
  server.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ error: `Not Found - ${req.method} ${req.originalUrl}` });
});

// Global Error Handler
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('Global error handler caught:', err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: err.message || 'An unexpected error occurred.',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// Export the Express app instance for testing.
module.exports = app;
