import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import EntryCard from './EntryCard';

// Mock CSS imports
jest.mock('./EntryCard.css', () => ({}));
jest.mock('../../styles/motion.css', () => ({})); // If motion.css is used by EntryCard directly or indirectly
expect.extend(toHaveNoViolations);

describe('EntryCard', () => {
  const defaultProps = {
    id: 'e1',
    title: 'Test Title',
    snippet: 'Test snippet of content.',
    date: 'Jan 1, 2024',
    isHighlighted: false,
    onClick: jest.fn(),
    onDeleteRequest: jest.fn(),
    onSetHighlight: jest.fn(),
  };

  beforeEach(() => {
    defaultProps.onClick.mockClear();
    defaultProps.onDeleteRequest.mockClear();
    defaultProps.onSetHighlight.mockClear();
  });

  test('renders title, snippet, and date, and has no a11y violations', async () => {
    const { container } = render(<EntryCard {...defaultProps} />);
    const cardElement = screen.getByRole('listitem', { name: defaultProps.title });

    expect(cardElement).toHaveAttribute('id', `entry-card-${defaultProps.id}`);
    expect(screen.getByText(defaultProps.title)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.snippet)).toBeInTheDocument();
    expect(screen.getByText(defaultProps.date)).toBeInTheDocument();
    expect(cardElement).not.toHaveClass('highlighted');
    expect(cardElement).not.toHaveAttribute('aria-current');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('applies highlighted class and aria-current when isHighlighted is true', async () => {
    const { container, rerender } = render(<EntryCard {...defaultProps} isHighlighted={true} />);
    const cardElement = screen.getByRole('listitem', { name: defaultProps.title });

    expect(cardElement).toHaveClass('highlighted');
    expect(cardElement).toHaveAttribute('aria-current', 'true');
    // Test that useEffect focuses the element (jsdom doesn't fully support focus effects like scrolling)
    // but we can check if document.activeElement is the card.
    expect(document.activeElement).toBe(cardElement);


    const results = await axe(container);
    expect(results).toHaveNoViolations();

    // Test that focus remains after re-render if still highlighted
    rerender(<EntryCard {...defaultProps} isHighlighted={true} />);
    expect(document.activeElement).toBe(cardElement);
  });


  test('calls onSetHighlight on focus', () => {
    render(<EntryCard {...defaultProps} />);
    const cardElement = screen.getByRole('listitem');
    fireEvent.focus(cardElement);
    expect(defaultProps.onSetHighlight).toHaveBeenCalledWith(defaultProps.id);
  });

  test('calls onClick handler when card is clicked', () => {
    render(<EntryCard {...defaultProps} />);
    fireEvent.click(screen.getByRole('listitem'));
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClick handler when Enter key is pressed', () => {
    render(<EntryCard {...defaultProps} />);
    const cardElement = screen.getByRole('listitem');
    fireEvent.keyDown(cardElement, { key: 'Enter', code: 'Enter' });
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClick handler when Space key is pressed', () => {
    render(<EntryCard {...defaultProps} />);
    const cardElement = screen.getByRole('listitem');
    fireEvent.keyDown(cardElement, { key: ' ', code: 'Space' });
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  describe('Delete Icon', () => {
    test('is rendered if onDeleteRequest is provided', () => {
      render(<EntryCard {...defaultProps} />);
      // Visibility is CSS based, so we just check for presence in DOM
      expect(screen.getByRole('button', { name: `Delete entry: ${defaultProps.title}` })).toBeInTheDocument();
    });

    test('is not rendered if onDeleteRequest prop is not provided', () => {
      const propsWithoutDelete = { ...defaultProps, onDeleteRequest: undefined };
      render(<EntryCard {...propsWithoutDelete} />);
      expect(screen.queryByRole('button', { name: `Delete entry: ${defaultProps.title}` })).not.toBeInTheDocument();
    });

    test('calls onDeleteRequest when clicked and stops propagation', () => {
      render(<EntryCard {...defaultProps} />);
      const deleteButton = screen.getByRole('button', { name: `Delete entry: ${defaultProps.title}` });

      fireEvent.click(deleteButton);
      expect(defaultProps.onDeleteRequest).toHaveBeenCalledWith(defaultProps.id);
      expect(defaultProps.onClick).not.toHaveBeenCalled(); // Check propagation stopped
    });
  });

  test('loop dot is present', () => {
    render(<EntryCard {...defaultProps} />);
    const cardElement = screen.getByRole('listitem');
    expect(cardElement.querySelector('.entry-card-loop-dot')).toBeInTheDocument();
  });
});
