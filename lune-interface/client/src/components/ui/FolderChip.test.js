import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import FolderChip from './FolderChip';

// Mock CSS import
jest.mock('./FolderChip.css', () => ({}));
expect.extend(toHaveNoViolations);

describe('FolderChip', () => {
  const defaultProps = {
    folderId: 'f1',
    name: 'My Notes',
    count: 15,
    isSelected: false,
    onClick: jest.fn(),
    onDoubleClick: jest.fn(),
    onLongPress: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();
    // Clear mock function calls before each test
    defaultProps.onClick.mockClear();
    defaultProps.onDoubleClick.mockClear();
    defaultProps.onLongPress.mockClear();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders with name, count, id, and correct ARIA attributes, and has no a11y violations', async () => {
    const { container } = render(<FolderChip {...defaultProps} />);
    const chip = screen.getByRole('tab', { name: /My Notes folder, 15 entries/i });

    expect(screen.getByText('My Notes')).toBeInTheDocument();
    expect(screen.getByText('15')).toBeInTheDocument();
    expect(chip).toHaveAttribute('id', `folder-tab-${defaultProps.folderId}`);
    expect(chip).toHaveAttribute('aria-selected', 'false');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('sets aria-selected="true" when isSelected prop is true', async () => {
    const { container } = render(<FolderChip {...defaultProps} isSelected={true} />);
    const chip = screen.getByRole('tab');
    expect(chip).toHaveAttribute('aria-selected', 'true');

    const results = await axe(container); // Check a11y for selected state too
    expect(results).toHaveNoViolations();
  });


  test('calls onClick handler when clicked', () => {
    render(<FolderChip {...defaultProps} />);
    fireEvent.click(screen.getByRole('tab'));
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  test('calls onDoubleClick handler when double clicked', () => {
    render(<FolderChip {...defaultProps} />);
    fireEvent.doubleClick(screen.getByRole('tab'));
    expect(defaultProps.onDoubleClick).toHaveBeenCalledTimes(1);
  });

  test('calls onLongPress handler after 600ms mousedown without mouseup', () => {
    render(<FolderChip {...defaultProps} />);
    const chip = screen.getByRole('tab');

    fireEvent.mouseDown(chip);
    act(() => { jest.advanceTimersByTime(599); });
    expect(defaultProps.onLongPress).not.toHaveBeenCalled();

    act(() => { jest.advanceTimersByTime(1); }); // Total 600ms
    expect(defaultProps.onLongPress).toHaveBeenCalledTimes(1);

    fireEvent.mouseUp(chip); // Should clear timer
    act(() => { jest.advanceTimersByTime(600); });
    expect(defaultProps.onLongPress).toHaveBeenCalledTimes(1); // Still 1
  });

  test('does not call onLongPress if mouseup occurs before 600ms', () => {
    render(<FolderChip {...defaultProps} />);
    const chip = screen.getByRole('tab');

    fireEvent.mouseDown(chip);
    act(() => { jest.advanceTimersByTime(300); });
    fireEvent.mouseUp(chip);
    act(() => { jest.advanceTimersByTime(300); });
    expect(defaultProps.onLongPress).not.toHaveBeenCalled();
  });

  test('calls onLongPress with touch events', () => {
    render(<FolderChip {...defaultProps} />);
    const chip = screen.getByRole('tab');

    fireEvent.touchStart(chip);
    act(() => { jest.advanceTimersByTime(600); });
    expect(defaultProps.onLongPress).toHaveBeenCalledTimes(1);
    fireEvent.touchEnd(chip);
  });

  test('calls onClick when Enter key is pressed', () => {
    render(<FolderChip {...defaultProps} />);
    fireEvent.keyDown(screen.getByRole('tab'), { key: 'Enter', code: 'Enter' });
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  test('calls onClick when Space key is pressed', () => {
    render(<FolderChip {...defaultProps} />);
    fireEvent.keyDown(screen.getByRole('tab'), { key: ' ', code: 'Space' });
    expect(defaultProps.onClick).toHaveBeenCalledTimes(1);
  });

  test('calls onLongPress (delete) when Delete key is pressed and chip isSelected', () => {
    render(<FolderChip {...defaultProps} isSelected={true} />);
    fireEvent.keyDown(screen.getByRole('tab'), { key: 'Delete', code: 'Delete' });
    expect(defaultProps.onLongPress).toHaveBeenCalledTimes(1);
  });

  test('calls onLongPress (delete) when Backspace key is pressed and chip isSelected', () => {
    render(<FolderChip {...defaultProps} isSelected={true} />);
    fireEvent.keyDown(screen.getByRole('tab'), { key: 'Backspace', code: 'Backspace' });
    expect(defaultProps.onLongPress).toHaveBeenCalledTimes(1);
  });

  test('does not call onLongPress (delete) on Delete/Backspace if not isSelected', () => {
    render(<FolderChip {...defaultProps} isSelected={false} />);
    fireEvent.keyDown(screen.getByRole('tab'), { key: 'Delete', code: 'Delete' });
    fireEvent.keyDown(screen.getByRole('tab'), { key: 'Backspace', code: 'Backspace' });
    expect(defaultProps.onLongPress).not.toHaveBeenCalled();
  });


  test('is focusable and has correct ARIA role', () => {
    render(<FolderChip {...defaultProps} name="Focus Test" count={3} />);
    const chip = screen.getByRole('tab', { name: /Focus Test folder, 3 entries/i });
    chip.focus();
    expect(chip).toHaveFocus();
  });

  test('prevents context menu if onLongPress is defined', () => {
    render(<FolderChip {...defaultProps} />);
    const chip = screen.getByRole('tab');
    const contextMenuEvent = fireEvent.contextMenu(chip);
    expect(contextMenuEvent.defaultPrevented).toBe(true);
  });

  test('does not prevent context menu if onLongPress is not defined', () => {
    // Render without onLongPress
    const { onLongPress, ...propsWithoutLongPress } = defaultProps;
    render(<FolderChip {...propsWithoutLongPress} />);
    const chip = screen.getByRole('tab');
    const contextMenuEvent = fireEvent.contextMenu(chip);
    expect(contextMenuEvent.defaultPrevented).toBe(false);
  });
});
