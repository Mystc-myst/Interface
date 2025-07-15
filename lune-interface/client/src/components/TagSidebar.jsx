import React from 'react';

function TagSidebar({ tagIndex, onSelect }) {
  const tags = Object.keys(tagIndex).sort();

  if (tags.length === 0) {
    return null;
  }

  return (
    <aside>
      <h3>Tags</h3>
      <ul>
        {tags.map(tag => (
          <li key={tag}>
            <button onClick={() => onSelect(tag)}>
              #{tag} ({tagIndex[tag].length})
            </button>
          </li>
        ))}
      </ul>
    </aside>
  );
}

export default TagSidebar;
