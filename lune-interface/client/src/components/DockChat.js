import React, { useState, useEffect } from 'react'; // Removed useRef
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
// LuneChatModal is now imported in App.js
import HashtagButtons from './HashtagButtons';
import HashtagEntriesModal from './HashtagEntriesModal'; // Import HashtagEntriesModal
import DiaryInput from "./DiaryInput"; // Back to relative path

export default function DockChat({ entries, hashtags, refreshEntries, editingId, setEditingId }) {
  const [input, setInput] = useState(''); // This state will be managed by DiaryInput, but handleSubmit logic relies on it. Consider refactoring.
  const [editing, setEditing] = useState(null);
  // const [showChat, setShowChat] = useState(false); // Moved to App.js
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false); // State for hashtag modal
  const [selectedHashtag, setSelectedHashtag] = useState(null); // State for selected hashtag
  const navigate = useNavigate();

  useEffect(() => {
    const id = editingId ?? editing;
    if (id) {
      const entry = entries.find(e => e.id === id);
      setInput(entry ? entry.text : '');
      setEditing(id);
      if (setEditingId) setEditingId(null);
    }
  }, [editingId, editing, entries, setEditingId]);

  const handleSave = async (text) => {
    if (!text.trim()) return;
    try {
      if (editing) {
        await fetch(`/diary/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
      } else {
        await fetch('/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
      }
      // setInput(''); // DiaryInput will clear its own text if needed, or we can pass a prop to clear it
      setEditing(null); // Reset editing state
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
      <div className="p-4 border-l-[1px] border-zinc-700/60 transition-opacity duration-700 ease-in-out opacity-0 animate-fadeIn">
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
        <button onClick={() => navigate('/entries')} className="mt-4 text-lunePurple underline">Go to Entries</button>
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
