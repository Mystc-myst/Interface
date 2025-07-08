const express = require('express');
const router = express.Router();
const diaryStore = require('../diaryStore');
const axios = require('axios');

// --- Entry Routes ---

// Create a diary entry
router.post('/', async (req, res) => {
  try {
    const { text, folderId } = req.body; // Accepts text (or legacy content) and optional folderId
    const entryText = text || req.body.content;

    if (!entryText || typeof entryText !== 'string') {
      return res.status(400).json({ error: 'Text is required.' });
    }
    // Validate folderId if provided (optional: ensure it exists, or let diaryStore handle it)
    const entry = await diaryStore.add(entryText, folderId);

    // Agent processing (existing logic)
    const n8nWebhookUrl = 'https://mystc-myst.app.n8n.cloud/webhook/9f5ad6f1-d4a7-43a6-8c13-4b1c0e76bb4e/chat';
    try {
      await axios.post(n8nWebhookUrl, { text: entry.text });
    } catch (webhookError) {
      console.error('Error sending data to n8n webhook:', webhookError.message);
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

// Edit an entry (update text and optionally folderId)
router.put('/:id', async (req, res) => {
  try {
    const { text, folderId } = req.body; // folderId can be string, null, or undefined
    if (!text || typeof text !== 'string') { // Text remains mandatory for this route
      return res.status(400).json({ error: 'Text is required.' });
    }
    // folderId being undefined means don't change it via this main update route
    // To explicitly unassign, client should send folderId: null
    const entry = await diaryStore.updateText(req.params.id, text, folderId);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Assign/Unassign an entry to/from a folder
router.put('/:entryId/folder', async (req, res) => {
  try {
    const { folderId } = req.body; // folderId can be a string (ID) or null (to unassign)
    if (folderId === undefined) {
        return res.status(400).json({ error: 'folderId is required (can be null to unassign).' });
    }
    const entry = await diaryStore.assignEntryToFolder(req.params.entryId, folderId);
    if (!entry) return res.status(404).json({ error: 'Entry not found.' });
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


// --- Folder Routes ---

// Get all folders
router.get('/folders', async (req, res) => {
  try {
    const folders = await diaryStore.getAllFolders();
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new folder
router.post('/folders', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required.' });
    }
    const folder = await diaryStore.addFolder(name);
    res.status(201).json(folder);
  } catch (err) {
    // diaryStore.addFolder might throw an error for empty name, catch it.
    res.status(400).json({ error: err.message });
  }
});

// Update a folder's name
router.put('/folders/:id', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required.' });
    }
    const folder = await diaryStore.updateFolder(req.params.id, name);
    if (!folder) return res.status(404).json({ error: 'Folder not found.' });
    res.json(folder);
  } catch (err) {
    // diaryStore.updateFolder might throw an error for empty name
    if (err.message === 'Folder name cannot be empty.') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: err.message });
  }
});

// Delete a folder
router.delete('/folders/:id', async (req, res) => {
  try {
    const success = await diaryStore.removeFolder(req.params.id);
    if (!success) return res.status(404).json({ error: 'Folder not found.' });
    res.json({ message: 'Folder deleted successfully. Entries within have been unassigned.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Hashtag Routes ---

// Get all unique hashtags
router.get('/hashtags', async (req, res) => {
  try {
    const hashtags = await diaryStore.getAllUniqueHashtags();
    res.json(hashtags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
