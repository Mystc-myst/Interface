import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom';
import io from 'socket.io-client';
import InitiationView from './components/InitiationView';
import DockChat from './components/DockChat';
import EntriesPage from './components/EntriesPage';
import FolderViewPage from './components/FolderViewPage';
import LuneChatModal from './components/LuneChatModal';

const socket = io('http://localhost:5001');

function App() {
  const [entries, setEntries] = useState([]);
  const [folders, setFolders] = useState([]);
  const [tagIndex, setTagIndex] = useState({});
  const [editingId, setEditingId] = useState(null);
  const [showChat, setShowChat] = useState(false);
  const [filterTag, setFilterTag] = useState(null);

  // Theme state and logic
  const [theme, setTheme] = useState(() => {
    const storedTheme = localStorage.getItem('theme');
    if (storedTheme) {
      return storedTheme;
    }
    // If no stored theme, check CSS-set theme from OS preference
    // The actual value of --theme is not directly readable here before mount,
    // but we can check if prefers-color-scheme was dark.
    // The `useEffect` below will correctly sync `data-theme` from the CSS variable if needed.
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches && !storedTheme) {
      return 'dark';
    }
    return 'light'; // Default to light if no preference or stored theme
  });

  useEffect(() => {
    // This effect ensures that on initial load, if localStorage is set, it overrides OS.
    // If localStorage is not set, it respects OS (already set by CSS @media query).
    // It also applies the theme from state to the html element.
    const root = document.documentElement;
    // Correctly get the --theme value set by CSS media query
    const computedStyle = getComputedStyle(root);
    const currentOsTheme = computedStyle.getPropertyValue('--theme').trim();

    if (localStorage.getItem('theme')) {
      // If theme is in localStorage, it takes precedence.
      // The `theme` state is already initialized from localStorage if available.
      root.dataset.theme = theme;
    } else if (currentOsTheme) {
      // If no localStorage theme, but OS theme is detected via CSS variable
      root.dataset.theme = currentOsTheme;
      if (theme !== currentOsTheme) { // Sync React state only if it differs
        setTheme(currentOsTheme);
      }
    } else {
      // Fallback: if no localStorage and no OS theme detected (e.g. --theme not set by CSS)
      // Use the initial state of `theme` (which defaults to 'light' or respects prefers-color-scheme via matchMedia)
      root.dataset.theme = theme;
    }
  }, []); // Run once on mount to initialize

  useEffect(() => {
    // This effect reacts to changes in the `theme` state (e.g., by toggleTheme)
    // and updates both localStorage and the `data-theme` attribute.
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

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

  const fetchTagIndex = useCallback(async () => {
    try {
      const res = await fetch('/diary/tags');
      if (!res.ok) throw new Error(`Failed to fetch tags: ${res.status}`);
      const data = await res.json();
      setTagIndex(data);
    } catch (error) {
      console.error("Error fetching tag index:", error);
      setTagIndex({});
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchFolders();
    fetchTagIndex();

    socket.on('new-entry', (entry) => {
      setEntries(prevEntries => [entry, ...prevEntries]);
    });

    socket.on('entry-updated', (updatedEntry) => {
      setEntries(prevEntries => prevEntries.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry));
    });

    socket.on('entry-deleted', (deletedEntryId) => {
      setEntries(prevEntries => prevEntries.filter(entry => entry.id !== deletedEntryId));
    });

    socket.on('tags-updated', (tags) => {
      setTagIndex(tags);
    });

    socket.on('folders-updated', () => {
      fetchFolders();
    });

    return () => {
      socket.off('new-entry');
      socket.off('entry-updated');
      socket.off('entry-deleted');
      socket.off('tags-updated');
      socket.off('folders-updated');
    };
  }, [fetchEntries, fetchFolders, fetchTagIndex]);

  // Callback function to refresh all data types.
  const refreshAllData = useCallback(async () => {
    await fetchEntries();
    await fetchFolders();
    await fetchTagIndex();
  }, [fetchEntries, fetchFolders, fetchTagIndex]);

  const handleTagSelect = (tag) => {
    console.log("handleTagSelect called with tag:", tag);
    setFilterTag(tag);
  };

  // Inner component `AppContent` to encapsulate routing logic.
  // This allows `useLocation` to be used, as it must be within a <Router> context.
  const AppContent = () => {
    const location = useLocation(); // Hook to get current URL location.
    const isChatPage = location.pathname === '/chat'; // Check if the current page is the chat page.

    const visibleEntries = filterTag
      ? entries.filter(e => (e.tags || []).includes(filterTag))
      : entries;
    console.log("filterTag:", filterTag, "visibleEntries.length:", visibleEntries.length);

    return (
      // Main layout container, uses flexbox for structure.
      <div className="flex flex-col min-h-screen">
        {/* Content area that grows to fill available space. */}
        <div className="flex-grow p-4"> {/* Added padding for visibility */}
          {/* Defines the routes for the application. */}
          <Routes>
            {/* Route for the new initiation screen. */}
            <Route path="/start" element={<InitiationView />} />
            {/* Route for the main chat interface. */}
            <Route
              path="/chat"
              element={
                // DockChat component, passed various state and functions as props.
                <DockChat
                  entries={visibleEntries} // Pass current entries.
                  tagIndex={tagIndex}
                  onTagSelect={handleTagSelect}
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
                  onTagClick={handleTagSelect}
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
            {/* Default route: navigate to "/start". InitiationView will handle redirect to "/chat" if already started. */}
            <Route path="/" element={<Navigate to="/start" replace />} />
            {/* Fallback route: if no other route matches (e.g. old bookmarks to /), navigate to "/start". */}
            <Route path="*" element={<Navigate to="/start" replace />} />
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

        {/* Theme Toggle Button */}
        <button
          aria-label="Toggle dark/light mode"
          onClick={toggleTheme}
          className="theme-toggle btn-glass" // Added btn-glass for styling, specific .theme-toggle for positioning
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>

        {/* Persistent link to entries page */}
        <Link to="/entries" className="entries-nav-button">
          📖
        </Link>

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

