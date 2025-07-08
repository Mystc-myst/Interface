import React from 'react';
import PropTypes from 'prop-types';

function HashtagButtons({ hashtags, onHashtagClick }) {
  if (!hashtags || hashtags.length === 0) {
    return null; // Don't render anything if there are no hashtags
  }

  return (
    <div className="mb-2 flex flex-wrap gap-2">
      {hashtags.map((tag) => (
        <button
          key={tag}
          type="button" // Important to prevent form submission if inside a form
          onClick={() => onHashtagClick(tag)}
          className="px-3 py-1 bg-luneSecondary text-luneText rounded-full text-sm hover:bg-lunePurple focus:outline-none focus:ring-2 focus:ring-lunePurple-dark focus:ring-opacity-50 transition-colors duration-150"
        >
          {tag}
        </button>
      ))}
    </div>
  );
}

HashtagButtons.propTypes = {
  hashtags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onHashtagClick: PropTypes.func.isRequired,
};

export default HashtagButtons;
