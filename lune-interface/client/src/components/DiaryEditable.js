import React, { useState, useEffect } from 'react';

function DiaryEditable({ entry, onSave }) {
  const [text, setText] = useState('');

  // Load content when entry changes
  useEffect(() => {
    setText(entry && entry.text ? entry.text : '');
  }, [entry]);

  // Guard for no entry selected
  if (!entry) {
    return (
      <div className="text-center text-luneDarkGray mt-10">
        Select or add an entry to view/edit.
      </div>
    );
  }

  // Handle form submit (save new or updated entry)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      if (entry._id) {
        await fetch(`/diary/${entry._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      } else {
        await fetch('/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      }
      setText('');
      onSave && onSave();
    } catch (err) {
      console.error('Failed to save entry:', err);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        id="diary-text"
        name="text"
        className="w-full border rounded p-2 mb-2 min-h-[120px]"
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Write your thoughts..."
        required
      />
      <button
        className="bg-lunePurple text-white px-4 py-2 rounded self-end"
        type="submit"
      >
        Save Entry
      </button>
    </form>
  );
}

export default DiaryEditable;
