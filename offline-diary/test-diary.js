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
            this.children = [];
          }
        },
        files: [],
        addEventListener: function(event, callback) {
          this[`on${event}`] = callback;
        },
        click: function() {
          if (this.onclick) {
            this.onclick();
          }
        },
        focus: () => { },
        appendChild: function(child) {
          if (!this.children) this.children = [];
          this.children.push(child);
          child._parentElement = this;
        },
        ...(id === 'importInput' && { files: [], type: 'file' }),
        ...(id === 'entryInput' && { rows: 0 }),
      };
    }
    return global.document._elements[id];
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
global.alert = global.window.alert;
global.confirm = global.window.confirm;
global.crypto = global.window.crypto;
global.Blob = global.window.Blob;
global.URL = global.window.URL;

let mockFileContents = {};
global.mockFileContents = mockFileContents;

const diaryApp = require('./script.js');

console.log("Starting Offline Diary Tests with Refactored Script...");

function assert(condition, message) {
  if (!condition) {
    console.error("Assertion Failed:", message);
    console.error.called = true;
  } else {
    console.log("Assertion Passed.");
  }
}

async function setupNewDiary(initialEntriesText = [], password = '') {
  mockFileContents = {};
  diaryApp.setDiary([]);
  diaryApp.setFileHandle(null);
  diaryApp.setCurrentPassword(null); // Important: reset currentPassword from script.js state
  diaryApp.setEditingId(null);

  if (global.domContentLoadedCallback) global.domContentLoadedCallback();
  diaryApp.initDOMForTests();

  diaryApp.getDOMElement('passwordInput').value = password;
  // Set the "current test password" for the crypto mock to know what password getKey was called with
  // This is a bit of a hack due to not having a full key management mock.
  // script.js's currentPassword will be set within handleCreateDiary/handleOpenDiary.
  // The mock needs to know what password was *intended* for the key.
  global.crypto._currentTestPassword = password;


  const originalShowSaveFilePicker = global.window.showSaveFilePicker;
  global.window.showSaveFilePicker = async (options) => ({
    createWritable: async () => ({
      write: async (content) => { mockFileContents[options.suggestedName] = content; },
      close: async () => {},
    }),
    getFile: async () => ({ text: async () => mockFileContents[options.suggestedName] || JSON.stringify([]) }),
    name: options.suggestedName
  });

  await diaryApp.handleCreateDiary();
  global.window.showSaveFilePicker = originalShowSaveFilePicker;

  assert(diaryApp.getFileHandle() !== null, "File handle should be set after create (setupNewDiary).");
  const initialDiary = diaryApp.getDiary();
  assert(initialDiary.length === 0, `New diary should be empty after create. Found: ${initialDiary.length} entries. Content: ${JSON.stringify(initialDiary)}`);

  if (initialEntriesText && initialEntriesText.length > 0) {
    for (const entryText of initialEntriesText) {
      diaryApp.getDOMElement('entryInput').value = entryText;
      await diaryApp.handleSaveEntry(); // This is now properly awaited
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
    diaryApp.getDOMElement('entryInput').value = text;
    await diaryApp.handleSaveEntry(); // This now awaits due to script.js change
  }
  assert(diaryApp.getDiary().length === entriesToSave.length, `Should have ${entriesToSave.length} entries after saving.`);

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
  diaryApp.setDiary([]);
  diaryApp.getDOMElement('passwordInput').value = correctPassword;
  global.crypto._currentTestPassword = correctPassword; // Inform mock this is the correct password attempt

  const originalShowOpenFilePicker = global.window.showOpenFilePicker;
  global.window.showOpenFilePicker = async () => [{
    getFile: async () => ({ text: async () => savedContentRaw, name: 'diary.json' }),
    name: 'diary.json'
  }];

  await diaryApp.handleOpenDiary();
  let currentDiary = diaryApp.getDiary();
  assert(currentDiary.length === entriesToSave.length, `Diary should have ${entriesToSave.length} entries after decryption.`);
  assert(currentDiary.some(e => e.text === "Secret entry 1"), "Decrypted diary missing 'Secret entry 1'.");
  assert(currentDiary.some(e => e.text === "Another secret"), "Decrypted diary missing 'Another secret'.");
  console.log("Decryption on open (correct password): VERIFIED");

  // 3. Test reopening with an incorrect password
  diaryApp.setDiary([]);
  diaryApp.getDOMElement('passwordInput').value = "wrongpassword";
  global.crypto._currentTestPassword = "wrongpassword"; // Inform mock this is a wrong password attempt
  global.lastAlert = "";
  await diaryApp.handleOpenDiary();
  assert(global.lastAlert.includes("Failed to load or decrypt diary"), "Alert should indicate decryption failure for wrong password.");
  assert(diaryApp.getDiary().length === 0, "Diary should be empty or not loaded with wrong password.");
  console.log("Decryption on open (wrong password): VERIFIED");

  // 4. Test reopening without a password
  diaryApp.setDiary([]);
  diaryApp.getDOMElement('passwordInput').value = "";
  // global.crypto._currentTestPassword = ""; // No password means script won't try to decrypt with key
  global.lastAlert = "";
  await diaryApp.handleOpenDiary();
  assert(global.lastAlert.includes("This file seems to be encrypted"), "Alert should indicate file is encrypted but no password provided.");
  assert(diaryApp.getDiary().length === 0, "Diary should not be loaded if encrypted and no password given.");
  console.log("Decryption on open (no password for encrypted file): VERIFIED");

  global.window.showOpenFilePicker = originalShowOpenFilePicker;
  console.log("Password Protection Test PASSED");
}


async function runSpecificTests() {
  try {
    await testPasswordProtection();

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
