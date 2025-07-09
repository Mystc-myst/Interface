// Import React hooks, PropTypes, and routing utilities.
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate, Link } from 'react-router-dom';
// Import CSS module for component-specific styling.
import styles from './FolderViewPage.module.css';
// Import UI component for displaying entries.
import EntryCard from './ui/EntryCard';

// FolderViewPage component: Displays entries contained within a specific folder.
// Allows users to manage these entries (delete, remove from folder, edit).
export default function FolderViewPage({
  allEntries,     // Array of all diary entries in the application.
  allFolders,     // Array of all folders in the application.
  startEdit,      // Function to initiate editing an entry (navigates to chat view).
  refreshEntries  // Function to refresh all entry data.
}) {
  const { folderId } = useParams(); // Hook to get URL parameters, specifically the folderId.
  const navigate = useNavigate();   // Hook for programmatic navigation.

  // State for the current folder being viewed.
  const [currentFolder, setCurrentFolder] = useState(null);
  // State for the list of entries that belong to the current folder.
  const [entriesInFolder, setEntriesInFolder] = useState([]);

  // useEffect hook to find the current folder and filter its entries when component mounts or dependencies change.
  useEffect(() => {
    if (allFolders && allEntries && folderId) {
      // Find the folder object from allFolders array using folderId from URL.
      const folder = allFolders.find(f => f.id === folderId);
      if (folder) {
        setCurrentFolder(folder); // Set the found folder as current.
        // Filter allEntries to get only those belonging to the current folder.
        // Sort these entries by timestamp, newest first.
        const filteredEntries = allEntries.filter(entry => entry.folderId === folderId)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setEntriesInFolder(filteredEntries); // Update state with the filtered and sorted entries.
      } else {
        // If folder is not found, log a warning and navigate back to the main entries page.
        console.warn(`Folder with ID ${folderId} not found.`);
        navigate('/entries');
      }
    }
  }, [folderId, allEntries, allFolders, navigate]); // Dependencies: re-run if any of these change.

  // Handles the permanent deletion of a diary entry.
  const handleDeleteEntry = async (entryId) => {
    if (!window.confirm('Are you sure you want to delete this entry permanently?')) return;
    try {
      await fetch(`/diary/${entryId}`, { method: 'DELETE' }); // API call to delete.
      if (refreshEntries) {
          await refreshEntries(); // Refresh data to reflect deletion.
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert(`Error deleting entry: ${error.message}`); // User-facing error.
    }
  };

  // Handles removing an entry from the current folder (sets its folderId to null).
  const handleRemoveEntryFromFolder = async (entryId) => {
    if (!window.confirm('Are you sure you want to remove this entry from the folder?')) return;
    try {
      const response = await fetch(`/diary/${entryId}/folder`, { // API call to update folderId.
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: null }), // Set folderId to null.
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove entry from folder');
      }
      if (refreshEntries) {
        await refreshEntries(); // Refresh data; the entry will no longer appear in this folder.
      }
    } catch (error) {
      console.error('Error removing entry from folder:', error);
      alert(`Error removing entry from folder: ${error.message}`); // User-facing error.
    }
  };

  // Display a loading message or "not found" if the currentFolder is not yet determined.
  if (!currentFolder) {
    return <div className="p-4 text-center text-moon-mist">Loading folder details or folder not found...</div>;
  }

  // Main render method for the component.
  return (
    // Uses CSS module class for the main page wrapper.
    <main className={styles.pageWrapper}>
      {/* Sticky header containing the back button. */}
      <div className={`${styles.stickyHeader} flex justify-between items-center px-4 sm:px-6 lg:px-8`}>
        {/* Link component for navigation back to the main entries page. */}
        <Link
          to="/entries"
          className={styles.backButton}
          aria-label="Back to all entries"
        >
          <span className={styles.backButtonIcon} aria-hidden="true">←</span>
          <span>Back to All Entries</span>
        </Link>
      </div>

      {/* Content wrapper that will scroll if content overflows. */}
      <div className={styles.contentWrapper}>
        {/* Display the name of the current folder as a title. */}
        <h1
          className="text-moon-mist mb-6 text-center"
          style={{ fontSize: 'clamp(2.0rem, 8vw, 3.2rem)', fontWeight: 600 }}
        >
          Folder: {currentFolder.name}
        </h1>

        {/* List container for entry cards. Accessibility: role="list". */}
        <div className="space-y-3" role="list">
          {entriesInFolder.length > 0 ? (
            // If there are entries in the folder, map over them and render an EntryCard for each.
            entriesInFolder.map(entry => (
              <EntryCard
                key={entry.id}
                id={entry.id}
                // Generate a simple title from entry text if no explicit title.
                title={entry.text.substring(0, 50) + (entry.text.length > 50 ? '...' : '')}
                snippet={entry.text} // Using full text as snippet.
                date={new Date(entry.timestamp).toLocaleString()} // Format timestamp.
                // Clicking an entry initiates editing and navigates to chat view.
                onClick={() => { startEdit(entry.id); navigate('/chat'); }}
                onDeleteRequest={handleDeleteEntry} // Pass delete handler.
                onRemoveFromFolderRequest={handleRemoveEntryFromFolder} // Pass remove from folder handler.
                // Props for keyboard navigation highlighting (optional, currently commented out).
                // isHighlighted={entry.id === highlightedEntryId}
                // onSetHighlight={setHighlightedEntryId}
              />
            ))
          ) : (
            // If the folder is empty, display a message.
            <div className="text-center text-moon-mist/70 p-5">This folder is empty.</div>
          )}
        </div>
      </div>
    </main>
  );
}

// PropTypes for type-checking the props passed to FolderViewPage.
FolderViewPage.propTypes = {
  allEntries: PropTypes.array.isRequired,     // Must be an array.
  allFolders: PropTypes.array.isRequired,     // Must be an array.
  startEdit: PropTypes.func.isRequired,       // Must be a function.
  refreshEntries: PropTypes.func,             // Function, optional (but recommended).
};
