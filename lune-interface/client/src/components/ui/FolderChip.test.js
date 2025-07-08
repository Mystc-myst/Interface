import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import FolderChip from './FolderChip';

// Mock CSS import
jest.mock('./FolderChip.css', () => ({}));
expect.extend(toHaveNoViolations);

describe('FolderChip', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders with name and count and has no a11y violations', async () => {
    const { container } = render(<FolderChip name="My Notes" count={15} />);
    expect(screen.getByText('My Notes')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /My Notes folder, 15 entries/i})).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<FolderChip name="Test" count={1} onClick={handleClick} />);
    fireEvent.click(screen.getByRole('tab'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('calls onDoubleClick handler when double clicked', () => {
    const handleDoubleClick = jest.fn();
    render(<FolderChip name="Test" count={1} onDoubleClick={handleDoubleClick} />);
    fireEvent.doubleClick(screen.getByRole('tab'));
    expect(handleDoubleClick).toHaveBeenCalledTimes(1);
  });

  test('calls onLongPress handler after 600ms mousedown without mouseup', () => {
    const handleLongPress = jest.fn();
    render(<FolderChip name="Test" count={1} onLongPress={handleLongPress} />);
    const chip = screen.getByRole('tab');

    fireEvent.mouseDown(chip);
    act(() => {
      jest.advanceTimersByTime(599);
    });
    expect(handleLongPress).not.toHaveBeenCalled(); // Not yet

    act(() => {
      jest.advanceTimersByTime(1); // Total 600ms
    });
    expect(handleLongPress).toHaveBeenCalledTimes(1);

    // Mouse up should clear timer and not call it again
    fireEvent.mouseUp(chip);
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(handleLongPress).toHaveBeenCalledTimes(1); // Still 1
  });

  test('does not call onLongPress if mouseup occurs before 600ms', () => {
    const handleLongPress = jest.fn();
    render(<FolderChip name="Test" count={1} onLongPress={handleLongPress} />);
    const chip = screen.getByRole('tab');

    fireEvent.mouseDown(chip);
    act(() => {
      jest.advanceTimersByTime(300);
    });
    fireEvent.mouseUp(chip);
    act(() => {
      jest.advanceTimersByTime(300); // Advance past 600ms total
    });
    expect(handleLongPress).not.toHaveBeenCalled();
  });

  test('calls onLongPress with touch events', () => {
    const handleLongPress = jest.fn();
    render(<FolderChip name="Test" count={1} onLongPress={handleLongPress} />);
    const chip = screen.getByRole('tab');

    fireEvent.touchStart(chip);
    act(() => {
      jest.advanceTimersByTime(600);
    });
    expect(handleLongPress).toHaveBeenCalledTimes(1);
    fireEvent.touchEnd(chip);
  });

  test('is focusable and has correct ARIA role', () => {
    render(<FolderChip name="Focus Test" count={3} />);
    const chip = screen.getByRole('tab', { name: /Focus Test folder, 3 entries/i });
    chip.focus();
    expect(chip).toHaveFocus();
  });

  test('prevents context menu if onLongPress is defined', () => {
    const onLongPress = jest.fn();
    render(<FolderChip name="Test" count={1} onLongPress={onLongPress} />);
    const chip = screen.getByRole('tab');
    const contextMenuEvent = fireEvent.contextMenu(chip);
    expect(contextMenuEvent.defaultPrevented).toBe(true);
  });

  test('does not prevent context menu if onLongPress is not defined', () => {
    render(<FolderChip name="Test" count={1} />);
    const chip = screen.getByRole('tab');
    const contextMenuEvent = fireEvent.contextMenu(chip);
    expect(contextMenuEvent.defaultPrevented).toBe(false);
  });

});
