// Import React hooks and PropTypes for type checking.
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { createEntry, updateEntry } from '../api/diaryApi';
// Import sub-components used within DockChat.
import TagSidebar from './TagSidebar';
import DiaryInput from "./DiaryInput"; // The main text input component for diary entries.

// DockChat is the main component for user interaction on the chat/input screen.
// It handles diary entry input, editing, saving, and tag interactions.
export default function DockChat({
  entries,
  tagIndex,
  onTagSelect,
  refreshEntries,
  editingId,
  setEditingId,
  setShowChat
}) {
  // Local state for the text input field.
  const [input, setInput] = useState('');

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
    if (!text.trim()) return false; // Do nothing if text is empty or only whitespace.

    try {
      if (editingId) {
        // If editingId exists, update the existing entry (PUT request).
        await updateEntry(editingId, { text });
      } else {
        // If no editingId, create a new entry (POST request).
        await createEntry({ text });
      }

      // After successful save, reset editingId in App.js to indicate completion of edit/creation.
      if (setEditingId) {
        setEditingId(null);
      }
      // The input field will be cleared by the useEffect hook above when editingId becomes null.
      await refreshEntries(); // Refresh all data to show the new/updated entry.
      return true;
    } catch (err) {
      console.error('Failed to save entry:', err);
      alert(`Failed to save entry: ${err.message}`);
      return false;
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
        <TagSidebar tagIndex={tagIndex} onSelect={onTagSelect} />

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
      </div>
    </main>
  );
}

// PropTypes for type checking the props passed to DockChat.
DockChat.propTypes = {
  entries: PropTypes.array.isRequired,
  tagIndex: PropTypes.object.isRequired,
  onTagSelect: PropTypes.func.isRequired,
  refreshEntries: PropTypes.func.isRequired,
  editingId: PropTypes.any,
  setEditingId: PropTypes.func,
  setShowChat: PropTypes.func.isRequired,
};
