import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import LiquidGoldButton from './ui/LiquidGoldButton'; // Assuming path is correct
import useKeyboardShortcuts from '../hooks/useKeyboardShortcuts';

const InitiationView = () => {
  const navigate = useNavigate();
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem('hasStartedDiary') === 'true') {
        navigate('/chat', { replace: true });
      }
    } catch (error) {
      console.warn('localStorage is not available. Initiation screen will always show.', error);
      // If localStorage is blocked, proceed to show the initiation screen
    }
  }, [navigate]);

  const handleActivation = () => {
    try {
      localStorage.setItem('hasStartedDiary', 'true');
    } catch (error) {
      console.warn('localStorage is not available. Diary start will not be remembered.', error);
      // Functionality still works, just won't remember dismissal
    }
    setIsFadingOut(true);
    setTimeout(() => {
      navigate('/chat');
    }, 500); // Match fade-out duration
  };

  // Setup keyboard shortcut for activation
  useKeyboardShortcuts({}, handleActivation, true);


  const viewStyle = {
    width: '100vw',
    height: '100vh',
    background: 'var(--ink-black, #000)', // Use token or fallback
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: isFadingOut ? 0 : 1,
    transition: 'opacity 0.5s ease-out',
  };

  return (
    <div style={viewStyle}>
      <LiquidGoldButton onClick={handleActivation} aria-label="Activate diary">
        Activate Now <kbd style={{opacity: 0.7, fontSize: '0.8em', fontWeight: 'normal'}}>⌘/Ctrl&nbsp;+&nbsp;↵</kbd>
      </LiquidGoldButton>
    </div>
  );
};

export default InitiationView;
