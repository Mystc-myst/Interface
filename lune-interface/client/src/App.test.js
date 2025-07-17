import { render, screen } from '@testing-library/react';
import App from './App';

test('shows activation button on initial load', () => {
  render(<App />);
  expect(screen.getByRole('button', { name: /activate diary/i })).toBeInTheDocument();
});

test('renders theme toggle button', () => {
  render(<App />);
  expect(screen.getByLabelText(/toggle dark\/light mode/i)).toBeInTheDocument();
});
