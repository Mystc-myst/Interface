import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DockChat from './components/DockChat';
import EntriesPage from './components/EntriesPage';
import FolderViewPage from './components/FolderViewPage'; // Import FolderViewPage

function App() {
  const [entries, setEntries] = useState([]);
  const [folders, setFolders] = useState([]); // Add state for folders
  const [editingId, setEditingId] = useState(null);

  // Fetch entries from backend
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/diary');
      if (!res.ok) throw new Error(`Failed to fetch entries: ${res.status}`);
      const data = await res.json();
      setEntries(data);
    } catch (error) {
      console.error("Error fetching entries:", error);
      setEntries([]); // Set to empty array on error
    }
  }, []);

  // Fetch folders from backend
  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/diary/folders'); // Assuming this is the endpoint
      if (!res.ok) throw new Error(`Failed to fetch folders: ${res.status}`);
      const data = await res.json();
      setFolders(data);
    } catch (error) {
      console.error("Error fetching folders:", error);
      setFolders([]); // Set to empty array on error
    }
  }, []);

  // Initial load for entries and folders
  useEffect(() => {
    fetchEntries();
    fetchFolders();
  }, [fetchEntries, fetchFolders]);

  // Combined refresh function
  const refreshAllData = useCallback(async () => {
    await fetchEntries();
    await fetchFolders();
  }, [fetchEntries, fetchFolders]);

  return (
    <Router>
      <Routes>
        <Route
          path="/chat"
          element={
            <DockChat
              entries={entries}
              refreshEntries={refreshAllData} // Use combined refresh
              editingId={editingId}
              setEditingId={setEditingId}
            />
          }
        />
        <Route
          path="/entries"
          element={
            <EntriesPage
              entries={entries}
              folders={folders} // Pass folders
              refreshEntries={refreshAllData} // Use combined refresh
              refreshFolders={fetchFolders} // Or pass fetchFolders if EntriesPage modifies folders directly
              startEdit={setEditingId}
              setFolders={setFolders} // Allow EntriesPage to update folders state (e.g., after adding a new folder via API)
            />
          }
        />
        <Route
          path="/folders/:folderId" // New route for viewing a single folder
          element={
            <FolderViewPage
              allEntries={entries}
              allFolders={folders}
              startEdit={setEditingId}
              refreshEntries={refreshAllData} // Use combined refresh
            />
          }
        />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

