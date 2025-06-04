const DiaryEntry = require('../models/DiaryEntry');

exports.processEntry = async function(entry) {
  entry.agent_logs = entry.agent_logs || {};
  const wordCount = entry.text ? entry.text.trim().split(/\s+/).length : 0;
  const previous = entry.agent_logs.Resistor ? entry.agent_logs.Resistor.text : '';
  entry.agent_logs.Interpreter = {
    text: `Word count: ${wordCount}. Prior analysis: ${previous}`,
    references: []
  };
  entry.markModified('agent_logs');
  await entry.save();
};
