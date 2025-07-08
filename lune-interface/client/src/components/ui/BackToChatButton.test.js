import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import BackToChatButton from './BackToChatButton';

// Mock CSS import
jest.mock('./BackToChatButton.css', () => ({}));
expect.extend(toHaveNoViolations);

describe('BackToChatButton', () => {
  const buttonId = "back-to-chat-button";

  // Helper to simulate scroll event
  const simulateScroll = (scrollY) => {
    global.window.scrollY = scrollY;
    fireEvent.scroll(global.window);
  };

  beforeEach(() => {
    jest.useFakeTimers();
    global.window.scrollY = 0; // Reset scroll position
  });

  afterEach(() => {
    // Ensure all timers are cleared and real timers are restored
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders button with correct id, text, icon, and has no a11y violations initially hidden', async () => {
    const { container } = render(<BackToChatButton id={buttonId} />);
    const button = screen.getByRole('button', { name: /Back to Chat/i });
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('id', buttonId);
    expect(screen.getByText('↩')).toBeInTheDocument(); // Icon
    expect(button).not.toHaveClass('visible');

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('becomes visible after scrolling >100px and 1000ms delay, and has no a11y violations when visible', async () => {
    const { container } = render(<BackToChatButton id={buttonId} />);
    const button = screen.getByRole('button', { name: /Back to Chat/i });

    expect(button).not.toHaveClass('visible');

    // Simulate scroll down
    act(() => { simulateScroll(200); });

    // Advance time by 999ms
    act(() => { jest.advanceTimersByTime(999); });
    expect(button).not.toHaveClass('visible'); // Still not visible

    // Advance time by 1ms to cross the 1000ms threshold
    act(() => { jest.advanceTimersByTime(1); });
    expect(button).toHaveClass('visible');

    // Check a11y when visible
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('calls onClick handler when clicked (after becoming visible)', () => {
    const handleClick = jest.fn();
    render(<BackToChatButton id={buttonId} onClick={handleClick} />);
    const button = screen.getByRole('button', { name: /Back to Chat/i });

    // Make it visible
    act(() => {
      simulateScroll(200);
      jest.advanceTimersByTime(1000); // Advance by the full delay
    });
    expect(button).toHaveClass('visible');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('hides again when scrolled to top (scrollY <= 100)', () => {
    render(<BackToChatButton id={buttonId} />);
    const button = screen.getByRole('button', { name: /Back to Chat/i });

    // Make it visible
    act(() => {
      simulateScroll(200);
      jest.advanceTimersByTime(1000);
    });
    expect(button).toHaveClass('visible');

    // Scroll back to top
    act(() => {
      simulateScroll(50); // scrollY <= 100
      // The component should set isVisible to false immediately,
      // and clear the timeout. The fade-out animation is CSS based.
    });
    expect(button).not.toHaveClass('visible');
  });

  test('clears timeout on unmount', () => {
    const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
    const { unmount } = render(<BackToChatButton id={buttonId} />);

    // Trigger the timeout setup
    act(() => { simulateScroll(200); });

    unmount();
    expect(clearTimeoutSpy).toHaveBeenCalledTimes(1); // Or more, if multiple timeouts were set and cleared.
                                                     // The important part is that it's called on unmount for the active timer.
    clearTimeoutSpy.mockRestore();
  });
});
