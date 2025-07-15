import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import './EntryCard.css';

// Using a simple SVG for the three-dot icon.
const ThreeDotsIconSVG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 3C10.9 3 10 3.9 10 5C10 6.1 10.9 7 12 7C13.1 7 14 6.1 14 5C14 3.9 13.1 3 12 3ZM12 10C10.9 10 10 10.9 10 12C10 13.1 10.9 14 12 14C13.1 14 14 13.1 14 12C14 10.9 13.1 10 12 10ZM12 17C10.9 17 10 17.9 10 19C10 20.1 10.9 21 12 21C13.1 21 14 20.1 14 19C14 17.9 13.1 17 12 17Z" />
  </svg>
);

const EntryCard = ({
  id, // Entry ID
  title,
  snippet,
  date,
  tags,
  onTagClick,
  onClick, // For navigating to the entry
  onDeleteRequest, // To request deletion of the entry
  onRemoveFromFolderRequest, // To request removal from folder
  isHighlighted, // Boolean, if this card is the one selected by keyboard
  onSetHighlight, // Function to call to set this card as highlighted
}) => {
  // Fallback for tags to ensure it's always an array.
  const safeTags = tags || [];

  const cardRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.focus();
    }
  }, [isHighlighted]);

  const handleFocus = () => {
    if (onSetHighlight) {
      onSetHighlight(id);
    }
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation(); // Prevent card click (navigation)
    setMenuOpen(prev => !prev);
  };

  const handleActionClick = (e, action) => {
    e.stopPropagation();
    action(id);
    setMenuOpen(false); // Close menu after action
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        // Check if the click target is not the menu button itself
        if (cardRef.current && !cardRef.current.querySelector('.entry-card-menu-button')?.contains(event.target)) {
          setMenuOpen(false);
        }
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuRef]);


  const cardClassName = `entry-card ${isHighlighted ? 'highlighted' : ''}`;

  return (
    <div
      ref={cardRef}
      id={`entry-card-${id}`}
      className={cardClassName}
      onClick={onClick}
      onFocus={handleFocus}
      role="listitem"
      tabIndex={0}
      aria-current={isHighlighted ? "true" : undefined}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          if (onClick) {
            e.preventDefault();
            onClick();
          }
        }
        // Consider adding Escape key to close menu if open
        if (e.key === 'Escape' && menuOpen) {
          setMenuOpen(false);
        }
      }}
    >
      <div className="entry-card-loop-dot"></div>
      <div className="entry-card-content">
        <h3 className="entry-card-title">{title}</h3>
        <p className="entry-card-snippet">{snippet}</p>
        <p className="entry-card-date">{date}</p>
      </div>
      <footer>
        {safeTags.map(t => (
          <button
            key={t}
            className="tag-pill"
            onClick={(e) => {
              e.stopPropagation();
              onTagClick(t);
            }}
          >
            #{t}
          </button>
        ))}
      </footer>

      {/* Three-dot menu */}
      {(onDeleteRequest || onRemoveFromFolderRequest) && (
        <div className="entry-card-menu-container" ref={menuRef}>
          <button
            type="button"
            aria-label="More actions"
            aria-haspopup="true"
            aria-expanded={menuOpen}
            className="entry-card-menu-button"
            onClick={handleMenuToggle}
          >
            <ThreeDotsIconSVG />
          </button>
          {menuOpen && (
            <div className="entry-card-menu" role="menu">
              {onRemoveFromFolderRequest && (
                <button
                  role="menuitem"
                  className="entry-card-menu-item"
                  onClick={(e) => handleActionClick(e, onRemoveFromFolderRequest)}
                >
                  Remove from Folder
                </button>
              )}
              {onDeleteRequest && (
                <button
                  role="menuitem"
                  className="entry-card-menu-item entry-card-menu-item-delete"
                  onClick={(e) => handleActionClick(e, onDeleteRequest)}
                >
                  Delete Entry
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

EntryCard.propTypes = {
  id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  title: PropTypes.string.isRequired,
  snippet: PropTypes.string.isRequired,
  date: PropTypes.string.isRequired,
  tags: PropTypes.arrayOf(PropTypes.string),
  onTagClick: PropTypes.func,
  onClick: PropTypes.func.isRequired,
  onDeleteRequest: PropTypes.func,
  onRemoveFromFolderRequest: PropTypes.func,
  isHighlighted: PropTypes.bool,
  onSetHighlight: PropTypes.func,
};

EntryCard.defaultProps = {
  tags: [],
  onTagClick: () => {},
  onDeleteRequest: null,
  onRemoveFromFolderRequest: null,
  isHighlighted: false,
  onSetHighlight: () => {},
};

export default EntryCard;
