import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
// LuneChatModal is now imported in App.js
import HashtagButtons from './HashtagButtons';
import HashtagEntriesModal from './HashtagEntriesModal'; // Import HashtagEntriesModal
import DiaryInput from "./DiaryInput"; // Back to relative path
import GoToEntriesButton from './ui/GoToEntriesButton'; // Import the new button

export default function DockChat({ entries, hashtags, refreshEntries, editingId, setEditingId }) {
  const [input, setInput] = useState('');
  // const [editing, setEditing] = useState(null); // Removed internal 'editing' state
  // const [showChat, setShowChat] = useState(false); // Moved to App.js
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false); // State for hashtag modal
  const [selectedHashtag, setSelectedHashtag] = useState(null); // State for selected hashtag
  const navigate = useNavigate();

  useEffect(() => {
    if (editingId) {
      const entry = entries.find(e => e.id === editingId);
      if (entry) {
        setInput(entry.text);
      } else {
        setInput(''); // Entry not found with editingId, clear input
        console.warn(`[DockChat] Entry with id "${editingId}" not found.`);
      }
    } else {
      setInput(''); // No editingId, so clear input (e.g., after save or new session)
    }
  }, [editingId, entries]); // Removed 'setEditingId' and internal 'editing' from dependencies

  const handleSave = async (text) => {
    if (!text.trim()) return;
    try {
      if (editingId) { // Use editingId prop to determine if updating existing entry
        await fetch(`/diary/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
      } else { // No editingId means it's a new entry
        await fetch('/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
      }
      // After successful save, reset editingId in App.js
      if (setEditingId) {
        setEditingId(null);
      }
      // input state will be cleared by the useEffect when editingId becomes null
      await refreshEntries();
    } catch (err) {
      console.error('Failed to save entry', err);
    }
  };

  // This function is kept to preserve the form's onSubmit behavior if needed,
  // but DiaryInput's internal save logic (Ctrl+Enter, button) will use handleSave directly.
  const handleSubmit = async (e) => {
    e.preventDefault();
    // This 'input' state is currently not updated by DiaryInput.
    // For direct form submission (e.g. if user presses Enter in a different form field if one existed),
    // we might need to get the text from DiaryInput, perhaps via a ref or by lifting state further.
    // However, the primary interaction is through DiaryInput's own save mechanisms.
    // For now, let's assume handleSave is the main path.
    // If direct form submission needs to work with DiaryInput's text, this needs more thought.
    // Consider removing this if DiaryInput is the sole way to submit.
    // await handleSave(input); // This `input` is the old state variable
  };

  const handleHashtagButtonClick = (tag) => {
    setSelectedHashtag(tag);
    setIsHashtagModalOpen(true);
  };

  // const startEdit = (id) => setEditing(id);

  // Calculate margin for the form based on whether hashtags are present
  const formMarginTop = (hashtags && hashtags.length > 0) ? "mt-16" : "mt-20"; // mt-16 (4rem) if hashtags, mt-20 (5rem) if not. h1 has mb-4. HashtagButtons div has mb-4. Total mt-24 from h1.

  return (
    <main className="relative">
      {/* Removed opacity-0 and animate-fadeIn from the div below */}
      <div className="p-4 border-l-[1px] border-zinc-700/60 transition-opacity duration-700 ease-in-out">
        <h1 className="text-lunePurple text-3xl font-bold mb-4 text-center font-literata font-light">Lune Diary.</h1>
        <div className="flex gap-2 mb-4">
        </div>
        {/* Hashtag Buttons Area */}
        <HashtagButtons hashtags={hashtags} onHashtagClick={handleHashtagButtonClick} />

        {/* The form tag is kept for structure but onSubmit might need adjustment if it's meant to trigger save from DiaryInput */}
        <form onSubmit={handleSubmit} className={`flex flex-col gap-2 ${formMarginTop}`}>
          <DiaryInput onSave={handleSave} initialText={input} clearOnSave={true} />
        </form>
        {/* The visual pulse line below the input might need reconsideration as DiaryInput has its own structure */}
        {/* {input.trim() && <div className="w-full h-[2px] bg-indigo-500/30 mt-1"></div>} */}
        {/* Removed old text button, new GoToEntriesButton will be added */}
        {/* LuneChatModal is now rendered in App.js */}
        <HashtagEntriesModal
          isOpen={isHashtagModalOpen}
          onClose={() => setIsHashtagModalOpen(false)}
          hashtag={selectedHashtag}
          entries={entries} // Pass all entries
          onSelectEntry={(entryId) => {
            if (setEditingId) setEditingId(entryId); // Ensure setEditingId is callable
            setIsHashtagModalOpen(false);
          }}
        />
        <GoToEntriesButton /> {/* Add the new button here */}
      </div>
    </main>
  );
}

DockChat.propTypes = {
  entries: PropTypes.array.isRequired,
  hashtags: PropTypes.arrayOf(PropTypes.string).isRequired,
  refreshEntries: PropTypes.func.isRequired,
  editingId: PropTypes.any, // Can be null or string
  setEditingId: PropTypes.func, // Can be undefined if not passed from a route that supports editing
};
