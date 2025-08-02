const express = require('express');
const diaryStore = require('../diaryStore');
const axios = require('axios');
const { processEntry } = require('../controllers/lune');

// Helper to send an entry to an external n8n webhook
async function sendEntryWebhook(entry) {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    throw new Error('N8N_WEBHOOK_URL is not configured.');
  }

  let folderPayload = null;
  if (entry.FolderId) {
    try {
      const folder = await diaryStore.findFolderById(entry.FolderId);
      if (folder) {
        folderPayload = {
          folder_id: folder.id,
          name: folder.name,
          description: null, // No description field in the Folder model
        };
      }
    } catch (err) {
      console.error('[Webhook] Error fetching folder for payload:', err.message);
    }
  }

  const payload = {
    entry_id: entry.id,
    content: entry.text || '',
    created_at: entry.createdAt.toISOString(),
    updated_at: entry.updatedAt.toISOString(),
    idea: null,
    folder: folderPayload,
  };

  console.log('[Webhook] Sending POST to n8n with payload:', JSON.stringify(payload, null, 2));

  try {
    const response = await axios.post(webhookUrl, payload, {
      timeout: 5000,
      headers: { 'Content-Type': 'application/json' },
      validateStatus: null,
    });

    if (response.status >= 200 && response.status < 300) {
      console.log(`[Webhook] Success: Received status code ${response.status}`);
    } else {
      console.error(`[Webhook] Non-success status: ${response.status}`, response.data);
      throw new Error(`n8n webhook returned status ${response.status}`);
    }
  } catch (err) {
    console.error('[Webhook] Failed to send:', err.message);
    throw err;
  }
}

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

      // Generate the idea/reflection using the Lune agent pipeline
      await processEntry(entry);

      // Fire and forget the webhook request so the client isn't blocked
      sendEntryWebhook(entry).catch(() => {});

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

      sendEntryWebhook(entry).catch(() => {});

      res.json(serializeEntry(entry));
  }));

  router.put('/:entryId/folder', asyncHandler(async (req, res) => {
      const { folderId } = req.body;
      if (folderId === undefined) {
          return res.status(400).json({ error: 'folderId is required (can be null to unassign from folder).' });
      }
      const entry = await diaryStore.assignEntryToFolder(req.params.entryId, folderId);
      io.emit('entry-updated', serializeEntry(entry));

      sendEntryWebhook(entry).catch(() => {});

      res.json(serializeEntry(entry));
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
      await diaryStore.remove(req.params.id);
      io.emit('entry-deleted', req.params.id);
      await diaryStore.emitTagsUpdate(io);

      res.json({ message: 'Diary entry deleted successfully.' });
  }));

  // --- Webhook Test Route ---

  // A dedicated endpoint to test the n8n webhook integration
  // by sending the most recent diary entry.
  router.get('/test-webhook', asyncHandler(async (req, res, next) => {
    console.log('[Webhook Test] Received request to test n8n webhook.');
    const entries = await diaryStore.getAll();
    const latestEntry = entries[0];

    if (!latestEntry) {
      console.log('[Webhook Test] No entries found in diaryStore.');
      return res.status(404).json({ error: 'No diary entries found to test the webhook.' });
    }

    console.log(`[Webhook Test] Found latest entry with ID: ${latestEntry.id}`);

    try {
      await sendEntryWebhook(latestEntry);
      res.status(200).json({
        message: 'Webhook test triggered successfully.',
        entry: serializeEntry(latestEntry)
      });
    } catch (error) {
      // The robust `sendEntryWebhook` now throws on failure.
      // We catch it and pass it to the Express error handler.
      console.error('[Webhook Test] The sendEntryWebhook function threw an error.');
      next(error); // Forward to global error handler
    }
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

module.exports.sendEntryWebhook = sendEntryWebhook;
