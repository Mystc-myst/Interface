// /server/routes/lune.js
const router = require('express').Router();
const luneController = require('../controllers/lune');

// POST /lune/send
router.post('/send', luneController.handleUserMessage);
router.post('/log', luneController.saveConversationLog);
module.exports = router;
