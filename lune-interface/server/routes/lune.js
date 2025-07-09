// /server/routes/lune.js
// This file defines the routes related to the Lune AI agent interactions.

// Import the Express router.
const router = require('express').Router();
// Import the controller functions for Lune operations.
const luneController = require('../controllers/lune');

// Define a POST route for sending a message to the Lune agent.
// The actual message handling logic, including communication with any external AI service (e.g., via n8n webhook),
// is encapsulated in `luneController.handleUserMessage`.
// Endpoint: POST /api/lune/send (since this router is mounted at /api/lune in server.js)
router.post('/send', luneController.handleUserMessage);

// Define a POST route for logging a conversation with Lune.
// This is used to save the chat history.
// Endpoint: POST /api/lune/log
router.post('/log', luneController.saveConversationLog);

// Export the router to be used by the main application (server.js).
module.exports = router;
