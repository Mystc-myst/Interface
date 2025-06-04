import { render, screen } from '@testing-library/react';
import App from './App';

test('renders dock chat heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/dock chat/i);
  expect(headingElement).toBeInTheDocument();
});
