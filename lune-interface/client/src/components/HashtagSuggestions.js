import React from 'react';
import PropTypes from 'prop-types';

const HashtagChip = ({ tag, onClick }) => (
  <button
    type="button"
    onClick={() => onClick(tag)}
    className="w-[48px] h-[48px] rounded-[8px] border border-moonMist flex items-center justify-center text-moonMist transition-transform duration-150 ease-in-out hover:scale-105"
    style={{
      backdropFilter: 'blur(14px)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)', // Slightly more transparent base for glass effect
    }}
    title={tag} // Show full tag on hover if it's truncated
  >
    {/* Display first few chars of tag, or an icon. For now, just text. */}
    <span className="truncate text-xs p-1">{tag.startsWith('#') ? tag.substring(1, 4) : tag.substring(0,3)}</span>
  </button>
);

HashtagChip.propTypes = {
  tag: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
};

const HashtagSuggestions = ({ hashtags, onHashtagClick }) => {
  if (!hashtags || hashtags.length === 0) {
    return null;
  }

  // Take top three hashtags
  const suggestions = hashtags.slice(0, 3);

  return (
    <div
      className="flex flex-col justify-center gap-[8px] absolute top-1/2 -translate-y-1/2"
      style={{
        // Position to the right of a 60ch textarea
        // Textarea's right edge is at (center + 30ch).
        // We want the left edge of hashtag chips to be 16px to the right of textarea's right edge.
        // So, `left` style targets the button group's left edge.
        left: 'calc(50% + 30ch + 16px)',
        transform: 'translateY(-50%)', // Only Y transform needed as `left` targets the left edge
      }}
    >
      {suggestions.map((tag) => (
        <HashtagChip key={tag} tag={tag} onClick={onHashtagClick} />
      ))}
    </div>
  );
};

HashtagSuggestions.propTypes = {
  hashtags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onHashtagClick: PropTypes.func.isRequired,
};

export default HashtagSuggestions;
