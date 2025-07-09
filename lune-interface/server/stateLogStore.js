// Import Node.js core modules for file system and path manipulation.
const fs = require('fs');
const path = require('path');

// Define the path to the data file where state logs are stored.
// This file is located in the same directory as this script (server root).
const DATA_FILE = path.join(__dirname, 'stateLogs.json');

// In-memory cache for state logs.
let logs = [];

/**
 * @private
 * @function load
 * @description Loads state logs from the DATA_FILE into the in-memory `logs` array.
 * - If the file exists, it's read and parsed as JSON.
 * - If parsing fails or the file doesn't exist, `logs` is initialized as an empty array.
 * - Handles potential errors during file reading or parsing by logging them and defaulting to empty logs.
 */
function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      // Ensure that if the file is empty, it doesn't crash JSON.parse
      if (raw.trim() === '') {
        logs = [];
      } else {
        logs = JSON.parse(raw);
      }
      console.log(`[stateLogStore] Loaded ${logs.length} state logs from ${DATA_FILE}`);
    } catch (err) {
      console.error(`[stateLogStore] Failed to load or parse ${DATA_FILE}:`, err.message);
      logs = []; // Default to empty logs on error.
    }
  } else {
    console.log(`[stateLogStore] ${DATA_FILE} not found. Initializing with empty logs.`);
    logs = []; // Initialize with empty logs if file doesn't exist.
  }
}

/**
 * @private
 * @function save
 * @description Saves the current state of the in-memory `logs` array to DATA_FILE.
 * - Writes the logs array as a JSON string, pretty-printed.
 * - Handles potential errors during file writing by logging them.
 */
function save() {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(logs, null, 2));
    console.log(`[stateLogStore] Saved ${logs.length} state logs to ${DATA_FILE}`);
  } catch (err) {
    console.error(`[stateLogStore] Failed to save state logs to ${DATA_FILE}:`, err.message);
    // Depending on the application, might want to throw error or implement retry logic.
  }
}

// Initial load of state logs when the module is first required.
load();

/**
 * @function add
 * @description Adds a new log entry to the in-memory `logs` array and saves all logs to file.
 * @param {Object} log - The log object to add. It's expected to be serializable to JSON.
 *                       Typically, this object might include a timestamp and log-specific data.
 * @returns {Promise<Object>} A promise that resolves to the added log object.
 *                            The function is async to maintain API consistency, though operations are synchronous.
 */
exports.add = async function(log) {
  logs.push(log); // Add the new log to the in-memory array.
  save(); // Save the updated array to the file.
  return log; // Return the added log.
};

/**
 * @function getAll
 * @description Retrieves all state logs from the in-memory cache.
 * - Returns a copy of the logs array.
 * - Sorts the logs by a `timestamp` property (if present on log objects) in ascending order (oldest first).
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of log objects.
 */
exports.getAll = async function() {
  // Return a slice (copy) of the logs array, sorted by timestamp.
  // Assumes log objects have a `timestamp` property that can be converted to Date for comparison.
  return logs.slice().sort((a, b) => {
    const dateA = new Date(a.timestamp);
    const dateB = new Date(b.timestamp);
    return dateA - dateB; // Sorts in ascending chronological order.
  });
};
