import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import BackToChatButton from './BackToChatButton';

// Mock CSS import
jest.mock('./BackToChatButton.css', () => ({}));
expect.extend(toHaveNoViolations);

describe('BackToChatButton', () => {
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
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  test('renders button with correct text and icon, and has no a11y violations initially hidden', async () => {
    const { container } = render(<BackToChatButton />);
    const button = screen.getByRole('button', { name: /Back to Chat/i });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('↩')).toBeInTheDocument(); // Icon
    expect(button).not.toHaveClass('visible'); // Initially hidden or starts transition from hidden

    const results = await axe(container);
    // jest-axe might report issues on initially hidden interactive elements if not handled carefully.
    // We expect it to be not visible to pointer events initially.
    // Depending on CSS, it might be fine. Let's check.
    expect(results).toHaveNoViolations();
  });

  test('becomes visible after scrolling and delay', () => {
    render(<BackToChatButton />);
    const button = screen.getByRole('button', { name: /Back to Chat/i });

    expect(button).not.toHaveClass('visible');

    act(() => {
      simulateScroll(200); // Scroll down
    });
    // Wait for the timeout inside the component (e.g., 600ms)
    act(() => {
      jest.advanceTimersByTime(599);
    });
    expect(button).not.toHaveClass('visible'); // Still not visible

    act(() => {
      jest.advanceTimersByTime(1); // Cross the 600ms threshold
    });
    expect(button).toHaveClass('visible');
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<BackToChatButton onClick={handleClick} />);
    const button = screen.getByRole('button', { name: /Back to Chat/i });

    // Make it visible for the click test
    act(() => {
      simulateScroll(200);
      jest.advanceTimersByTime(600);
    });
    expect(button).toHaveClass('visible');

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('hides again when scrolled to top', () => {
    render(<BackToChatButton />);
    const button = screen.getByRole('button', { name: /Back to Chat/i });

    // Make it visible
    act(() => {
      simulateScroll(200);
      jest.advanceTimersByTime(600);
    });
    expect(button).toHaveClass('visible');

    // Scroll back to top
    act(() => {
      simulateScroll(0);
      // Visibility change should be immediate if scrollY < 100, timeout is cleared
      // jest.advanceTimersByTime(100); // Ensure any potential debounce/throttle has passed
    });
     expect(button).not.toHaveClass('visible');
  });
});
