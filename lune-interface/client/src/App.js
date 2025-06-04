import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DockChat from './components/DockChat';
import EntriesPage from './components/EntriesPage';

function App() {
  const [entries, setEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);

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

  const refreshEntries = async () => {
    await fetchEntries();
  };

  return (
    <Router>
      <Routes>
        <Route
          path="/chat"
          element={<DockChat entries={entries} refreshEntries={refreshEntries} editingId={editingId} setEditingId={setEditingId} />}
        />
        <Route
          path="/entries"
          element={<EntriesPage entries={entries} refreshEntries={refreshEntries} startEdit={setEditingId} />}
        />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>
    </Router>
  );
}

export default App;

