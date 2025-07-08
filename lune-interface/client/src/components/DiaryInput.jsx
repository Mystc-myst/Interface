"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button } from './ui/button'; // Back to relative path
import PropTypes from 'prop-types';

const DiaryInput = ({ onSave, initialText = '', clearOnSave = false }) => {
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

  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      if (onSave) {
        onSave(text);
        if (clearOnSave) {
          setText('');
        }
      }
    }
  };

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="w-full md:max-w-3xl mx-auto"
    >
      <textarea
        ref={textareaRef}
        rows={1}
        placeholder="Write what stirs beneath …"
        value={text}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        className="frost w-full min-h-[8rem] resize-none overflow-hidden rounded-2xl p-4 md:p-6 text-lg leading-loose text-slate-200 placeholder:text-slate-400 outline-none ring-1 ring-inset focus:ring-2 focus:ring-violet-300/60 transition"
      />
      <div className="mt-8 flex items-center justify-between">
        <span className="text-xs text-slate-300">
          {wordCount} word{wordCount === 1 ? '' : 's'}
        </span>
        <Button
          variant="secondary"
          className="px-4 py-1"
          onClick={() => {
            if (onSave) {
              onSave(text);
              if (clearOnSave) {
                setText('');
              }
            }
          }}
        >
          Save <kbd className="ml-2 text-xs">⌘/Ctrl + ↵</kbd>
        </Button>
      </div>
    </motion.div>
  );
};

DiaryInput.propTypes = {
  onSave: PropTypes.func.isRequired,
  initialText: PropTypes.string,
  clearOnSave: PropTypes.bool,
};

export default DiaryInput;
