const express = require('express');
const router = express.Router();
const diaryStore = require('../diaryStore');
// Agent controllers are not used in offline mode
// const resistor = require('../controllers/resistor');
// const interpreter = require('../controllers/interpreter');
// const forge = require('../controllers/forge');
// const lune = require('../controllers/lune');

// Create a diary entry (accepts 'text' or legacy 'content')
router.post('/', async (req, res) => {
  try {
    const text = req.body.text || req.body.content;
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }
    const entry = await diaryStore.add(text);

    // Agent processing disabled for offline diary

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
