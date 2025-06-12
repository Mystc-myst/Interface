// /server/controllers/lune.js (for OpenAI v4+)
const axios = require('axios'); // Added axios import
const chatLogStore = require('../chatLogStore');

let lastN8nResponse = null; // Variable to store n8n response

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Lune replies will fail.');
}


exports.handleUserMessage = async (req, res) => {
  const { sessionId, userMessage } = req.body;
  // Conversation logging omitted since only userMessage is sent

  // Send data to n8n webhook
  try {
    const webhookUrl = 'https://mystc-myst.app.n8n.cloud/webhook/9f5ad6f1-d4a7-43a6-8c13-4b1c0e76bb4e/chat';
    const data = {
      sessionId: sessionId || 'test-session-1',
      userMessage
      // luneResponse is removed as n8n will provide it
    };
    await axios.post(webhookUrl, data, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    // If the webhook call is successful, send an acknowledgment to the client
    res.status(202).json({ message: "Request received, processing via n8n." });
  } catch (webhookError) {
    console.error('Error sending data to n8n webhook:', webhookError);
    // If the webhook call fails, inform the client
    res.status(500).json({ error: "Failed to forward message to n8n." });
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

exports.receiveN8nResponse = (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Missing 'message' in request body." });
  }

  lastN8nResponse = message;
  console.log('Received message from n8n:', lastN8nResponse); // Optional: log received message
  res.status(200).json({ message: "Response received and stored." });
};

exports.getN8nResponse = (req, res) => {
  if (lastN8nResponse !== null) {
    const messageToReturn = lastN8nResponse;
    lastN8nResponse = null; // Clear the message after retrieving it
    res.status(200).json({ message: messageToReturn });
  } else {
    res.status(200).json({ message: null }); // No new message
  }
};
