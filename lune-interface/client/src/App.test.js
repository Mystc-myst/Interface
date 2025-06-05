import { render, screen } from '@testing-library/react';
import App from './App';

test('renders lune diary heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/lune diary./i);
  expect(headingElement).toBeInTheDocument();
});
