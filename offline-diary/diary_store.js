let diary = [];
let editingId = null;

// This function contains the part of handleSaveEntry that manipulates the diary array and editingId
// It will be called by the new handleSaveEntry in ui_main.js
// It assumes 'entryInput' value and 'fileHandle' are checked by the caller.
// It also assumes 'saveDiaryToFile' and 'renderDiaryEntries' will be called by the caller if needed.
function updateDiaryStore(text) {
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
}

// Example of another function that purely manipulates the diary array structure (if needed later)
// function findEntryById(id) {
//   return diary.find(e => e.id === id);
// }

// Function to generate data for CSV export (moved from script.js's generateExportData)
function generateExportDataForDiary() {
  return diary.map(e => `"${new Date(e.timestamp).toLocaleString()}","${e.text.replace(/"/g, '""')}"`).join('\n');
}

// Function to handle the logic of importing diary data (from handleImportDiary)
// Assumes 'file' is a File object.
// It will call saveDiaryToFile and renderDiaryEntries from their new locations if needed,
// or the caller (in diary_file_operations.js) will handle that.
// For now, it just updates the 'diary' array.
function importDiaryData(parsedData) {
  if (Array.isArray(parsedData)) {
    const validEntries = parsedData.filter(e => e.id && e.text && e.timestamp);
    diary = diary.concat(validEntries);
    return true; // Indicates success
  }
  return false; // Indicates failure
}
