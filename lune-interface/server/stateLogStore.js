const fs = require('fs');
const path = require('path');
const DATA_FILE = path.join(__dirname, 'stateLogs.json');

let logs = [];

function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      logs = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to load stateLogs.json:', err);
      logs = [];
    }
  } else {
    logs = [];
  }
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(logs, null, 2));
}

load();

exports.add = async function(log) {
  logs.push(log);
  save();
  return log;
};

exports.getAll = async function() {
  return logs.slice().sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
};
