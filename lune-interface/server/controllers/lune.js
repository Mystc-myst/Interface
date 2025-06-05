// /server/controllers/lune.js (for OpenAI v4+)
const OpenAI = require('openai');
const chatLogStore = require('../chatLogStore');

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Lune replies will fail.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


exports.handleUserMessage = async (req, res) => {
  const { entries, conversation } = req.body;
  // Persist the conversation so far
  try {
    await chatLogStore.add(conversation || []);
  } catch (err) {
    console.error('Failed to save chat log:', err);
  }
  const systemMessage = {
    role: "system",
    content: "You are Lune, a helpful, reflective journaling companion. You receive the user's diary entries as context and should use them to provide thoughtful, supportive responses."
  };
  const entrySummary = entries
    .map(e => `- (${e.createdAt ? new Date(e.createdAt).toLocaleString() : 'No Date'}) ${e.content || e.text || '[No Content]'}`)
    .join('\n');
  const userContext = `Here are my diary entries:\n${entrySummary}`;
  const messages = [
    systemMessage,
    { role: "user", content: userContext },
    ...(conversation || []).map(msg => ({
      role: msg.sender === "user" ? "user" : "assistant",
      content: msg.text
    }))
  ];
  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages
    });
    const reply = completion.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Lune failed to reply." });
  }
};

exports.saveConversationLog = async (req, res) => {
  const { conversation } = req.body;
  if (!conversation || !Array.isArray(conversation)) {
    return res.status(400).json({ error: 'Conversation must be an array.' });
  }
  try {
    await chatLogStore.add(conversation);
    res.json({ saved: true });
  } catch (err) {
    console.error('Failed to save conversation log:', err);
    res.status(500).json({ error: 'Failed to save log.' });
  }
};

// Lightweight offline reflection for diary pipeline
const diaryStore = require('../diaryStore');

exports.processEntry = async function(entry) {
  entry.agent_logs = entry.agent_logs || {};
  const resOut = entry.agent_logs.Resistor ? entry.agent_logs.Resistor.text : '';
  const interpOut = entry.agent_logs.Interpreter ? entry.agent_logs.Interpreter.text : '';
  const forgeOut = entry.agent_logs.Forge ? entry.agent_logs.Forge.text : '';
  const reflection = `Based on your entry and analyses: ${resOut}; ${interpOut}; ${forgeOut}`;
  entry.agent_logs.Lune = {
    reflection,
    references: ['text', 'Resistor', 'Interpreter', 'Forge']
  };
  await diaryStore.saveEntry(entry);
};
