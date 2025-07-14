import React from 'react';
import PropTypes from 'prop-types';

function HashtagContextMenu({ x, y, onSelect, tag }) {
  const handleOptionClick = (option) => {
    onSelect(option, tag);
  };

  return (
    <div
      className="context-menu"
      style={{ '--x': `${x}px`, '--y': `${y}px` }}
    >
      <ul className="py-1 text-white">
        <li
          className="px-4 py-2 hover:bg-zinc-600/80 cursor-pointer"
          onClick={() => handleOptionClick('open')}
        >
          Open #{tag.replace('#', '')}
        </li>
        <li
          className="px-4 py-2 hover:bg-red-500/80 cursor-pointer text-red-400"
          onClick={() => handleOptionClick('delete')}
        >
          Delete #{tag.replace('#', '')}
        </li>
      </ul>
    </div>
  );
}

HashtagContextMenu.propTypes = {
  x: PropTypes.number.isRequired,
  y: PropTypes.number.isRequired,
  onSelect: PropTypes.func.isRequired,
  tag: PropTypes.string.isRequired,
};

export default HashtagContextMenu;
