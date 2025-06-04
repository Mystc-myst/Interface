// /server/controllers/lune.js (for OpenAI v4+)
const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
  console.warn('Warning: OPENAI_API_KEY is not set. Lune replies will fail.');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


exports.handleUserMessage = async (req, res) => {
  const { entries, conversation } = req.body;
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
