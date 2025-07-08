import React, { useState } from 'react';
import './EntryCard.css';
// Assuming an icon component or SVG for trash icon
// For now, using a simple text character or placeholder.
// import { FaTrash } from 'react-icons/fa'; // Example if using react-icons

const EntryCard = ({ title, snippet, date, onClick, onDelete }) => {
  const [isHovered, setIsHovered] = useState(false);

  // Placeholder for trash icon - to be replaced with actual SVG or icon component
  const TrashIcon = () => (
    <span
      role="button"
      aria-label="Delete entry"
      className="entry-card-delete-icon"
      onClick={(e) => {
        e.stopPropagation(); // Prevent card click when deleting
        if (onDelete) onDelete();
      }}
    >
      🗑️
    </span>
  );

  return (
    <div
      className="entry-card"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      role="listitem" // As part of a diary feed (list)
      tabIndex={0} // Make it focusable
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        } else if (e.key === 'Delete' || e.key === 'Backspace') {
          if (onDelete) {
            e.preventDefault();
            // To maintain consistency with hover-reveal,
            // we might want to briefly show the icon or just call delete.
            // For now, directly call onDelete.
            onDelete();
          }
        }
      }}
    >
      <div className="entry-card-loop-dot"></div>
      <div className="entry-card-content">
        <h3 className="entry-card-title">{title}</h3>
        <p className="entry-card-snippet">{snippet}</p>
        <p className="entry-card-date">{date}</p>
      </div>
      {isHovered && onDelete && <TrashIcon />}
    </div>
  );
};

export default EntryCard;
