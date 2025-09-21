import { render, screen } from '@testing-library/react';
import App from './App';

test('renders interview position tracker heading', () => {
  render(<App />);
  const headingElement = screen.getByText(/interview position tracker/i);
  expect(headingElement).toBeInTheDocument();
});

test('renders welcome message', () => {
  render(<App />);
  const welcomeElement = screen.getByText(
    /welcome to your job application management system/i
  );
  expect(welcomeElement).toBeInTheDocument();
});
