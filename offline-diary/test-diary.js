// --- Mocks ---
global.window = { // Define window first
  localStorage: {
    _store: {},
    getItem: (key) => global.window.localStorage._store[key] || null,
    setItem: (key, value) => { global.window.localStorage._store[key] = value; },
    removeItem: (key) => { delete global.window.localStorage._store[key]; }
  },
  crypto: { // Define crypto on window
    _correctPassword: "testpassword123", // Store the correct password for mock checks
    getRandomValues: (arr) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = i;
      }
      return arr;
    },
    subtle: {
      importKey: async (format, keyMaterial, algo, extractable, keyUsages) => {
        // Store password if this is for PBKDF2 key derivation
        if (algo.name === 'PBKDF2') {
          // keyMaterial is the password buffer. For simplicity, we won't decode it back to string here.
          // Instead, the 'decrypt' mock will check the password string passed to decryptDiary.
        }
        return {}; // Mock key object
      },
      deriveKey: async (algo, baseKey, derivedKeyType, extractable, keyUsages) => {
        // The 'baseKey' here is from importKey.
        // We can associate the password with this baseKey if needed, or rely on password passed to decryptDiary.
        return new ArrayBuffer(32); // Mock derived key material
      },
      encrypt: async (algo, key, data) => {
        const iv = algo.iv || global.crypto.getRandomValues(new Uint8Array(12));
        const encryptedData = new Uint8Array(iv.byteLength + data.byteLength);
        encryptedData.set(new Uint8Array(iv.buffer || iv), 0);
        encryptedData.set(new Uint8Array(data), iv.byteLength);
        return encryptedData.buffer;
      },
      decrypt: async (algo, key, data) => {
        // This 'key' is derived. The actual password check needs to happen based on what password
        // was passed to `getKey` that led to this `key`.
        // For simplicity, we'll assume `global.crypto._currentTestPassword` is set by the test
        // before calling `decryptDiary`.
        if (global.crypto._currentTestPassword !== global.crypto._correctPassword) {
          console.log(`Mock decrypt: Incorrect password used ('${global.crypto._currentTestPassword}'). Throwing error.`);
          throw new Error("Mock Decryption Error: Incorrect Key or Corrupted Data");
        }

        const iv = algo.iv;
        if (!iv || !iv.byteLength) {
          throw new Error("Mock decrypt error: IV is missing or invalid in algo param.");
        }
        if (data.byteLength < iv.byteLength) {
            throw new Error("Mock decrypt error: data is shorter than IV length.");
        }
        const decryptedData = new Uint8Array(data).slice(iv.byteLength);
        return decryptedData.buffer;
      }
    }
  },
  showOpenFilePicker: async () => {
    return [{
      getFile: async () => ({
        text: async () => JSON.stringify([]),
        name: 'mock-diary.json'
      }),
      name: 'mock-diary.json'
    }];
  },
  showSaveFilePicker: async (options) => {
    return {
      getFile: async () => ({
        text: async () => JSON.stringify(mockFileContents[options.suggestedName] || []),
        name: options.suggestedName || 'new-diary.json'
      }),
      createWritable: async () => ({
        write: async (content) => {
          mockFileContents[options.suggestedName || 'new-diary.json'] = content;
        },
        close: async () => {},
      }),
      name: options.suggestedName || 'new-diary.json'
    };
  },
  URL: {
    createObjectURL: (blob) => `blob:http://localhost/mock-url-for-${blob.type}`,
    revokeObjectURL: () => {}
  },
  alert: (message) => { console.log('Alert:', message); global.lastAlert = message; },
  confirm: (message) => { console.log('Confirm:', message); return global.confirmResponse !== undefined ? global.confirmResponse : true; },
  TextEncoder: class { encode = (str) => new Uint8Array(str.split('').map(c => c.charCodeAt(0))); },
  TextDecoder: class { decode = (buf) => String.fromCharCode(...new Uint8Array(buf)); },
  Blob: class { constructor(parts, options) { this.parts = parts; this.type = options ? options.type : ''; } },
  Uint8Array: Uint8Array,
  ArrayBuffer: ArrayBuffer,
  atob: (b64) => Buffer.from(b64, 'base64').toString('binary'),
  btoa: (str) => Buffer.from(str, 'binary').toString('base64')
};

global.document = {
  _elements: {},
  getElementById: (id) => {
    if (!global.document._elements[id]) {
      global.document._elements[id] = {
        id: id,
        value: '',
        disabled: false,
        _innerHTML: '',
        get innerHTML() { return this._innerHTML; },
        set innerHTML(html) {
          this._innerHTML = html;
          if (html === '') {
            this.children = []; // Simple way to clear children for mock
          }
        },
        scrollTop: 0, // for chatMessages
        style: {}, // for chatModal display style
        files: [],
        addEventListener: function(event, callback) {
          this[`on${event}`] = callback;
        },
        click: function() {
          if (this.onclick) {
            this.onclick();
          }
        },
        focus: () => { global.focusedElement = this.id; }, // Track focused element
        appendChild: function(child) {
          if (!this.children) this.children = [];
          this.children.push(child);
          child._parentElement = this;
          // Update innerHTML roughly for basic textContent checks
          this._innerHTML += child.outerHTML || child.textContent || '';
        },
        // Specific mocks for certain elements
        ...(id === 'importInput' && { files: [], type: 'file' }),
        ...(id === 'entryInput' && { rows: 0 }),
        ...(id === 'chatInput' && { type: 'textarea' }),
        ...(id === 'chatMessages' && { className: 'chat-messages-area' }),
        ...(id === 'chatModal' && { className: 'modal' }),
        ...(id === 'closeChatModalBtn' && { className: 'close-button' }),
      };
    }
    return global.document._elements[id];
  },
  // activeElement mock for focus management tests
  get activeElement() {
    return global.focusedElement ? global.document.getElementById(global.focusedElement) : null;
  },
  createElement: function(tagName) {
    const mockElement = {
      tagName: tagName.toUpperCase(),
      href: '',
      download: '',
      style: {},
      _children: [],
      get children() { return this._children; },
      click: function() {
        if (this.onclick) this.onclick();
      },
      appendChild: function(child) {
        this._children.push(child);
        child._parentElement = this;
      },
      addEventListener: function(type, listener) {
        this[`on${type}`] = listener;
      },
      className: '',
      _textContent: '',
      get textContent() {
        if (this._children.length > 0) {
          return this._children.map(c => c.textContent).join('');
        }
        return this._textContent;
      },
      set textContent(text) {
        this._textContent = text;
        this._children = [];
      },
    };
    return mockElement;
  },
  addEventListener: (event, callback) => {
    if (event === 'DOMContentLoaded') {
      global.domContentLoadedCallback = callback;
    }
  }
};
global.CustomEvent = class CustomEvent { constructor(type, detail) { this.type = type; this.detail = detail; }};
global.Event = class Event { constructor(type) { this.type = type; this.target = null; }};

global.localStorage = global.window.localStorage;

// sessionStorage Mock
global.sessionStorage = {
  _store: {},
  getItem: function(key) { return this._store[key] || null; },
  setItem: function(key, value) { this._store[key] = String(value); },
  removeItem: function(key) { delete this._store[key]; },
  clear: function() { this._store = {}; }
};
global.window.sessionStorage = global.sessionStorage; // Make it available on window too if any code expects that

// showDirectoryPicker Mock
global.mockChatDirectoryHandle = {
  _files: {},
  getFileHandle: async function(name, options) {
    this._files[name] = this._files[name] || { name: name, content: null, writableClosed: false };
    return {
      name: name,
      createWritable: async () => {
        this._files[name].writableClosed = false; // Mark writable as open
        return {
          write: async (content) => { this._files[name].content = content; },
          close: async () => { this._files[name].writableClosed = true; }, // Mark as closed
        };
      }
    };
  },
  getMockFileContent: function(name) { return this._files[name] ? this._files[name].content : null; },
  isWritableClosed: function(name) { return this._files[name] ? this._files[name].writableClosed : false; },
  reset: function() { this._files = {}; }
};
global.window.showDirectoryPicker = async (options) => {
  if (global.mockShowDirectoryPickerResult === 'cancel') throw new DOMException('User aborted', 'AbortError');
  if (global.mockShowDirectoryPickerResult === 'deny') throw new DOMException('Permission denied', 'NotAllowedError');
  if (global.mockShowDirectoryPickerResult === 'error') throw new Error('Mock picker error');
  return global.mockChatDirectoryHandle;
};
global.mockShowDirectoryPickerResult = 'success'; // Default behavior

global.alert = global.window.alert;
global.confirm = global.window.confirm;
global.crypto = global.window.crypto;
global.Blob = global.window.Blob;
global.URL = global.window.URL;

let mockFileContents = {}; // Used for diary file operations mock
global.mockFileContents = mockFileContents;

// --- Script Loading ---
const fs = require('fs');
const vm = require('vm');

// Create a context for the VM to run the scripts in
const context = {
  global, window: global.window, document: global.document, localStorage: global.localStorage, sessionStorage: global.sessionStorage,
  crypto: global.crypto, alert: global.alert, confirm: global.confirm,
  Blob: global.Blob, URL: global.URL, TextEncoder: global.TextEncoder, TextDecoder: global.TextDecoder,
  Uint8Array: global.Uint8Array, ArrayBuffer: global.ArrayBuffer,
  console, // Make console available inside the scripts
  module: {}, exports: {}, // For scripts that might check for module environment
  setTimeout, clearTimeout, setInterval, clearInterval, // timers
  // Node.js Buffer for _arrayBufferToBase64 and _base64ToArrayBuffer in crypto_utils.js
  Buffer: Buffer,
  // Mock for showDirectoryPicker needs to be on window for chat_handler.js
  showDirectoryPicker: global.window.showDirectoryPicker,
  showOpenFilePicker: global.window.showOpenFilePicker,
  showSaveFilePicker: global.window.showSaveFilePicker,
  DOMException: DOMException, // For showDirectoryPicker mock
};
vm.createContext(context); // Globalize the context

const scriptPaths = [
  './offline-diary/crypto_utils.js',
  './offline-diary/diary_store.js',
  './offline-diary/diary_file_operations.js',
  './offline-diary/chat_handler.js',
  './offline-diary/page_sync.js',
  './offline-diary/ui_main.js'
];

for (const path of scriptPaths) {
  try {
    const scriptCode = fs.readFileSync(path, 'utf8');
    vm.runInContext(scriptCode, context, { filename: path.split('/').pop() });
  } catch (e) {
    console.error(`Error loading script ${path}:`, e);
    process.exit(1); // Exit if essential scripts can't be loaded
  }
}
// Expose key functions/variables from the loaded scripts to the test file's global scope
// This makes it easier to call them in tests, similar to how they are global in the browser.
// Note: This assumes these variables/functions are defined globally in their respective scripts.
Object.assign(global, {
    // from crypto_utils.js
    encryptDiary: context.encryptDiary, decryptDiary: context.decryptDiary, getKey: context.getKey,
    // from diary_store.js
    diary: context.diary, editingId: context.editingId, updateDiaryStore: context.updateDiaryStore,
    generateExportDataForDiary: context.generateExportDataForDiary, importDiaryData: context.importDiaryData,
    // from diary_file_operations.js
    fileHandle: context.fileHandle, currentPassword: context.currentPassword,
    handleOpenDiary: context.handleOpenDiary, handleCreateDiary: context.handleCreateDiary,
    loadDiaryFromFile: context.loadDiaryFromFile, saveDiaryToFile: context.saveDiaryToFile,
    handleExportDiary: context.handleExportDiary, handleImportDiary: context.handleImportDiary,
    // from chat_handler.js
    currentChatHistory: context.currentChatHistory, chatDirectoryHandle: context.chatDirectoryHandle,
    addMessageToChatHistory: context.addMessageToChatHistory, clearChatSession: context.clearChatSession,
    saveCurrentChatConversation: context.saveCurrentChatConversation, saveChatConversation: context.saveChatConversation,
    // from page_sync.js
    prepareDiaryDataForEntriesPage: context.prepareDiaryDataForEntriesPage,
    checkSessionStorageForUpdates: context.checkSessionStorageForUpdates,
    // from ui_main.js
    initDOM: context.initDOM, setupEventListeners: context.setupEventListeners, enableEditingControls: context.enableEditingControls,
    // DOM elements are also global in ui_main.js but accessed via document.getElementById in tests or directly if needed after initDOM
});


// The old diaryApp variable is no longer needed as functions are global.
// const diaryApp = require('./script.js');
// Tests will now call functions like initDOM(), handleCreateDiary() directly.

console.log("Starting Offline Diary Tests with Refactored Scripts (Loaded via VM)...");

function assert(condition, message) {
  if (!condition) {
    console.error("Assertion Failed:", message);
    console.error.called = true;
  } else {
    console.log("Assertion Passed.");
  }
}

async function setupNewDiary(initialEntriesText = [], password = '') {
  mockFileContents = {}; // Reset mock diary file content
  global.diary = []; // Reset global diary variable from diary_store.js
  global.fileHandle = null; // Reset global fileHandle from diary_file_operations.js
  global.currentPassword = null; // Reset global currentPassword from diary_file_operations.js
  global.editingId = null; // Reset global editingId from diary_store.js
  global.currentChatHistory = []; // Reset global chat history
  if (global.mockChatDirectoryHandle) global.mockChatDirectoryHandle.reset(); // Reset mock chat files
  global.localStorage.clear();
  global.sessionStorage.clear();
  // Clear any previous DOM element state if necessary (getElementById mock creates fresh ones if not exists)
  // global.document._elements = {}; // Uncomment if elements need to be pristine for each setup

  // Simulate DOMContentLoaded which calls initDOM and setupEventListeners from ui_main.js
  if (global.domContentLoadedCallback) {
    global.domContentLoadedCallback();
  } else {
    // Fallback if DOMContentLoaded listener wasn't captured (e.g. script order issue)
    if (typeof initDOM === 'function') initDOM();
    if (typeof setupEventListeners === 'function') setupEventListeners();
  }

  global.document.getElementById('passwordInput').value = password;
  global.crypto._currentTestPassword = password; // For crypto mock

  const originalShowSaveFilePicker = global.window.showSaveFilePicker;
  global.window.showSaveFilePicker = async (options) => ({
    createWritable: async () => ({
      write: async (content) => { mockFileContents[options.suggestedName || 'diary.json'] = content; },
      close: async () => {},
    }),
    getFile: async () => ({ text: async () => mockFileContents[options.suggestedName || 'diary.json'] || JSON.stringify([]) }),
    name: options.suggestedName || 'diary.json'
  });

  if (typeof handleCreateDiary === 'function') {
    await handleCreateDiary(); // Call global function
  } else {
    console.error("handleCreateDiary is not defined globally. Check script loading.");
  }
  global.window.showSaveFilePicker = originalShowSaveFilePicker;

  assert(global.fileHandle !== null, "File handle should be set after create (setupNewDiary).");
  assert(global.diary.length === 0, `New diary should be empty after create. Found: ${global.diary.length} entries. Content: ${JSON.stringify(global.diary)}`);

  if (initialEntriesText && initialEntriesText.length > 0) {
    for (const entryText of initialEntriesText) {
      global.document.getElementById('entryInput').value = entryText;
      // Simulate saveBtn click which internally calls updateDiaryStore and saveDiaryToFile
      const saveBtn = global.document.getElementById('saveEntry');
      if (saveBtn && saveBtn.onclick) {
          await saveBtn.onclick();
      } else {
          console.error("Save button or its click handler is not found for saving initial entries.");
      }
    }
  }
}

async function testPasswordProtection() {
  console.log("\n--- Test: Password Protection (Encryption/Decryption) ---");
  const correctPassword = global.crypto._correctPassword; // Use the one defined in the mock

  // 1. Create a password-protected diary and add entries
  await setupNewDiary([], correctPassword);
  const entriesToSave = ["Secret entry 1", "Another secret"];
  for (const text of entriesToSave) {
    global.document.getElementById('entryInput').value = text;
    const saveBtn = global.document.getElementById('saveEntry');
    await saveBtn.onclick();
  }
  assert(global.diary.length === entriesToSave.length, `Should have ${entriesToSave.length} entries after saving.`);

  // Fetch the content AFTER all save operations are complete
  const savedContentRaw = mockFileContents['diary.json'];
  assert(savedContentRaw, "Encrypted diary should be saved.");
  let savedContentParsed;
  try {
    savedContentParsed = JSON.parse(savedContentRaw);
    assert(true, "Saved content is valid JSON.");
  } catch (e) {
    assert(false, "Saved content should be valid JSON (" + e + ")");
    savedContentParsed = null; // Ensure it's null if parsing failed
  }

  if (savedContentParsed) {
    assert(savedContentParsed.salt && savedContentParsed.iv && savedContentParsed.data, "Saved data should be in encrypted format {salt, iv, data}.");
    assert(!savedContentRaw.includes("Secret entry 1"), "Encrypted file should not contain plaintext 'Secret entry 1'.");
  }
  console.log("Encryption on save: VERIFIED");

  // 2. Test reopening with the correct password
  global.diary = []; // Reset diary state
  global.document.getElementById('passwordInput').value = correctPassword;
  global.crypto._currentTestPassword = correctPassword; // Inform mock

  const originalShowOpenFilePicker = global.window.showOpenFilePicker;
  global.window.showOpenFilePicker = async () => [{
    getFile: async () => ({ text: async () => savedContentRaw, name: 'diary.json' }),
    name: 'diary.json'
  }];

  await handleOpenDiary(); // Call global function
  assert(global.diary.length === entriesToSave.length, `Diary should have ${entriesToSave.length} entries after decryption.`);
  assert(global.diary.some(e => e.text === "Secret entry 1"), "Decrypted diary missing 'Secret entry 1'.");
  assert(global.diary.some(e => e.text === "Another secret"), "Decrypted diary missing 'Another secret'.");
  console.log("Decryption on open (correct password): VERIFIED");

  // 3. Test reopening with an incorrect password
  global.diary = [];
  global.document.getElementById('passwordInput').value = "wrongpassword";
  global.crypto._currentTestPassword = "wrongpassword"; // Inform mock
  global.lastAlert = "";
  await handleOpenDiary();
  assert(global.lastAlert.includes("Failed to load or decrypt diary"), "Alert should indicate decryption failure for wrong password.");
  assert(global.diary.length === 0, "Diary should be empty or not loaded with wrong password.");
  console.log("Decryption on open (wrong password): VERIFIED");

  // 4. Test reopening without a password
  global.diary = [];
  global.document.getElementById('passwordInput').value = "";
  // global.crypto._currentTestPassword = ""; // Reset for this scenario
  global.lastAlert = "";
  await handleOpenDiary();
  assert(global.lastAlert.includes("This file seems to be encrypted"), "Alert should indicate file is encrypted but no password provided.");
  assert(global.diary.length === 0, "Diary should not be loaded if encrypted and no password given.");
  console.log("Decryption on open (no password for encrypted file): VERIFIED");

  global.window.showOpenFilePicker = originalShowOpenFilePicker;
  console.log("Password Protection Test PASSED");
}

async function testChatFlow() {
  console.log("\n--- Test: Chat Flow (Modal Interaction and Saving) ---");
  // Ensure a clean state for chat directory handle for this test
  global.chatDirectoryHandle = null;
  await setupNewDiary(["Initial entry for chat test"], "chatTestPassword");

  // A. Open and interact with chat modal
  const chatBtn = global.document.getElementById('chatWithLuneBtn');
  chatBtn.onclick(); // Simulate click to open chat

  assert(global.document.getElementById('chatModal').style.display === 'block', "Chat modal should be visible.");
  assert(global.currentChatHistory.length === 0, "Chat history should be empty on open.");
  assert(global.focusedElement === 'chatInput' || global.focusedElement === 'closeChatModalBtn', "Focus should be inside chat modal.");


  const chatInputEl = global.document.getElementById('chatInput');
  const sendChatBtnEl = global.document.getElementById('sendChatBtn');
  chatInputEl.value = "Hello Lune";
  sendChatBtnEl.onclick(); // Simulate send

  assert(global.currentChatHistory.length === 2, "Chat history should have user and bot message (2 entries).");
  assert(global.currentChatHistory[0].text === "Hello Lune", "User message not recorded correctly.");
  assert(global.currentChatHistory[1].sender === "lune", "Bot message not recorded correctly.");
  const chatMessagesDiv = global.document.getElementById('chatMessages');
  assert(chatMessagesDiv.innerHTML.includes("You: Hello Lune"), "User message not in chat UI.");
  assert(chatMessagesDiv.innerHTML.includes("Lune: Thanks for your message!"), "Bot message not in chat UI.");


  // B. Test Chat Saving (Success Case)
  global.mockShowDirectoryPickerResult = 'success'; // Ensure picker mock is set to succeed
  global.mockChatDirectoryHandle.reset(); // Clear any previous mock files

  const closeChatBtn = global.document.getElementById('closeChatModalBtn');
  global.focusedElement = null; // Reset focus before close
  global.document.getElementById('chatWithLuneBtn').focus(); // Assume chat button had focus before modal
  let focusBeforeClose = global.document.activeElement.id;

  closeChatBtn.onclick(); // Simulate click to close and trigger save

  await new Promise(resolve => setTimeout(resolve, 200)); // Increased timeout for file ops

  assert(global.document.getElementById('chatModal').style.display === 'none', "Chat modal should be hidden after close.");
  assert(global.focusedElement === focusBeforeClose, "Focus should return to element focused before modal.");


  const savedFiles = Object.keys(global.mockChatDirectoryHandle._files);
  assert(savedFiles.length === 1, `One chat file should be saved. Found: ${savedFiles.length}. Files: ${JSON.stringify(global.mockChatDirectoryHandle._files)}`);
  const fileName = savedFiles[0];
  assert(fileName.startsWith('chat_') && fileName.endsWith('.json'), "Chat file name format incorrect.");
  assert(global.mockChatDirectoryHandle.isWritableClosed(fileName), "Chat file writable should be closed.");
  const savedContent = JSON.parse(global.mockChatDirectoryHandle.getMockFileContent(fileName));
  assert(savedContent.length === 2, "Saved chat content incorrect length.");
  assert(savedContent[0].text === "Hello Lune", "Saved chat content incorrect.");
  console.log("Chat saving (success): VERIFIED");

  // C. Test Chat Saving (Picker Cancelled)
  global.currentChatHistory = []; // Reset for next test part
  global.chatDirectoryHandle = null; // Crucial: reset handle to force picker again
  chatBtn.onclick(); // Re-open
  chatInputEl.value = "Another message";
  sendChatBtnEl.onclick();

  global.mockShowDirectoryPickerResult = 'cancel'; // Simulate user cancelling directory picker
  global.lastAlert = "";
  closeChatBtn.onclick(); // Close and attempt save
  await new Promise(resolve => setTimeout(resolve, 100));
  assert(global.lastAlert.includes("Chat save was cancelled"), "Alert for picker cancellation not shown.");
  console.log("Chat saving (picker cancel): VERIFIED");

  // Reset mock for other tests
  global.mockShowDirectoryPickerResult = 'success';
  global.document.getElementById('chatModal').style.display = 'none'; // ensure modal is hidden
}

async function testViewEntriesPageDataFlow() {
  console.log("\n--- Test: View Entries Page Data Flow ---");
  await setupNewDiary(["Entry 1", "Entry 2"], "viewEntriesTestPassword");

  // 1. Simulate navigating to entries.html
  prepareDiaryDataForEntriesPage();

  const storedDiaryDataString = global.sessionStorage.getItem('diaryDataForEntriesPage');
  assert(storedDiaryDataString !== null, "Diary data string should be in sessionStorage.");
  const storedDiaryData = JSON.parse(storedDiaryDataString);
  assert(storedDiaryData.length === 2, "Diary data not correctly stored in sessionStorage for entries page.");
  assert(storedDiaryData[0].text === "Entry 1", "Diary data content mismatch in sessionStorage.");

  // 2. Simulate "Edit" from entries.html
  const entryToEditId = storedDiaryData[0].id;
  global.sessionStorage.setItem('editEntryId', entryToEditId);

  // 3. Simulate "Delete" from entries.html (delete "Entry 2" which is storedDiaryData[1])
  const remainingEntries = [storedDiaryData[0]]; // Keep Entry 1
  global.sessionStorage.setItem('diaryDataForEntriesPage', JSON.stringify(remainingEntries));
  global.sessionStorage.setItem('diaryEntriesModified', 'true');

  // 4. Simulate returning to index.html and checkSessionStorageForUpdates() being called
  global.document.getElementById('entryInput').value = ''; // Reset input
  global.editingId = null; // Reset editingId state

  await checkSessionStorageForUpdates();

  assert(global.document.getElementById('entryInput').value === "Entry 1", "Entry text not loaded into input for editing.");
  assert(global.editingId === entryToEditId, "editingId not set correctly after 'edit' from entries page.");

  assert(global.diary.length === 1, `Diary in index.html not updated after deletion on entries page. Expected 1, got ${global.diary.length}`);
  assert(global.diary[0].text === "Entry 1", `Incorrect entry remaining after deletion sync. Expected "Entry 1", got "${global.diary[0].text}"`);

  // Check if saveDiaryToFile was triggered by checkSessionStorageForUpdates
  const fileContentRaw = mockFileContents['diary.json'];
  assert(fileContentRaw, "Diary file content should exist after sync.");
  const fileContentParsed = JSON.parse(fileContentRaw);
  let finalDiaryInFile;
  if (fileContentParsed.salt) {
      global.crypto._currentTestPassword = "viewEntriesTestPassword"; // Set for mock decryption
      const decrypted = await decryptDiary(fileContentParsed, "viewEntriesTestPassword");
      finalDiaryInFile = JSON.parse(decrypted);
  } else {
      finalDiaryInFile = fileContentParsed;
  }
  assert(finalDiaryInFile.length === 1 && finalDiaryInFile[0].text === "Entry 1", "Persistent save after delete from entries page failed.");

  console.log("View Entries Page data flow (edit and delete sync): VERIFIED");
  global.sessionStorage.clear();
}


async function runSpecificTests() {
  try {
    await testPasswordProtection();
    await testChatFlow();
    await testViewEntriesPageDataFlow();

    if (console.error.called) {
        console.log("SUBTASK_FAILURE");
        return false;
    }
    console.log("\n\n✅ ✅ ✅ Password protection tests completed! ✅ ✅ ✅");
    console.log("SUBTASK_SUCCESS");
    return true;
  } catch (error) {
    console.error("\n\n❌ ❌ ❌ One or more tests FAILED: ❌ ❌ ❌ ", error);
    console.log("SUBTASK_FAILURE");
    return false;
  }
}

runSpecificTests();

const originalConsoleError = console.error;
console.error = (...args) => {
    originalConsoleError(...args);
    console.error.called = true;
};
console.error.called = false;

global.isSubtaskRun = true;
