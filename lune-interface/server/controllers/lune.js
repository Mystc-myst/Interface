// /server/controllers/lune.js (for OpenAI v4+)
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: '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'
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
