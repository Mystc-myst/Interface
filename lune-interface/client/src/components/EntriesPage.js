import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import Folder from './Folder';
import EntryCard from './ui/EntryCard'; // Import EntryCard
import BackToChatButton from './ui/BackToChatButton'; // Import the new button
import './EntriesPage.css'; // Import specific styles for EntriesPage if any are still needed (e.g., layout)

export default function EntriesPage({ entries, folders, refreshEntries, refreshFolders, startEdit }) {
  const navigate = useNavigate();

  const handleBackToChat = () => {
    navigate('/chat');
  };

  // handleDelete is now passed to EntryCard, which calls it with entryId
  const handleDeleteEntry = async (id) => {
    // Confirmation can be handled inside EntryCard's menu, or here.
    // For consistency with FolderViewPage, let's assume menu action is sufficient,
    // or add window.confirm if a global behavior is desired.
    // The original EntriesPage had window.confirm, so let's keep it for now.
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await fetch(`/diary/${id}`, { method: 'DELETE' });
      await refreshEntries(); // Refresh all data
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert(`Error: ${error.message}`);
    }
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
        if (refreshFolders) {
          await refreshFolders();
        } else if (refreshEntries) {
          await refreshEntries();
        }
      } catch (error) {
        console.error('Error adding folder:', error);
        alert(`Error: ${error.message}`);
      }
    }
  };

  const handleDropEntryIntoFolder = useCallback(async (folderId, entryId) => {
    // const entry = entries.find(e => e.id === entryId); // Not strictly needed if backend handles it
    // if (!entry) return;
    try {
      const response = await fetch(`/diary/${entryId}/folder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folderId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move entry to folder');
      }
      await refreshEntries();
    } catch (error) {
      console.error('Error moving entry to folder:', error);
      alert(`Error: ${error.message}`);
    }
  }, [refreshEntries]); // Removed 'entries' from deps as it's not used directly

  const handleDragStartEntry = (e, entryId) => {
    e.dataTransfer.setData('text/plain', entryId);
  };

  const unfiledEntries = entries.filter(entry => !entry.folderId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort newest first for consistency

  return (
    <main className="entries-page-main"> {/* Use a class for page-level styling */}
      <div className="entries-page-content"> {/* Wrapper for padding and animation */}
        <div className="entries-page-header">
          <h1 className="entries-page-title">Entries</h1>
          <button
            onClick={handleAddFolder}
            className="entries-page-add-folder-button"
          >
            Add Folder +
          </button>
        </div>

        {/* Folders Section */}
        {folders.length > 0 && (
          <div className="entries-page-folders-section">
            <h2 className="entries-page-section-title">Folders</h2>
            <div className="entries-page-folders-grid">
              {folders.map(folder => (
                <Folder
                  key={folder.id}
                  folder={{
                    ...folder,
                    entries: folder.entries,
                  }}
                  onDropEntry={handleDropEntryIntoFolder}
                />
              ))}
            </div>
          </div>
        )}

        {/* Unfiled Entries Section - Now uses EntryCard */}
        {/* The container for EntryCards should manage their layout, e.g., vertical spacing */}
        <div className="entries-list-container" role="list"> {/* Added role="list" for accessibility */}
          {unfiledEntries.map(entry => (
            <div
              key={entry.id} // Key for React list
              draggable // Keep draggable functionality if needed for folders
              onDragStart={(e) => handleDragStartEntry(e, entry.id)}
              // The EntryCard itself will handle its styling and click.
              // The draggable div is a wrapper here.
              // Consider if draggable should be on the EntryCard itself or a wrapper.
              // For now, keeping wrapper for drag, EntryCard for content/interaction.
            >
              <EntryCard
                id={entry.id}
                // Generate a title if entry.title doesn't exist. Assume entry.text is primary content.
                title={entry.title || entry.text.substring(0, 50) + (entry.text.length > 50 ? '...' : '')}
                snippet={entry.text} // Or a more sophisticated snippet generation
                date={new Date(entry.timestamp).toLocaleString()}
                onClick={() => { startEdit(entry.id); navigate('/chat'); }}
                onDeleteRequest={handleDeleteEntry} // Pass the delete handler
                // onRemoveFromFolderRequest is not applicable for unfiled entries
                // isHighlighted, onSetHighlight could be added for keyboard navigation consistency
              />
            </div>
          ))}
          {entries.length === 0 && <div className="entries-page-empty-message">Every echo has found its nest.</div>}
          {entries.length > 0 && unfiledEntries.length === 0 && folders.length > 0 && (
            <div className="entries-page-empty-message">This space awaits a new ripple.</div>
          )}
           {entries.length > 0 && unfiledEntries.length === 0 && folders.length === 0 && (
            <div className="entries-page-empty-message">This space awaits a new ripple.</div>
          )}
        </div>
        {/* Replace the old button with the new BackToChatButton component */}
        <BackToChatButton id="entries-page-back-to-chat" onClick={handleBackToChat} />
      </div>
    </main>
  );
}

EntriesPage.propTypes = {
  entries: PropTypes.array.isRequired,
  folders: PropTypes.array.isRequired,
  refreshEntries: PropTypes.func.isRequired,
  refreshFolders: PropTypes.func.isRequired,
  startEdit: PropTypes.func.isRequired,
};
