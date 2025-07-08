import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import LuneChatModal from './LuneChatModal';
import HashtagButtons from './HashtagButtons';
import HashtagEntriesModal from './HashtagEntriesModal'; // Import HashtagEntriesModal
import DiaryInput from "@/components/DiaryInput";

export default function DockChat({ entries, hashtags, refreshEntries, editingId, setEditingId }) {
  const [input, setInput] = useState(''); // This state will be managed by DiaryInput, but handleSubmit logic relies on it. Consider refactoring.
  const [editing, setEditing] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false); // State for hashtag modal
  const [selectedHashtag, setSelectedHashtag] = useState(null); // State for selected hashtag
  const fileInputRef = useRef(null);
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

  const handleUpload = async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data)) {
        for (const entry of data) {
          const bodyText = entry.text || entry.content;
          if (typeof bodyText === 'string') {
            await fetch('/diary', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ text: bodyText })
            });
          }
        }
        await refreshEntries();
      } else {
        alert('Invalid diary JSON.');
      }
    } catch (err) {
      alert('Failed to import diary: ' + err.message);
    }
    e.target.value = '';
  };

  const handleHashtagButtonClick = (tag) => {
    setSelectedHashtag(tag);
    setIsHashtagModalOpen(true);
  };

  // const startEdit = (id) => setEditing(id);

  return (
    <div className="p-4 bg-gradient-to-br from-slate-900 via-zinc-900 to-slate-950 border-l-[1px] border-zinc-700/60 transition-opacity duration-700 ease-in-out opacity-0 animate-fadeIn">
      <h1 className="text-lunePurple text-3xl font-bold mb-4 text-center font-literata">Lune Diary.</h1>
      <div className="flex gap-2 mb-4">
        <button
          type="button"
          onClick={() => setShowChat(true)}
          className="bg-lunePurple text-white px-4 py-2 rounded flex-1"
        >
          Chat with Lune
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current && fileInputRef.current.click()}
          className="bg-lunePurple text-white px-4 py-2 rounded flex-1"
        >
          Upload
        </button>
        <input
          type="file"
          accept="application/json"
          ref={fileInputRef}
          onChange={handleUpload}
          className="hidden"
        />
      </div>
      {/* Hashtag Buttons Area */}
      <HashtagButtons hashtags={hashtags} onHashtagClick={handleHashtagButtonClick} />

      {/* The form tag is kept for structure but onSubmit might need adjustment if it's meant to trigger save from DiaryInput */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <DiaryInput onSave={handleSave} initialText={input} clearOnSave={true} />
      </form>
      {/* The visual pulse line below the input might need reconsideration as DiaryInput has its own structure */}
      {/* {input.trim() && <div className="w-full h-[2px] bg-indigo-500/30 mt-1"></div>} */}
      <button onClick={() => navigate('/entries')} className="mt-4 text-lunePurple underline">Go to Entries</button>
      <LuneChatModal open={showChat} onClose={() => setShowChat(false)} />
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
  );
}

DockChat.propTypes = {
  entries: PropTypes.array.isRequired,
  hashtags: PropTypes.arrayOf(PropTypes.string).isRequired,
  refreshEntries: PropTypes.func.isRequired,
  editingId: PropTypes.any, // Can be null or string
  setEditingId: PropTypes.func, // Can be undefined if not passed from a route that supports editing
};
