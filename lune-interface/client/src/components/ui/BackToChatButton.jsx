import React, { useRef } from 'react'; // Removed useState, useEffect
import PropTypes from 'prop-types';
import './BackToChatButton.css';

const BackToChatButton = ({ id, onClick }) => { // Added id prop for keyboard shortcut targeting
  const buttonRef = useRef(null);
  // Removed isVisible state and useEffect for scroll handling

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Placeholder action if no onClick is provided
      // In EntriesPage.jsx, onClick is provided to navigate.
      console.log('Back to Chat clicked! (No custom onClick handler provided)');
    }
  };

  return (
    <button
      id={id} // Apply id for keyboard shortcut targeting
      ref={buttonRef}
      // Always apply 'visible' class or adjust CSS to not need it for visibility
      className="back-to-chat-button visible"
      onClick={handleClick}
      aria-label="Return to the moment" // Updated aria-label
      // No longer need aria-hidden based on isVisible
    >
      <span className="back-to-chat-icon" aria-hidden="true">↩</span>
      <span className="back-to-chat-text">Back to Chat</span>
    </button>
  );
};

BackToChatButton.propTypes = {
  id: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default BackToChatButton;
