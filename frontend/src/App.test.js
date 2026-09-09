import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the Rob Ferreira HMS home page', () => {
  render(<App />);
  expect(screen.getAllByText(/Rob Ferreira/i).length).toBeGreaterThan(0);
});
