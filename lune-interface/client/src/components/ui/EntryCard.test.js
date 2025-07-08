import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import EntryCard from './EntryCard';

// Mock CSS imports
jest.mock('./EntryCard.css', () => ({}));
jest.mock('../../styles/motion.css', () => ({}));
expect.extend(toHaveNoViolations);

describe('EntryCard', () => {
  const defaultProps = {
    title: 'Test Title',
    snippet: 'Test snippet of content.',
    date: 'Jan 1, 2024',
    onClick: jest.fn(),
    onDelete: jest.fn(),
  };

  beforeEach(() => {
    defaultProps.onClick.mockClear();
    defaultProps.onDelete.mockClear();
  });

  test('renders title, snippet, and date, and has no a11y violations', async () => {
    const { container } = render(<EntryCard {...defaultProps} />);
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.snippet)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.date)).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('has role="listitem" and is focusable', () => {
    render(<EntryCard {...defaultProps} />);
    const cardElement = screen.getByRole('listitem');
    expect(cardElement).toBeInTheDocument();
    cardElement.focus();
    expect(cardElement).toHaveFocus();
  });

  test('calls onClick handler when card is clicked', () => {
    render(<EntryCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('listitem'));
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClick handler when Enter key is pressed on a focused card', () => {
    render(<EntryCard {...defaultProps} />);
    const cardElement = screen.getByRole('listitem');
    cardElement.focus();
    fireEvent.keyDown(cardElement, { key: 'Enter', code: 'Enter' });
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClick handler when Space key is pressed on a focused card', () => {
    render(<EntryCard {...defaultProps} />);
    const cardElement = screen.getByRole('listitem');
    cardElement.focus();
    fireEvent.keyDown(cardElement, { key: ' ', code: 'Space' });
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  describe('Delete Icon', () => {
    test('is not visible by default if onDelete is provided', () => {
      render(<EntryCard {...defaultProps} />);
      // The icon is conditionally rendered based on isHovered state, so it won't be in the DOM initially.
      expect(screen.queryByRole('button', { name: /Delete entry/i })).not.toBeInTheDocument();
    });

    test('becomes visible on mouseEnter and calls onDelete when clicked', () => {
      render(<EntryCard {...defaultProps} />);
      const cardElement = screen.getByRole('listitem');

      fireEvent.mouseEnter(cardElement);
      const deleteButton = screen.getByRole('button', { name: /Delete entry/i });
      expect(deleteButton).toBeInTheDocument();

      fireEvent.click(deleteButton);
      expect(defaultProps.onDelete).toHaveBeenCalledTimes(1);
      // Ensure card's onClick was not called due to event propagation
      expect(defaultProps.onClick).not.toHaveBeenCalled();
    });

    test('is hidden on mouseLeave', () => {
      render(<EntryCard {...defaultProps} />);
      const cardElement = screen.getByRole('listitem');

      fireEvent.mouseEnter(cardElement);
      expect(screen.getByRole('button', { name: /Delete entry/i })).toBeInTheDocument();

      fireEvent.mouseLeave(cardElement);
      expect(screen.queryByRole('button', { name: /Delete entry/i })).not.toBeInTheDocument();
    });

    test('is not rendered if onDelete prop is not provided', () => {
      const propsWithoutDelete = { ...defaultProps, onDelete: undefined };
      render(<EntryCard {...propsWithoutDelete} />);
      const cardElement = screen.getByRole('listitem');

      fireEvent.mouseEnter(cardElement);
      expect(screen.queryByRole('button', { name: /Delete entry/i })).not.toBeInTheDocument();
    });
  });

  test('loop dot is present', () => {
    render(<EntryCard {...defaultProps} />);
    // The loop dot is a div with a specific class, not interactive itself.
    // We can check for its presence if it has a unique identifier or test its container.
    // For now, assuming its presence if the card renders. A more specific test might involve
    // checking its computed style for the animation if that were easily testable in JSDOM,
    // or giving it a data-testid.
    // Simple check:
    const cardElement = screen.getByRole('listitem');
    expect(cardElement.querySelector('.entry-card-loop-dot')).toBeInTheDocument();
  });
});
