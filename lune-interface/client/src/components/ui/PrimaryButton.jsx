import React from 'react';
import './PrimaryButton.css';

const PrimaryButton = ({ children, onClick, type = 'button', ...props }) => {
  return (
    <button
      type={type}
      className="primary-button"
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default PrimaryButton;
