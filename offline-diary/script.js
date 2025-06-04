let diary = [];
let editingId = null;
let fileHandle = null;

const entryInput = document.getElementById('entryInput');
const saveBtn = document.getElementById('saveEntry');
const entriesList = document.getElementById('entriesList');
const openBtn = document.getElementById('openFile');
const createBtn = document.getElementById('createFile');

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
  await saveFile();
  renderEntries();
});

function enableEntry() {
  entryInput.disabled = false;
  saveBtn.disabled = false;
}

async function loadFile() {
  const file = await fileHandle.getFile();
  const text = await file.text();
  try {
    diary = JSON.parse(text || '[]');
  } catch {
    diary = [];
  }
  enableEntry();
  renderEntries();
}

async function saveFile() {
  if (!fileHandle) return;
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(diary, null, 2));
  await writable.close();
}

function renderEntries() {
  entriesList.innerHTML = '';
  const sorted = diary.slice().sort((a,b) => new Date(b.timestamp) - new Date(a.timestamp));
  for (const entry of sorted) {
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
