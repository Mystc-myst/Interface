// Import Node.js core modules for file system and path manipulation.
const fs = require('fs');
const path = require('path');

// Define the directory where chat logs will be stored.
// This is located within the `offline-diary` folder, alongside `diary.json`.
const LOG_DIR = path.join(__dirname, '..', '..', 'offline-diary', 'chatlogs');

/**
 * @private
 * @function ensureDir
 * @description Ensures that the LOG_DIR directory exists. If it doesn't, it creates the directory.
 * Uses `recursive: true` to create parent directories if they don't exist.
 */
function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    console.log(`[chatLogStore] Chat log directory not found. Creating: ${LOG_DIR}`);
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * @function add
 * @description Adds a new chat conversation log to the LOG_DIR.
 * - Each conversation is saved as a separate JSON file.
 * - The filename is generated based on the current timestamp to ensure uniqueness and chronological order.
 * - Ensures the log directory exists before writing.
 * @param {Array<Object>} conversation - An array of message objects representing the conversation.
 *                                     Each message object typically has `sender` and `text` properties.
 * @returns {Promise<string>} A promise that resolves to the full file path of the saved log file.
 *                            The function is async to maintain API consistency with other stores,
 *                            though file operations here are synchronous.
 */
exports.add = async function(conversation) {
  ensureDir(); // Make sure the chatlogs directory exists.
  // Generate a timestamp string for the filename, replacing characters not suitable for filenames.
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(LOG_DIR, `${timestamp}.json`); // Construct the full file path.

  // Write the conversation data to the JSON file, pretty-printed.
  // If `conversation` is null or undefined, an empty array is written.
  fs.writeFileSync(filePath, JSON.stringify(conversation || [], null, 2));
  console.log(`[chatLogStore] Conversation log saved to: ${filePath}`);
  return filePath; // Return the path of the newly created log file.
};

/**
 * @function getAll
 * @description Retrieves all chat log files from the LOG_DIR.
 * - Reads all `.json` files from the directory.
 * - Parses each file's content as JSON.
 * - Returns an array of objects, each containing the filename and the parsed messages.
 * - Sorts the logs by filename (which corresponds to chronological order due to timestamped filenames).
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of log objects.
 *                                    Each object has `filename` (string) and `messages` (Array).
 */
exports.getAll = async function() {
  ensureDir(); // Make sure the chatlogs directory exists.
  // Read all files in the log directory.
  const files = fs.readdirSync(LOG_DIR)
    // Filter to include only files ending with '.json'.
    .filter(f => f.endsWith('.json'));

  // Map over the filenames to read and parse each log file.
  return files.map(f => {
    const data = fs.readFileSync(path.join(LOG_DIR, f), 'utf8'); // Read file content.
    return { filename: f, messages: JSON.parse(data) }; // Return object with filename and parsed messages.
  })
  // Sort the logs by filename in ascending order (chronological).
  .sort((a, b) => a.filename.localeCompare(b.filename));
};
