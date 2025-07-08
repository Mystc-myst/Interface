import React from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import './GoToEntriesButton.css';

const GoToEntriesButton = ({ id }) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/entries');
  };

  return (
    <button
      id={id}
      className="go-to-entries-button" // Will add 'visible' if we re-introduce scroll logic, for now always visible
      onClick={handleClick}
      aria-label="View all entries"
    >
      <span className="go-to-entries-text">Go to Entries</span>
      <span className="go-to-entries-icon" aria-hidden="true">→</span>
    </button>
  );
};

GoToEntriesButton.propTypes = {
  id: PropTypes.string.isRequired,
};

GoToEntriesButton.defaultProps = {
  id: 'go-to-entries-btn', // Default ID if not provided
};

export default GoToEntriesButton;
