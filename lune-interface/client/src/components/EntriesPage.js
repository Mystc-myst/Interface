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
    <div className="p-4">
      <h1 className="text-lunePurple text-3xl font-bold mb-4 text-center">Entries</h1>
      <div className="space-y-4 mb-4 max-h-[70vh] overflow-y-auto">
        {entries.map(entry => (
          <div
            key={entry.id}
            className="bg-white p-3 rounded shadow cursor-pointer"
            onClick={() => { startEdit(entry.id); navigate('/chat'); }}
          >
            <div className="text-xs text-luneDarkGray">{new Date(entry.timestamp).toLocaleString()}</div>
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
