import React from 'react';
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

export default LiquidGoldButton;
