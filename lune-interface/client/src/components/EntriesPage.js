import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function EntriesPage({ entries, refreshEntries, startEdit }) {
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    await fetch(`/diary/${id}`, { method: 'DELETE' });
    await refreshEntries();
  };

  return (
    <div className="p-4 transition-opacity duration-700 ease-in-out opacity-0 animate-fadeIn">
      <h1 className="text-lunePurple text-3xl font-bold mb-4 text-center font-literata">Entries</h1>
      <div className="space-y-4 mb-4 max-h-[70vh] overflow-y-auto ring-1 ring-slate-800 shadow-inner bg-[#0d0d0f]">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="rounded-xl bg-gradient-to-b from-slate-800/30 to-slate-900/60 p-4 shadow-md backdrop-blur-md cursor-pointer hover:shadow-[0_0_12px_#fcd34d80] hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-500 ease-in-out"
            onClick={() => { startEdit(entry.id); navigate('/chat'); }}
          >
            <div className="text-xs text-slate-400 italic tracking-wide font-ibmPlexMono uppercase">{new Date(entry.timestamp).toLocaleString()}</div>
            <div className="whitespace-pre-wrap mb-2">{entry.text}</div>
            {entry.agent_logs?.Lune && (
              <div className="mb-2 p-2 bg-luneGray rounded">
                <span className="font-semibold">Lune:</span> {entry.agent_logs.Lune.reflection}
              </div>
            )}
            <button
              onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
              className="text-sm text-red-600"
            >
              Delete
            </button>
          </div>
        ))}
        {entries.length === 0 && <div className="text-center text-luneDarkGray">No entries.</div>}
      </div>
      <button onClick={() => navigate('/chat')} className="text-lunePurple underline">Back to Chat</button>
    </div>
  );
}
