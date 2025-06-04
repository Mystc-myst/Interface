const mongoose = require('mongoose');

const DiaryEntrySchema = new mongoose.Schema({
  type: { type: String, default: 'DiaryEntry' },
  text: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  fields: { type: [String], default: [] },
  states: { type: [String], default: [] },
  loops: { type: [String], default: [] },
  links: { type: [String], default: [] },
  agent_logs: {
    Resistor: {
      text: String,
      references: [String]
    },
    Interpreter: {
      text: String,
      references: [String]
    },
    Forge: {
      text: String,
      references: [String]
    },
    Lune: {
      text: String,
      references: [String]
    }
  }
}, { minimize: false });

module.exports = mongoose.model('DiaryEntry', DiaryEntrySchema);
