let diary = [];
let editingId = null;
let fileHandle = null;

const entryInput = document.getElementById('entryInput');
const saveBtn = document.getElementById('saveEntry');
const entriesList = document.getElementById('entriesList');
const openBtn = document.getElementById('openFile');
const createBtn = document.getElementById('createFile');
const passwordInput = document.getElementById('passwordInput');
const searchInput = document.getElementById('searchInput');
const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const importInput = document.getElementById('importInput');

document.addEventListener('DOMContentLoaded', () => {
  const draft = localStorage.getItem('diaryDraft');
  if (draft) entryInput.value = draft;
  searchInput.addEventListener('input', renderEntries);
});

const enc = new TextEncoder();
const dec = new TextDecoder();

async function getKey(password, salt, usage) {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), {name: 'PBKDF2'}, false, ['deriveKey']);
  return crypto.subtle.deriveKey({name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256'}, keyMaterial, {name: 'AES-GCM', length: 256}, false, usage);
}

function hex(buf) {
  return Array.from(buf).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hexStr) {
  const arr = hexStr.match(/.{2}/g).map(x => parseInt(x, 16));
  return new Uint8Array(arr);
}

async function encrypt(text, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt, ['encrypt']);
  const data = await crypto.subtle.encrypt({name: 'AES-GCM', iv}, key, enc.encode(text));
  return {salt: hex(salt), iv: hex(iv), data: btoa(String.fromCharCode(...new Uint8Array(data)))};
}

async function decrypt(obj, password) {
  const salt = hexToBuf(obj.salt);
  const iv = hexToBuf(obj.iv);
  const key = await getKey(password, salt, ['decrypt']);
  const data = Uint8Array.from(atob(obj.data), c => c.charCodeAt(0));
  const txt = await crypto.subtle.decrypt({name: 'AES-GCM', iv}, key, data);
  return dec.decode(txt);
}

openBtn.addEventListener('click', async () => {
  try {
    [fileHandle] = await window.showOpenFilePicker({
      types: [{description: 'JSON Files', accept: {'application/json': ['.json']}}]
    });
    await loadFile();
  } catch (err) {
    console.error(err);
  }
});

createBtn.addEventListener('click', async () => {
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: 'diary.json',
      types: [{description: 'JSON Files', accept: {'application/json': ['.json']}}]
    });
    diary = [];
    await saveFile();
    enableEntry();
    renderEntries();
  } catch (err) {
    console.error(err);
  }
});

exportBtn.addEventListener('click', () => {
  const csv = diary.map(e => `"${new Date(e.timestamp).toLocaleString()}","${e.text.replace(/"/g,'""')}"`).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'diary.csv';
  a.click();
  URL.revokeObjectURL(url);
});

importBtn.addEventListener('click', () => importInput.click());

importInput.addEventListener('change', async () => {
  const file = importInput.files[0];
  if (!file) return;
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      diary = diary.concat(data);
      await saveFile();
      renderEntries();
    } else {
      alert('Invalid JSON file');
    }
  } catch {
    alert('Could not parse file');
  }
  importInput.value = '';
});

entryInput.addEventListener('input', () => {
  localStorage.setItem('diaryDraft', entryInput.value);
});

saveBtn.addEventListener('click', async () => {
  const text = entryInput.value.trim();
  if (!text) return;
  if (!fileHandle) return alert('Open or create a diary file first.');
  if (editingId) {
    const entry = diary.find(e => e.id === editingId);
    if (entry) {
      entry.text = text;
      entry.timestamp = new Date().toISOString();
    }
    editingId = null;
  } else {
    const entry = {
      id: Date.now().toString() + Math.random().toString(16).slice(2),
      text,
      timestamp: new Date().toISOString()
    };
    diary.push(entry);
  }
  entryInput.value = '';
  localStorage.removeItem('diaryDraft');
  await saveFile();
  renderEntries();
});

function enableEntry() {
  entryInput.disabled = false;
  saveBtn.disabled = false;
  searchInput.disabled = false;
  exportBtn.disabled = false;
}

async function loadFile() {
  const file = await fileHandle.getFile();
  const text = await file.text();
  try {
    if (passwordInput.value) {
      const obj = JSON.parse(text);
      if (obj && obj.data && obj.iv && obj.salt) {
        const decrypted = await decrypt(obj, passwordInput.value);
        diary = JSON.parse(decrypted || '[]');
      } else {
        diary = JSON.parse(text || '[]');
      }
    } else {
      diary = JSON.parse(text || '[]');
    }
  } catch {
    diary = [];
  }
  enableEntry();
  renderEntries();
}

async function saveFile() {
  if (!fileHandle) return;
  const writable = await fileHandle.createWritable();
  let data = JSON.stringify(diary, null, 2);
  if (passwordInput.value) {
    data = JSON.stringify(await encrypt(data, passwordInput.value));
  }
  await writable.write(data);
  await writable.close();
}

function renderEntries() {
  entriesList.innerHTML = '';
  const query = searchInput.value.toLowerCase();
  const sorted = diary.slice().sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  const filtered = query ? sorted.filter(e => e.text.toLowerCase().includes(query)) : sorted;
  for (const entry of filtered) {
    const div = document.createElement('div');
    div.className = 'entry';
    const date = document.createElement('div');
    date.className = 'entry-date';
    date.textContent = new Date(entry.timestamp).toLocaleString();
    const text = document.createElement('div');
    text.textContent = entry.text;
    const buttons = document.createElement('div');
    buttons.className = 'entry-buttons';
    const editBtn = document.createElement('button');
    editBtn.textContent = 'Edit';
    editBtn.addEventListener('click', () => {
      entryInput.value = entry.text;
      editingId = entry.id;
      entryInput.focus();
    });
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm('Delete this entry?')) return;
      diary = diary.filter(e => e.id !== entry.id);
      await saveFile();
      renderEntries();
    });
    buttons.appendChild(editBtn);
    buttons.appendChild(deleteBtn);
    div.appendChild(date);
    div.appendChild(text);
    div.appendChild(buttons);
    entriesList.appendChild(div);
  }
}
