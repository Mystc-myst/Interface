let fileHandle = null;
let currentPassword = null;

// Note: These functions will call crypto functions from crypto_utils.js (e.g., encryptDiary, decryptDiary)
// and diary manipulation functions from diary_store.js (e.g., updateDiaryStore).
// They also rely on global DOM elements like 'passwordInput' or that such values are passed to them.
// And will call UI functions like 'enableEditingControls' and 'renderDiaryEntries' from ui_main.js.

async function handleOpenDiary() {
  try {
    // window.showOpenFilePicker must be used in response to a user gesture.
    const [pickerFileHandle] = await window.showOpenFilePicker({
      types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
    });
    fileHandle = pickerFileHandle; // Store the obtained file handle globally
    currentPassword = passwordInput.value; // Store password at time of opening
    await loadDiaryFromFile(); // This populates 'diary' (global variable)

    // Call UI updates, assuming these functions are globally available from ui_main.js
    if (typeof checkSessionStorageForUpdates === 'function') {
        checkSessionStorageForUpdates(); // Check after diary is loaded
    }
    if (typeof enableEditingControls === 'function') {
        enableEditingControls();
    }
    // renderDiaryEntries is not called here anymore as entries are on a separate page.
    // If there was a need to refresh something on the main page, it would be called.

  } catch (err) {
    console.error("Error opening diary:", err);
    if (err.name !== 'AbortError') alert("Failed to open diary: " + err.message);
  }
}

async function handleCreateDiary() {
  try {
    // window.showSaveFilePicker must be used in response to a user gesture.
    const pickerFileHandle = await window.showSaveFilePicker({
      suggestedName: 'diary.json',
      types: [{ description: 'JSON Files', accept: { 'application/json': ['.json'] } }]
    });
    fileHandle = pickerFileHandle; // Store the obtained file handle globally
    diary = []; // Reset diary array (global from diary_store.js)
    currentPassword = passwordInput.value; // Store password at time of creation

    await saveDiaryToFile(); // Save the empty diary structure

    // Call UI updates
    if (typeof enableEditingControls === 'function') {
        enableEditingControls();
    }
    // renderDiaryEntries(); // Not needed on main page
    if (typeof checkSessionStorageForUpdates === 'function') {
        checkSessionStorageForUpdates(); // Check after diary is created
    }

  } catch (err) {
    console.error("Error creating diary:", err);
    if (err.name !== 'AbortError') alert("Failed to create diary: " + err.message);
  }
}

async function loadDiaryFromFile() {
  if (!fileHandle) return;
  const file = await fileHandle.getFile();
  const text = await file.text();
  try {
    let parsedDiaryData = [];
    if (currentPassword) {
      const obj = JSON.parse(text); // First parse to see if it's our encrypted structure
      if (obj && obj.data && obj.iv && obj.salt) { // Check if it looks like an encrypted object
        const decrypted = await decryptDiary(obj, currentPassword); // from crypto_utils.js
        parsedDiaryData = JSON.parse(decrypted || '[]');
      } else {
        alert("File does not appear to be encrypted as expected, or is corrupted. Trying to load as plaintext.");
        parsedDiaryData = JSON.parse(text || '[]');
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
      parsedDiaryData = JSON.parse(text || '[]');
    }
    diary = parsedDiaryData; // Update global diary array
  } catch (err) {
    console.error("Error loading diary content:", err);
    alert("Failed to load or decrypt diary: " + err.message + ". Starting with an empty diary if file was newly created, or keeping existing data otherwise.");
  }
  // UI updates like enableEditingControls and renderDiaryEntries should be called by the initiator (handleOpenDiary)
}

async function saveDiaryToFile() {
  if (!fileHandle) return;
  const writable = await fileHandle.createWritable();
  let dataToSave = JSON.stringify(diary, null, 2); // 'diary' is global from diary_store.js
  if (currentPassword) {
    const encryptedObject = await encryptDiary(dataToSave, currentPassword); // from crypto_utils.js
    dataToSave = JSON.stringify(encryptedObject);
  }
  await writable.write(dataToSave);
  await writable.close();
}

function handleExportDiary() {
  const csv = generateExportDataForDiary(); // from diary_store.js
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
  const text = await file.text();
  try {
    const data = JSON.parse(text);
    if (importDiaryData(data)) { // importDiaryData from diary_store.js
      await saveDiaryToFile();
      // renderDiaryEntries(); // This was on the main page, which is now gone.
      // If entries were displayed on entries.html, that page would need to be refreshed or re-rendered.
      // For now, just save and the main page doesn't show entries.
      alert("Diary imported successfully. Changes will be saved.");
    } else {
      alert('Invalid JSON file: Data should be an array of entries.');
    }
  } catch (err) {
    alert('Could not parse JSON file: ' + err.message);
    console.error("Error importing diary:", err);
  }
  if (typeof importInput !== 'undefined' && importInput) importInput.value = ''; // Reset file input (DOM element)
}
