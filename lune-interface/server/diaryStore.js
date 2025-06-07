const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_FILE = path.join(__dirname, '..', '..', 'offline-diary', 'diary.json');

let diary = [];

function load() {
  if (fs.existsSync(DATA_FILE)) {
    try {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      diary = JSON.parse(raw);
    } catch (err) {
      console.error('Failed to load diary.json:', err);
      diary = [];
    }
  } else {
    diary = [];
  }
}

function save() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(diary, null, 2));
}

load();

exports.getAll = async function() {
  return diary.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
};

function parseTags(text) {
  const fields = new Set();
  const states = new Set();
  const loops = new Set();
  if (typeof text === 'string') {
    // eslint-disable-next-line no-useless-escape
    const regex = /\[\[([^\[]+?)\]\]/g;
    let match;
    while ((match = regex.exec(text)) !== null) {
      const tag = `[[${match[1]}]]`;
      if (/loop/i.test(match[1])) {
        loops.add(tag);
      } else if (/state/i.test(match[1])) {
        states.add(tag);
      } else {
        fields.add(tag);
      }
    }
  }
  return {
    fields: Array.from(fields),
    states: Array.from(states),
    loops: Array.from(loops)
  };
}

exports.add = async function(text) {
  const tags = parseTags(text);
  const entry = {
    id: crypto.randomUUID(),
    text,
    timestamp: new Date().toISOString(),
    fields: tags.fields,
    states: tags.states,
    loops: tags.loops,
    links: [],
    agent_logs: {}
  };
  diary.push(entry);
  save();
  return entry;
};

exports.findById = async function(id) {
  return diary.find(e => e.id === id);
};

exports.updateText = async function(id, text) {
  const entry = diary.find(e => e.id === id);
  if (!entry) return null;
  entry.text = text;
  entry.timestamp = new Date().toISOString();
  save();
  return entry;
};

exports.saveEntry = async function(entry) {
  const index = diary.findIndex(e => e.id === entry.id);
  if (index !== -1) {
    diary[index] = entry;
    save();
  }
  return entry;
};

exports.remove = async function(id) {
  const index = diary.findIndex(e => e.id === id);
  if (index !== -1) {
    diary.splice(index, 1);
    save();
    return true;
  }
  return false;
};
