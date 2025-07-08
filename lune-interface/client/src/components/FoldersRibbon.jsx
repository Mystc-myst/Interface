import React, { useState } from 'react';
import FolderChip from './ui/FolderChip';
import './FoldersRibbon.css';

// Placeholder data - in a real app, this would come from state/props
const initialFolders = [
  { id: '1', name: 'All Notes', count: 125 },
  { id: '2', name: 'Work', count: 30 },
  { id: '3', name: 'Personal', count: 45 },
  { id: '4', name: 'Ideas', count: 50 },
  { id: '5', name: 'Travel', count: 15 },
  { id: '6', name: 'Recipes', count: 22 },
  { id: '7', name: 'Archive', count: 800 },
  { id: '8', name: 'To Read', count: 10 },
];

const FoldersRibbon = ({ onSelectFolder, onRenameFolder, onDeleteFolder }) => {
  const [folders, setFolders] = useState(initialFolders); // Manage folder state locally for now
  const [selectedFolderId, setSelectedFolderId] = useState(initialFolders[0]?.id || null);

  const handleChipClick = (folderId) => {
    setSelectedFolderId(folderId);
    if (onSelectFolder) {
      onSelectFolder(folderId);
    }
    console.log(`Selected folder: ${folderId}`);
  };

  const handleChipDoubleClick = (folder) => {
    const newName = prompt(`Rename folder "${folder.name}":`, folder.name);
    if (newName && newName !== folder.name) {
      setFolders(prevFolders => prevFolders.map(f => f.id === folder.id ? { ...f, name: newName } : f));
      if (onRenameFolder) {
        onRenameFolder(folder.id, newName);
      }
      console.log(`Rename folder ${folder.id} to "${newName}"`);
    }
  };

  const handleChipLongPress = (folder) => {
    if (window.confirm(`Are you sure you want to delete folder "${folder.name}"?`)) {
      setFolders(prevFolders => prevFolders.filter(f => f.id !== folder.id));
      if (onDeleteFolder) {
        onDeleteFolder(folder.id);
      }
      console.log(`Delete folder ${folder.id}`);
      // If the selected folder is deleted, select the first one if available
      if (selectedFolderId === folder.id) {
        setSelectedFolderId(folders[0]?.id || null);
         if (onSelectFolder && folders[0]) {
            onSelectFolder(folders[0].id);
        }
      }
    }
  };

  return (
    <div className="folders-ribbon-container" role="tablist" aria-label="Folder categories">
      {folders.map(folder => (
        <FolderChip
          key={folder.id}
          name={folder.name}
          count={folder.count}
          onClick={() => handleChipClick(folder.id)}
          onDoubleClick={() => handleChipDoubleClick(folder)}
          onLongPress={() => handleChipLongPress(folder)}
          // ARIA attributes for tab role
          aria-selected={selectedFolderId === folder.id}
          // id={`folder-tab-${folder.id}`} // Optional: for aria-controls if needed
          // aria-controls={`folder-panel-${folder.id}`} // Optional
        />
      ))}
    </div>
  );
};

export default FoldersRibbon;
