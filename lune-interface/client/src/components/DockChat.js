import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom'; // For navigation
// LuneChatModal is now imported in App.js
// import HashtagButtons from './HashtagButtons'; // Old hashtag buttons, will be replaced by new module
import HashtagEntriesModal from './HashtagEntriesModal'; // Import HashtagEntriesModal
import DiaryInput from "./DiaryInput"; // Will be restyled
// import GoToEntriesButton from './ui/GoToEntriesButton'; // Removed, functionality now in new button stack

// Placeholder for new components, will be created in later steps
import ActionButtons from './ActionButtons';
import HashtagSuggestions from './HashtagSuggestions';

export default function DockChat({ entries, hashtags, refreshEntries, editingId, setEditingId }) {
  const [currentText, setCurrentText] = useState(''); // Renamed from 'input' for clarity with DiaryInput prop
  const [isHashtagModalOpen, setIsHashtagModalOpen] = useState(false);
  const [selectedHashtag, setSelectedHashtag] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (editingId) {
      const entry = entries.find(e => e.id === editingId);
      if (entry) {
        setCurrentText(entry.text);
      } else {
        setCurrentText('');
        console.warn(`[DockChat] Entry with id "${editingId}" not found.`);
      }
    } else {
      setCurrentText('');
    }
  }, [editingId, entries]);

  const handleSave = async (textToSave) => { // Accepts textToSave from DiaryInput or ActionButtons
    const text = typeof textToSave === 'string' ? textToSave : currentText; // Ensure we have text
    if (!text.trim()) return;
    try {
      if (editingId) {
        await fetch(`/diary/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
      } else {
        await fetch('/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text })
        });
      }
      if (setEditingId) {
        setEditingId(null); // This will trigger useEffect to clear currentText
      }
      await refreshEntries();
    } catch (err) {
      console.error('Failed to save entry', err);
    }
  };

  // const handleHashtagButtonClick = (tag) => { // Old hashtag button click
  //   setSelectedHashtag(tag);
  //   setIsHashtagModalOpen(true);
  // };

  // Placeholder for the new Internet button modal
  const openInternetModal = () => {
    console.log("Internet button clicked - openInternetModal placeholder");
    // Logic to open an internet-related modal would go here
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-transparent p-4 relative">
      {/* Header */}
      <h1
        className="font-playfair text-moonMist text-center fixed top-8 left-1/2 -translate-x-1/2"
        style={{ fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', letterSpacing: '-0.4px' }}
      >
        Lune Diary.
      </h1>

      {/* Main content area: Textarea and side buttons */}
      <div className="flex items-center relative">
        <ActionButtons
          onSave={() => handleSave(currentText)}
          navigate={navigate}
          openInternetModal={openInternetModal}
        />

        {/* Central Textarea (DiaryInput will be restyled in Step 3) */}
        {/* The form tag is removed as DiaryInput handles its own submission via onSave */}
        <DiaryInput
          onSave={handleSave}
          initialText={currentText}
          clearOnSave={true} // DiaryInput will clear its internal text, DockChat's currentText clears via useEffect
          setTextExternally={setCurrentText} // Allow DiaryInput to update DockChat's currentText
        />

        <HashtagSuggestions
          hashtags={hashtags} // Pass all hashtags, component will slice
          onHashtagClick={(tag) => {
            // Logic for when a hashtag chip is clicked
            // For now, let's reuse the existing modal logic
            setSelectedHashtag(tag);
            setIsHashtagModalOpen(true);
            console.log(`Hashtag chip clicked: ${tag}`);
          }}
        />
      </div>

      {/* Modal for showing entries by hashtag, triggered by HashtagSuggestions */}
      {isHashtagModalOpen && selectedHashtag && ( // Ensure modal only opens if both are true
        <HashtagEntriesModal
          isOpen={isHashtagModalOpen}
          onClose={() => {
            setIsHashtagModalOpen(false);
            setSelectedHashtag(null); // Clear selected hashtag when closing
          }}
          hashtag={selectedHashtag}
          entries={entries}
          onSelectEntry={(entryId) => {
            if (setEditingId) setEditingId(entryId); // Set entry for editing
            setIsHashtagModalOpen(false); // Close modal
            setSelectedHashtag(null); // Clear selected hashtag
          }}
        />
      )}
    </main>
  );
}

DockChat.propTypes = {
  entries: PropTypes.array.isRequired,
  hashtags: PropTypes.arrayOf(PropTypes.string).isRequired,
  refreshEntries: PropTypes.func.isRequired,
  editingId: PropTypes.any,
  setEditingId: PropTypes.func,
};
