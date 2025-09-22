import React from 'react';
import { render, screen } from '@testing-library/react';
import LoginFormSimple from '../LoginFormSimple';

describe('LoginFormSimple Component', () => {
  it('renders basic form elements', () => {
    render(<LoginFormSimple />);
    
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });
});