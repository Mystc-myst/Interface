import React from 'react';
import PropTypes from 'prop-types';

const Folder = ({ folder, onDropEntry }) => {
  // Calculate color intensity based on the number of entries
  // This is a placeholder, we can refine this later
  const colorIntensity = Math.min(folder.entries.length * 10, 100);
  const folderStyle = {
    backgroundColor: `rgba(75, 0, 130, ${colorIntensity / 100})`, // Purple base color
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const entryId = e.dataTransfer.getData('text/plain');
    onDropEntry(folder.id, entryId);
  };

  return (
    <div
      className="rounded-full w-32 h-32 flex items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer"
      style={folderStyle}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {folder.name}
    </div>
  );
};

Folder.propTypes = {
  folder: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    entries: PropTypes.array.isRequired,
  }).isRequired,
  onDropEntry: PropTypes.func.isRequired,
};

export default Folder;
