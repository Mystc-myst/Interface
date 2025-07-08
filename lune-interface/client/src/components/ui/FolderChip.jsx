import React, { useRef, useEffect } from 'react';
import './FolderChip.css';

const FolderChip = ({
  folderId,
  name,
  count,
  isSelected,
  onClick,
  onDoubleClick,
  onLongPress
}) => {
  const longPressTimer = useRef(null);
  const chipRef = useRef(null);

  const handleInteractionStart = () => {
    // Clear any existing timer
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
    longPressTimer.current = setTimeout(() => {
      if (onLongPress) {
        onLongPress(); // This would typically receive the folderId or folder object
      }
      longPressTimer.current = null; // Reset timer after firing
    }, 600); // 600ms for long press
  };

  const handleInteractionEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  const handleContextMenu = (e) => {
    // Prevent context menu if long press is a designated action,
    // especially on touch devices where long press might also trigger context menu.
    if (onLongPress) {
      e.preventDefault();
    }
  };

  return (
    <button
      ref={chipRef}
      id={`folder-tab-${folderId}`}
      className="folder-chip"
      onClick={(e) => {
        // If a long press was detected and fired, onClick might not be desired.
        // However, standard behavior is that click fires after mouseup/touchend
        // unless the long press itself initiated a modal or different state.
        // For now, let click proceed.
        if (onClick) onClick();
      }}
      onDoubleClick={onDoubleClick}
      onMouseDown={handleInteractionStart}
      onMouseUp={handleInteractionEnd}
      onTouchStart={handleInteractionStart}
      onTouchEnd={handleInteractionEnd}
      onContextMenu={handleContextMenu}
      onKeyDown={(e) => {
        // Delete key for deleting the folder (if it's selected or focused)
        // The prompt implies onLongPress is for delete.
        if (e.key === 'Delete' || e.key === 'Backspace') {
          if (onLongPress && isSelected) { // Only delete if selected and handler exists
            e.preventDefault();
            onLongPress();
          }
        }
        // Enter/Space for click activation (standard for buttons/tabs)
        if (e.key === 'Enter' || e.key === ' ') {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }
      }}
      role="tab"
      aria-selected={isSelected}
      aria-label={`${name} folder, ${count} entries`}
      // tabIndex is 0 by default for buttons, but explicit for clarity when selected/focused
      // For non-selected tabs in a tablist, tabIndex="-1" is common for roving tabindex,
      // but here all chips are focusable via arrow keys if tablist handles that.
      // Keeping it simple with tabIndex={0} as all are directly focusable.
      tabIndex={0}
    >
      <div className="folder-chip-name" title={name}>{name}</div>
      <div className="folder-chip-count">{count}</div>
    </button>
  );
};

export default FolderChip;
