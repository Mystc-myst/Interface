import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Folder from './Folder'; // Import the Folder component

export default function EntriesPage({ entries, refreshEntries, startEdit }) {
  const navigate = useNavigate();
  const [folders, setFolders] = useState([]); // State for folders

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    await fetch(`/diary/${id}`, { method: 'DELETE' });
    await refreshEntries();
    // Also remove the entry from any folder it might be in
    setFolders(prevFolders => prevFolders.map(f => ({
      ...f,
      entries: f.entries.filter(entryId => entryId !== id)
    })));
  };

  const handleAddFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName) {
      const newFolder = {
        id: `folder-${Date.now()}`, // Simple unique ID
        name: folderName,
        entries: [],
      };
      setFolders(prevFolders => [...prevFolders, newFolder]);
    }
  };

  const handleDropEntryIntoFolder = useCallback((folderId, entryId) => {
    // Find the entry
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    setFolders(prevFolders => {
      // Remove entry from its old folder (if any)
      const updatedFolders = prevFolders.map(f => {
        if (f.entries.includes(entryId)) {
          return { ...f, entries: f.entries.filter(id => id !== entryId) };
        }
        return f;
      });

      // Add entry to the new folder
      return updatedFolders.map(f => {
        if (f.id === folderId) {
          // Avoid adding duplicates if it's somehow already there
          if (!f.entries.includes(entryId)) {
            return { ...f, entries: [...f.entries, entryId] };
          }
        }
        return f;
      });
    });
  }, [entries]); // `entries` is a dependency

  const handleDragStartEntry = (e, entryId) => {
    e.dataTransfer.setData('text/plain', entryId);
  };

  // Filter out entries that are already in folders
  const entriesInFolders = folders.reduce((acc, folder) => [...acc, ...folder.entries], []);
  const unfiledEntries = entries.filter(entry => !entriesInFolders.includes(entry.id));

  return (
    <div className="p-4 transition-opacity duration-700 ease-in-out opacity-0 animate-fadeIn">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-lunePurple text-3xl font-bold text-center font-literata">Entries</h1>
        <button
          onClick={handleAddFolder}
          className="bg-lunePurple text-white font-bold py-2 px-4 rounded-lg shadow-md hover:bg-lunePurple-dark transition-colors duration-300"
        >
          Add Folder +
        </button>
      </div>

      {/* Folders Section */}
      {folders.length > 0 && (
        <div className="mb-6">
          <h2 className="text-xl text-luneLightGray font-semibold mb-3 font-literata">Folders</h2>
          <div className="flex flex-wrap gap-4 p-2 bg-[#0d0d0f]/50 rounded-lg shadow-inner">
            {folders.map(folder => (
              <Folder
                key={folder.id}
                folder={{
                  ...folder,
                  // Pass the actual entry objects to Folder if needed for display, or just IDs
                  // For now, Folder component uses entry count for color, so IDs are enough.
                  entries: folder.entries // folder.entries are IDs, Folder component expects this
                }}
                onDropEntry={handleDropEntryIntoFolder}
              />
            ))}
          </div>
        </div>
      )}

      {/* Entries Section */}
      <div className="space-y-4 mb-4 max-h-[70vh] overflow-y-auto ring-1 ring-slate-800 shadow-inner bg-[#0d0d0f]">
        {unfiledEntries.map(entry => (
          <div
            key={entry.id}
            draggable // Make entries draggable
            onDragStart={(e) => handleDragStartEntry(e, entry.id)}
            className="rounded-xl bg-gradient-to-b from-slate-800/30 to-slate-900/60 p-4 shadow-md backdrop-blur-md cursor-grab hover:shadow-[0_0_12px_#fcd34d80] hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-500 ease-in-out"
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
        {entries.length > 0 && unfiledEntries.length === 0 && folders.length === 0 && <div className="text-center text-luneDarkGray">All entries are in folders.</div>}
      </div>
      <button onClick={() => navigate('/chat')} className="text-lunePurple underline">Back to Chat</button>
    </div>
  );
}

EntriesPage.propTypes = {
  entries: PropTypes.array.isRequired,
  refreshEntries: PropTypes.func.isRequired,
  startEdit: PropTypes.func.isRequired,
};
