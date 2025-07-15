import React from 'react';

import PropTypes from 'prop-types';

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

TagSidebar.propTypes = {
  tagIndex: PropTypes.object.isRequired,
  onSelect: PropTypes.func.isRequired,
};

export default TagSidebar;
