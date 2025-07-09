// Import necessary React features and components.
import React, { useState, useEffect, useCallback } from 'react';
// Import routing components from react-router-dom.
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
// Import custom page/view components.
import DockChat from './components/DockChat'; // Main chat interface component.
import EntriesPage from './components/EntriesPage'; // Page for displaying and managing diary entries.
import FolderViewPage from './components/FolderViewPage'; // Page for viewing entries within a specific folder.
import LuneChatModal from './components/LuneChatModal'; // Modal component for Lune AI chat.

// Main application component.
function App() {
  // State for storing diary entries.
  const [entries, setEntries] = useState([]);
  // State for storing folders.
  const [folders, setFolders] = useState([]);
  // State for storing hashtags.
  const [hashtags, setHashtags] = useState([]);
  // State for tracking the ID of the entry currently being edited.
  const [editingId, setEditingId] = useState(null);
  // State to control the visibility of the LuneChatModal.
  const [showChat, setShowChat] = useState(false);

  // Callback function to fetch diary entries from the backend.
  // Uses useCallback to prevent re-creation on every render unless dependencies change.
  const fetchEntries = useCallback(async () => {
    try {
      const res = await fetch('/diary'); // API endpoint for entries.
      if (!res.ok) throw new Error(`Failed to fetch entries: ${res.status}`);
      const data = await res.json();
      setEntries(data); // Update entries state with fetched data.
    } catch (error) {
      console.error("Error fetching entries:", error);
      setEntries([]); // Reset to empty array on error to prevent crashes.
    }
  }, []); // Empty dependency array means this function is created once.

  // Callback function to fetch folders from the backend.
  const fetchFolders = useCallback(async () => {
    try {
      const res = await fetch('/diary/folders'); // API endpoint for folders.
      if (!res.ok) throw new Error(`Failed to fetch folders: ${res.status}`);
      const data = await res.json();
      setFolders(data); // Update folders state.
    } catch (error) {
      console.error("Error fetching folders:", error);
      setFolders([]); // Reset on error.
    }
  }, []); // Empty dependency array.

  // Callback function to fetch hashtags from the backend.
  const fetchHashtags = useCallback(async () => {
    try {
      const res = await fetch('/diary/hashtags'); // API endpoint for hashtags.
      if (!res.ok) throw new Error(`Failed to fetch hashtags: ${res.status}`);
      const data = await res.json();
      setHashtags(data); // Update hashtags state.
    } catch (error) {
      console.error("Error fetching hashtags:", error);
      setHashtags([]); // Reset on error.
    }
  }, []); // Empty dependency array.

  // useEffect hook to perform initial data loading when the component mounts.
  // Fetches entries, folders, and hashtags.
  useEffect(() => {
    fetchEntries();
    fetchFolders();
    fetchHashtags();
  }, [fetchEntries, fetchFolders, fetchHashtags]); // Dependencies: re-run if these functions change (they won't due to useCallback).

  // Callback function to refresh all data types (entries, folders, hashtags).
  const refreshAllData = useCallback(async () => {
    await fetchEntries();
    await fetchFolders();
    await fetchHashtags();
  }, [fetchEntries, fetchFolders, fetchHashtags]); // Dependencies ensure it's stable.

  // Inner component `AppContent` to encapsulate routing logic.
  // This allows `useLocation` to be used, as it must be within a <Router> context.
  const AppContent = () => {
    const location = useLocation(); // Hook to get current URL location.
    const isChatPage = location.pathname === '/chat'; // Check if the current page is the chat page.

    return (
      // Main layout container, uses flexbox for structure.
      <div className="flex flex-col min-h-screen">
        {/* Content area that grows to fill available space. */}
        <div className="flex-grow">
          {/* Defines the routes for the application. */}
          <Routes>
            {/* Route for the main chat interface. */}
            <Route
              path="/chat"
              element={
                // DockChat component, passed various state and functions as props.
                <DockChat
                  entries={entries} // Pass current entries.
                  hashtags={hashtags} // Pass current hashtags.
                  refreshEntries={refreshAllData} // Pass function to refresh all data.
                  editingId={editingId} // Pass current editing ID.
                  setEditingId={setEditingId} // Pass function to set editing ID.
                  showChat={showChat} // Pass state for chat modal visibility.
                  setShowChat={setShowChat} // Pass function to control chat modal visibility.
                />
              }
            />
            {/* Route for the entries page. */}
            <Route
              path="/entries"
              element={
                // EntriesPage component.
                <EntriesPage
                  entries={entries} // Pass current entries.
                  folders={folders} // Pass current folders.
                  refreshEntries={refreshAllData} // Pass function to refresh all data.
                  refreshFolders={fetchFolders} // Pass function to specifically refresh folders.
                  startEdit={setEditingId} // Pass function to initiate editing an entry.
                  setFolders={setFolders} // Allow EntriesPage to update folders state (e.g., after creating a new folder).
                />
              }
            />
            {/* Route for viewing entries within a specific folder. Uses a URL parameter :folderId. */}
            <Route
              path="/folders/:folderId"
              element={
                // FolderViewPage component.
                <FolderViewPage
                  allEntries={entries} // Pass all entries (likely filtered within the component).
                  allFolders={folders} // Pass all folders.
                  startEdit={setEditingId} // Pass function to initiate editing.
                  refreshEntries={refreshAllData} // Pass function to refresh all data.
                />
              }
            />
            {/* Fallback route: if no other route matches, navigate to "/chat". */}
            <Route path="*" element={<Navigate to="/chat" replace />} />
          </Routes>
        </div>
        {/* Conditional rendering for a footer section, only shown on the chat page. */}
        {isChatPage && (
          <footer className="w-full flex justify-center items-center px-4 pb-6">
            {/* Footer content was previously here, now removed. */}
            {/* Could be a place for a global "Open Lune Chat" button if not handled elsewhere. */}
          </footer>
        )}
        {/* LuneChatModal component, its visibility is controlled by `showChat` state. */}
        <LuneChatModal open={showChat} onClose={() => setShowChat(false)} />
      </div>
    );
  };

  // The App component returns the Router wrapping AppContent.
  // Router provides the routing context for the application.
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

// Export the App component to be used in index.js.
export default App;

