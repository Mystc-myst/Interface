import React from 'react';
import PropTypes from 'prop-types'; // Import PropTypes
import styles from './LiquidGoldButton.module.css';

const LiquidGoldButton = ({ children, onClick, type = "button", className = '', ...props }) => {
  // Combine local module styles with any passed-in className
  const buttonClasses = `${styles.btnAction} ${className}`;

  return (
    <button type={type} className={buttonClasses} onClick={onClick} {...props}>
      <span className={styles.inner}>
        {children}
      </span>
    </button>
  );
};

// Define PropTypes
LiquidGoldButton.propTypes = {
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func.isRequired,
  type: PropTypes.string,
  className: PropTypes.string,
};

// Define defaultProps for non-required props that have defaults in destructuring
LiquidGoldButton.defaultProps = {
  type: "button",
  className: '',
};

export default LiquidGoldButton;
