import React, { useState } from 'react';
import PropTypes from 'prop-types';
import HashtagContextMenu from './HashtagContextMenu';

function HashtagButtons({ hashtags, onHashtagClick, onHashtagDelete, onHashtagOpen }) {
  const [contextMenu, setContextMenu] = useState(null);

  if (!hashtags || hashtags.length === 0) {
    return null; // Don't render anything if there are no hashtags
  }

  const handleContextMenu = (event, tag) => {
    event.preventDefault();
    setContextMenu({
      x: event.pageX,
      y: event.pageY,
      tag: tag,
    });
  };

  const handleContextMenuSelect = (option, tag) => {
    setContextMenu(null);
    if (option === 'open') {
      onHashtagOpen(tag);
    } else if (option === 'delete') {
      onHashtagDelete(tag);
    }
  };

  return (
    <div className="mb-4 p-3 bg-luneLightGray rounded-md shadow flex flex-wrap justify-center gap-5">
      {hashtags.map((tag) => (
        <button
          key={tag}
          type="button" // Important to prevent form submission if inside a form
          onClick={() => onHashtagClick(tag)}
          onContextMenu={(e) => handleContextMenu(e, tag)}
          className="btn-glass tag-chip" // Applied the new classes here
        >
          {tag}
        </button>
      ))}
      {contextMenu && (
        <HashtagContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onSelect={handleContextMenuSelect}
          tag={contextMenu.tag}
        />
      )}
    </div>
  );
}

HashtagButtons.propTypes = {
  hashtags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onHashtagClick: PropTypes.func.isRequired,
  onHashtagDelete: PropTypes.func.isRequired,
  onHashtagOpen: PropTypes.func.isRequired,
};

export default HashtagButtons;

