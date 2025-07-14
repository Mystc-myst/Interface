import React from 'react';
import PropTypes from 'prop-types';

function HashtagContextMenu({ x, y, onSelect, tag }) {
  const handleOptionClick = (option) => {
    onSelect(option, tag);
  };

  return (
    <div
      className="absolute bg-white rounded-md shadow-lg"
      style={{ top: y, left: x }}
    >
      <ul className="py-1">
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => handleOptionClick('open')}
        >
          Open tag
        </li>
        <li
          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
          onClick={() => handleOptionClick('delete')}
        >
          Delete tag
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
