let currentChatHistory = [];
let chatDirectoryHandle = null;

// This function is called by the sendChatBtn event listener in ui_main.js
function addMessageToChatHistory(sender, text, timestamp) {
  currentChatHistory.push({ sender, text, timestamp });
}

// This function is called by the chatWithLuneBtn event listener in ui_main.js
function clearChatSession() {
  currentChatHistory = [];
  // Clearing UI (chatMessages.innerHTML = '') will be done in ui_main.js
}

// This function is called by modal close listeners in ui_main.js
async function saveCurrentChatConversation() {
  if (currentChatHistory.length > 0) {
    await saveChatConversation(currentChatHistory);
  }
}

async function saveChatConversation(chatHistory) {
  if (!chatHistory || chatHistory.length === 0) {
    console.log("Chat history is empty, nothing to save.");
    return;
  }

  const timestamp = new Date();
  const dateStr = timestamp.toISOString().split('T')[0]; // YYYY-MM-DD
  const timeStr = timestamp.toTimeString().split(' ')[0].replace(/:/g, ''); // HHMMSS
  const fileName = `chat_${dateStr}_${timeStr}.json`; // Save as JSON for structured data

  const chatContent = JSON.stringify(chatHistory, null, 2);

  try {
    if (!chatDirectoryHandle) {
      console.log("Chat directory handle not yet established. Requesting directory access.");
      chatDirectoryHandle = await window.showDirectoryPicker({
        id: 'lune_chats', // An ID to help browser remember the path
        mode: 'readwrite'
      });
    }

    if (chatDirectoryHandle) {
      const fileHandle = await chatDirectoryHandle.getFileHandle(fileName, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(chatContent);
      await writable.close();
      console.log(`Chat saved to ${fileName} in the selected directory.`);
    } else {
      alert("Chat directory not selected or permission denied. Chat not saved.");
    }
  } catch (err) {
    console.error("Error saving chat conversation:", err);
    if (err.name === 'AbortError') {
      alert("Chat save was cancelled or directory not selected.");
    } else if (err.name === 'NotAllowedError') {
      alert("Permission to save chat files was denied. Chat not saved. Please allow access if you want to save chats.");
      chatDirectoryHandle = null; // Reset handle if permission was denied
    } else {
      alert(`Failed to save chat: ${err.message}`);
    }
  }
}
