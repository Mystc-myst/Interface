import React, { useState, useEffect, useRef } from 'react';

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
        const response = await fetch('/diary/hashtags');
        if (response.ok) {
          const data = await response.json();
          setAllHashtags(data);
        } else {
          console.error('Failed to fetch hashtags');
        }
      } catch (err) {
        console.error('Error fetching hashtags:', err);
      }
    };
    fetchHashtags();
  }, []);

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);

    const cursorPos = e.target.selectionStart;
    const textBeforeCursor = newText.substring(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');
    const lastSpaceIndex = textBeforeCursor.lastIndexOf(' ');

    if (lastHashIndex !== -1 && lastHashIndex > lastSpaceIndex) {
      const currentTag = textBeforeCursor.substring(lastHashIndex + 1);
      const filteredSuggestions = allHashtags.filter(tag =>
        tag.toLowerCase().startsWith(`#${currentTag.toLowerCase()}`) || tag.toLowerCase().startsWith(currentTag.toLowerCase())
      );

      if (filteredSuggestions.length > 0) {
        setSuggestions(filteredSuggestions);
        setShowSuggestions(true);
        // Calculate position - this is a simplified example
        // You might need a more robust way to get caret position in pixels
        if (textareaRef.current) {
          // This is a placeholder for actual caret position calculation
          // A library like 'textarea-caret' might be needed for accuracy
          const textareaRect = textareaRef.current.getBoundingClientRect();
          setSuggestionPosition({ top: textareaRect.bottom, left: textareaRect.left });
        }
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    const cursorPos = textareaRef.current.selectionStart;
    const textBeforeCursor = text.substring(0, cursorPos);
    const lastHashIndex = textBeforeCursor.lastIndexOf('#');

    if (lastHashIndex !== -1) {
      const textAfterCursor = text.substring(cursorPos);
      const textBeforeHash = text.substring(0, lastHashIndex);
      // Ensure the suggestion starts with #, if not, prepend it.
      const fullSuggestion = suggestion.startsWith('#') ? suggestion : `#${suggestion}`;
      const newText = `${textBeforeHash}${fullSuggestion} ${textAfterCursor}`;
      setText(newText);
      setShowSuggestions(false);
      // Focus and set cursor position after the inserted hashtag
      setTimeout(() => {
        if (textareaRef.current) {
          textareaRef.current.focus();
          const newCursorPos = (textBeforeHash + fullSuggestion + " ").length;
          textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
        }
      }, 0);
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
      if (entry._id) {
        await fetch(`/diary/${entry._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      } else {
        await fetch('/diary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text }),
        });
      }
      setText('');
      onSave && onSave();
    } catch (err) {
      console.error('Failed to save entry:', err);
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
        onBlur={() => setTimeout(() => setShowSuggestions(false), 100)} // Hide suggestions on blur with a small delay
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
              onMouseDown={() => handleSuggestionClick(tag)} // Use onMouseDown to avoid blur event firing first
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
