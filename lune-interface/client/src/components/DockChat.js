import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function DockChat({ entries, refreshEntries, editingId, setEditingId }) {
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState(null);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    try {
      if (editing) {
        await fetch(`/diary/${editing}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input })
        });
      } else {
        await fetch('/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: input })
        });
      }
      setInput('');
      setEditing(null);
      await refreshEntries();
    } catch (err) {
      console.error('Failed to save entry', err);
    }
  };

  const startEdit = (id) => setEditing(id);

  return (
    <div className="p-4">
      <h1 className="text-lunePurple text-3xl font-bold mb-4 text-center">Dock Chat</h1>
      <div className="space-y-4 mb-4 max-h-[70vh] overflow-y-auto">
        {entries.slice().sort((a,b) => new Date(a.timestamp) - new Date(b.timestamp)).map(entry => (
          <div key={entry.id} className="bg-white p-3 rounded shadow">
            <div className="text-xs text-luneDarkGray">{new Date(entry.timestamp).toLocaleString()}</div>
            <div className="whitespace-pre-wrap">{entry.text}</div>
            {entry.agent_logs?.Lune && (
              <div className="mt-2 p-2 bg-luneGray rounded">
                <span className="font-semibold">Lune:</span> {entry.agent_logs.Lune.reflection}
              </div>
            )}
            <button onClick={() => startEdit(entry.id)} className="text-sm text-lunePurple mt-1">Edit</button>
          </div>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          className="flex-1 border rounded p-2"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Write your thoughts..."
        />
        <button type="submit" className="bg-luneGreen text-white px-4 py-2 rounded">{editing ? 'Update' : 'Add'}</button>
      </form>
      <button onClick={() => navigate('/entries')} className="mt-4 text-lunePurple underline">Go to Entries</button>
    </div>
  );
}
