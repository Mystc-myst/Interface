import React, { useState, useEffect } from 'react';
import FolderChip from './ui/FolderChip';
import './FoldersRibbon.css';

// Default/fallback folders if none are provided via props
const defaultFolders = [
  { id: 'df1', name: 'All Notes', count: 0 },
  { id: 'df2', name: 'Ideas', count: 0 },
];

const FoldersRibbon = ({
  folders: foldersFromProps, // Renamed to be clear
  onSelectFolder,
  onRenameFolder, // Prop to notify parent about rename
  onDeleteFolder  // Prop to notify parent about delete
}) => {
  // Internal state for folders, initialized by props or default
  const [internalFolders, setInternalFolders] = useState(foldersFromProps || defaultFolders);
  const [selectedFolderId, setSelectedFolderId] = useState(
    (foldersFromProps && foldersFromProps.length > 0) ? foldersFromProps[0].id : (defaultFolders.length > 0 ? defaultFolders[0].id : null)
  );

  // Effect to update internal state if the folders prop changes from parent
  useEffect(() => {
    setInternalFolders(foldersFromProps || defaultFolders);
    // Optionally, update selectedFolderId if the current one is no longer in the new list
    if (foldersFromProps && !foldersFromProps.find(f => f.id === selectedFolderId)) {
      setSelectedFolderId(foldersFromProps.length > 0 ? foldersFromProps[0].id : null);
    } else if (!foldersFromProps && !defaultFolders.find(f => f.id === selectedFolderId)) {
      setSelectedFolderId(defaultFolders.length > 0 ? defaultFolders[0].id : null);
    }
  }, [foldersFromProps, selectedFolderId]);


  const handleChipClick = (folderId) => {
    setSelectedFolderId(folderId);
    if (onSelectFolder) {
      onSelectFolder(folderId);
    }
    // console.log(`Selected folder: ${folderId}`);
  };

  const handleChipDoubleClick = (folder) => {
    const newName = prompt(`Rename folder "${folder.name}":`, folder.name);
    if (newName && newName !== folder.name) {
      if (onRenameFolder) {
        onRenameFolder(folder.id, newName); // Notify parent
      } else {
        // Fallback to updating internal state if no parent handler
        setInternalFolders(prevFolders =>
          prevFolders.map(f => (f.id === folder.id ? { ...f, name: newName } : f))
        );
        console.log(`Rename folder ${folder.id} to "${newName}" (internal state)`);
      }
    }
  };

  const handleChipLongPress = (folder) => {
    if (window.confirm(`Are you sure you want to delete folder "${folder.name}"?`)) {
      if (onDeleteFolder) {
        onDeleteFolder(folder.id); // Notify parent
      } else {
        // Fallback to updating internal state
        setInternalFolders(prevFolders => prevFolders.filter(f => f.id !== folder.id));
        console.log(`Delete folder ${folder.id} (internal state)`);
        if (selectedFolderId === folder.id) {
          const newSelectedId = internalFolders.length > 1 ? internalFolders.find(f => f.id !== folder.id)?.id : null;
          setSelectedFolderId(newSelectedId);
          if (onSelectFolder && newSelectedId) {
            onSelectFolder(newSelectedId);
          }
        }
      }
    }
  };

  const displayFolders = internalFolders && internalFolders.length > 0 ? internalFolders : [];

  return (
    <div className="folders-ribbon-container" role="tablist" aria-label="Folder categories">
      {displayFolders.map(folder => (
        <FolderChip
          key={folder.id}
          folderId={folder.id} // Pass folderId for ARIA attributes if needed inside FolderChip
          name={folder.name}
          count={folder.count}
          isSelected={selectedFolderId === folder.id} // Pass selection state
          onClick={() => handleChipClick(folder.id)}
          onDoubleClick={() => handleChipDoubleClick(folder)} // Pass the folder object
          onLongPress={() => handleChipLongPress(folder)}   // Pass the folder object
          // The FolderChip itself should have role="tab"
          // aria-selected is managed via isSelected prop
        />
      ))}
    </div>
  );
};

export default FoldersRibbon;
