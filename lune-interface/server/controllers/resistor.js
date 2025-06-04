const diaryStore = require('../diaryStore');

// Simple sentiment-like analysis. Counts some positive/negative words.
const positiveWords = ['happy','joy','excited','good','great'];
const negativeWords = ['sad','angry','upset','bad','terrible'];

function scoreSentiment(text) {
  if (!text) return 0;
  const words = text.toLowerCase().split(/\W+/);
  let score = 0;
  for (const w of words) {
    if (positiveWords.includes(w)) score += 1;
    if (negativeWords.includes(w)) score -= 1;
  }
  return score;
}

exports.processEntry = async function(entry) {
  const score = scoreSentiment(entry.text);
  entry.agent_logs = entry.agent_logs || {};
  entry.agent_logs.Resistor = {
    text: `Sentiment score: ${score}`,
    references: ['text']
  };
  await diaryStore.saveEntry(entry);
};
