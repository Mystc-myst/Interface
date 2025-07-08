import React, { useState, useEffect, useRef } from 'react';
import './BackToChatButton.css';

const BackToChatButton = ({ id, onClick }) => { // Added id prop for keyboard shortcut targeting
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef(null);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    const handleScroll = () => {
      // Clear any existing timeout to avoid multiple fade-ins if user scrolls up/down quickly
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      if (window.scrollY > 100) { // User has scrolled down a bit
        // Set a timeout to make the button visible after 0.5 seconds
        scrollTimeoutRef.current = setTimeout(() => {
          setIsVisible(true);
        }, 500); // Animation starts after 500ms (0.5s)
      } else {
        // If scrolled back to top, hide the button immediately (or after its fade-out animation)
        setIsVisible(false);
      }
    };

    // Add scroll listener
    window.addEventListener('scroll', handleScroll, { passive: true });
    // Initial check in case page loads already scrolled down
    handleScroll();

    // Cleanup function to remove listener and clear timeout
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

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
      className={`back-to-chat-button ${isVisible ? 'visible' : ''}`}
      onClick={handleClick}
      aria-label="Return to the moment" // Updated aria-label
      // aria-hidden={!isVisible} // Hide from screen readers when not visible
      // pointer-events are handled by CSS, so aria-hidden might be redundant if CSS fully hides it.
    >
      <span className="back-to-chat-icon" aria-hidden="true">↩</span>
      <span className="back-to-chat-text">Back to Chat</span>
    </button>
  );
};

export default BackToChatButton;
