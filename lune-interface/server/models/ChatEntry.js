const mongoose = require('mongoose');

const ChatEntrySchema = new mongoose.Schema({
  user: { type: String }, // optional: user name or id
  message: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ChatEntry', ChatEntrySchema);
