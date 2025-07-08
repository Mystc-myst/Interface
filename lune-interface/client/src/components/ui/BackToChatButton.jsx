import React, { useState, useEffect, useRef } from 'react';
import './BackToChatButton.css';

const BackToChatButton = ({ onClick }) => {
  const [isVisible, setIsVisible] = useState(false);
  const buttonRef = useRef(null);

  useEffect(() => {
    let observer;
    let timeoutId;

    const handleScroll = () => {
      // Show button after 1s of scrolling from top
      // This simple check works if page is scrollable from the start.
      // A more robust way for "1s scroll" might involve tracking scroll start time.
      // For now, show after scrolling down a bit (e.g., 100px) and then apply delay.

      // Clear any existing timeout to avoid multiple fade-ins if user scrolls up/down quickly
      clearTimeout(timeoutId);

      if (window.scrollY > 100) { // User has scrolled down a bit
        timeoutId = setTimeout(() => {
          setIsVisible(true);
        }, 700); // Spec says "fade-in after 1s scroll", animation is 400ms.
                     // Total: 700ms delay + 400ms fade = ~1.1s effect.
                     // Let's make it 600ms delay for 1s total.
      } else {
        setIsVisible(false);
      }
    };

    // More robust: IntersectionObserver to detect when a certain point is passed.
    // However, the spec says "1s scroll", implying time-based after scroll starts.
    // The current implementation is a simplified version: show 600ms after scrolling past 100px.

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial check in case page loads scrolled

    return () => {
      window.removeEventListener('scroll', handleScroll);
      clearTimeout(timeoutId);
      if (observer) observer.disconnect();
    };
  }, []);

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Placeholder action
      alert('Back to Chat clicked!');
      // window.location.href = '/chat'; // Example navigation
    }
  };

  return (
    <button
      ref={buttonRef}
      className={`back-to-chat-button ${isVisible ? 'visible' : ''}`}
      onClick={handleClick}
      aria-label="Back to Chat"
    >
      <span className="back-to-chat-icon" aria-hidden="true">↩</span>
      <span className="back-to-chat-text">Back to Chat</span>
    </button>
  );
};

export default BackToChatButton;
