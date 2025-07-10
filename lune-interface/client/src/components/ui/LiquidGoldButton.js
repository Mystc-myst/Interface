import React from 'react';
import PropTypes from 'prop-types';

const LiquidGoldButton = ({ children, onClick, ...props }) => {
  return (
    <button className="btn-action" onClick={onClick} {...props}>
      <span className="inner">
        {children}
      </span>
    </button>
  );
};

LiquidGoldButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
};

export default LiquidGoldButton;
