// Import Express and create a router instance.
const express = require('express');
const router = express.Router();
// Import the diaryStore for data operations (CRUD for entries, folders, hashtags).
const diaryStore = require('../diaryStore');
// Import axios for making HTTP requests (used for n8n webhook).
const axios = require('axios');

// --- Diary Entry Routes ---

// POST /diary - Create a new diary entry.
router.post('/', async (req, res) => {
  try {
    // Destructure text and optional folderId from request body.
    // Supports 'text' or legacy 'content' for the entry's main content.
    const { text, folderId } = req.body;
    const entryText = text || req.body.content;

    // Validate that entryText is provided and is a string.
    if (!entryText || typeof entryText !== 'string') {
      return res.status(400).json({ error: 'Text is required for the entry.' });
    }

    // Add the new entry to the diaryStore.
    // folderId is optional; diaryStore will handle its assignment.
    const entry = await diaryStore.add(entryText, folderId);

    // Post-creation: Send entry text to an n8n webhook for further processing (agent pipeline).
    // This URL appears to be for a specific n8n workflow.
    const n8nWebhookUrl = 'https://mystc-myst.app.n8n.cloud/webhook/9f5ad6f1-d4a7-43a6-8c13-4b1c0e76bb4e/chat';
    try {
      await axios.post(n8nWebhookUrl, { text: entry.text });
    } catch (webhookError) {
      // Log error if webhook call fails, but don't fail the main entry creation response.
      console.error('Error sending data to n8n webhook after entry creation:', webhookError.message);
    }

    // Respond with 201 (Created) and the newly created entry object.
    res.status(201).json(entry);
  } catch (err) {
    // Handle errors during entry creation (e.g., issues with diaryStore).
    res.status(400).json({ error: err.message });
  }
});

// GET /diary - Retrieve all diary entries.
// Entries are typically returned newest first by the diaryStore.
router.get('/', async (req, res) => {
  try {
    const entries = await diaryStore.getAll();
    res.json(entries);
  } catch (err) {
    // Handle errors during retrieval.
    res.status(500).json({ error: `Failed to get entries: ${err.message}` });
  }
});

// PUT /diary/:id - Edit an existing diary entry.
// Updates the entry's text and optionally its folderId.
router.put('/:id', async (req, res) => {
  try {
    const { text, folderId } = req.body; // folderId can be string (new folder), null (unassign), or undefined (no change).
    // Text content remains mandatory for updating an entry via this route.
    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required to update an entry.' });
    }
    // diaryStore.updateText handles the logic for folderId:
    // - If folderId is provided (string or null), it's updated.
    // - If folderId is undefined, it's not changed by this specific call.
    const entry = await diaryStore.updateText(req.params.id, text, folderId);
    if (!entry) { // If entry with the given ID is not found.
      return res.status(404).json({ error: 'Entry not found.' });
    }
    res.json(entry); // Respond with the updated entry.
  } catch (err) {
    res.status(500).json({ error: `Failed to update entry: ${err.message}` });
  }
});

// PUT /diary/:entryId/folder - Assign or unassign an entry to/from a folder.
// This is a more specific route for managing an entry's folder association.
router.put('/:entryId/folder', async (req, res) => {
  try {
    const { folderId } = req.body; // folderId can be a string (new folder ID) or null (to unassign).
    // folderId must be explicitly provided (even if null).
    if (folderId === undefined) {
        return res.status(400).json({ error: 'folderId is required (can be null to unassign from folder).' });
    }
    const entry = await diaryStore.assignEntryToFolder(req.params.entryId, folderId);
    if (!entry) { // If entry with the given ID is not found.
      return res.status(404).json({ error: 'Entry not found.' });
    }
    res.json(entry); // Respond with the updated entry.
  } catch (err) {
    res.status(500).json({ error: `Failed to assign entry to folder: ${err.message}` });
  }
});

// DELETE /diary/:id - Delete a specific diary entry.
router.delete('/:id', async (req, res) => {
  try {
    const success = await diaryStore.remove(req.params.id);
    if (!success) { // If entry was not found or deletion failed.
      return res.status(404).json({ error: 'Entry not found or could not be deleted.' });
    }
    res.json({ message: 'Diary entry deleted successfully.' });
  } catch (err) {
    res.status(500).json({ error: `Failed to delete entry: ${err.message}` });
  }
});


// --- Folder Routes ---

// GET /diary/folders - Retrieve all folders.
router.get('/folders', async (req, res) => {
  try {
    const folders = await diaryStore.getAllFolders();
    res.json(folders);
  } catch (err) {
    res.status(500).json({ error: `Failed to get folders: ${err.message}` });
  }
});

// POST /diary/folders - Create a new folder.
router.post('/folders', async (req, res) => {
  try {
    const { name } = req.body; // Expects folder name in the request body.
    // Validate folder name.
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required and cannot be empty.' });
    }
    const folder = await diaryStore.addFolder(name.trim());
    res.status(201).json(folder); // Respond with 201 (Created) and the new folder object.
  } catch (err) {
    // Handle errors, including potential validation errors from diaryStore if name is invalid.
    res.status(400).json({ error: `Failed to create folder: ${err.message}` });
  }
});

// PUT /diary/folders/:id - Update an existing folder's name.
router.put('/folders/:id', async (req, res) => {
  try {
    const { name } = req.body; // Expects new folder name.
    // Validate new folder name.
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'Folder name is required and cannot be empty for update.' });
    }
    const folder = await diaryStore.updateFolder(req.params.id, name.trim());
    if (!folder) { // If folder with the given ID is not found.
      return res.status(404).json({ error: 'Folder not found.' });
    }
    res.json(folder); // Respond with the updated folder object.
  } catch (err) {
    // Specific error handling for "Folder name cannot be empty" if diaryStore throws it.
    if (err.message === 'Folder name cannot be empty.') {
      return res.status(400).json({ error: err.message });
    }
    res.status(500).json({ error: `Failed to update folder: ${err.message}` });
  }
});

// DELETE /diary/folders/:id - Delete a folder.
// Entries within the deleted folder are typically unassigned (folderId set to null).
router.delete('/folders/:id', async (req, res) => {
  try {
    const success = await diaryStore.removeFolder(req.params.id);
    if (!success) { // If folder was not found or deletion failed.
      return res.status(404).json({ error: 'Folder not found or could not be deleted.' });
    }
    res.json({ message: 'Folder deleted successfully. Entries previously in this folder are now unassigned.' });
  } catch (err) {
    res.status(500).json({ error: `Failed to delete folder: ${err.message}` });
  }
});

// --- Tag Routes ---

// GET /diary/tags - Retrieve the tag index.
router.get('/tags', async (req, res) => {
  try {
    const tags = await diaryStore.getTags();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: `Failed to get tags: ${err.message}` });
  }
});

// Export the router to be used in server.js.
module.exports = router;
