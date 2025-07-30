const express = require('express');
const diaryStore = require('../diaryStore');
const { NotFoundError, DatabaseError } = require('../errors');
const axios = require('axios');

module.exports = function(io) {
  const router = express.Router();

  // --- Diary Entry Routes ---

  router.post('/', async (req, res) => {
    try {
      const { text, folderId } = req.body;
      const entryText = text || req.body.content;

      if (!entryText || typeof entryText !== 'string') {
        return res.status(400).json({ error: 'Text is required for the entry.' });
      }

      const entry = await diaryStore.add(entryText, folderId);

      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      try {
        await axios.post(n8nWebhookUrl, { text: entry.text });
      } catch (webhookError) {
        console.error('Error sending data to n8n webhook after entry creation:', webhookError.message);
      }

      io.emit('new-entry', entry);
      const tags = await diaryStore.getTags();
      io.emit('tags-updated', tags);

      res.status(201).json(entry);
    } catch (err) {
      if (err instanceof DatabaseError) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  });

// GET /diary - Retrieve all diary entries.
// Entries are typically returned newest first by the diaryStore.
router.get('/', async (req, res) => {
  try {
    const entries = await diaryStore.getAll();
    res.json(entries);
  } catch (err) {
    if (err instanceof DatabaseError) {
        res.status(500).json({ error: err.message });
    } else {
        res.status(500).json({ error: `An unexpected error occurred: ${err.message}` });
    }
  }
});

  router.put('/:id', async (req, res) => {
    try {
      const { text, folderId } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required to update an entry.' });
      }
      const entry = await diaryStore.updateEntry({ id: req.params.id, text, folderId });
      io.emit('entry-updated', entry);
      const tags = await diaryStore.getTags();
      io.emit('tags-updated', tags);

      res.json(entry);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
      } else if (err instanceof DatabaseError) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  });

  router.put('/:entryId/folder', async (req, res) => {
    try {
      const { folderId } = req.body;
      if (folderId === undefined) {
          return res.status(400).json({ error: 'folderId is required (can be null to unassign from folder).' });
      }
      const entry = await diaryStore.assignEntryToFolder(req.params.entryId, folderId);
      io.emit('entry-updated', entry);
      res.json(entry);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
      } else if (err instanceof DatabaseError) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      await diaryStore.remove(req.params.id);
      io.emit('entry-deleted', req.params.id);
      const tags = await diaryStore.getTags();
      io.emit('tags-updated', tags);

      res.json({ message: 'Diary entry deleted successfully.' });
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
      } else if (err instanceof DatabaseError) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  });

  // --- Folder Routes ---

  router.get('/folders', async (req, res) => {
    try {
      const folders = await diaryStore.getAllFolders();
      res.json(folders);
    } catch (err) {
      if (err instanceof DatabaseError) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(500).json({ error: `An unexpected error occurred: ${err.message}` });
      }
    }
  });

  router.post('/folders', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Folder name is required and cannot be empty.' });
      }
      const folder = await diaryStore.addFolder(name.trim());
      io.emit('folders-updated');
      res.status(201).json(folder);
    } catch (err) {
      if (err instanceof DatabaseError) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  });

  router.put('/folders/:id', async (req, res) => {
    try {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Folder name is required and cannot be empty for update.' });
      }
      const folder = await diaryStore.updateFolder(req.params.id, name.trim());
      io.emit('folders-updated');
      res.json(folder);
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
      } else if (err instanceof DatabaseError) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  });

  router.delete('/folders/:id', async (req, res) => {
    try {
      await diaryStore.removeFolder(req.params.id);
      io.emit('folders-updated');
      res.json({ message: 'Folder deleted successfully. Entries previously in this folder are now unassigned.' });
    } catch (err) {
      if (err instanceof NotFoundError) {
        res.status(404).json({ error: err.message });
      } else if (err instanceof DatabaseError) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(400).json({ error: err.message });
      }
    }
  });

  // --- Tag Routes ---

  router.get('/tags', async (req, res) => {
    try {
      const tags = await diaryStore.getTags();
      res.json(tags);
    } catch (err) {
      if (err instanceof DatabaseError) {
        res.status(500).json({ error: err.message });
      } else {
        res.status(500).json({ error: `An unexpected error occurred: ${err.message}` });
      }
    }
  });

  return router;
}
