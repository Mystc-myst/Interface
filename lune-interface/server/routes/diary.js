const express = require('express');
const router = express.Router();
const diaryStore = require('../diaryStore');
const resistor = require('../controllers/resistor');
const interpreter = require('../controllers/interpreter');
const forge = require('../controllers/forge');
const lune = require('../controllers/lune');

// Create a diary entry (accepts 'text' or legacy 'content')
router.post('/', async (req, res) => {
  try {
    const text = req.body.text || req.body.content;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }
    const entry = await diaryStore.add(text);

    // Trigger simple agent processing sequentially
    try {
      await resistor.processEntry(entry);
      await interpreter.processEntry(entry);
      await forge.processEntry(entry);
      await lune.processEntry(entry);
    } catch (err) {
      console.error('Agent processing failed:', err);
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

    // Re-run simple agent pipeline after edit
    try {
      await resistor.processEntry(entry);
      await interpreter.processEntry(entry);
      await forge.processEntry(entry);
      await lune.processEntry(entry);
    } catch (err) {
      console.error('Agent processing failed:', err);
    }

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete an entry
router.delete('/:id', async (req, res) => {
  try {
    const removed = await diaryStore.deleteById(req.params.id);
    if (!removed) return res.status(404).json({ error: 'Entry not found.' });
    res.json({ message: 'Entry deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
