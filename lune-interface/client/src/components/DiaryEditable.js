import React, { useState, useEffect, useRef } from 'react';
import getCaretCoordinates from 'textarea-caret';
import { log } from '../lib/logger';
import socket from '../lib/socket';
import { getTagIndex, createEntry, updateEntry } from '../api/diaryApi';

function DiaryEditable({ entry, onSave }) {
  const [text, setText] = useState('');
  const [allHashtags, setAllHashtags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionPosition, setSuggestionPosition] = useState({ top: 0, left: 0 });
  const textareaRef = useRef(null);

  // Load content when entry changes
  useEffect(() => {
    setText(entry && entry.text ? entry.text : '');
  }, [entry]);

  // Fetch all hashtags on mount
  useEffect(() => {
    const fetchHashtags = async () => {
      try {
        const response = await getTagIndex();
        const data = response.data;
        const tags = Object.keys(data).map(t => `#${t}`);
        setAllHashtags(tags);
      } catch (err) {
        console.error('Error fetching hashtags:', err);
      }
    };

    fetchHashtags();

    socket.on('tags-updated', (tags) => {
      const formatted = Object.keys(tags).map(t => `#${t}`);
      setAllHashtags(formatted);
    });

    return () => {
      socket.off('tags-updated');
    };
  }, []);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newText.substring(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    const lastSpaceIndex = textBeforeCursor.lastIndexOf(' '); // Also check for start of line

    if (lastHashIndex !== -1 && lastHashIndex > lastSpaceIndex && !textBeforeCursor.substring(lastHashIndex + 1).includes(' ')) {
      const currentTag = textBeforeCursor.substring(lastHashIndex + 1);
      log('[DiaryEditable] Current partial tag:', currentTag);
      log('[DiaryEditable] All available hashtags:', allHashtags);

      // Filter suggestions: hashtags from allHashtags should start with '#' followed by the currentTag
      const filteredSuggestions = allHashtags.filter(tag =>
        tag.toLowerCase().startsWith(`#${currentTag.toLowerCase()}`)
      );
      log('[DiaryEditable] Filtered suggestions:', filteredSuggestions);

      if (filteredSuggestions.length > 0) {
        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
        if (textareaRef.current) {
          const caret = getCaretCoordinates(textareaRef.current, textareaRef.current.selectionStart);
          const textareaRect = textareaRef.current.getBoundingClientRect();
          // Position the suggestion box relative to the textarea's viewport position
          // caret.top and caret.left are relative to the textarea's content, not the viewport
          setSuggestionPosition({
            top: textareaRect.top + caret.top + caret.height, // Position below the caret line
            left: textareaRect.left + caret.left,          // Position at the caret's horizontal start
          });
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const insertHashtag = (suggestion) => {
    if (!textareaRef.current) return;
    const cursorPos = textareaRef.current.selectionStart;
    const currentText = textareaRef.current.value; // Use currentText from ref for consistency
    const textBeforeCursor = currentText.substring(0, cursorPos);
    // Find the last '#' that is part of the current tag being typed
    // This needs to correctly identify the start of the tag we are replacing.
    let currentTagStart = textBeforeCursor.lastIndexOf('#');
    if (currentTagStart === -1) return; // Should not happen if suggestions are shown

    // Ensure we are replacing the correct tag, especially if multiple '#' exist
    const partBeforeTag = currentText.substring(0, currentTagStart);
    const partAfterCursor = currentText.substring(cursorPos);

    const fullSuggestion = suggestion.startsWith('#') ? suggestion : `#${suggestion}`;
    const newText = `${partBeforeTag}${fullSuggestion} ${partAfterCursor}`;
    setText(newText);
    setShowSuggestions(false);

    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newCursorPos = (partBeforeTag + fullSuggestion + " ").length;
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleSuggestionClick = (suggestion) => {
    insertHashtag(suggestion);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Tab' && showSuggestions && suggestions.length > 0) {
      e.preventDefault(); // Prevent default Tab behavior (focus change)
      insertHashtag(suggestions[0]); // Insert the first suggestion
    }
    // Optional: handle Escape key to close suggestions
    if (e.key === 'Escape' && showSuggestions) {
      setShowSuggestions(false);
    }
  };

  // Guard for no entry selected
  if (!entry) {
    return (
      <div className="text-center text-luneDarkGray mt-10">
        Select or add an entry to view/edit.
      </div>
    );
  }

  // Handle form submit (save new or updated entry)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    try {
      if (entry.id) {
        await updateEntry(entry.id, { text });
      } else {
        await createEntry({ text });
      }
      setText('');
      onSave && onSave();
    } catch (err) {
      console.error('Failed to save entry:', err);
      alert(`Failed to save entry: ${err.message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 relative">
      <textarea
        id="diary-text"
        name="text"
        ref={textareaRef}
        className="w-full border rounded p-2 mb-2 min-h-[120px]"
        value={text}
        onChange={handleTextChange}
        onKeyDown={handleKeyDown}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 150)} // Hide suggestions on blur with a small delay to allow click/tab
        placeholder="Write your thoughts..."
        required
      />
      {showSuggestions && suggestions.length > 0 && (
        <div
          className="absolute z-10 bg-white border rounded shadow-lg max-h-40 overflow-y-auto"
          // Basic positioning, consider a library for precise caret positioning if needed
          style={{ top: suggestionPosition.top, left: suggestionPosition.left, minWidth: '150px' }}
        >
          {suggestions.map((tag, index) => (
            <div
              key={index}
              className="p-2 hover:bg-luneLightGray cursor-pointer"
              onMouseDown={() => handleSuggestionClick(tag)} // Use onMouseDown to avoid blur/tab event firing first
            >
              {tag}
            </div>
          ))}
        </div>
      )}
      <button
        className="bg-lunePurple text-white px-4 py-2 rounded self-end"
        type="submit"
      >
        Save Entry
      </button>

      {entry.agent_logs && (
        <div className="mt-4 space-y-2">
          {Object.entries(entry.agent_logs).map(([agent, log]) => (
            <div key={agent} className="border rounded p-2 bg-luneGray/20">
              <h3 className="font-semibold text-sm mb-1">{agent}</h3>
              <div className="text-sm whitespace-pre-wrap">{log.reflection || log.text}</div>
            </div>
          ))}
        </div>
      )}
    </form>
  );
}

export default DiaryEditable;
