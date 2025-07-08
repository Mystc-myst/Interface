"use client";

import React, { useState, useRef, useEffect } from 'react';
// import { motion } from 'framer-motion'; // Removed framer-motion wrapper for simplicity, can be added back if needed
// import { Button } from './ui/button'; // Removed old save button from here
import PropTypes from 'prop-types';

const DiaryInput = ({ onSave, initialText = '', clearOnSave = false, setTextExternally }) => {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef(null);

  useEffect(() => {
    setText(initialText); // Sync with external changes (e.g. loading an entry to edit)
  }, [initialText]);

  // Auto-grow functionality (optional, as height is now fixed by spec, but good for typing experience)
  // The spec asks for height: 12ch, but I used 12rem. If auto-grow is kept, min-height should be 12rem.
  // For now, I'll remove auto-grow to strictly adhere to fixed height.
  // const autoGrow = () => {
  //   if (textareaRef.current) {
  //     textareaRef.current.style.height = 'auto'; // Reset height
  //     textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set to scroll height
  //   }
  // };

  // useEffect(() => {
  //  autoGrow();
  // }, [text]); // Auto-grow when text changes

  const handleInputChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    if (setTextExternally) {
      setTextExternally(newText); // Keep parent state in sync
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter for saving is a common pattern, can be kept or removed
    // The new "Save" button will be the primary save action.
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onSave) {
        onSave(text); // Save the current text
        if (clearOnSave) {
          setText(''); // Clear internal text
          if (setTextExternally) {
            setTextExternally(''); // Also clear parent's text state
          }
        }
      }
    }
  };

  // Removed word count and old save button from the render output.
  // The main div wrapper (motion.div) is also removed.
  // The component now returns only the textarea.

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={handleInputChange}
      onKeyDown={handleKeyDown}
      placeholder="What visions stir within the Lune..." // New placeholder text
      className="bg-textareaBg text-moonMist placeholder-moonMist/50 rounded-[16px] p-4 focus:outline-none focus:ring-0"
      style={{
        width: '60ch',
        height: '12rem', // Using 12rem for a "tall" textarea. '12ch' might be too small.
        boxShadow: 'inset 0 0 0 2px var(--moon-mist)',
        fontFamily: 'Inter, sans-serif', // Ensuring a consistent font
        fontSize: '1rem', // Base font size for consistent ch unit and overall appearance
        lineHeight: '1.5', // For better readability
        resize: 'none', // As per original, disable resize
      }}
    />
  );
};

DiaryInput.propTypes = {
  onSave: PropTypes.func.isRequired,
  initialText: PropTypes.string,
  clearOnSave: PropTypes.bool,
  setTextExternally: PropTypes.func, // New prop to update parent state
};

export default DiaryInput;
