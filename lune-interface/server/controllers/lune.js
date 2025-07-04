// /server/controllers/lune.js (for OpenAI v4+)
const axios = require('axios'); // Added axios import
const chatLogStore = require('../chatLogStore');

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Lune replies will fail.');
}


exports.handleUserMessage = async (req, res) => {
  const { sessionId, userMessage } = req.body;
  // Conversation logging omitted since only userMessage is sent

  try {
    const webhookUrl =
      'https://mystc-myst.app.n8n.cloud/webhook/9f5ad6f1-d4a7-43a6-8c13-4b1c0e76bb4e/chat';
    const data = {
      sessionId: sessionId || 'test-session-1',
      userMessage,
    };

    const webhookRes = await axios.post(webhookUrl, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const reply =
      webhookRes.data && typeof webhookRes.data === 'object'
        ? webhookRes.data.message ?? webhookRes.data
        : webhookRes.data;

    res.status(200).json({ aiReply: reply });
  } catch (webhookError) {
    console.error('Error communicating with n8n webhook:', webhookError);
    res.status(500).json({ error: 'Failed to communicate with n8n.' });
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

