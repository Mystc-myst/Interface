import React from 'react';
import './FolderChip.css';

const FolderChip = ({ name, count, onClick, onDoubleClick, onLongPress }) => {
  let longPressTimer;

  const handleMouseDown = () => {
    longPressTimer = setTimeout(() => {
      if (onLongPress) {
        onLongPress();
      }
    }, 600); // 600ms for long press
  };

  const handleMouseUp = () => {
    clearTimeout(longPressTimer);
  };

  const handleTouchStart = () => {
    longPressTimer = setTimeout(() => {
      if (onLongPress) {
        onLongPress();
      }
    }, 600);
  };

  const handleTouchEnd = () => {
    clearTimeout(longPressTimer);
  };

  // Prevent context menu on long press if it's also a right click
  const handleContextMenu = (e) => {
    if (onLongPress) { // If long press is handled, prevent context menu
        // This is a simple check; more sophisticated logic might be needed
        // if right-click initiated long press should still show context menu.
        // For now, assume long press takes precedence for triggering actions.
        e.preventDefault();
    }
  };


  return (
    <button
      className="folder-chip"
      onClick={onClick}
      onDoubleClick={onDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onContextMenu={handleContextMenu}
      onKeyDown={(e) => {
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (onLongPress) { // Assuming onLongPress is the delete handler
            e.preventDefault(); // Prevent browser back navigation on Backspace
            onLongPress();
          }
        }
        // Allow Enter/Space to also trigger click for accessibility with role="tab"
        if (e.key === 'Enter' || e.key === ' ') {
            if(onClick) {
                e.preventDefault();
                onClick();
            }
        }
      }}
      aria-label={`${name} folder, ${count} entries`}
      role="tab" // As per spec
      tabIndex={0} // Make it focusable
    >
      <div className="folder-chip-name">{name}</div>
      <div className="folder-chip-count">{count}</div>
    </button>
  );
};

export default FolderChip;
