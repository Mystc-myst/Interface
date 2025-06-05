// Application state
let diary = [];
let editingId = null;
let fileHandle = null;
let currentPassword = null; // Store password for current diary

// DOM Elements (initialized in initDOM)
let entryInput, saveBtn, entriesList, openBtn, createBtn, passwordInput, searchInput, exportBtn, importBtn, importInput;

// Crypto utilities
const enc = new TextEncoder();
const dec = new TextDecoder();

// Helper functions for Base64 ArrayBuffer
// Uses Node.js Buffer for robust Base64 handling in test environment
function _arrayBufferToBase64(buffer) {
  // console.log("_arrayBufferToBase64: input buffer length:", buffer.byteLength);
  const base64 = Buffer.from(buffer).toString('base64');
  // console.log("_arrayBufferToBase64: output base64 length:", base64.length);
  return base64;
}

function _base64ToArrayBuffer(base64) {
  // console.log("_base64ToArrayBuffer: input base64 length:", base64.length);
  const nodeBuffer = Buffer.from(base64, 'base64');
  // console.log("_base64ToArrayBuffer: decoded NodeBuffer length:", nodeBuffer.length);
  // Convert Node Buffer to ArrayBuffer
  // Create a new ArrayBuffer and copy data to ensure it's a true ArrayBuffer
  // as expected by Web Crypto API, not just a view on Node Buffer's underlying memory.
  const arrayBuffer = new ArrayBuffer(nodeBuffer.length);
  const view = new Uint8Array(arrayBuffer);
  for (let i = 0; i < nodeBuffer.length; ++i) {
    view[i] = nodeBuffer[i];
  }
  // console.log("_base64ToArrayBuffer: output ArrayBuffer length:", arrayBuffer.byteLength);
  return arrayBuffer;
}

async function getKey(password, salt, usage) {
  const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(password), { name: 'PBKDF2' }, false, ['deriveKey']);
  return crypto.subtle.deriveKey({ name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' }, keyMaterial, { name: 'AES-GCM', length: 256 }, false, usage);
}

function bufToHex(buf) { // Renamed for clarity
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hexStr) {
  if (!hexStr || hexStr.length % 2 !== 0) return new Uint8Array(0); // Basic validation
  const arr = [];
  for (let i = 0; i < hexStr.length; i += 2) {
    arr.push(parseInt(hexStr.substr(i, 2), 16));
  }
  return new Uint8Array(arr);
}

async function encryptDiary(text, password) {
  console.log("encryptDiary: input text length:", text.length, "password:", password ? "yes" : "no");
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await getKey(password, salt, ['encrypt']);
  const dataBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(text));
  const result = {salt: bufToHex(salt), iv: bufToHex(iv), data: _arrayBufferToBase64(dataBuffer)}; // Use helper
  console.log("encryptDiary: result object:", JSON.stringify(result).substring(0, 100) + "...");
  return result;
}

async function decryptDiary(encryptedObj, password) {
  console.log("decryptDiary: received encryptedObj.data length:", encryptedObj.data.length);
  console.log("decryptDiary: received encryptedObj.data (first 50):", encryptedObj.data.substring(0,50));
  console.log("decryptDiary: received encryptedObj.data (last 50):", encryptedObj.data.substring(encryptedObj.data.length - 50));

  const salt = hexToBuf(encryptedObj.salt);
  const iv = hexToBuf(encryptedObj.iv);
  if (salt.length === 0 || iv.length === 0) throw new Error("Invalid salt or iv in encrypted data.");
  const key = await getKey(password, salt, ['decrypt']);
  const dataBuffer = _base64ToArrayBuffer(encryptedObj.data); // Use helper
  // console.log("decryptDiary: encryptedObj.salt:", encryptedObj.salt, "encryptedObj.iv:", encryptedObj.iv); // Redundant with above
  // console.log("decryptDiary: salt buffer length:", salt.length, "iv buffer length:", iv.length); // Redundant
  console.log("decryptDiary: dataBuffer from _base64ToArrayBuffer (byteLength):", dataBuffer.byteLength);
  const txtBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, dataBuffer);
  console.log("decryptDiary: txtBuffer from crypto.subtle.decrypt (byteLength):", txtBuffer.byteLength);
  const decodedText = dec.decode(txtBuffer);
  console.log("decryptDiary: decodedText (first 100 chars):", decodedText.substring(0,100));
  return decodedText;
}

// --- Core Logic Functions ---
function initDOM() {
  entryInput = document.getElementById('entryInput');
  saveBtn = document.getElementById('saveEntry');
  entriesList = document.getElementById('entriesList');
  openBtn = document.getElementById('openFile');
  createBtn = document.getElementById('createFile');
  passwordInput = document.getElementById('passwordInput');
  searchInput = document.getElementById('searchInput');
  exportBtn = document.getElementById('exportBtn');
  importBtn = document.getElementById('importBtn');
  importInput = document.getElementById('importInput');
}

async function handleOpenDiary() {
  try {
    [fileHandle] = await window.showOpenFilePicker({
      types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
    });
    currentPassword = passwordInput.value; // Store password at time of opening
    await loadDiaryFromFile();
  } catch (err) {
    console.error("Error opening diary:", err);
    if (err.name !== 'AbortError') alert("Failed to open diary: " + err.message);
  }
}

async function handleCreateDiary() {
  try {
    fileHandle = await window.showSaveFilePicker({
      suggestedName: 'diary.json',
      types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
    });
    diary = [];
    currentPassword = passwordInput.value; // Store password at time of creation
    await saveDiaryToFile();
    enableEditingControls();
    renderDiaryEntries();
  } catch (err) {
    console.error("Error creating diary:", err);
    if (err.name !== 'AbortError') alert("Failed to create diary: " + err.message);
  }
}

function generateExportData() {
  return diary.map(e => `"${new Date(e.timestamp).toLocaleString()}","${e.text.replace(/"/g, '""')}"`).join('\n');
}

function handleExportDiary() {
  const csv = generateExportData();
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'diary.csv';
  a.click();
  URL.revokeObjectURL(url);
}

async function handleImportDiary(file) {
  if (!file) return;
  const text = await file.text(); // In tests, this needs to be provided.
  try {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      // Basic validation of imported entries (optional, but good practice)
      const validEntries = data.filter(e => e.id && e.text && e.timestamp);
      diary = diary.concat(validEntries);
      await saveDiaryToFile();
      renderDiaryEntries();
    } else {
      alert('Invalid JSON file: Data should be an array of entries.');
    }
  } catch (err) {
    alert('Could not parse JSON file: ' + err.message);
    console.error("Error importing diary:", err);
  }
  if (importInput) importInput.value = ''; // Reset file input
}


async function handleSaveEntry() { // Changed to async
  const text = entryInput.value.trim();
  if (!text) return;
  if (!fileHandle) {
    alert('Open or create a diary file first.');
    return;
  }

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
  await saveDiaryToFile(); // Changed to await
  renderDiaryEntries(); // Call after await
}

function enableEditingControls() {
  if (!entryInput) initDOM(); // Ensure DOM elements are loaded, for testing
  entryInput.disabled = false;
  saveBtn.disabled = false;
  searchInput.disabled = false;
  exportBtn.disabled = false;
}

async function loadDiaryFromFile() {
  if (!fileHandle) return;
  const file = await fileHandle.getFile(); // In tests, this needs to be mocked.
  const text = await file.text(); // In tests, this needs to be mocked.
  try {
    let parsedDiary = [];
    if (currentPassword) {
      const obj = JSON.parse(text);
      if (obj && obj.data && obj.iv && obj.salt) { // Check if it looks like an encrypted object
        const decrypted = await decryptDiary(obj, currentPassword);
        parsedDiary = JSON.parse(decrypted || '[]');
      } else {
         // If password was provided, but file is not encrypted, treat as error or handle as plaintext
        alert("File does not appear to be encrypted, or is corrupted. Trying to load as plaintext.");
        parsedDiary = JSON.parse(text || '[]');
      }
    } else {
      // No password, attempt to parse as plaintext
      // Check if it's accidentally trying to load an encrypted file without password
      try {
        const objTest = JSON.parse(text);
        if (objTest && objTest.data && objTest.iv && objTest.salt) {
          alert("This file seems to be encrypted. Please provide a password to open it.");
          return; // Stop loading
        }
      } catch(e) { /* Not a JSON object, likely plaintext or corrupted */ }
      parsedDiary = JSON.parse(text || '[]');
    }
    diary = parsedDiary;
  } catch (err) {
    console.error("Error loading diary content:", err);
    alert("Failed to load or decrypt diary: " + err.message + ". Starting with an empty diary if file was newly created, or keeping existing data otherwise.");
    // Don't reset diary to [] if it was already populated and load failed.
    // If it's a new file creation that failed to load (which is unlikely), then diary would be [] anyway.
  }
  enableEditingControls();
  renderDiaryEntries();
}

async function saveDiaryToFile() {
  if (!fileHandle) return;
  const writable = await fileHandle.createWritable(); // In tests, this needs to be mocked.
  let dataToSave = JSON.stringify(diary, null, 2);
  if (currentPassword) {
    const encryptedObject = await encryptDiary(dataToSave, currentPassword);
    console.log("saveDiaryToFile: encryptedObject before stringify:", typeof encryptedObject, JSON.stringify(encryptedObject).substring(0,100)+"...");
    dataToSave = JSON.stringify(encryptedObject);
    console.log("saveDiaryToFile: dataToSave after stringify:", dataToSave.substring(0,100)+"...");
  }
  await writable.write(dataToSave);
  await writable.close();
}

function renderDiaryEntries() {
  if (!entriesList || !searchInput) initDOM(); // Ensure DOM elements are loaded

  entriesList.innerHTML = '';
  const query = searchInput.value.toLowerCase();
  const sorted = diary.slice().sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
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
      await saveDiaryToFile();
      renderDiaryEntries();
    });
    buttons.appendChild(editBtn);
    buttons.appendChild(deleteBtn);
    div.appendChild(date);
    div.appendChild(text);
    div.appendChild(buttons);
    entriesList.appendChild(div);
  }
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  if (!openBtn) initDOM(); // Ensure DOM elements are loaded

  openBtn.addEventListener('click', handleOpenDiary);
  createBtn.addEventListener('click', handleCreateDiary);
  exportBtn.addEventListener('click', handleExportDiary);
  importBtn.addEventListener('click', () => importInput.click());
  importInput.addEventListener('change', (event) => {
    // In a browser, event.target.files[0] would be used.
    // For testing, we might need to pass the file mock differently.
    handleImportDiary(event.target.files[0]);
  });
  saveBtn.addEventListener('click', handleSaveEntry);
  searchInput.addEventListener('input', renderDiaryEntries);
  entryInput.addEventListener('input', () => {
    localStorage.setItem('diaryDraft', entryInput.value);
  });
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  initDOM();
  setupEventListeners();
  const draft = localStorage.getItem('diaryDraft');
  if (draft) entryInput.value = draft;
  // Initially, most controls should be disabled until a file is opened/created
  entryInput.disabled = true;
  saveBtn.disabled = true;
  searchInput.disabled = true;
  exportBtn.disabled = true;
});

// --- Exports for Testing (Conditional) ---
// This pattern allows a testing environment to access internal functions and state.
if (typeof module !== 'undefined' && module.exports) {
  // No longer need to polyfill window.btoa/atob here as helpers use Buffer directly.
  module.exports = {
    // State
    getDiary: () => diary,
    setDiary: (newDiary) => { diary = newDiary; },
    getEditingId: () => editingId,
    setEditingId: (id) => { editingId = id; },
    getFileHandle: () => fileHandle,
    setFileHandle: (fh) => { fileHandle = fh; },
    setCurrentPassword: (pw) => { currentPassword = pw; },
    // DOM Elements (for asserting their state, not direct manipulation in tests)
    getDOMElement: (id) => document.getElementById(id), // Or return the direct variable if initialized
    // Core Logic
    handleCreateDiary,
    handleOpenDiary,
    handleSaveEntry,
    handleExportDiary,
    handleImportDiary,
    loadDiaryFromFile,
    saveDiaryToFile,
    renderDiaryEntries, // Be careful with functions that manipulate DOM directly
    enableEditingControls,
    // Crypto
    encryptDiary,
    decryptDiary,
    getKey, // Expose if direct crypto testing is needed
    bufToHex,
    hexToBuf,
    // Helpers
    initDOMForTests: initDOM, // To ensure DOM elements are "loaded" in test
    setupEventListenersForTests: setupEventListeners // If needed, though direct calls are better
  };
}
