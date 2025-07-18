/**
 * @module db
 * @description Sets up the a new database connection and defines the data models and their associations.
 */

const { Sequelize, DataTypes } = require('/app/node_modules/sequelize');
const path = require('path');

// Initialize a new Sequelize instance with SQLite dialect.
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '..', 'offline-diary', 'diary.sqlite')
});

// Define the Entry model.
const Entry = sequelize.define('Entry', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  text: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
});

// Define the Folder model.
const Folder = sequelize.define('Folder', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  }
});

// Define the Tag model.
const Tag = sequelize.define('Tag', {
  name: {
    type: DataTypes.STRING,
    primaryKey: true
  }
});

// Define the associations between the models.
Entry.belongsTo(Folder);
Folder.hasMany(Entry);

Entry.belongsToMany(Tag, { through: 'EntryTag' });
Tag.belongsToMany(Entry, { through: 'EntryTag' });

// Export the sequelize instance and the models.
module.exports = {
  sequelize,
  Entry,
  Folder,
  Tag
};
