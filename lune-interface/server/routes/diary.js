const express = require('express');
const router = express.Router();
const diaryStore = require('../diaryStore');
const axios = require('axios');

// Create a diary entry (accepts 'text' or legacy 'content')
router.post('/', async (req, res) => {
  try {
    const text = req.body.text || req.body.content;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }
    const entry = await diaryStore.add(text);

    // Agent processing disabled for offline diary
    const n8nWebhookUrl = 'https://mystc-myst.app.n8n.cloud/webhook/9f5ad6f1-d4a7-43a6-8c13-4b1c0e76bb4e/chat';
    try {
      console.log(`Sending data to n8n webhook: ${n8nWebhookUrl}`);
      const response = await axios.post(n8nWebhookUrl, { text: entry.text }); // Ensure 'text' field is used
      console.log('n8n webhook response status:', response.status);
      console.log('n8n webhook response data:', response.data);
    } catch (webhookError) {
      console.error('Error sending data to n8n webhook:', webhookError.message);
      // Decide if you want to alter the client response if webhook fails.
      // For now, we still return the locally saved entry.
    }

    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all entries (newest first)
router.get('/', async (req, res) => {
  try {
    const entries = await diaryStore.getAll();
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit an entry (update content and refresh date)
router.put('/:id', async (req, res) => {
  try {
    const text = req.body.text;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }
    const entry = await diaryStore.updateText(req.params.id, text);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    // Agent processing disabled for offline diary
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an entry
router.delete('/:id', async (req, res) => {
  try {
    const success = await diaryStore.remove(req.params.id);
    if (!success) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
