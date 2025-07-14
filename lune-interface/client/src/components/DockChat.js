// Import React hooks and PropTypes for type checking.
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
// Import sub-components used within DockChat.
// LuneChatModal is now globally managed by App.js and shown/hidden via prop.
import HashtagButtons from './HashtagButtons'; // Component to display clickable hashtag buttons.
import HashtagEntriesModal from './HashtagEntriesModal'; // Modal to show entries filtered by a selected hashtag.
import DiaryInput from "./DiaryInput"; // The main text input component for diary entries.
import GoToEntriesButton from './ui/GoToEntriesButton'; // Button to navigate to the EntriesPage.

// DockChat is the main component for user interaction on the chat/input screen.
// It handles diary entry input, editing, saving, and hashtag interactions.
export default function DockChat({
  entries,         // Array of all diary entries, passed from App.js.
  hashtags,        // Array of all unique hashtags, passed from App.js.
  refreshEntries,  // Function to refresh all data (entries, folders, hashtags), passed from App.js.
  editingId,       // ID of the entry currently being edited, or null if new entry. Passed from App.js.
  setEditingId,    // Function to set the editingId in App.js.
  setShowChat      // Function to control visibility of the LuneChatModal, passed from App.js.
}) {
  // Local state for the text input field. This is largely controlled by `editingId` now.
  const [input, setInput] = useState('');
  // State to control the visibility of the HashtagEntriesModal.
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);
  // State to store the currently selected hashtag for the modal.
  const [selectedHashtag, setSelectedHashtag] = useState(null);

  // useEffect hook to update the input field when `editingId` changes.
  // If an `editingId` is provided, it finds the corresponding entry and populates the input field.
  // If `editingId` is null (e.g., after saving or for a new entry), it clears the input field.
  useEffect(() => {
    if (editingId) {
      const entry = entries.find(e => e.id === editingId);
      if (entry) {
        setInput(entry.text); // Populate input with text of entry being edited.
      } else {
        setInput(''); // Clear input if entry not found (should ideally not happen).
        console.warn(`[DockChat] Entry with id "${editingId}" not found for editing.`);
      }
    } else {
      setInput(''); // Clear input if no entry is being edited (new entry mode).
    }
  }, [editingId, entries]); // Dependencies: re-run when editingId or the entries list changes.

  // Handles saving a new entry or updating an existing one.
  // This function is passed to DiaryInput component.
  const handleSave = async (text) => {
    if (!text.trim()) return; // Do nothing if text is empty or only whitespace.

    try {
      if (editingId) {
        // If editingId exists, update the existing entry (PUT request).
        await fetch(`/diary/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
      } else {
        // If no editingId, create a new entry (POST request).
        await fetch('/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
      }
      // After successful save, reset editingId in App.js to indicate completion of edit/creation.
      if (setEditingId) {
        setEditingId(null);
      }
      // The input field will be cleared by the useEffect hook above when editingId becomes null.
      await refreshEntries(); // Refresh all data to show the new/updated entry.
    } catch (err) {
      console.error('Failed to save entry:', err);
      // TODO: Add user-facing error message.
    }
  };

  // Handles form submission. Currently, DiaryInput's internal save (Ctrl+Enter, button) is preferred.
  // This function might be redundant if the <form> element itself doesn't trigger saves independently.
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevent default form submission (page reload).
    // The `input` state here might not be up-to-date if DiaryInput manages its own internal state
    // before calling onSave. This function might need to be removed or re-thought if direct
    // form submission (e.g., pressing Enter in a hypothetical other field) is required.
    // await handleSave(input); // This would use the potentially stale `input` state of DockChat.
  };

  // Handles clicks on hashtag buttons. Sets the selected hashtag and opens the modal.
  const handleHashtagButtonClick = (tag) => {
    setSelectedHashtag(tag);
    setIsHashtagModalOpen(true);
  };

  const handleHashtagOpen = (tag) => {
    handleHashtagButtonClick(tag);
  };

  const handleHashtagDelete = async (tag) => {
    try {
      await fetch(`/diary/hashtags/${tag}`, {
        method: 'DELETE',
      });
      await refreshEntries();
    } catch (err) {
      console.error('Failed to delete hashtag:', err);
    }
  };

  // Styling for the top margin of the form.
  const formMarginTop = "mt-4";

  return (
    // Main container for the DockChat view.
    <main className="relative">
      {/* Content wrapper with padding, border, and centered items. */}
      <div
        className="p-4 border-l-[1px] border-zinc-700/60 transition-opacity duration-700 ease-in-out flex flex-col items-center"
        style={{ marginTop: '96px' }} // Fixed top margin.
      >
        {/* Placeholder div, was potentially for other buttons or elements. */}
        <div className="flex gap-2 mb-4">
        </div>

        {/* Displays clickable hashtag buttons. */}
        <HashtagButtons
          hashtags={hashtags}
          onHashtagClick={handleHashtagButtonClick}
          onHashtagDelete={handleHashtagDelete}
          onHashtagOpen={handleHashtagOpen}
        />

        {/* Form element containing the diary input. onSubmit might be vestigial. */}
        <form onSubmit={handleSubmit} className={`flex flex-col gap-2 ${formMarginTop}`}>
          {/* DiaryInput component for text entry and save/chat actions. */}
          <DiaryInput
            onSave={handleSave} // Pass the save handler.
            initialText={input} // Controlled by editingId effect; DiaryInput might need to sync with this.
            clearOnSave={true}  // DiaryInput should clear its internal state on save.
            onChatWithLune={() => setShowChat(true)} // Pass function to open Lune chat modal.
          />
        </form>

        {/* Modal for displaying entries filtered by a selected hashtag. */}
        <HashtagEntriesModal
          isOpen={isHashtagModalOpen}
          onClose={() => setIsHashtagModalOpen(false)}
          hashtag={selectedHashtag}
          entries={entries} // Pass all entries to be filtered within the modal.
          onSelectEntry={(entryId) => {
            // When an entry is selected from the modal, set it as the current editingId.
            if (setEditingId) setEditingId(entryId);
            setIsHashtagModalOpen(false); // Close the modal.
          }}
        />
        {/* Button to navigate to the EntriesPage. */}
        <GoToEntriesButton />
      </div>
    </main>
  );
}

// PropTypes for type checking the props passed to DockChat.
DockChat.propTypes = {
  entries: PropTypes.array.isRequired, // Must be an array.
  hashtags: PropTypes.arrayOf(PropTypes.string).isRequired, // Must be an array of strings.
  refreshEntries: PropTypes.func.isRequired, // Must be a function.
  editingId: PropTypes.any, // Can be null, string, or number (depending on ID type).
  setEditingId: PropTypes.func, // Function to set editing ID.
  setShowChat: PropTypes.func.isRequired, // Function to control chat modal visibility.
};
