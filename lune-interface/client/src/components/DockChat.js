import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LuneChatModal from './LuneChatModal';

export default function DockChat({ entries, refreshEntries, editingId, setEditingId }) {
  const [input, setInput] = useState('');
  const [editing, setEditing] = useState(null);
  const [showChat, setShowChat] = useState(false);
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
      <form onSubmit={handleSubmit} className="flex gap-2">
        <textarea
          className={`flex-1 border rounded p-2 ring-1 ring-slate-800 shadow-inner bg-[#0d0d0f] text-[#f8f8f2] ${input.trim() ? 'animate-pulse' : ''}`}
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Write your thoughts..."
        />
        <button type="submit" className="bg-animusRed hover:bg-red-600 text-white px-4 py-2 rounded">{editing ? 'Update' : 'Add'}</button>
      </form>
      {input.trim() && <div className="w-full h-[2px] bg-indigo-500/30 mt-1"></div>}
      <button onClick={() => navigate('/entries')} className="mt-4 text-lunePurple underline">Go to Entries</button>
      <LuneChatModal open={showChat} onClose={() => setShowChat(false)} entries={entries} />
    </div>
  );
}
