import React from 'react';
import PropTypes from 'prop-types';

function HashtagEntriesModal({ isOpen, onClose, hashtag, entries, onSelectEntry }) {
  if (!isOpen || !hashtag) {
    return null;
  }

  const filteredEntries = entries.filter(entry => entry.hashtags && entry.hashtags.includes(hashtag));

  // Simple function to get a snippet of text
  const getSnippet = (text, maxLength = 100) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-center items-center z-50 p-4">
      <div className="bg-slate-800 p-6 rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-lunePurple font-literata">
            Entries for <span className="text-luneGold">{hashtag}</span>
          </h2>
          <button
            onClick={onClose}
            className="text-luneLightGray hover:text-white text-2xl font-bold"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {filteredEntries.length > 0 ? (
          <ul className="space-y-3 overflow-y-auto no-scrollbar flex-grow">
            {filteredEntries.map((entry) => (
              <li key={entry.id}>
                <button
                  onClick={() => {
                    onSelectEntry(entry.id);
                    onClose();
                  }}
                  className="w-full text-left p-3 bg-slate-700 hover:bg-lunePurple/30 rounded-md transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-lunePurple"
                >
                  <p className="text-sm text-slate-300 mb-1">
                    {new Date(entry.timestamp).toLocaleString()}
                  </p>
                  <p className="text-luneText">{getSnippet(entry.text)}</p>
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-luneDarkGray text-center py-4">No entries found for this hashtag.</p>
        )}

        <button
            onClick={onClose}
            className="mt-6 bg-luneRed hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-md transition-colors duration-150 self-center"
        >
            Close
        </button>
      </div>
    </div>
  );
}

HashtagEntriesModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  hashtag: PropTypes.string,
  entries: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.string.isRequired,
    text: PropTypes.string.isRequired,
    timestamp: PropTypes.string.isRequired,
    hashtags: PropTypes.arrayOf(PropTypes.string),
  })).isRequired,
  onSelectEntry: PropTypes.func.isRequired,
};

export default HashtagEntriesModal;
