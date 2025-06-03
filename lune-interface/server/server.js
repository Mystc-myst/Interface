// server.js (FINAL, most reliable dotenv loading for Windows + Node)
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const luneRoutes = require('./routes/lune');
const processingRoutes = require('./routes/processing');

const dotenv = require('dotenv');
// Only ONE dotenv.config() call needed!
dotenv.config(); // Looks for .env in same folder as server.js

// --- Debug: print your key to verify env loads ---
console.log('OpenAI key loaded:', process.env.OPENAI_API_KEY);

const app = express();
const port = process.env.PORT || 5001;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- Routes ---
const diaryRoutes = require('./routes/diary');
app.use('/diary', diaryRoutes);
app.use('/api/lune', luneRoutes); // <-- Lune chat API: /api/lune/send
app.use('/api/processing', processingRoutes);

// --- Database ---
async function connectToDatabase() {
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('Error: MONGO_URI is not defined in .env file!');
      process.exit(1);
    }
    await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB database connection established successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}
connectToDatabase();

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`);
});
