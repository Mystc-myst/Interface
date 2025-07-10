import React from 'react';

const LiquidGoldButton = ({ children, onClick, ...props }) => {
  return (
    <button className="btn-action" onClick={onClick} {...props}>
      <span className="inner">
        {children}
      </span>
    </button>
  );
};

export default LiquidGoldButton;
