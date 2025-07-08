import React, { useCallback } from 'react'; // Removed useState as folders are now props
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Folder from './Folder';

// Updated to use folders prop from App.js
export default function EntriesPage({ entries, folders, refreshEntries, refreshFolders, startEdit }) {
  const navigate = useNavigate();

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this entry?')) return;
    await fetch(`/diary/${id}`, { method: 'DELETE' });
    await refreshEntries(); // This will refresh both entries and folders from App.js
    // No need to manually update local folder state as it's now managed by App.js
  };

  const handleAddFolder = async () => {
    const folderName = prompt('Enter folder name:');
    if (folderName && folderName.trim() !== '') {
      try {
        const response = await fetch('/diary/folders', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: folderName.trim() }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create folder');
        }
        // const newFolder = await response.json(); // The new folder object from backend
        // Instead of setFolders directly, call refreshFolders to get the latest list from App.js
        if (refreshFolders) {
          await refreshFolders();
        } else if (refreshEntries) { // Fallback if only refreshEntries (which refreshes all) is available
          await refreshEntries();
        }
      } catch (error) {
        console.error('Error adding folder:', error);
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleDropEntryIntoFolder = useCallback(async (folderId, entryId) => {
    const entry = entries.find(e => e.id === entryId);
    if (!entry) return;

    // Optimistic UI update can be tricky here if relying on parent state.
    // Best to make API call then refresh.
    try {
      const response = await fetch(`/diary/${entryId}/folder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folderId }), // folderId can be null to unassign
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move entry to folder');
      }
      await refreshEntries(); // Refresh all data to reflect the change
    } catch (error) {
      console.error('Error moving entry to folder:', error);
      alert(`Error: ${error.message}`);
      // Optionally, revert optimistic update if one was made
    }
  }, [entries, refreshEntries]); // refreshEntries from App.js now refreshes both entries and folders

  const handleDragStartEntry = (e, entryId) => {
    e.dataTransfer.setData('text/plain', entryId);
  };

  // Calculate which entries are unfiled based on the `folderId` property of each entry
  const unfiledEntries = entries.filter(entry => !entry.folderId);

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
  folders: PropTypes.array.isRequired,
  refreshEntries: PropTypes.func.isRequired,
  refreshFolders: PropTypes.func.isRequired,
  startEdit: PropTypes.func.isRequired,
};
