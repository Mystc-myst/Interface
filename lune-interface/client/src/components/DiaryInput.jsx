"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from './ui/button'; // Back to relative path
import PropTypes from 'prop-types';

const DiaryInput = ({ onSave, initialText = '', clearOnSave = false, onChatWithLune }) => {
  const [text, setText] = useState(initialText);
  const textareaRef = useRef(null);

  useEffect(() => {
    setText(initialText);
  }, [initialText]);

  const autoGrow = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => {
    autoGrow();
  }, []);

  useEffect(() => {
    autoGrow();
  }, [text]);

  const handleInputChange = (e) => {
    setText(e.target.value);
  };

  const handleKeyDown = async (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onSave) {
        const success = await onSave(text);
        if (success && clearOnSave) {
          setText('');
        }
      }
    }
  };

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  return (
    <div className="w-full md:max-w-[70ch] mx-auto">
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Write what stirs beneath …"
        value={text}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="frost w-full md:w-[70ch] min-h-[8rem] resize-none overflow-hidden rounded-2xl p-4 md:p-6 text-lg leading-loose text-slate-200 placeholder:text-slate-400 outline-none ring-1 ring-inset focus:ring-2 focus:ring-violet-300/60 transition" // Adjusted width
      />
      {/* New button container */}
      <div className="flex items-center gap-4 justify-start mt-3"> {/* 1rem = gap-4, 0.75rem = mt-3 */}
        <Button
          className="btn-glass" // Apply the new class for Save button
          onClick={async () => {
            if (onSave) {
              const success = await onSave(text);
              if (success && clearOnSave) {
                setText('');
              }
            }
          }}
        >
          Save <kbd className="ml-2 text-xs">⌘/Ctrl + ↵</kbd>
        </Button>
        <Button
          className="btn-glass" // Apply the new class
          onClick={onChatWithLune}
        >
          Chat with Lune
        </Button>
        <span className="text-xs text-slate-300 ml-auto"> {/* Pushed word count to the right */}
          {wordCount} word{wordCount === 1 ? '' : 's'}
        </span>
      </div>
    </div>
  );
};

DiaryInput.propTypes = {
  onSave: PropTypes.func.isRequired,
  initialText: PropTypes.string,
  clearOnSave: PropTypes.bool,
  onChatWithLune: PropTypes.func, // Added prop type for onChatWithLune
};

// Add default prop for onChatWithLune to avoid errors if not passed
DiaryInput.defaultProps = {
  onChatWithLune: () => {}, // No-op function
};

export default DiaryInput;
