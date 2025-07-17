/**
 * @module diaryStore
 * @description Manages the persistence of diary entries and folders to a JSON file (`offline-diary/diary.json`).
 * Handles loading, saving, adding, updating, and removing entries and folders.
 * Includes error handling for corrupted data files, migration from old format, and file locking for save operations.
 */

// Node.js core modules for file system, path manipulation, and cryptography.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // Used for generating unique IDs for entries and folders.
// External module for file locking to prevent race conditions during writes.
const lockfile = require('proper-lockfile');

// Define the path to the main data file where diary entries and folders are stored.
const DATA_FILE = path.join(__dirname, '..', '..', 'offline-diary', 'diary.json');

// In-memory cache for diary entries and folders.
let diary = []; // Stores diary entry objects.
let folders = []; // Stores folder objects.
let tagIndex = {}; // In-memory index for tags

/**
 * @private
 * @function load
 * @description Loads diary entries and folders from the DATA_FILE into the in-memory cache.
 * - If the file exists, it's read and parsed as JSON.
 * - Handles migration from an old format (where data was an array of entries) to the new format
 *   (an object with `entries` and `folders` properties).
 * - If the file is corrupted or in an unexpected format, it attempts to back up the problematic file
 *   and initializes the cache with empty arrays.
 * - If the file doesn't exist, initializes with empty arrays.
 */
function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(raw);

      // Check for old array format (only entries) vs new object format {entries, folders}
      if (Array.isArray(data)) {
        console.log('[diaryStore] Old diary format detected (array). Migrating to new format {entries, folders}.');
        diary = data; // Old format was just an array of entries.
        folders = []; // Initialize folders as empty.
      } else if (data && typeof data === 'object' && data.entries !== undefined && data.folders !== undefined) {
        // New format: has both entries and folders properties.
        diary = data.entries;
        folders = data.folders;
        console.log('[diaryStore] Loaded data in new format.');
      } else {
        // Unexpected format.
        console.warn('[diaryStore] diary.json is in an unexpected format. Initializing with empty data and attempting to back up.');
        const backupFilename = `${DATA_FILE}.unexpected_format.${Date.now()}`;
        try {
            fs.renameSync(DATA_FILE, backupFilename);
            console.log(`[diaryStore] Unexpected format diary file backed up to: ${backupFilename}`);
        } catch(e) {
            console.error(`[diaryStore] Could not back up unexpected format file: ${e.message}`);
        }
        diary = [];
        folders = [];
      }
    } catch (parseErr) {
      // Handle JSON parsing errors (corrupted file).
      console.error('[diaryStore] Failed to parse diary.json:', parseErr.message);
      try {
        // Create a timestamped backup of the corrupted file.
        const now = new Date();
        const timestamp = now.getFullYear() + '-' +
          ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
          ('0' + now.getDate()).slice(-2) + '_' +
          ('0' + now.getHours()).slice(-2) + '-' +
          ('0' + now.getMinutes()).slice(-2) + '-' +
          ('0' + now.getSeconds()).slice(-2);
        const backupFilename = `${DATA_FILE}.corrupted.${timestamp}`;
        fs.renameSync(DATA_FILE, backupFilename);
        console.log(`[diaryStore] Corrupted diary file backed up to: ${backupFilename}`);
      } catch (renameErr) {
        console.error(`[diaryStore] Failed to rename corrupted diary.json: ${renameErr.message}`);
      }
      // Initialize with empty data after backup attempt.
      diary = [];
      folders = [];
    }
  } else {
    // If DATA_FILE does not exist, initialize with empty arrays.
    console.log('[diaryStore] diary.json not found. Initializing with empty data.');
    diary = [];
    folders = [];
  }
}

/**
 * @private
 * @function save
 * @description Saves the current state of the in-memory diary entries and folders to DATA_FILE.
 * - Ensures the directory for DATA_FILE exists.
 * - Uses `proper-lockfile` to acquire a lock on the file before writing, preventing data corruption
 *   from concurrent writes. The lock is synchronous.
 * - Writes data as a JSON object: `{ "entries": [...], "folders": [...] }`.
 * - Releases the lock in a `finally` block to ensure it's always released.
 * @throws Will re-throw errors encountered during directory creation, locking, or writing.
 */
function save() {
  console.log('[diaryStore] Attempting to save diary data...');
  try {
    // Ensure the directory for DATA_FILE exists.
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      console.log(`[diaryStore] Target directory ${dir} does not exist. Creating...`);
      fs.mkdirSync(dir, { recursive: true });
    }

    // Acquire a synchronous lock on the data file.
    // `stale: 5000` means the lock is considered stale after 5 seconds if not released.
    // Synchronous lock is used here; for high-concurrency, async might be better but is more complex.
    console.log(`[diaryStore] Attempting to acquire lock for: ${DATA_FILE}`);
    lockfile.lockSync(DATA_FILE, { stale: 5000 });
    console.log(`[diaryStore] Lock acquired for: ${DATA_FILE}`);

    // Prepare data in the new format.
    const dataToSave = {
      entries: diary,
      folders: folders,
    };
    // Write the data to the file, pretty-printed with 2-space indentation.
    console.log('[diaryStore] Attempting to write data to file...');
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
    console.log('[diaryStore] Data successfully written to file.');
  } catch (err) {
    // Log and re-throw any error encountered during the save process.
    console.error('[diaryStore] Failed to save diary data:', err);
    throw err;
  } finally {
    // Ensure the lock is released, even if an error occurred.
    try {
      // Check if the lock exists before trying to unlock, to prevent errors if lock acquisition failed.
      if (lockfile.checkSync(DATA_FILE)) {
        console.log(`[diaryStore] Releasing lock for: ${DATA_FILE}`);
        lockfile.unlockSync(DATA_FILE);
      }
    } catch (unlockErr) {
      // Log errors occurring during the unlock sequence itself.
      console.error('[diaryStore] Error during unlock sequence:', unlockErr);
    }
  }
}

async function rebuildTagIndex() {
  console.log('[diaryStore] Rebuilding tag index...');
  const all = diary; // Use in-memory diary
  tagIndex = all.reduce((idx, e) => {
    if (e.tags) {
      e.tags.forEach(tag => {
        idx[tag] = idx[tag] || new Set();
        idx[tag].add(e.id);
      });
    }
    return idx;
  }, {});
  console.log('[diaryStore] Tag index rebuilt.');
}

// Initial load of data when the module is first required.
load();
rebuildTagIndex();


// Perform an initial save if the file didn't exist, was empty, or was in the old format.
// This ensures diary.json is created and is in the new {entries, folders} format from the start.
let needsInitialSave = !fs.existsSync(DATA_FILE); // If file doesn't exist, it needs saving.
if (fs.existsSync(DATA_FILE)) {
    try {
        const rawContent = fs.readFileSync(DATA_FILE, 'utf8');
        if (rawContent.trim() === '') { // If file is empty
            needsInitialSave = true;
        } else {
            const currentData = JSON.parse(rawContent);
            if (Array.isArray(currentData)) { // If data is in old array format
                needsInitialSave = true;
            }
        }
    } catch (e) {
        // If parsing fails (e.g., corrupted or not JSON), it might need an initial save.
        // `load()` would have initialized `diary` and `folders` to empty arrays.
        // Check if the file is empty, which would also require an initial save.
        if (fs.statSync(DATA_FILE).size === 0) {
            needsInitialSave = true;
        }
        console.warn(`[diaryStore] Error checking initial content of diary.json, possibly corrupted: ${e.message}. Load function handled initialization.`);
    }
}

if (needsInitialSave) {
    console.log('[diaryStore] Performing initial save to ensure diary.json is in the new format.');
    try {
        save();
    } catch (initialSaveError) {
        console.error(`[diaryStore] Critical error during initial save of diary.json: ${initialSaveError.message}`);
        // Depending on severity, might want to exit or take other recovery actions.
    }
}


/**
 * @function getAll
 * @description Retrieves all diary entries from the in-memory cache, sorted by timestamp in descending order (newest first).
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of diary entry objects.
 *                                    The functions are async to maintain a consistent API, even though current ops are sync.
 */
exports.getAll = async function() {
  // Return a copy of the array, sorted.
  return diary.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

function parseHashtags(text) {
  if (typeof text !== 'string') {
    return [];
  }
  const TAG_REGEX = /#([A-Za-z0-9_-]+)/g;
  const matches = text.matchAll(TAG_REGEX);
  const tags = new Set(Array.from(matches, m => m[1].toLowerCase()));
  return Array.from(tags);
}

// Export for testing
exports._private = {
  parseHashtags
};

/**
 * @function add
 * @description Creates a new diary entry with the given text and optional folder ID.
 * - Generates a unique ID for the entry.
 * - Sets the current timestamp.
 * - Parses `[[tags]]` (legacy) and `#hashtags` from the text.
 * - Adds the new entry to the in-memory cache and saves to file.
 * @param {string} text - The content of the diary entry.
 * @param {string|null} [folderId=null] - Optional ID of the folder to associate this entry with.
 * @returns {Promise<Object>} A promise that resolves to the newly created diary entry object.
 */
exports.add = async function(text, folderId = null) {
  const tags = parseHashtags(text);
  const entry = {
    id: crypto.randomUUID(),
    text,
    timestamp: new Date().toISOString(),
    tags: tags,
    folderId: folderId
  };
  diary.push(entry);
  await save();
  console.log(`[diaryStore] Parsed tags for new entry ${entry.id}:`, entry.tags);
  await rebuildTagIndex();
  return entry;
};

exports.getTags = async function() {
  // Convert sets to arrays for JSON serialization
  const serializableTagIndex = Object.entries(tagIndex).reduce((acc, [tag, entryIds]) => {
    acc[tag] = Array.from(entryIds);
    return acc;
  }, {});
  return serializableTagIndex;
};

/**
 * @function findById
 * @description Finds a diary entry by its unique ID from the in-memory cache.
 * @param {string} id - The unique ID of the diary entry to find.
 * @returns {Promise<Object|undefined>} A promise that resolves to the diary entry object if found, otherwise undefined.
 */
exports.findById = async function(id) {
  return diary.find(e => e.id === id);
};

/**
 * @function updateText
 * @description Updates the text content of an existing diary entry.
 * - Also updates the entry's timestamp to the current time.
 * - Re-parses `[[tags]]` (legacy) and `#hashtags` from the new text.
 * - Can optionally update the entry's `folderId`.
 * - Saves changes to file if the entry is found.
 * @param {string} id - The unique ID of the diary entry to update.
 * @param {string} text - The new text content for the diary entry.
 * @param {string|null|undefined} [folderId=undefined] - New folder ID.
 *        - `string`: Assigns to new folder.
 *        - `null`: Unassigns from any folder.
 *        - `undefined`: Leaves folderId unchanged.
 * @returns {Promise<Object|null>} A promise that resolves to the updated diary entry object,
 * or null if no entry with the given ID is found.
 */
exports.updateText = async function(id, text, folderId) {
  const entry = await exports.findById(id);
  if (!entry) return null;

  entry.text = text;
  entry.timestamp = new Date().toISOString();
  entry.tags = parseHashtags(text);
  console.log(`[diaryStore] Parsed tags for updated entry ${entry.id}:`, entry.tags);

  if (folderId !== undefined) {
    entry.folderId = folderId;
  }

  await save();
  await rebuildTagIndex();
  return entry;
};

/**
 * @function saveEntry
 * @description Saves an entire diary entry object by replacing the existing entry with the same ID.
 * This is useful for updates where the entire entry object (potentially modified by agent processing) is available.
 * If no entry with the given ID exists, it currently logs a warning and does not add it as a new entry.
 * @param {Object} entryToSave - The diary entry object to save. Must contain an `id` property.
 * @returns {Promise<Object|null>} A promise that resolves to the saved diary entry object, or null if not found.
 */
exports.saveEntry = async function(entryToSave) {
  const index = diary.findIndex(e => e.id === entryToSave.id);
  if (index !== -1) {
    // Ensure tags are parsed from the text.
    entryToSave.tags = parseHashtags(entryToSave.text);
    console.log(`[diaryStore] Parsed tags for entry ${entryToSave.id}:`, entryToSave.tags);

    // Replace existing entry.
    diary[index] = entryToSave;
    await save(); // Persist changes.
    await rebuildTagIndex(); // Rebuild index after save.
  } else {
    // Entry not found. Currently, this function only updates existing entries.
    // To add if not found, one might push to `diary` array and then save.
    console.warn(`[diaryStore] saveEntry called for an ID not found: ${entryToSave.id}. Entry not saved.`);
    return null; // Indicate failure or that no update occurred.
  }
  return entryToSave;
};

/**
 * @function remove
 * @description Removes a diary entry by its ID from the in-memory cache and saves changes to file.
 * @param {string} id - The unique ID of the diary entry to remove.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the entry was found and removed, otherwise `false`.
 */
exports.remove = async function(id) {
  const index = diary.findIndex(e => e.id === id);
  if (index !== -1) {
    diary.splice(index, 1);
    await save();
    await rebuildTagIndex();
    return true;
  }
  return false;
};

// --- Folder Management Functions ---

/**
 * @function getAllFolders
 * @description Retrieves all folders from the in-memory cache, sorted by name alphabetically.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of folder objects.
 */
exports.getAllFolders = async function() {
  return folders.slice().sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * @function addFolder
 * @description Creates a new folder with the given name.
 * - Validates that the name is not empty.
 * - Generates a unique ID for the folder.
 * - Adds the new folder to the in-memory cache and saves to file.
 * @param {string} name - The name of the new folder.
 * @returns {Promise<Object>} A promise that resolves to the newly created folder object.
 * @throws {Error} If the folder name is empty or not a string, or if saving fails.
 */
exports.addFolder = async function(name) {
  console.log(`[diaryStore] addFolder called with name: "${name}"`);
  // Validate folder name: must be a non-empty string.
  if (!name || typeof name !== 'string' || name.trim() === '') {
    console.error('[diaryStore] addFolder: Folder name validation failed - name is empty or not a string.');
    throw new Error('Folder name cannot be empty.');
  }
  const folder = {
    id: crypto.randomUUID(), // Generate unique ID.
    name: name.trim(),       // Use trimmed name.
  };
  folders.push(folder); // Add to in-memory cache.
  console.log(`[diaryStore] Folder "${folder.name}" (ID: ${folder.id}) created in memory. Attempting to save.`);
  try {
    save(); // Persist changes. save() will throw on failure.
    console.log('[diaryStore] addFolder: Save successful.');
    return folder;
  } catch (err) {
    // If save operation fails, roll back the in-memory addition.
    console.error(`[diaryStore] addFolder: Error during save operation for folder "${name}". Error: ${err.message}`);
    const index = folders.findIndex(f => f.id === folder.id);
    if (index !== -1) {
      folders.splice(index, 1);
      console.log(`[diaryStore] addFolder: Rolled back in-memory addition of folder ID ${folder.id}`);
    }
    throw err; // Re-throw the error to be handled by the route handler.
  }
};

/**
 * @function findFolderById
 * @description Finds a folder by its unique ID from the in-memory cache.
 * @param {string} id - The unique ID of the folder to find.
 * @returns {Promise<Object|undefined>} A promise that resolves to the folder object if found, otherwise undefined.
 */
exports.findFolderById = async function(id) {
  return folders.find(f => f.id === id);
};

/**
 * @function updateFolder
 * @description Updates the name of an existing folder.
 * - Validates that the new name is not empty.
 * - Saves changes to file if the folder is found.
 * @param {string} id - The unique ID of the folder to update.
 * @param {string} name - The new name for the folder.
 * @returns {Promise<Object|null>} A promise that resolves to the updated folder object,
 * or null if no folder with the given ID is found.
 * @throws {Error} If the new folder name is empty or not a string.
 */
exports.updateFolder = async function(id, name) {
  // Validate new folder name.
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Folder name cannot be empty.');
  }
  const folder = await exports.findFolderById(id);
  if (!folder) return null; // Folder not found.

  folder.name = name.trim(); // Update name.
  save(); // Persist changes.
  return folder;
};

/**
 * @function removeFolder
 * @description Removes a folder by its ID from the in-memory cache.
 * Also iterates through all diary entries and unassigns them from the deleted folder
 * (sets their `folderId` to null). Saves changes to file.
 * @param {string} id - The unique ID of the folder to remove.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the folder was found and removed, otherwise `false`.
 */
exports.removeFolder = async function(id) {
  const index = folders.findIndex(f => f.id === id);
  if (index !== -1) {
    folders.splice(index, 1); // Remove folder from cache.
    // Unassign entries from the deleted folder.
    diary.forEach(entry => {
      if (entry.folderId === id) {
        entry.folderId = null;
      }
    });
    save(); // Persist changes.
    return true;
  }
  return false; // Folder not found.
};

/**
 * @function assignEntryToFolder
 * @description Assigns a diary entry to a specific folder or unassigns it from any folder.
 * - Updates the `folderId` property of the specified entry.
 * - Saves changes to file if the entry is found.
 * @param {string} entryId - The ID of the diary entry to assign/unassign.
 * @param {string|null} folderId - The ID of the folder to assign the entry to,
 *        or `null` to unassign the entry (remove it from any folder).
 * @returns {Promise<Object|null>} A promise that resolves to the updated entry object, or null if the entry is not found.
 */
exports.assignEntryToFolder = async function(entryId, folderId) {
  const entry = await exports.findById(entryId);
  if (!entry) return null; // Entry not found.

  // Optional validation: Check if folderId (if not null) exists.
  // Currently, it allows assignment to a non-existent folderId, assuming client/frontend manages folder creation.
  // If strict validation is needed:
  // if (folderId !== null && !folders.find(f => f.id === folderId)) {
  //   console.warn(`[diaryStore] Attempted to assign entry ${entryId} to non-existent folder ${folderId}.`);
  //   throw new Error(`Folder with ID ${folderId} not found.`);
  // }

  entry.folderId = folderId; // Update folderId (can be string ID or null).
  save(); // Persist changes.
  return entry;
};

// Export the tag index rebuild function for external use
exports.rebuildTagIndex = rebuildTagIndex;
