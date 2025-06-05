// This function is called by the viewAllEntriesBtn event listener in ui_main.js
function prepareDiaryDataForEntriesPage() {
  // 'diary' is a global variable from diary_store.js
  sessionStorage.setItem('diaryDataForEntriesPage', JSON.stringify(diary));
}

async function checkSessionStorageForUpdates() {
  const entriesModified = sessionStorage.getItem('diaryEntriesModified');
  if (entriesModified === 'true') {
    const updatedDiaryData = sessionStorage.getItem('diaryDataForEntriesPage');
    if (updatedDiaryData) {
      try {
        // 'diary' is a global variable from diary_store.js
        diary = JSON.parse(updatedDiaryData);
        if (fileHandle) { // 'fileHandle' is global from diary_file_operations.js
          // 'saveDiaryToFile' is global from diary_file_operations.js
          await saveDiaryToFile();
        }
      } catch (error) {
        console.error("Error parsing diary data from session storage:", error);
      }
      // renderDiaryEntries(); // Not needed as entries are not on main page
    }
    sessionStorage.removeItem('diaryEntriesModified');
  }

  const entryIdToEdit = sessionStorage.getItem('editEntryId');
  if (entryIdToEdit) {
    // 'diary' is global from diary_store.js
    if (diary && diary.length > 0) {
        const entryToEdit = diary.find(e => e.id === entryIdToEdit);
        if (entryToEdit) {
            // DOM elements like 'entryInput' are global, initialized in ui_main.js
            entryInput.value = entryToEdit.text;
            // 'editingId' is global from diary_store.js
            editingId = entryIdToEdit;
            // 'enableEditingControls' is global from ui_main.js
            if (typeof enableEditingControls === 'function') {
                enableEditingControls();
            }
            entryInput.focus();
        }
    } else if (fileHandle) { // 'fileHandle' is global
        console.warn("Attempted to edit entry, but diary is not loaded or empty. Consider calling loadDiaryFromFile first if a file is open.");
    }
    sessionStorage.removeItem('editEntryId');
  }
}
