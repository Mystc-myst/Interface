// Import React hooks, PropTypes, and navigation tools.
import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
// Import sub-components.
import Folder from './Folder'; // Component to display a single folder and its entries.
import EntryCard from './ui/EntryCard'; // UI component to display a single entry's summary.
// Import CSS for this page. Consider migrating to CSS Modules or Tailwind if not already.
import './EntriesPage.css';

// EntriesPage component: Displays all diary entries, organized by folders and unfiled.
// Allows users to manage entries and folders.
export default function EntriesPage({
  entries,          // Array of all diary entries.
  folders,          // Array of all folders.
  refreshEntries,   // Function to refresh all data (entries, folders, hashtags).
  refreshFolders,   // Function to specifically refresh folders data.
  startEdit,         // Function to set an entry's ID for editing (navigates to chat view).
  onTagClick
}) {
  const navigate = useNavigate(); // Hook for programmatic navigation.

  // Handles the deletion of a diary entry.
  // This function is passed to EntryCard, which calls it with the entryId.
  const handleDeleteEntry = async (id) => {
    // User confirmation before deleting.
    if (!window.confirm('Are you sure you want to delete this entry?')) return;
    try {
      await fetch(`/diary/${id}`, { method: 'DELETE' }); // API call to delete the entry.
      await refreshEntries(); // Refresh all data to reflect the deletion.
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert(`Error deleting entry: ${error.message}`); // User-facing error.
    }
  };

  // Handles adding a new folder.
  const handleAddFolder = async () => {
    const folderName = prompt('Enter folder name:'); // Get folder name from user.
    if (folderName && folderName.trim() !== '') {
      try {
        const response = await fetch('/diary/folders', { // API call to create a new folder.
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: folderName.trim() }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to create folder');
        }
        // Refresh folder list (or all data if only refreshEntries is available).
        if (refreshFolders) {
          await refreshFolders();
        } else if (refreshEntries) { // Fallback if specific folder refresh isn't provided.
          await refreshEntries();
        }
      } catch (error) {
        console.error('Error adding folder:', error);
        alert(`Error adding folder: ${error.message}`); // User-facing error.
      }
    }
  };

  // Handles dropping an entry into a folder (drag and drop functionality).
  // useCallback is used for performance, as this function is passed to Folder components.
  const handleDropEntryIntoFolder = useCallback(async (folderId, entryId) => {
    try {
      const response = await fetch(`/diary/${entryId}/folder`, { // API call to update entry's folderId.
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: folderId }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to move entry to folder');
      }
      await refreshEntries(); // Refresh data to show the entry in its new folder.
    } catch (error) {
      console.error('Error moving entry to folder:', error);
      alert(`Error moving entry: ${error.message}`); // User-facing error.
    }
  }, [refreshEntries]); // Dependency: refreshEntries function.

  // Sets the data for drag and drop when an entry drag starts.
  const handleDragStartEntry = (e, entryId) => {
    e.dataTransfer.setData('text/plain', entryId); // Set the dragged data to be the entry's ID.
  };

  // Filter out entries that are not assigned to any folder.
  // Sort them by timestamp, newest first.
  const unfiledEntries = entries.filter(entry => !entry.folderId)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return (
    // Main container for the entries page.
    <main className="entries-page-main">
      {/* Wrapper for content, likely for padding and animations. */}
      <div className="entries-page-content">
        {/* Header section with title and "Add Folder" button. */}
        <div className="entries-page-header">
          <h1 className="entries-page-title">Entries</h1>
          <button
            onClick={handleAddFolder}
            className="entries-page-add-folder-button"
          >
            Add Folder +
          </button>
        </div>

        {/* Section for displaying folders, only shown if there are folders. */}
        {folders.length > 0 && (
          <div className="entries-page-folders-section">
            <h2 className="entries-page-section-title">Folders</h2>
            {/* Grid layout for folders. */}
            <div className="entries-page-folders-grid">
              {folders.map(folder => (
                <Folder
                  key={folder.id}
                  folder={{ // Pass folder data, including its entries.
                    ...folder,
                    entries: folder.entries, // Assuming folder object comes with its entries pre-filtered or needs to be.
                                          // Or, Folder component might filter entries itself based on folder.id.
                  }}
                  onDropEntry={handleDropEntryIntoFolder} // Pass drop handler.
                />
              ))}
            </div>
          </div>
        )}

        {/* Section for displaying unfiled entries. */}
        {/* Uses EntryCard for each unfiled entry. */}
        <div className="entries-list-container" role="list"> {/* Accessibility: role="list". */}
          {unfiledEntries.map(entry => (
            // Each entry is wrapped in a draggable div.
            <div
              key={entry.id}
              draggable // Make the entry draggable.
              onDragStart={(e) => handleDragStartEntry(e, entry.id)}
            >
              <EntryCard
                id={entry.id}
                // Generate a simple title from the first 50 chars of text if no title exists.
                title={entry.title || entry.text.substring(0, 50) + (entry.text.length > 50 ? '...' : '')}
                snippet={entry.text} // Using full text as snippet; could be refined.
                date={new Date(entry.timestamp).toLocaleString()} // Format timestamp for display.
                tags={entry.tags}
                onTagClick={onTagClick}
                // Clicking an entry card initiates editing and navigates to chat view.
                onClick={() => { startEdit(entry.id); navigate('/chat'); }}
                onDeleteRequest={handleDeleteEntry} // Pass delete handler.
                // onRemoveFromFolderRequest is not applicable here as these are unfiled.
              />
            </div>
          ))}
          {/* Message displayed if there are no entries at all. */}
          {entries.length === 0 && <div className="entries-page-empty-message">Every echo has found its nest.</div>}
          {/* Message if all entries are filed and there are folders. */}
          {entries.length > 0 && unfiledEntries.length === 0 && folders.length > 0 && (
            <div className="entries-page-empty-message">This space awaits a new ripple.</div>
          )}
          {/* Message if all entries are filed but there are no folders (less likely scenario if folders are used). */}
           {entries.length > 0 && unfiledEntries.length === 0 && folders.length === 0 && (
            <div className="entries-page-empty-message">This space awaits a new ripple.</div>
          )}
        </div>
      </div>
    </main>
  );
}

// PropTypes for type-checking the props passed to EntriesPage.
EntriesPage.propTypes = {
  entries: PropTypes.array.isRequired,        // Must be an array.
  folders: PropTypes.array.isRequired,        // Must be an array.
  refreshEntries: PropTypes.func.isRequired,  // Must be a function.
  refreshFolders: PropTypes.func.isRequired,  // Must be a function.
  startEdit: PropTypes.func.isRequired,       // Must be a function.
  onTagClick: PropTypes.func.isRequired,
};
