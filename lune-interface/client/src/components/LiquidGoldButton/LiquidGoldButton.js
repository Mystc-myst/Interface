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

// Define PropTypes: Ensures children and onClick are provided, type and className are optional strings.
LiquidGoldButton.propTypes = {
  /** Content to be rendered inside the button */
  children: PropTypes.node.isRequired,
  /** Function to call when the button is clicked */
  onClick: PropTypes.func.isRequired,
  /** HTML button type attribute */
  type: PropTypes.string,
  /** Additional CSS classes to apply to the button */
  className: PropTypes.string,
};

// Define defaultProps: Sets default values for type and className if not provided.
LiquidGoldButton.defaultProps = {
  type: "button",
  className: '',
};

export default LiquidGoldButton;
