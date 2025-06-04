import { render, screen } from '@testing-library/react';
import App from './App';

test('renders diary heading and new entry button', () => {
  render(<App />);
  const headingElement = screen.getByText(/lune diary/i);
  expect(headingElement).toBeInTheDocument();
  const newButton = screen.getByRole('button', { name: /create new diary entry/i });
  expect(newButton).toBeInTheDocument();
});
