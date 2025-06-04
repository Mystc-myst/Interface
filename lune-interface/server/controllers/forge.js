const diaryStore = require('../diaryStore');

exports.processEntry = async function(entry) {
  entry.agent_logs = entry.agent_logs || {};
  const interp = entry.agent_logs.Interpreter ? entry.agent_logs.Interpreter.text : '';
  const summary = entry.text ? entry.text.slice(0, 60) : '';
  entry.agent_logs.Forge = {
    text: `Summary: ${summary}... | Interpreter says: ${interp}`,
    references: []
  };
  await diaryStore.saveEntry(entry);
};
