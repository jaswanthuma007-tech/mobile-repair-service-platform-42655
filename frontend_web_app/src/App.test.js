import { render, screen } from '@testing-library/react';
import App from './App';

test('renders landing page hero headline', () => {
  render(<App />);
  expect(screen.getByText(/Doorstep device repairs/i)).toBeInTheDocument();
});
