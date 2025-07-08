import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate, Link } from 'react-router-dom';

export default function FolderViewPage({ allEntries, allFolders, startEdit, refreshEntries }) {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [currentFolder, setCurrentFolder] = useState(null);
  const [entriesInFolder, setEntriesInFolder] = useState([]);

  useEffect(() => {
    if (allFolders && allEntries && folderId) {
      const folder = allFolders.find(f => f.id === folderId);
      if (folder) {
        setCurrentFolder(folder);
        const filteredEntries = allEntries.filter(entry => entry.folderId === folderId)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort newest first
        setEntriesInFolder(filteredEntries);
      } else {
        // Folder not found, maybe navigate to a 404 page or back to entries
        console.warn(`Folder with ID ${folderId} not found.`);
        navigate('/entries'); // Or a dedicated 404 page
      }
    }
  }, [folderId, allEntries, allFolders, navigate]);

  const handleDelete = async (entryId) => {
    if (!window.confirm('Delete this entry?')) return;
    await fetch(`/diary/${entryId}`, { method: 'DELETE' });
    // Refresh entries at the App level or however refreshEntries is implemented
    if (refreshEntries) {
        await refreshEntries();
    }
    // No need to manually filter here if allEntries prop updates, useEffect will handle it.
  };

  const handleRemoveFromFolder = async (entryId) => {
    if (!window.confirm('Remove this entry from the folder?')) return;
    try {
      const response = await fetch(`/diary/${entryId}/folder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: null }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove entry from folder');
      }
      if (refreshEntries) {
        await refreshEntries();
      }
      // After refresh, the entry will no longer be in this folder, and UI will update.
    } catch (error) {
      console.error('Error removing entry from folder:', error);
      alert(`Error: ${error.message}`);
    }
  };

  if (!currentFolder) {
    // Could show a loading indicator or a "Folder not found" message
    return <div className="p-4 text-center">Loading folder details or folder not found...</div>;
  }

  return (
    <main className="relative">
      <div className="p-4 transition-opacity duration-700 ease-in-out opacity-0 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-lunePurple text-3xl font-bold font-literata font-light">
            Folder: {currentFolder.name}
        </h1>
        <Link to="/entries" className="text-lunePurple underline hover:text-luneGold">
          Back to All Entries
        </Link>
      </div>

      <div className="space-y-4 mb-4 max-h-[70vh] overflow-y-auto ring-1 ring-slate-800 shadow-inner bg-[#0d0d0f] no-scrollbar">
        {entriesInFolder.length > 0 ? (
          entriesInFolder.map(entry => (
            <div
              key={entry.id}
              className="frost rounded-xl p-4 shadow-md cursor-pointer hover:shadow-[0_0_12px_#fcd34d80] hover:scale-[1.02] focus:scale-[1.02] transition-transform duration-500 ease-in-out"
              onClick={() => { startEdit(entry.id); navigate('/chat'); }}
            >
              <div className="text-xs text-slate-300 italic tracking-wide font-ibmPlexMono uppercase">
                {new Date(entry.timestamp).toLocaleString()}
              </div>
              <div className="whitespace-pre-wrap mb-2">{entry.text}</div>
              {entry.agent_logs?.Lune && (
                <div className="mb-2 p-2 bg-luneGray rounded">
                  <span className="font-semibold">Lune:</span> {entry.agent_logs.Lune.reflection}
                </div>
              )}
              <div className="mt-2 flex space-x-2">
                <button
                  onClick={(e) => { e.stopPropagation(); handleRemoveFromFolder(entry.id); }}
                  className="text-sm text-luneGold hover:text-yellow-400 px-2 py-1 rounded hover:bg-slate-700/60 transition-colors"
                >
                  Remove from Folder
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                  className="text-sm text-red-500 hover:text-red-400 px-2 py-1 rounded hover:bg-slate-700/60 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center text-slate-300 p-5">This folder is empty.</div>
        )}
      </div>
      </div>
    </main>
  );
}

FolderViewPage.propTypes = {
  allEntries: PropTypes.array.isRequired,
  allFolders: PropTypes.array.isRequired,
  startEdit: PropTypes.func.isRequired,
  refreshEntries: PropTypes.func, // Optional, but good for consistency
};
