import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';

const Folder = ({ folder, onDropEntry }) => {
  const navigate = useNavigate();

  // Calculate color intensity based on the number of entries
  const entryCount = Array.isArray(folder.entries) ? folder.entries.length : 0;
  const colorIntensity = Math.min(entryCount * 10, 100); // Max 100 for full opacity part
  const baseColorOpacity = 0.1; // Base opacity for empty folder
  const finalOpacity = baseColorOpacity + (colorIntensity / 100) * (1 - baseColorOpacity);

  const folderStyle = {
    backgroundColor: `rgba(128, 0, 128, ${finalOpacity})`, // Purple base color, using finalOpacity
    // Consider adding a border or other style that also uses this color logic
    borderColor: `rgba(128, 0, 128, ${Math.min(finalOpacity + 0.2, 1)})`, // Slightly more opaque border
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Necessary to allow dropping
    e.stopPropagation(); // Prevent interfering with parent drag handlers if any
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling up
    const entryId = e.dataTransfer.getData('text/plain');
    if (entryId && folder.id) {
      onDropEntry(folder.id, entryId);
    }
  };

  const handleClick = (e) => {
    // Prevent click from triggering if a drag operation just finished on this element.
    // This can be tricky; often handled by checking if a drag occurred.
    // For simplicity, we navigate. If drag-and-drop also triggers navigation,
    // it might be an acceptable UX or need further refinement.
    e.stopPropagation(); // Stop click from propagating further if wrapped by other clickable elements
    navigate(`/folders/${folder.id}`);
  };

  return (
    <div
      className="rounded-full w-32 h-32 flex flex-col items-center justify-center text-white font-bold text-lg shadow-lg cursor-pointer transition-all duration-300 ease-in-out border-2 hover:shadow-xl hover:scale-105"
      style={folderStyle}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      onClick={handleClick}
      title={`Open folder: ${folder.name} (${entryCount} ${entryCount === 1 ? 'entry' : 'entries'})`}
    >
      <span className="block text-center break-words max-w-[80%] leading-tight">{folder.name}</span>
      <span className="text-xs font-normal mt-1">({entryCount})</span>
    </div>
  );
};

Folder.propTypes = {
  folder: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    entries: PropTypes.arrayOf(PropTypes.string).isRequired, // Expecting array of entry IDs
  }).isRequired,
  onDropEntry: PropTypes.func.isRequired,
};

export default Folder;
