import React, { useState, useEffect } from 'react';
import EntriesMenu from './components/EntriesMenu';
import DiaryEditable from './components/DiaryEditable';
import LuneChatModal from './components/LuneChatModal'; // <-- NEW IMPORT

function App() {
  const [entries, setEntries] = useState([]);
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [luneOpen, setLuneOpen] = useState(false); // <-- NEW STATE

  // Fetch entries from backend
  const fetchEntries = async () => {
    const res = await fetch('/diary');
    const data = await res.json();
    setEntries(data);
  };

  // Initial load
  useEffect(() => {
    fetchEntries();
  }, []);

  // Refresh entries after save
  const handleSave = async () => {
    await fetchEntries();
    setSelectedEntry(null); // Clear selection after save
  };

  // Select entry to edit
  const handleSelect = (entry) => {
    setSelectedEntry(entry);
  };

  // Click "New Entry" resets the editor
  const handleNew = () => {
    setSelectedEntry({ text: '' });
  };

  return (
    <div className="min-h-screen bg-luneGray p-4">
      <h1 className="text-lunePurple text-3xl font-bold mb-4 text-center">Lune Diary</h1>
      {/* Lune Chat Button and Modal */}
      <button
        className="bg-lunePurple text-white px-4 py-2 rounded mb-4"
        onClick={() => setLuneOpen(true)}
      >
        Chat with Lune
      </button>
      <LuneChatModal
        open={luneOpen}
        onClose={() => setLuneOpen(false)}
        entries={entries}
      />
      <div className="max-w-3xl mx-auto flex flex-col md:flex-row gap-6">
        {/* Left panel: EntriesMenu */}
        <div className="w-full md:w-1/2">
          <EntriesMenu
            entries={entries}
            onSelect={handleSelect}
            onNew={handleNew}
          />
        </div>
        {/* Right panel: DiaryEditable */}
        <div className="w-full md:w-1/2">
          <DiaryEditable
            entry={selectedEntry}
            onSave={handleSave}
          />
        </div>
      </div>
    </div>
  );
}

export default App;

