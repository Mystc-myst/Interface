/**
 * @module diaryStore
 * @description Manages the persistence of diary entries, folders, and tags using a SQLite database with Sequelize.
 */

const fs = require('fs');
const path = require('path');
const { sequelize, Entry, Folder, Tag } = require('./db');
const { NotFoundError, DatabaseError } = require('./errors');
const Umzug = require('umzug');

// Path to the old JSON data file for migration purposes.
const DATA_FILE = path.join(__dirname, '..', '..', 'offline-diary', 'diary.json');

/**
 * @private
 * @function migrate
 * @description Migrates data from the old diary.json file to the new SQLite database.
 * - This function is called once on startup if the diary.json file exists.
 * - It reads the JSON file, creates entries, folders, and tags in the database, and then renames the JSON file to prevent re-migration.
 */
async function migrate() {
  if (fs.existsSync(DATA_FILE)) {
    console.log('Migrating data from diary.json to SQLite...');
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const data = JSON.parse(raw);
    const entries = Array.isArray(data) ? data : data.entries;
    const folders = Array.isArray(data) ? [] : data.folders;

    await Folder.bulkCreate(folders, { ignoreDuplicates: true });

    for (const entry of entries) {
      const newEntry = await Entry.create({
        id: entry.id,
        text: entry.text,
        timestamp: entry.timestamp,
        FolderId: entry.folderId
      });
      const tags = parseHashtags(entry.text);
      if (tags.length > 0) {
        const tagInstances = await Promise.all(tags.map(tag => Tag.findOrCreate({ where: { name: tag } })));
        await newEntry.setTags(tagInstances.map(t => t[0]));
      }
    }

    fs.renameSync(DATA_FILE, `${DATA_FILE}.migrated`);
    console.log('Migration complete.');
  }
}

// Synchronize the database and then run the migration.
const umzug = new Umzug({
  migrations: {
    path: path.join(__dirname, 'migrations'),
    params: [
      sequelize.getQueryInterface(),
      sequelize.constructor
    ]
  },
  storage: 'sequelize',
  storageOptions: {
    sequelize: sequelize
  }
});

(async () => {
  await umzug.up();
  await migrate();
})();

/**
 * @private
 * @function parseHashtags
 * @description Parses hashtags from a given text.
 * @param {string} text - The text to parse.
 * @returns {string[]} An array of tags.
 */
function parseHashtags(text) {
  if (typeof text !== 'string') {
    return [];
  }
  const TAG_REGEX = /#([\p{L}\p{N}_-]+)/gu;
  const matches = text.matchAll(TAG_REGEX);
  const tags = new Set(Array.from(matches, m => m[1].toLowerCase()));
  return Array.from(tags);
}

/**
 * @private
 * @function cleanupUnusedTags
 * @description Removes tags that are no longer associated with any entries.
 */
async function cleanupUnusedTags({ transaction } = {}) {
  await sequelize.query(
    `DELETE FROM Tags WHERE name IN (
      SELECT T.name FROM Tags T LEFT JOIN EntryTag ET ON T.name = ET.TagName WHERE ET.TagName IS NULL
    )`,
    { type: sequelize.QueryTypes.DELETE, transaction }
  );
}

// Export internal helpers for testing purposes
exports._private = { cleanupUnusedTags };
exports.parseHashtags = parseHashtags;

/**
 * @function getAll
 * @description Retrieves all diary entries from the database, sorted by timestamp in descending order.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of diary entry objects.
 */
exports.getAll = async function() {
  try {
    return await Entry.findAll({
      order: [['timestamp', 'DESC']],
      include: [Folder, Tag]
    });
  } catch (err) {
    throw new DatabaseError(`Failed to get all entries: ${err.message}`);
  }
};

/**
 * @function add
 * @description Creates a new diary entry with the given text and optional folder ID.
 * @param {string} text - The content of the diary entry.
 * @param {string|null} [folderId=null] - Optional ID of the folder to associate this entry with.
 * @returns {Promise<Object>} A promise that resolves to the newly created diary entry object.
 */
exports.add = async function(text, folderId = null, { transaction } = {}) {
  try {
    const entry = await Entry.create({
      text,
      FolderId: folderId
    }, { transaction });
    const tags = parseHashtags(text);
    if (tags.length > 0) {
      const tagInstances = await Promise.all(tags.map(tag => Tag.findOrCreate({ where: { name: tag }, transaction })));
      await entry.setTags(tagInstances.map(t => t[0]), { transaction });
    }
    return entry;
  } catch (err) {
    throw new DatabaseError(`Failed to add entry: ${err.message}`);
  }
};

/**
 * @function getTags
 * @description Retrieves the tag index from the database.
 * @returns {Promise<Object>} A promise that resolves to the tag index.
 */
exports.getTags = async function({ transaction } = {}) {
  try {
    const results = await sequelize.query(
      `SELECT T.name, ET.EntryId FROM Tags T JOIN EntryTag ET ON T.name = ET.TagName`,
      { type: sequelize.QueryTypes.SELECT, transaction }
    );
    const tagIndex = {};
    for (const result of results) {
      if (!tagIndex[result.name]) {
        tagIndex[result.name] = [];
      }
      tagIndex[result.name].push(result.EntryId);
    }
    return tagIndex;
  } catch (err) {
    throw new DatabaseError(`Failed to get tags: ${err.message}`);
  }
};

/**
 * @function findById
 * @description Finds a diary entry by its unique ID from the database.
 * @param {string} id - The unique ID of the diary entry to find.
 * @returns {Promise<Object|undefined>} A promise that resolves to the diary entry object if found, otherwise undefined.
 */
exports.findById = async function(id) {
  try {
    const entry = await Entry.findByPk(id, { include: [Folder, Tag] });
    if (!entry) {
      throw new NotFoundError(`Entry with ID ${id} not found.`);
    }
    return entry;
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new DatabaseError(`Failed to find entry by ID ${id}: ${err.message}`);
  }
};

/**
 * @function updateText
 * @description Updates the text content of an existing diary entry.
 * @param {string} id - The unique ID of the diary entry to update.
 * @param {string} text - The new text content for the diary entry.
 * @param {string|null|undefined} [folderId=undefined] - New folder ID.
 * @returns {Promise<Object|null>} A promise that resolves to the updated diary entry object, or null if no entry with the given ID is found.
 */
exports.updateText = async function(id, text, folderId, { transaction } = {}) {
  try {
    const entry = await Entry.findByPk(id, { transaction });
    if (!entry) {
      throw new NotFoundError(`Entry with ID ${id} not found.`);
    }

    await entry.update({
      text,
      timestamp: new Date(),
      FolderId: folderId
    }, { transaction });

    const tags = parseHashtags(text);
    if (tags.length > 0) {
      const tagInstances = await Promise.all(tags.map(tag => Tag.findOrCreate({ where: { name: tag }, transaction })));
      await entry.setTags(tagInstances.map(t => t[0]), { transaction });
    }
    await cleanupUnusedTags({ transaction });

    return entry;
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new DatabaseError(`Failed to update entry with ID ${id}: ${err.message}`);
  }
};

/**
 * @function saveEntry
 * @description Saves an entire diary entry object by replacing the existing entry with the same ID.
 * @param {Object} entryToSave - The diary entry object to save. Must contain an `id` property.
 * @returns {Promise<Object|null>} A promise that resolves to the saved diary entry object, or null if not found.
 */
exports.saveEntry = async function(entryToSave) {
  try {
    const entry = await Entry.findByPk(entryToSave.id);
    if (!entry) {
      throw new NotFoundError(`Entry with ID ${entryToSave.id} not found.`);
    }

    await entry.update(entryToSave);

    const tags = parseHashtags(entryToSave.text);
    const tagInstances = await Promise.all(tags.map(tag => Tag.findOrCreate({ where: { name: tag } })));
    await entry.setTags(tagInstances.map(t => t[0]));
    await cleanupUnusedTags();

    return entry;
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new DatabaseError(`Failed to save entry with ID ${entryToSave.id}: ${err.message}`);
  }
};

/**
 * @function remove
 * @description Removes a diary entry by its ID from the database.
 * @param {string} id - The unique ID of the diary entry to remove.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the entry was found and removed, otherwise `false`.
 */
exports.remove = async function(id, { transaction } = {}) {
  try {
    const entry = await Entry.findByPk(id, { transaction });
    if (!entry) {
      throw new NotFoundError(`Entry with ID ${id} not found.`);
    }
    await entry.destroy({ transaction });
    await cleanupUnusedTags({ transaction });
    return true;
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new DatabaseError(`Failed to remove entry with ID ${id}: ${err.message}`);
  }
};

/**
 * @function getAllFolders
 * @description Retrieves all folders from the database, sorted by name alphabetically.
 * @returns {Promise<Array<Object>>} A promise that resolves to an array of folder objects.
 */
exports.getAllFolders = async function() {
  try {
    return await Folder.findAll({ order: [['name', 'ASC']] });
  } catch (err) {
    throw new DatabaseError(`Failed to get all folders: ${err.message}`);
  }
};

/**
 * @function addFolder
 * @description Creates a new folder with the given name.
 * @param {string} name - The name of the new folder.
 * @returns {Promise<Object>} A promise that resolves to the newly created folder object.
 */
exports.addFolder = async function(name) {
  try {
    return await Folder.create({ name });
  } catch (err) {
    throw new DatabaseError(`Failed to add folder: ${err.message}`);
  }
};

/**
 * @function findFolderById
 * @description Finds a folder by its unique ID from the database.
 * @param {string} id - The unique ID of the folder to find.
 * @returns {Promise<Object|undefined>} A promise that resolves to the folder object if found, otherwise undefined.
 */
exports.findFolderById = async function(id) {
  try {
    const folder = await Folder.findByPk(id);
    if (!folder) {
      throw new NotFoundError(`Folder with ID ${id} not found.`);
    }
    return folder;
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new DatabaseError(`Failed to find folder by ID ${id}: ${err.message}`);
  }
};

/**
 * @function updateFolder
 * @description Updates the name of an existing folder.
 * @param {string} id - The unique ID of the folder to update.
 * @param {string} name - The new name for the folder.
 * @returns {Promise<Object|null>} A promise that resolves to the updated folder object, or null if no folder with the given ID is found.
 */
exports.updateFolder = async function(id, name) {
  try {
    const folder = await Folder.findByPk(id);
    if (!folder) {
      throw new NotFoundError(`Folder with ID ${id} not found.`);
    }
    return await folder.update({ name });
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new DatabaseError(`Failed to update folder with ID ${id}: ${err.message}`);
  }
};

/**
 * @function removeFolder
 * @description Removes a folder by its ID from the database.
 * @param {string} id - The unique ID of the folder to remove.
 * @returns {Promise<boolean>} A promise that resolves to `true` if the folder was found and removed, otherwise `false`.
 */
exports.removeFolder = async function(id) {
  try {
    const folder = await Folder.findByPk(id);
    if (!folder) {
      throw new NotFoundError(`Folder with ID ${id} not found.`);
    }
    await folder.destroy();
    return true;
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new DatabaseError(`Failed to remove folder with ID ${id}: ${err.message}`);
  }
};

/**
 * @function assignEntryToFolder
 * @description Assigns a diary entry to a specific folder.
 * @param {string} entryId - The ID of the diary entry to assign.
 * @param {string|null} folderId - The ID of the folder to assign the entry to.
 * @returns {Promise<Object|null>} A promise that resolves to the updated entry object, or null if the entry is not found.
 */
exports.assignEntryToFolder = async function(entryId, folderId) {
  try {
    const entry = await Entry.findByPk(entryId);
    if (!entry) {
      throw new NotFoundError(`Entry with ID ${entryId} not found.`);
    }
    return await entry.update({ FolderId: folderId });
  } catch (err) {
    if (err instanceof NotFoundError) {
      throw err;
    }
    throw new DatabaseError(`Failed to assign entry with ID ${entryId} to folder: ${err.message}`);
  }
};
