import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { axe, toHaveNoViolations } from 'jest-axe';
import PrimaryButton from './PrimaryButton';

// Mock the CSS import
jest.mock('./PrimaryButton.css', () => ({}));
expect.extend(toHaveNoViolations);

describe('PrimaryButton', () => {
  test('renders with children and has no a11y violations', async () => {
    const { container } = render(<PrimaryButton>Test Button</PrimaryButton>);
    expect(screen.getByRole('button', { name: /Test Button/i })).toBeInTheDocument();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  test('calls onClick handler when clicked', () => {
    const handleClick = jest.fn();
    render(<PrimaryButton onClick={handleClick}>Click Me</PrimaryButton>);
    fireEvent.click(screen.getByRole('button', { name: /Click Me/i }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('applies type attribute correctly', () => {
    render(<PrimaryButton type="submit">Submit</PrimaryButton>);
    expect(screen.getByRole('button', { name: /Submit/i })).toHaveAttribute('type', 'submit');
  });

  test('defaults to type="button" if no type is provided', () => {
    render(<PrimaryButton>Default Type</PrimaryButton>);
    expect(screen.getByRole('button', { name: /Default Type/i })).toHaveAttribute('type', 'button');
  });

  test('is focusable and can be triggered by keyboard', async () => {
    const handleClick = jest.fn();
    render(<PrimaryButton onClick={handleClick}>Focus Me</PrimaryButton>);
    const button = screen.getByRole('button', { name: /Focus Me/i });

    button.focus();
    expect(button).toHaveFocus();

    const user = userEvent.setup();
    await user.keyboard('{Enter}');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('passes through other HTML button attributes', () => {
    render(<PrimaryButton aria-label="Custom Action">Aria Button</PrimaryButton>);
    expect(screen.getByRole('button', { name: /Custom Action/i })).toHaveAttribute('aria-label', 'Custom Action');
  });

  test('is disabled when disabled prop is true', () => {
    const handleClick = jest.fn();
    render(<PrimaryButton onClick={handleClick} disabled>Disabled Button</PrimaryButton>);
    const button = screen.getByRole('button', { name: /Disabled Button/i });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(handleClick).not.toHaveBeenCalled();
  });

  // Testing :hover or :focus-visible for transform: scale(1.04) is not straightforward
  // with Jest and RTL for styles applied via external CSS pseudo-classes.
  // This would typically be covered by visual regression tests or Storybook interaction tests.
  // We can ensure the button is focusable, which is a prerequisite for :focus-visible.
  test('receives focus', () => {
    render(<PrimaryButton>Focus Test</PrimaryButton>);
    const button = screen.getByRole('button', { name: /Focus Test/i });
    button.focus();
    expect(button).toHaveFocus();
  });

});
