import { render, screen } from '@testing-library/react';
import App from './App';

test('renders the PMS home page', () => {
  render(<App />);
  expect(screen.getAllByText(/PMS/i).length).toBeGreaterThan(0);
});
