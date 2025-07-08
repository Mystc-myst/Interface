import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useParams, useNavigate, Link } from 'react-router-dom';
import styles from './FolderViewPage.module.css'; // Import CSS module
import EntryCard from './ui/EntryCard'; // Import EntryCard

export default function FolderViewPage({ allEntries, allFolders, startEdit, refreshEntries }) {
  const { folderId } = useParams();
  const navigate = useNavigate();
  const [currentFolder, setCurrentFolder] = useState(null);
  const [entriesInFolder, setEntriesInFolder] = useState([]);
  // State for highlighted card for keyboard navigation (optional for this page, but good for consistency)
  // const [highlightedEntryId, setHighlightedEntryId] = useState(null);


  useEffect(() => {
    if (allFolders && allEntries && folderId) {
      const folder = allFolders.find(f => f.id === folderId);
      if (folder) {
        setCurrentFolder(folder);
        const filteredEntries = allEntries.filter(entry => entry.folderId === folderId)
          .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); // Sort newest first
        setEntriesInFolder(filteredEntries);
      } else {
        console.warn(`Folder with ID ${folderId} not found.`);
        navigate('/entries');
      }
    }
  }, [folderId, allEntries, allFolders, navigate]);

  const handleDeleteEntry = async (entryId) => {
    // Confirmation can be handled within EntryCard or here.
    // For now, let's assume EntryCard's menu click is the confirmation for this action.
    // Or, we can add window.confirm back if preferred for these actions.
    if (!window.confirm('Are you sure you want to delete this entry permanently?')) return;
    try {
      await fetch(`/diary/${entryId}`, { method: 'DELETE' });
      if (refreshEntries) {
          await refreshEntries();
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleRemoveEntryFromFolder = async (entryId) => {
    if (!window.confirm('Are you sure you want to remove this entry from the folder?')) return;
    try {
      const response = await fetch(`/diary/${entryId}/folder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ folderId: null }), // Set folderId to null to remove
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to remove entry from folder');
      }
      if (refreshEntries) {
        await refreshEntries(); // This will re-filter entries for the current folder
      }
    } catch (error) {
      console.error('Error removing entry from folder:', error);
      alert(`Error: ${error.message}`);
    }
  };

  if (!currentFolder) {
    return <div className="p-4 text-center text-moon-mist">Loading folder details or folder not found...</div>;
  }

  return (
    <main className={styles.pageWrapper}>
      <div className={`${styles.stickyHeader} flex justify-between items-center px-4 sm:px-6 lg:px-8`}>
        <Link
          to="/entries"
          className={styles.backButton}
          aria-label="Back to all entries"
        >
          <span className={styles.backButtonIcon} aria-hidden="true">←</span>
          <span>Back to All Entries</span>
        </Link>
      </div>

      {/* Apply contentWrapper style, this div will scroll */}
      <div className={styles.contentWrapper}> {/* p-4 and animate-fadeIn are now part of this class */}
        <h1
          className="text-moon-mist mb-6 text-center" // Ensure mb-6 is appropriate with new padding
          style={{ fontSize: 'clamp(2.0rem, 8vw, 3.2rem)', fontWeight: 600 }}
        >
          Folder: {currentFolder.name}
        </h1>

        {/* Entries List with role="list" */}
        <div className="space-y-3" role="list"> {/* space-y-3 for 12px vertical rhythm */}
          {entriesInFolder.length > 0 ? (
            entriesInFolder.map(entry => (
              <EntryCard
                key={entry.id}
                id={entry.id}
                title={entry.text.substring(0, 50) + (entry.text.length > 50 ? '...' : '')} // Simple title generation
                snippet={entry.text} // Full text as snippet for now, or implement proper snippet generation
                date={new Date(entry.timestamp).toLocaleString()}
                onClick={() => { startEdit(entry.id); navigate('/chat'); }}
                onDeleteRequest={handleDeleteEntry}
                onRemoveFromFolderRequest={handleRemoveEntryFromFolder}
                // isHighlighted={entry.id === highlightedEntryId} // Optional: for keyboard nav
                // onSetHighlight={setHighlightedEntryId}        // Optional: for keyboard nav
              />
            ))
          ) : (
            <div className="text-center text-moon-mist/70 p-5">This folder is empty.</div>
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
  refreshEntries: PropTypes.func,
};
