// server.js (FINAL, most reliable dotenv loading for Windows + Node)
const express = require('express');
const cors = require('cors');
// Agent routes are disabled for offline diary usage
const luneRoutes = require('./routes/lune');

const dotenv = require('dotenv');
// Only ONE dotenv.config() call needed!
dotenv.config(); // Looks for .env in same folder as server.js

// --- Debug: print your key to verify env loads ---
// console.log('OpenAI key loaded:', process.env.OPENAI_API_KEY);

const app = express();
const port = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
const diaryRoutes = require('./routes/diary');
app.use('/diary', diaryRoutes);
app.use('/api/lune', luneRoutes); // <-- Lune chat API: /api/lune/send

// No database connection needed; diary entries are stored in diary.json

// --- Start Server ---
// app.listen(port, () => {
//   console.log(`Server is running on port: ${port}`);
// });

// Export app for testing purposes, and start server only if not in test.
if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
  });
}

module.exports = app;
