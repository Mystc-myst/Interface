import React, { useState, useEffect } from 'react';
import PrimaryButton from './ui/PrimaryButton';
import BackToChatButton from './ui/BackToChatButton';
import FoldersRibbon from './FoldersRibbon';
import DiaryFeed from './DiaryFeed';
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts'; // Adjusted path
import './EntriesPage.css'; // For page-specific styles like slide animation

// Assuming App.js passes these props, or they are fetched here
const EntriesPage = ({ entries, folders, refreshEntries, refreshFolders, startEdit, setFolders }) => {
  const [isSlidingOut, setIsSlidingOut] = useState(false);

  // Initialize keyboard shortcuts
  useKeyboardShortcuts({
    n: 'add-folder-button', // ID for the "Add Folder +" button
    b: 'back-to-chat-button', // ID for the "Back to Chat" button
  });

  const handleAddFolder = () => {
    // Placeholder: In a real app, this would likely open a modal or inline form
    const newFolderName = prompt('Enter new folder name:');
    if (newFolderName) {
      // Simulate adding a folder and refreshing
      // This logic would ideally involve an API call and then refreshing folders state
      const newFolder = {
        id: `temp-${Date.now()}`,
        name: newFolderName,
        count: 0
      };
      if (setFolders) { // Check if setFolders prop is passed from App.js
         setFolders(prev => [...(prev || []), newFolder]);
      } else {
        // Fallback if setFolders is not available (e.g. if FoldersRibbon manages its own state fully)
        console.log('Folder added (simulated):', newFolder);
      }
      // if (refreshFolders) refreshFolders();
    }
  };

  const handleEntryCardClick = (entryId) => {
    console.log(`Entry card ${entryId} clicked, preparing to slide out.`);
    setIsSlidingOut(true);
    // Actual navigation and view change would happen after the animation.
    // The 300ms slide is a visual effect before routing.
    setTimeout(() => {
      // In a real app, you'd use your router here.
      // For example, history.push(`/entries/${entryId}`);
      alert(`Navigating to entry ${entryId}... (after slide)`);
      // Reset slide state if user navigates back or for next interaction
      // This might be handled differently depending on routing setup.
      // For now, this just simulates the visual part.
      // setIsSlidingOut(false); // This would be reset when the new page/view loads

      // For now, just use window.location.href as in DiaryFeed, but without the internal timeout
      window.location.href = `/entries/${entryId}`;
    }, 300); // Corresponds to slide animation duration
  };

  const handleBackToChat = () => {
    // Navigate to chat page, potentially with a slide-left animation if desired
    alert('Navigating back to chat...');
    window.location.href = '/chat'; // Example navigation
  };


  // Dummy data if not provided by props (for standalone testing or if App.js doesn't pass them yet)
  const currentEntries = entries || [
    { id: 'e1', title: 'My First Entry', snippet: 'Details here...', date: 'Today' },
    { id: 'e2', title: 'Another Day', snippet: 'More details...', date: 'Yesterday' },
  ];
  const currentFolders = folders || [
    { id: 'f1', name: 'All', count: 2 },
    { id: 'f2', name: 'Work', count: 1 },
  ];


  return (
    <div className={`entries-page-wrapper ${isSlidingOut ? 'slide-out-active' : ''}`}>
      <header className="entries-page-header">
        <h1>Entries</h1>
        <PrimaryButton id="add-folder-button" onClick={handleAddFolder}>
          Add Folder +
        </PrimaryButton>
      </header>

      <FoldersRibbon
        // folders={currentFolders} // FoldersRibbon uses its own placeholder data for now
        onSelectFolder={(folderId) => console.log(`Folder ${folderId} selected in page`)}
        // onRenameFolder, onDeleteFolder can be wired up here if needed
      />

      <main className="entries-page-main-content">
        <DiaryFeed
          entries={currentEntries}
          onEntryClick={handleEntryCardClick} // Use the page-level handler for slide effect
          // onEntryDelete is handled by EntryCard directly via keyboard,
          // but DiaryFeed also has a handler if needed for other triggers.
        />
      </main>

      <BackToChatButton id="back-to-chat-button" onClick={handleBackToChat} />
    </div>
  );
};

export default EntriesPage;
