import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import DockChat from './components/DockChat';
import EntriesPage from './components/EntriesPage';
import FolderViewPage from './components/FolderViewPage'; // Import FolderViewPage
import LuneChatModal from './components/LuneChatModal'; // Import LuneChatModal

function App() {
  const [entries, setEntries] = useState([]);
  const [folders, setFolders] = useState([]);
  const [hashtags, setHashtags] = useState([]); // Add state for hashtags
  const [editingId, setEditingId] = useState(null);
  const [showChat, setShowChat] = useState(false); // Add showChat state

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

  // Fetch hashtags from backend
  const fetchHashtags = useCallback(async () => {
    try {
      const res = await fetch('/diary/hashtags');
      if (!res.ok) throw new Error(`Failed to fetch hashtags: ${res.status}`);
      const data = await res.json();
      setHashtags(data);
    } catch (error) {
      console.error("Error fetching hashtags:", error);
      setHashtags([]); // Set to empty array on error
    }
  }, []);

  // Initial load for entries, folders, and hashtags
  useEffect(() => {
    fetchEntries();
    fetchFolders();
    fetchHashtags();
  }, [fetchEntries, fetchFolders, fetchHashtags]);

  // Combined refresh function
  const refreshAllData = useCallback(async () => {
    await fetchEntries();
    await fetchFolders();
    await fetchHashtags();
  }, [fetchEntries, fetchFolders, fetchHashtags]);

  // Inner component to access useLocation
  const AppContent = () => {
    const location = useLocation();
    const isChatPage = location.pathname === '/chat';

    return (
      <div className="flex flex-col min-h-screen">
        <div className="flex-grow">
          <Routes>
            <Route
              path="/chat"
              element={
                <DockChat
                  entries={entries}
                  hashtags={hashtags} // Pass hashtags
                  refreshEntries={refreshAllData} // Use combined refresh (now includes hashtags)
                  editingId={editingId}
                  setEditingId={setEditingId}
                  showChat={showChat} // Pass showChat state
                  setShowChat={setShowChat} // Pass setShowChat function
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
        </div>
        {isChatPage && (
          <footer className="w-full flex justify-center items-center px-4 pb-6"> {/* Changed pb-10 to pb-6 */}
            {/* The div with frost styling has been removed */}
            {/* Button removed from here */}
          </footer>
        )}
        <LuneChatModal open={showChat} onClose={() => setShowChat(false)} />
      </div>
    );
  };

  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;

