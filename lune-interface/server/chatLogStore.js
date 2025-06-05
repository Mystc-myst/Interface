const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'offline-diary', 'chatlogs');

function ensureDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

exports.add = async function(conversation) {
  ensureDir();
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filePath = path.join(LOG_DIR, `${timestamp}.json`);
  fs.writeFileSync(filePath, JSON.stringify(conversation || [], null, 2));
  return filePath;
};

exports.getAll = async function() {
  ensureDir();
  const files = fs.readdirSync(LOG_DIR).filter(f => f.endsWith('.json'));
  return files.map(f => {
    const data = fs.readFileSync(path.join(LOG_DIR, f), 'utf8');
    return { filename: f, messages: JSON.parse(data) };
  }).sort((a, b) => a.filename.localeCompare(b.filename));
};
