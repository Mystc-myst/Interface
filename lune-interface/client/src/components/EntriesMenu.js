import React, { useState } from 'react';

function EntriesMenu({ entries, onSelect, onNew, onDelete }) {
  const [search, setSearch] = useState('');

  // Filter entries by search term
  const filtered = (Array.isArray(entries) ? entries : []).filter(e =>
    (e.text || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex mb-2">
        <input
          id="entries-search"
          name="search"
          autoComplete="off"
          className="flex-1 border rounded p-2 mr-2"
          placeholder="Search..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button
          className="bg-luneGreen text-white px-3 py-1 rounded"
          onClick={onNew}
          aria-label="Create new diary entry"
        >
          New Entry
        </button>
      </div>
      <div className="overflow-y-auto max-h-[70vh]">
        {filtered.map(entry => (
          <div
            key={entry._id || entry.id || Math.random()}
            className="p-2 border-b flex justify-between items-start hover:bg-lunePurple/10"
          >
            <div
              className="flex-1 cursor-pointer"
              tabIndex={0}
              role="button"
              onClick={() => onSelect(entry)}
              onKeyPress={e => (e.key === 'Enter' || e.key === ' ') && onSelect(entry)}
              aria-label={`Select diary entry from ${entry.timestamp ? new Date(entry.timestamp).toLocaleDateString() : 'Unknown date'}`}
            >
              <div className="text-xs text-luneDarkGray">
                {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'No Date'}
              </div>
              <div className="truncate">{entry.text || '[No Content]'}</div>
            </div>
            <div className="flex gap-2">
              <button
                className="text-lunePurple text-sm"
                onClick={() => onSelect(entry)}
              >
                Edit
              </button>
              <button
                className="text-red-600 text-sm"
                onClick={() => onDelete && onDelete(entry.id || entry._id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-luneDarkGray mt-4 text-center">No entries found.</div>
        )}
      </div>
    </div>
  );
}

export default EntriesMenu;
