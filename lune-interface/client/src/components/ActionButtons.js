import React from 'react';
import PropTypes from 'prop-types';

const ActionButton = ({ onClick, children }) => (
  <button
    type="button"
    onClick={onClick}
    className="w-[64px] h-[32px] rounded-full text-brazenGold border border-moonMist flex items-center justify-center transition-colors hover:bg-moonMist/10"
    style={{
      backdropFilter: 'blur(14px)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)', // Slightly more transparent base for glass effect
    }}
  >
    {children}
  </button>
);

ActionButton.propTypes = {
  onClick: PropTypes.func.isRequired,
  children: PropTypes.node.isRequired,
};

const ActionButtons = ({ onSave, navigate, openInternetModal }) => {
  return (
    <div
      className="flex flex-col justify-center gap-[6px] absolute top-1/2 -translate-y-1/2"
      style={{
        // Position to the left of a 60ch textarea (approx 30ch from center)
        // 60ch wide textarea. Half is 30ch.
        // Button width 64px. Half is 32px.
        // Gap between textarea and button column could be e.g. 16px.
        // So, left edge of button column = center - 30ch - 16px (gap)
        // And since we use translateX(-100%), 'left' refers to the right edge of the button column.
        // left: 'calc(50% - 30ch - 16px)',
        // transform: 'translate(-100%, -50%)', // This places it left of center
        // To place it relative to the start of the textarea (which is centered):
        // Textarea starts at (50% - 30ch). We want buttons to be to the left of this.
        // Buttons are 64px wide.
        // Let's try: left: 'calc(50% - 30ch - 64px - 16px)' where 16px is the gap.
        left: 'calc(50% - 30ch - 64px - 16px)', // 60ch is textarea, 64px is button width, 16px is gap
        // The above calculation positions the left edge of the button stack.
        // The parent div in DockChat is `flex items-center relative`.
        // The textarea (DiaryInput) is the central element.
        // This div should be a sibling to DiaryInput.
        // So, position it to the left of the implicit textarea block.
        // Let's simplify by assuming the parent div in DockChat is the reference for 50%.
        // The textarea itself is 60ch wide.
        // We want the buttons to be to its left, with a 16px gap.
        // So, the right edge of the buttons should be at `-(60ch / 2) - 16px` from the center of the parent.
        // Or, `left: calc(50% - 30ch - 16px - 64px)` if the parent is the viewport center.

        // Simpler: position it relative to the start of the textarea.
        // If textarea is at margin auto, this needs JS or more complex CSS.
        // Given the parent `div className="flex items-center relative">` in DockChat,
        // we can make ActionButtons a flex child that orders itself before DiaryInput.
        // For now, sticking to absolute positioning relative to the centered container.
        // This needs to be placed *outside* the textarea element, but *inside* the centered flex container.
        // The current plan has DockChat's content area as:
        // <div className="flex items-center relative">
        //   {/* ActionButtons will go here */}
        //   <DiaryInput />
        //   {/* HashtagSuggestions will go here */}
        // </div>
        // So the buttons will be positioned relative to this flex container.
        // The container itself is centered. Textarea is 60ch.
        // Buttons are 64px wide.
        // Left edge of Textarea is effectively at (container_width/2 - 30ch).
        // We want the right edge of buttons to be 16px to the left of textarea's left edge.
        // left: 'calc(50% - 30ch - 16px)', // This is where right edge of buttons should be
        // transform: 'translateX(-100%) translateY(-50%)', // X for positioning, Y for vertical centering
        // So, left style should target the button group's right edge.
        left: 'calc(50% - 30ch - 16px)', // This should be the coordinate for the *right* edge of the button column
        transform: 'translateX(-100%) translateY(-50%)', // Moves the whole column left by its own width
      }}
    >
      <ActionButton onClick={onSave}>Save</ActionButton>
      <ActionButton onClick={() => navigate('/entries')}>Entries</ActionButton>
      <ActionButton onClick={openInternetModal}>Internet</ActionButton>
    </div>
  );
};

ActionButtons.propTypes = {
  onSave: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  openInternetModal: PropTypes.func.isRequired,
};

export default ActionButtons;
