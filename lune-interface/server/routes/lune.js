// /server/routes/lune.js
const router = require('express').Router();
const luneController = require('../controllers/lune');

// POST /lune/send
router.post('/send', luneController.handleUserMessage);
router.post('/log', luneController.saveConversationLog);

// POST /lune/n8n_response - New route for receiving messages from n8n
router.post('/n8n_response', luneController.receiveN8nResponse);

// GET /lune/get_n8n_response - New route for client to poll for n8n messages
router.get('/get_n8n_response', luneController.getN8nResponse);

module.exports = router;
