const express = require('express');
const router = express.Router();
const DiaryEntry = require('../models/DiaryEntry');

// Create a diary entry (accepts 'text' or legacy 'content')
router.post('/', async (req, res) => {
  try {
    const text = req.body.text || req.body.content;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }
    const entry = new DiaryEntry({ text });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all entries (newest first)
router.get('/', async (req, res) => {
  try {
    const entries = await DiaryEntry.find().sort({ timestamp: -1 });
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
    const entry = await DiaryEntry.findByIdAndUpdate(
      req.params.id,
      { text, timestamp: new Date() },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
