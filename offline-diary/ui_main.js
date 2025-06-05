// DOM Elements
let entryInput, saveBtn, /*entriesList,*/ openBtn, createBtn, passwordInput, /*searchInput,*/ exportBtn, importBtn, importInput, chatWithLuneBtn, viewAllEntriesBtn;
let chatModal, chatMessages, chatInput, sendChatBtn, closeChatModalBtn;
let focusedElementBeforeModal = null;

// --- Core UI Logic Functions ---
function initDOM() {
  entryInput = document.getElementById('entryInput');
  saveBtn = document.getElementById('saveEntry');
  // entriesList = document.getElementById('entriesList'); // This was removed from index.html
  openBtn = document.getElementById('openFile');
  createBtn = document.getElementById('createFile');
  passwordInput = document.getElementById('passwordInput');
  // searchInput = document.getElementById('searchInput'); // Removed
  exportBtn = document.getElementById('exportBtn');
  importBtn = document.getElementById('importBtn');
  importInput = document.getElementById('importInput');
  chatWithLuneBtn = document.getElementById('chatWithLuneBtn');
  viewAllEntriesBtn = document.getElementById('viewAllEntriesBtn');

  chatModal = document.getElementById('chatModal');
  chatMessages = document.getElementById('chatMessages');
  chatInput = document.getElementById('chatInput');
  sendChatBtn = document.getElementById('sendChatBtn');
  closeChatModalBtn = document.getElementById('closeChatModalBtn');
}

function enableEditingControls() {
  if (!entryInput) initDOM(); // Ensure DOM elements are loaded
  entryInput.disabled = false;
  saveBtn.disabled = false;
  // if(searchInput) searchInput.disabled = false; // searchInput removed
  exportBtn.disabled = false;
}

// --- Event Listeners Setup ---
function setupEventListeners() {
  if (!openBtn && typeof initDOM === 'function') initDOM(); // Ensure DOM elements are loaded

  if (openBtn && typeof handleOpenDiary === 'function') {
    openBtn.addEventListener('click', handleOpenDiary);
  }
  if (createBtn && typeof handleCreateDiary === 'function') {
    createBtn.addEventListener('click', handleCreateDiary);
  }
  if (exportBtn && typeof handleExportDiary === 'function') {
    exportBtn.addEventListener('click', handleExportDiary);
  }
  if (importBtn && importInput) {
    importBtn.addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (event) => {
      if (typeof handleImportDiary === 'function') {
        handleImportDiary(event.target.files[0]);
      }
    });
  }

  if (saveBtn && typeof updateDiaryStore === 'function' && typeof saveDiaryToFile === 'function') {
    saveBtn.addEventListener('click', async () => {
      const text = entryInput.value.trim();
      if (!text) return;
      if (!fileHandle) { // fileHandle is global from diary_file_operations.js
        alert('Open or create a diary file first.');
        return;
      }
      updateDiaryStore(text); // From diary_store.js
      entryInput.value = '';
      localStorage.removeItem('diaryDraft');
      await saveDiaryToFile(); // From diary_file_operations.js
      // renderDiaryEntries(); // Not on main page
      console.log("Entry saved via ui_main.js");
    });
  }

  // searchInput related event listener removed.

  if(entryInput) {
    entryInput.addEventListener('input', () => {
        localStorage.setItem('diaryDraft', entryInput.value);
    });
  }

  // Chat Modal Listeners
  if (chatWithLuneBtn) {
    chatWithLuneBtn.addEventListener('click', () => {
      focusedElementBeforeModal = document.activeElement; // Store focus
      if (typeof clearChatSession === 'function') {
        clearChatSession(); // From chat_handler.js
      }
      if (chatMessages) chatMessages.innerHTML = ''; // Clear UI
      if (chatModal) chatModal.style.display = 'block';
      if (chatInput) chatInput.focus(); // Focus inside modal
      else if (closeChatModalBtn) closeChatModalBtn.focus(); // Fallback focus
      console.log('Chat with Lune clicked, modal opened.');
    });
  }

  if (closeChatModalBtn) {
    closeChatModalBtn.addEventListener('click', () => {
      if (typeof saveCurrentChatConversation === 'function') {
        saveCurrentChatConversation(); // From chat_handler.js
      }
      if (chatModal) chatModal.style.display = 'none';
      if (focusedElementBeforeModal) focusedElementBeforeModal.focus(); // Restore focus
      console.log('Chat modal closed by button.');
    });
  }

  if (sendChatBtn && chatInput && chatMessages) {
    sendChatBtn.addEventListener('click', () => {
      const messageText = chatInput.value.trim();
      if (messageText) {
        const userMessageDiv = document.createElement('div');
        userMessageDiv.textContent = "You: " + messageText;
        chatMessages.appendChild(userMessageDiv);

        const botResponseText = "Lune: Thanks for your message!"; // Simple echo
        const botMessageDiv = document.createElement('div');
        botMessageDiv.textContent = botResponseText;
        chatMessages.appendChild(botMessageDiv);

        if (typeof addMessageToChatHistory === 'function') {
          addMessageToChatHistory('user', messageText, new Date().toISOString());
          addMessageToChatHistory('lune', botResponseText, new Date().toISOString());
        }

        chatInput.value = ''; // Clear input
        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to bottom
      }
    });
  }

  if (chatModal) {
    window.addEventListener('click', (event) => {
      if (event.target == chatModal) {
        if (typeof saveCurrentChatConversation === 'function') {
          saveCurrentChatConversation(); // From chat_handler.js
        }
        chatModal.style.display = 'none';
        if (focusedElementBeforeModal) focusedElementBeforeModal.focus(); // Restore focus
        console.log('Chat modal closed by clicking backdrop.');
      }
    });
  }

  // View All Entries Button
  if (viewAllEntriesBtn && typeof prepareDiaryDataForEntriesPage === 'function') {
    viewAllEntriesBtn.addEventListener('click', () => {
      prepareDiaryDataForEntriesPage(); // From page_sync.js
      window.location.href = 'entries.html';
    });
  }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  if (typeof initDOM === 'function') initDOM();
  if (typeof setupEventListeners === 'function') setupEventListeners();

  const draft = localStorage.getItem('diaryDraft');
  if (draft && entryInput) entryInput.value = draft;

  if (typeof checkSessionStorageForUpdates === 'function') {
    checkSessionStorageForUpdates(); // From page_sync.js
  }

  // Initial state of controls
  if (entryInput) entryInput.disabled = true;
  if (saveBtn) saveBtn.disabled = true;
  // if (searchInput) searchInput.disabled = true; // searchInput removed
  if (exportBtn) exportBtn.disabled = true;
});

// --- Exports for Testing (Conditional) ---
// This section might be adjusted if direct testing of ui_main.js itself is needed,
// but most logic is now in other modules which would be tested independently or via ui_main.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    initDOM,
    setupEventListeners,
    enableEditingControls,
    // Expose any other functions if needed for very specific UI testing not covered by calls from other modules.
  };
}
