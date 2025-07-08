import React, { useEffect, useRef } from 'react';
import './EntryCard.css';

// Using a simple SVG for the trash icon for now.
// In a real app, this might come from an icon library or a dedicated SVG component.
const TrashIconSVG = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V6H3ZM5 8H19V20H5V8ZM16 10L15.2929 10.7071L12.7071 13.2929L10.1213 10.7071L9.41421 10L12 12.5858L14.5858 10H16ZM7 2H17V4H7V2Z" />
  </svg>
);


const EntryCard = ({
  id, // Entry ID
  title,
  snippet,
  date,
  onClick, // For navigating to the entry
  onDeleteRequest, // To request deletion (e.g., show confirmation)
  isHighlighted, // Boolean, if this card is the one selected by keyboard
  onSetHighlight, // Function to call to set this card as highlighted
  // onDelete prop is removed, replaced by onDeleteRequest and page-level Delete key handling
}) => {
  const cardRef = useRef(null);

  // Pulse animation for loop-dot is handled by CSS on mount.
  // The `useEffect` below is for when `isHighlighted` changes.
  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      // Optional: Scroll into view if highlighted and off-screen
      // cardRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      // For now, focus is enough, as user is likely using keyboard to navigate items.
      cardRef.current.focus();
    }
  }, [isHighlighted]);

  const handleFocus = () => {
    if (onSetHighlight) {
      onSetHighlight(id);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation(); // Prevent card click (navigation)
    if (onDeleteRequest) {
      onDeleteRequest(id); // Pass entry ID to the delete request handler
    }
  };

  // Combine className for highlighted state
  const cardClassName = `entry-card ${isHighlighted ? 'highlighted' : ''}`;

  return (
    <div
      ref={cardRef}
      id={`entry-card-${id}`}
      className={cardClassName}
      onClick={onClick} // Main click action (navigation)
      onFocus={handleFocus} // Set highlight when card receives focus
      role="listitem"
      tabIndex={0} // Make it focusable
      aria-current={isHighlighted ? "true" : undefined} // Indicate highlighted item
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }
        // Note: 'Delete' key is handled at Page level for highlighted card.
        // If individual cards need their own delete shortcut (e.g. if trash icon is focused),
        // that could be added here.
      }}
    >
      <div className="entry-card-loop-dot"></div>
      <div className="entry-card-content">
        <h3 className="entry-card-title">{title}</h3>
        <p className="entry-card-snippet">{snippet}</p>
        <p className="entry-card-date">{date}</p>
      </div>
      {/* Trash icon is shown/hidden via CSS based on .entry-card:hover or .entry-card:focus-within */}
      {onDeleteRequest && ( // Only render if delete functionality is provided
        <button
          type="button"
          aria-label={`Delete entry: ${title}`}
          className="entry-card-delete-icon"
          onClick={handleDeleteClick}
          // Prevent focus on this button itself if card focus handles delete icon visibility
          // Or allow focus if specific icon actions are needed
          tabIndex={-1} // Keep focus on the card itself, trash appears on hover/focus-within
        >
          <TrashIconSVG />
        </button>
      )}
    </div>
  );
};

export default EntryCard;
