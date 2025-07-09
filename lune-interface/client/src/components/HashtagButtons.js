import React from 'react';
import PropTypes from 'prop-types';

function HashtagButtons({ hashtags, onHashtagClick }) {
  if (!hashtags || hashtags.length === 0) {
    return null; // Don't render anything if there are no hashtags
  }

  return (
    <div className="mb-4 p-3 bg-luneLightGray rounded-md shadow flex flex-wrap justify-center gap-5">
      {hashtags.map((tag) => (
        <button
          key={tag}
          type="button" // Important to prevent form submission if inside a form
          onClick={() => onHashtagClick(tag)}
          className="btn-liquid-gold-translucent" // Applied the new class here
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

