/**
 * @module diaryStore
 * @description Manages the persistence of diary entries to a JSON file.
 * Handles loading, saving, adding, updating, and removing entries,
 * as well as parsing tags from entry text.
 * Includes error handling for corrupted data files and file locking for save operations.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const lockfile = require('proper-lockfile');

const DATA_FILE = path.join(__dirname, '..', '..', 'offline-diary', 'diary.json');

let diary = [];

/**
 * @function load
 * @description Loads diary entries from the DATA_FILE.
 * If the file exists, it's read and parsed.
 * If parsing fails, it attempts to back up the corrupted file and then re-throws the parsing error.
 * If the file doesn't exist, the diary is initialized as an empty array.
 * @throws {Error} Re-throws the JSON parsing error if `diary.json` is corrupted.
 */
function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      diary = JSON.parse(raw);
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
        // Log the rename error, but still prioritize re-throwing the original parsing error
      }
      throw parseErr; // Re-throw the original JSON parsing error
    }
  } else {
    diary = [];
  }
}

/**
 * @function save
 * @description Saves the current state of the diary (in-memory `diary` array) to DATA_FILE.
 * Ensures the directory exists and uses file locking to prevent concurrent writes.
 * Errors during saving (e.g., disk full, permissions) are logged to the console.
 */
function save() {
  try {
    // Check if the directory exists, create it if it doesn't
    const dir = path.dirname(DATA_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    // Attempt to acquire lock
    lockfile.lockSync(DATA_FILE, {
      retries: {
        retries: 5,
        factor: 3,
        minTimeout: 100,
        maxTimeout: 300,
        randomize: true,
      },
      stale: 5000, // Consider a lock stale after 5 seconds
    });
    fs.writeFileSync(DATA_FILE, JSON.stringify(diary, null, 2));
  } catch (err) {
    console.error('Failed to save diary data:', err);
    // Depending on the error, you might want to throw it or handle it differently
    // For now, just log it, as the original function didn't throw errors from save
  } finally {
    if (lockfile.checkSync(DATA_FILE)) {
      lockfile.unlockSync(DATA_FILE);
    }
  }
}

load();

/**
 * @function getAll
 * @description Retrieves all diary entries, sorted by timestamp in descending order.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of diary entry objects.
 * Each object represents a diary entry.
 */
exports.getAll = async function() {
  return diary.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

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
 * Parses tags from the text, assigns a unique ID and timestamp, and saves the diary.
 * @param {string} text - The content of the diary entry.
 * @returns {Promise<Object>} A promise that resolves to the newly created diary entry object.
 */
exports.add = async function(text) {
  const tags = parseTags(text);
  const entry = {
    id: crypto.randomUUID(),
    text,
    timestamp: new Date().toISOString(),
    fields: tags.fields,
    states: tags.states,
    loops: tags.loops,
    links: [],
    agent_logs: {}
  };
  diary.push(entry);
  save();
  return entry;
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
 * Also updates the entry's timestamp.
 * If the entry is found, changes are saved.
 * @param {string} id - The unique ID of the diary entry to update.
 * @param {string} text - The new text content for the diary entry.
 * @returns {Promise<Object|null>} A promise that resolves to the updated diary entry object,
 * or null if no entry with the given ID is found.
 */
exports.updateText = async function(id, text) {
  const entry = diary.find(e => e.id === id);
  if (!entry) return null;

  entry.text = text;
  entry.timestamp = new Date().toISOString();

  // Re-parse tags and update entry
  const tags = parseTags(text);
  entry.fields = tags.fields;
  entry.states = tags.states;
  entry.loops = tags.loops;

  save();
  return entry;
};

/**
 * @function saveEntry
 * @description Saves an entire diary entry object.
 * This is typically used when modifications beyond just the text are made to an entry.
 * The entry is identified by its `id` property. If an existing entry with the same ID is found, it's replaced.
 * @param {Object} entry - The diary entry object to save. Must contain an `id` property.
 * @returns {Promise<Object>} A promise that resolves to the saved diary entry object.
 */
exports.saveEntry = async function(entry) {
  const index = diary.findIndex(e => e.id === entry.id);
  if (index !== -1) {
    diary[index] = entry;
    save();
  }
  return entry;
};

/**
 * @function remove
 * @description Removes a diary entry by its ID.
 * If an entry with the given ID is found, it's removed from the diary and changes are saved.
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
