const express = require('express');
const diaryStore = require('../diaryStore');
const axios = require('axios');

// Utility to forward async errors to Express error handlers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Normalize a Sequelize Entry instance to a plain object expected by the client
function serializeEntry(entry) {
  const plain = entry.toJSON ? entry.toJSON() : entry;
  return {
    id: plain.id,
    text: plain.text,
    timestamp: plain.timestamp,
    folderId: plain.folderId ?? plain.FolderId ?? null,
    tags: Array.isArray(plain.Tags) ? plain.Tags.map(t => t.name) : plain.tags || [],
  };
}

module.exports = function(io) {
  const router = express.Router();

  // --- Diary Entry Routes ---

  router.post('/', asyncHandler(async (req, res) => {
      const { text, folderId } = req.body;
      const entryText = text || req.body.content;

      if (!entryText || typeof entryText !== 'string') {
        return res.status(400).json({ error: 'Text is required for the entry.' });
      }

      const entry = await diaryStore.add(entryText, folderId);

      const n8nWebhookUrl = process.env.N8N_WEBHOOK_URL;
      if (n8nWebhookUrl) {
        // Fire and forget the webhook request so the client isn't blocked
        axios
          .post(n8nWebhookUrl, { text: entry.text }, { timeout: 2000 })
          .catch((webhookError) => {
            console.error(
              'Error sending data to n8n webhook after entry creation:',
              webhookError.message
            );
          });
      }

      io.emit('new-entry', serializeEntry(entry));
      await diaryStore.emitTagsUpdate(io);

      res.status(201).json(serializeEntry(entry));
  }));

// GET /diary - Retrieve all diary entries.
// Entries are typically returned newest first by the diaryStore.
router.get('/', asyncHandler(async (req, res) => {
    const entries = await diaryStore.getAll();
    res.json(entries.map(serializeEntry));
}));

  router.put('/:id', asyncHandler(async (req, res) => {
      const { text, folderId } = req.body;
      if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text is required to update an entry.' });
      }
      const entry = await diaryStore.updateEntry(req.params.id, { text, folderId });
      io.emit('entry-updated', serializeEntry(entry));
      await diaryStore.emitTagsUpdate(io);

      res.json(serializeEntry(entry));
  }));

  router.put('/:entryId/folder', asyncHandler(async (req, res) => {
      const { folderId } = req.body;
      if (folderId === undefined) {
          return res.status(400).json({ error: 'folderId is required (can be null to unassign from folder).' });
      }
      const entry = await diaryStore.assignEntryToFolder(req.params.entryId, folderId);
      io.emit('entry-updated', serializeEntry(entry));
      res.json(serializeEntry(entry));
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
      await diaryStore.remove(req.params.id);
      io.emit('entry-deleted', req.params.id);
      await diaryStore.emitTagsUpdate(io);

      res.json({ message: 'Diary entry deleted successfully.' });
  }));

  // --- Folder Routes ---

  router.get('/folders', asyncHandler(async (req, res) => {
      const folders = await diaryStore.getAllFolders();
      res.json(folders);
  }));

  router.post('/folders', asyncHandler(async (req, res) => {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Folder name is required and cannot be empty.' });
      }
      const folder = await diaryStore.addFolder(name.trim());
      io.emit('folders-updated');
      res.status(201).json(folder);
  }));

  router.put('/folders/:id', asyncHandler(async (req, res) => {
      const { name } = req.body;
      if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'Folder name is required and cannot be empty for update.' });
      }
      const folder = await diaryStore.updateFolder(req.params.id, name.trim());
      io.emit('folders-updated');
      res.json(folder);
  }));

  router.delete('/folders/:id', asyncHandler(async (req, res) => {
      await diaryStore.removeFolder(req.params.id);
      io.emit('folders-updated');
      res.json({ message: 'Folder deleted successfully. Entries previously in this folder are now unassigned.' });
  }));

  // --- Tag Routes ---

  router.get('/tags', asyncHandler(async (req, res) => {
      const tags = await diaryStore.getTags();
      res.json(tags);
  }));

  return router;
}
