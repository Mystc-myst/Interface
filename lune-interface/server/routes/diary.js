const express = require('express');
const router = express.Router();
const DiaryEntry = require('../models/DiaryEntry');

// Create a diary entry (accepts 'content' or old 'text')
router.post('/', async (req, res) => {
  try {
    const content = req.body.content || req.body.text;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required.' });
    }
    const entry = new DiaryEntry({ content });
    await entry.save();
    res.status(201).json(entry);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all entries (newest first)
router.get('/', async (req, res) => {
  try {
    const entries = await DiaryEntry.find().sort({ createdAt: -1 });
    res.json(entries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Edit an entry (update content and refresh date)
router.put('/:id', async (req, res) => {
  try {
    const content = req.body.content;
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required.' });
    }
    const entry = await DiaryEntry.findByIdAndUpdate(
      req.params.id,
      { content, createdAt: new Date() },
      { new: true }
    );
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
