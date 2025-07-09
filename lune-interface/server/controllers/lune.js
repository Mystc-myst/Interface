// /server/controllers/lune.js
// This file contains the controller logic for handling Lune AI agent interactions.

// Import axios for making HTTP requests to external services (e.g., n8n webhook).
const axios = require('axios');
// Import chatLogStore for saving conversation logs.
const chatLogStore = require('../chatLogStore');
// Import diaryStore for the processEntry function (agent pipeline related).
const diaryStore = require('../diaryStore');

// Check for OPENAI_API_KEY environment variable.
// Note: While this check exists, the current `handleUserMessage` implementation
// primarily interacts with an n8n webhook, not directly with OpenAI API.
// This suggests the n8n workflow might be the one using the OpenAI key.
if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Lune replies might fail if the n8n webhook relies on it.');
}

// Controller function to handle incoming user messages for the Lune agent.
exports.handleUserMessage = async (req, res) => {
  // Destructure sessionId and userMessage from the request body.
  const { sessionId, userMessage } = req.body;
  // The comment "Conversation logging omitted since only userMessage is sent" implies
  // that full conversation history isn't passed to the AI with each turn via this controller.
  // The AI (or n8n workflow) might manage session context independently if needed.

  try {
    // Define the n8n webhook URL. This is where the user's message is forwarded.
    const webhookUrl =
      'https://mystc-myst.app.n8n.cloud/webhook/9f5ad6f1-d4a7-43a6-8c13-4b1c0e76bb4e/chat';
    // Prepare the data payload for the webhook.
    const data = {
      sessionId: sessionId || 'test-session-1', // Use provided sessionId or a default.
      userMessage, // The user's message text.
    };

    // Make a POST request to the n8n webhook.
    const webhookRes = await axios.post(webhookUrl, data, {
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Process the response from the n8n webhook to extract the AI's reply.
    // It attempts to find a 'message' property in the response data,
    // otherwise uses the whole data object or direct data if not an object.
    const reply =
      webhookRes.data && typeof webhookRes.data === 'object'
        ? webhookRes.data.message ?? webhookRes.data // Prefer .message if available
        : webhookRes.data; // Fallback to using the entire response data

    // Send a 200 OK response with the AI's reply.
    res.status(200).json({ aiReply: reply });
  } catch (webhookError) {
    // Handle errors during communication with the n8n webhook.
    console.error('Error communicating with n8n webhook:', webhookError.message || webhookError);
    res.status(500).json({ error: 'Failed to communicate with the AI service (n8n webhook).' });
  }
};

// Controller function to save a conversation log.
exports.saveConversationLog = async (req, res) => {
  // Destructure the conversation array from the request body.
  const { conversation } = req.body;
  // Validate that the conversation is an array.
  if (!conversation || !Array.isArray(conversation)) {
    return res.status(400).json({ error: 'Conversation data must be an array.' });
  }
  try {
    // Use chatLogStore to add/save the conversation.
    await chatLogStore.add(conversation);
    // Respond with success.
    res.json({ saved: true, message: 'Conversation log saved successfully.' });
  } catch (err) {
    // Handle errors during log saving.
    console.error('Failed to save conversation log:', err);
    res.status(500).json({ error: 'Failed to save conversation log.' });
  }
};

// Controller function for "lightweight offline reflection" as part of a diary processing pipeline.
// This function seems to be part of the agent chain (Resistor -> Interpreter -> Forge -> Lune)
// described in `docs/key_application_flow.md`.
// It's not directly exposed via a route in `routes/lune.js` but could be called internally
// or by another process (e.g., the n8n webhook that processes diary entries).
exports.processEntry = async function(entry) {
  // Ensure agent_logs object exists on the entry.
  entry.agent_logs = entry.agent_logs || {};
  // Retrieve outputs from previous hypothetical agents in the pipeline.
  const resOut = entry.agent_logs.Resistor ? entry.agent_logs.Resistor.text : '';
  const interpOut = entry.agent_logs.Interpreter ? entry.agent_logs.Interpreter.text : '';
  const forgeOut = entry.agent_logs.Forge ? entry.agent_logs.Forge.text : '';

  // Create Lune's reflection based on the outputs of previous agents.
  const reflection = `Based on your entry and analyses: ${resOut}; ${interpOut}; ${forgeOut}`;
  // Store Lune's reflection and references in the entry's agent_logs.
  entry.agent_logs.Lune = {
    reflection,
    references: ['text', 'Resistor', 'Interpreter', 'Forge'] // Indicates sources for the reflection.
  };
  // Save the updated entry (with Lune's reflection) using diaryStore.
  await diaryStore.saveEntry(entry);
  // This function doesn't return a value, it modifies the entry and saves it.
};

