/**
 * @module diaryStore
 * @description Manages the persistence of diary entries and folders to a JSON file.
 * Handles loading, saving, adding, updating, and removing entries and folders.
 * Includes error handling for corrupted data files and file locking for save operations.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const lockfile = require('proper-lockfile');

const DATA_FILE = path.join(__dirname, '..', '..', 'offline-diary', 'diary.json');

let diary = []; // For entries
let folders = []; // For folders

/**
 * @function load
 * @description Loads diary entries and folders from the DATA_FILE.
 * The file is expected to be a JSON object with 'entries' and 'folders' keys.
 * Handles file corruption by backing up the corrupted file.
 * Initializes with empty arrays if the file doesn't exist or is not in the new format.
 */
function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      const data = JSON.parse(raw);

      if (Array.isArray(data)) {
        console.log('Old diary format detected. Migrating to new format.');
        diary = data;
        folders = [];
      } else if (data && typeof data === 'object' && data.entries !== undefined && data.folders !== undefined) {
        diary = data.entries;
        folders = data.folders;
      } else {
        console.warn('Diary.json is in an unexpected format. Initializing with empty data and attempting to back up.');
        const backupFilename = `${DATA_FILE}.unexpected_format.${Date.now()}`;
        try {
            fs.renameSync(DATA_FILE, backupFilename);
            console.log(`Unexpected format diary file backed up to: ${backupFilename}`);
        } catch(e) {
            console.error(`Could not back up unexpected format file: ${e.message}`);
        }
        diary = [];
        folders = [];
      }
    } catch (parseErr) {
      console.error('Failed to parse diary.json:', parseErr.message);
      try {
        const now = new Date();
        const timestamp = now.getFullYear() + '-' +
          ('0' + (now.getMonth() + 1)).slice(-2) + '-' +
          ('0' + now.getDate()).slice(-2) + '_' +
          ('0' + now.getHours()).slice(-2) + '-' +
          ('0' + now.getMinutes()).slice(-2) + '-' +
          ('0' + now.getSeconds()).slice(-2);
        const backupFilename = `${DATA_FILE}.corrupted.${timestamp}`;
        fs.renameSync(DATA_FILE, backupFilename);
        console.log(`Corrupted diary file backed up to: ${backupFilename}`);
      } catch (renameErr) {
        console.error(`Failed to rename corrupted diary.json: ${renameErr.message}`);
      }
      diary = [];
      folders = [];
    }
  } else {
    diary = [];
    folders = [];
  }
}

/**
 * @function save
 * @description Saves the current state of diary entries and folders to DATA_FILE.
 * Data is stored as a JSON object: { "entries": [...], "folders": [...] }.
 * Ensures directory exists and uses file locking.
 */
function save() {
  console.log('[diaryStore] Attempting to save diary data...');
  try {
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      console.log(`[diaryStore] Creating directory: ${dir}`);
      fs.mkdirSync(dir, { recursive: true });
    }

    console.log(`[diaryStore] Attempting to acquire lock for: ${DATA_FILE}`);
    // lockSync does not support the `retries` option. Including it causes
    // `Error: Cannot use retries with the sync api` which prevents saving
    // diary data. The sync variant is sufficient here since writes are small
    // and infrequent.
    lockfile.lockSync(DATA_FILE, { stale: 5000 });
    console.log(`[diaryStore] Lock acquired for: ${DATA_FILE}`);

    const dataToSave = {
      entries: diary,
      folders: folders,
    };
    console.log('[diaryStore] Attempting to write data to file...');
    fs.writeFileSync(DATA_FILE, JSON.stringify(dataToSave, null, 2));
    console.log('[diaryStore] Data successfully written to file.');
  } catch (err) {
    console.error('[diaryStore] Failed to save diary data:', err);
    throw err; // Re-throw the error so the caller can handle it
  } finally {
    // Ensure unlock is attempted only if lock was acquired or if checking is safe
    try {
      if (lockfile.checkSync(DATA_FILE)) {
        console.log(`[diaryStore] Releasing lock for: ${DATA_FILE}`);
        lockfile.unlockSync(DATA_FILE);
      }
    } catch (unlockErr) {
      // This catch is for errors during checkSync or unlockSync itself
      console.error('[diaryStore] Error during unlock sequence:', unlockErr);
    }
  }
}

load(); // Load data on module initialization

// Initial save to ensure file is in the new format if it was newly created or migrated.
// This check needs to be careful not to cause issues if DATA_FILE doesn't exist yet and load initializes empty arrays.
let needsInitialSave = !fs.existsSync(DATA_FILE);
if (fs.existsSync(DATA_FILE)) {
    try {
        const rawContent = fs.readFileSync(DATA_FILE, 'utf8');
        const currentData = JSON.parse(rawContent);
        if (Array.isArray(currentData)) { // Old format
            needsInitialSave = true;
        }
    } catch (e) {
        // If parsing fails, it might be corrupted or empty, load() handles initialization.
        // If it's an empty file that's not valid JSON, it also needs an initial save.
        if (fs.statSync(DATA_FILE).size === 0) {
            needsInitialSave = true;
        }
    }
}

if (needsInitialSave) {
    console.log('Initial save to ensure new format for diary.json.');
    save();
}


/**
 * @function getAll
 * @description Retrieves all diary entries, sorted by timestamp in descending order.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of diary entry objects.
 */
exports.getAll = async function() {
  return diary.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

/**
 * @function parseHashtags
 * @description Parses a string of text to extract hashtags (e.g., #example).
 * @param {string} text - The text to parse for hashtags.
 * @returns {Array<string>} An array of unique hashtag strings.
 */
function parseHashtags(text) {
  if (typeof text !== 'string') {
    return [];
  }
  const regex = /#(\w+)/g;
  const hashtags = new Set();
  let match;
  while ((match = regex.exec(text)) !== null) {
    hashtags.add(`#${match[1]}`);
  }
  return Array.from(hashtags);
}

/**
 * @function parseTags
 * @description Parses a string of text to extract tags based on the `[[tag]]` pattern.
 * Categorizes tags into fields, states (if "state" is in the tag), and loops (if "loop" is in the tag).
 * @param {string} text - The text to parse for tags.
 * @returns {{fields: Array<string>, states: Array<string>, loops: Array<string>}} An object containing arrays of extracted tags.
 */
function parseTags(text) {
  const fields = new Set();
  const states = new Set();
  const loops = new Set();
  if (typeof text === 'string') {
    // eslint-disable-next-line no-useless-escape
    const regex = /\[\[([^\[]+?)\]\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const tag = `[[${match[1]}]]`;
      if (/loop/i.test(match[1])) {
        loops.add(tag);
      } else if (/state/i.test(match[1])) {
        states.add(tag);
      } else {
        fields.add(tag);
      }
    }
  }
  return {
    fields: Array.from(fields),
    states: Array.from(states),
    loops: Array.from(loops)
  };
}

/**
 * @function add
 * @description Creates a new diary entry with the given text.
 * Parses tags, assigns ID, timestamp, optional folderId, and saves.
 * @param {string} text - The content of the diary entry.
 * @param {string|null} [folderId=null] - Optional ID of the folder for this entry.
 * @returns {Promise<Object>} A promise that resolves to the newly created diary entry object.
 */
exports.add = async function(text, folderId = null) {
  const oldTags = parseTags(text); // Existing tag parsing
  const hashtags = parseHashtags(text); // New hashtag parsing
  const entry = {
    id: crypto.randomUUID(),
    text,
    timestamp: new Date().toISOString(),
    fields: oldTags.fields,
    states: oldTags.states,
    loops: oldTags.loops,
    hashtags: hashtags, // Add new hashtags field
    links: [],
    agent_logs: {},
    folderId: folderId
  };
  diary.push(entry);
  save();
  return entry;
};

/**
 * @function getAllUniqueHashtags
 * @description Retrieves all unique hashtags from all diary entries, sorted alphabetically.
 * @returns {Promise<Array<string>>} A promise that resolves to an array of unique hashtag strings.
 */
exports.getAllUniqueHashtags = async function() {
  const allHashtags = new Set();
  diary.forEach(entry => {
    // Instead of reading from entry.hashtags, parse the current text
    const currentHashtags = parseHashtags(entry.text);
    currentHashtags.forEach(tag => allHashtags.add(tag));
  });
  return Array.from(allHashtags).sort();
};

/**
 * @function findById
 * @description Finds a diary entry by its ID.
 * @param {string} id - The unique ID of the diary entry to find.
 * @returns {Promise<Object|undefined>} A promise that resolves to the diary entry object if found, otherwise undefined.
 */
exports.findById = async function(id) {
  return diary.find(e => e.id === id);
};

/**
 * @function updateText
 * @description Updates the text and associated tags of an existing diary entry.
 * Also updates the entry's timestamp. Can also update folderId.
 * If the entry is found, changes are saved.
 * @param {string} id - The unique ID of the diary entry to update.
 * @param {string} text - The new text content for the diary entry.
 * @param {string|null|undefined} [folderId=undefined] - New folder ID. `null` unassigns, `undefined` leaves it unchanged.
 * @returns {Promise<Object|null>} A promise that resolves to the updated diary entry object,
 * or null if no entry with the given ID is found.
 */
exports.updateText = async function(id, text, folderId) {
  const entry = await exports.findById(id);
  if (!entry) return null;

  entry.text = text;
  entry.timestamp = new Date().toISOString(); // Always update timestamp on text change

  const oldTags = parseTags(text); // Existing tag parsing
  entry.fields = oldTags.fields;
  entry.states = oldTags.states;
  entry.loops = oldTags.loops;

  const hashtags = parseHashtags(text); // New hashtag parsing
  entry.hashtags = hashtags; // Update hashtags field

  if (folderId !== undefined) {
    entry.folderId = folderId; // folderId can be null here
  }

  save();
  return entry;
};

/**
 * @function saveEntry
 * @description Saves an entire diary entry object. Replaces based on ID.
 * @param {Object} entry - The diary entry object to save. Must contain an `id` property.
 * @returns {Promise<Object>} A promise that resolves to the saved diary entry object.
 */
exports.saveEntry = async function(entryToSave) {
  const index = diary.findIndex(e => e.id === entryToSave.id);
  if (index !== -1) {
    diary[index] = entryToSave;
    save();
  } else {
    // Optionally handle case where entry to save is new, though 'add' is typical for that.
    // For now, only updates existing.
    // Or, if it should add if not found:
    // diary.push(entryToSave);
    // save();
    // return entryToSave;
    console.warn(`saveEntry called for an id not found: ${entryToSave.id}. Entry not saved.`);
    return null; // Or throw error
  }
  return entryToSave;
};

/**
 * @function remove
 * @description Removes a diary entry by its ID.
 * @param {string} id - The unique ID of the diary entry to remove.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the entry was found and removed, otherwise `false`.
 */
exports.remove = async function(id) {
  const index = diary.findIndex(e => e.id === id);
  if (index !== -1) {
    diary.splice(index, 1);
    save();
    return true;
  }
  return false;
};

// --- Folder Management Functions ---

/**
 * @function getAllFolders
 * @description Retrieves all folders, sorted by name.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of folder objects.
 */
exports.getAllFolders = async function() {
  return folders.slice().sort((a, b) => a.name.localeCompare(b.name));
};

/**
 * @function addFolder
 * @description Creates a new folder with the given name.
 * @param {string} name - The name of the new folder.
 * @returns {Promise<Object>} A promise that resolves to the newly created folder object.
 * @throws {Error} If name is empty or not a string.
 */
exports.addFolder = async function(name) {
  console.log(`[diaryStore] addFolder called with name: "${name}"`);
  if (!name || typeof name !== 'string' || name.trim() === '') {
    console.error('[diaryStore] addFolder: Folder name validation failed.');
    throw new Error('Folder name cannot be empty.');
  }
  const folder = {
    id: crypto.randomUUID(),
    name: name.trim(),
  };
  folders.push(folder);
  console.log(`[diaryStore] Folder created in memory: ${JSON.stringify(folder)}. Attempting to save.`);
  try {
    save(); // save() will now throw if it fails
    console.log('[diaryStore] addFolder: Save successful.');
    return folder;
  } catch (err) {
    console.error(`[diaryStore] addFolder: Error during save operation for folder "${name}". Error: ${err.message}`);
    // Attempt to roll back the in-memory change if save failed
    const index = folders.findIndex(f => f.id === folder.id);
    if (index !== -1) {
      folders.splice(index, 1);
      console.log(`[diaryStore] addFolder: Rolled back in-memory addition of folder ID ${folder.id}`);
    }
    throw err; // Re-throw to be caught by the route handler
  }
};

/**
 * @function findFolderById
 * @description Finds a folder by its ID.
 * @param {string} id - The unique ID of the folder to find.
 * @returns {Promise<Object|undefined>} A promise that resolves to the folder object if found, otherwise undefined.
 */
exports.findFolderById = async function(id) {
  return folders.find(f => f.id === id);
};

/**
 * @function updateFolder
 * @description Updates the name of an existing folder.
 * @param {string} id - The unique ID of the folder to update.
 * @param {string} name - The new name for the folder.
 * @returns {Promise<Object|null>} A promise that resolves to the updated folder object,
 * or null if no folder with the given ID is found.
 * @throws {Error} If name is empty or not a string.
 */
exports.updateFolder = async function(id, name) {
  if (!name || typeof name !== 'string' || name.trim() === '') {
    throw new Error('Folder name cannot be empty.');
  }
  const folder = await exports.findFolderById(id);
  if (!folder) return null;

  folder.name = name.trim();
  save();
  return folder;
};

/**
 * @function removeFolder
 * @description Removes a folder by its ID. Also sets `folderId` to null for all entries formerly in this folder.
 * @param {string} id - The unique ID of the folder to remove.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the folder was found and removed, otherwise `false`.
 */
exports.removeFolder = async function(id) {
  const index = folders.findIndex(f => f.id === id);
  if (index !== -1) {
    folders.splice(index, 1);
    diary.forEach(entry => {
      if (entry.folderId === id) {
        entry.folderId = null;
      }
    });
    save();
    return true;
  }
  return false;
};

/**
 * @function assignEntryToFolder
 * @description Assigns an entry to a specific folder or unassigns it.
 * @param {string} entryId - The ID of the entry to assign/unassign.
 * @param {string|null} folderId - The ID of the folder to assign to, or `null` to unassign the entry from any folder.
 * @returns {Promise<Object|null>} A promise that resolves to the updated entry, or null if entry not found.
 */
exports.assignEntryToFolder = async function(entryId, folderId) {
  const entry = await exports.findById(entryId);
  if (!entry) return null;

  // Optional: Validate if folderId (if not null) actually exists in the folders array
  if (folderId !== null && !folders.find(f => f.id === folderId)) {
    // console.warn(`Attempted to assign entry ${entryId} to non-existent folder ${folderId}.`);
    // Depending on desired behavior, either throw an error or proceed to assign (could be a folder to be created later)
    // For now, allow assignment, assuming frontend/client manages folder existence.
  }

  entry.folderId = folderId;
  save();
  return entry;
};
