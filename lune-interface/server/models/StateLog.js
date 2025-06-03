const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for state logs (deeper analysis results)
const stateLogSchema = new Schema({
  timestamp: { type: Date, default: Date.now }, // Timestamp of the log
  loopType: { type: String }, // Type of symbolic loop (e.g., "reflection_loop")
  somaticFeedback: { type: String }, // Mocked somatic feedback
  symbolicTags: { type: [String] }, // Array of symbolic tags/concepts
  processingStage: { type: String } // Current processing stage (e.g., "Forge (Mocked)")
});

// Create and export the Mongoose model
const StateLog = mongoose.model('StateLog', stateLogSchema);
module.exports = StateLog;