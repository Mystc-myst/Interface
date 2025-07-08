import { render, screen } from '@testing-library/react';
import App from './App';

test('renders lune diary heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/lune diary./i);
  expect(headingElement).toBeInTheDocument();
});

test('body has the correct radial gradient background', () => {
  render(<App />);
  const bodyStyles = window.getComputedStyle(document.body);
  // Check for the presence of the starting color of the gradient
  expect(bodyStyles.backgroundImage).toContain('radial-gradient');
  expect(bodyStyles.backgroundImage).toContain('#5b2eff'); // Hex code for violet-deep, ensure case-insensitivity if necessary
  // We could also check for the ending color #050409, but starting color is a good indicator.
});
