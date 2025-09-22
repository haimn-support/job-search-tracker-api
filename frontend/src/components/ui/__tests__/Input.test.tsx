import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { Input } from '../Input';

describe('Input Component', () => {
  it('renders with default props', () => {
    render(<Input />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeInTheDocument();
    expect(input).toHaveClass('border-gray-300');
  });

  it('renders with label', () => {
    render(<Input label="Email Address" />);
    
    const input = screen.getByLabelText(/email address/i);
    expect(input).toBeInTheDocument();
    
    const label = screen.getByText(/email address/i);
    expect(label).toBeInTheDocument();
  });

  it('renders with placeholder', () => {
    render(<Input placeholder="Enter your email" />);
    
    const input = screen.getByPlaceholderText(/enter your email/i);
    expect(input).toBeInTheDocument();
  });

  it('shows error state', () => {
    render(<Input error="This field is required" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('border-red-500');
    
    const errorMessage = screen.getByText(/this field is required/i);
    expect(errorMessage).toBeInTheDocument();
    expect(errorMessage).toHaveClass('text-red-600');
    expect(errorMessage).toHaveAttribute('role', 'alert');
  });

  it('shows required indicator', () => {
    render(<Input label="Name" required />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
    
    const requiredIndicator = screen.getByText('*');
    expect(requiredIndicator).toBeInTheDocument();
    expect(requiredIndicator).toHaveClass('text-red-500');
  });

  it('handles disabled state', () => {
    render(<Input disabled />);
    
    const input = screen.getByRole('textbox');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('handles different input types', () => {
    const { rerender } = render(<Input type="email" />);
    
    let input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('type', 'email');
    
    rerender(<Input type="password" />);
    // Password inputs don't have a specific role, so we get by type
    input = document.querySelector('input[type="password"]') as HTMLInputElement;
    expect(input).toHaveAttribute('type', 'password');
    
    rerender(<Input type="number" />);
    input = screen.getByRole('spinbutton');
    expect(input).toHaveAttribute('type', 'number');
  });

  it('handles value changes', async () => {
    const handleChange = jest.fn();
    const user = userEvent.setup();
    
    render(<Input onChange={handleChange} />);
    
    const input = screen.getByRole('textbox');
    await user.type(input, 'test value');
    
    expect(handleChange).toHaveBeenCalled();
    expect(input).toHaveValue('test value');
  });

  it('handles controlled input', () => {
    const { rerender } = render(<Input value="initial" onChange={() => {}} />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveValue('initial');
    
    rerender(<Input value="updated" onChange={() => {}} />);
    expect(input).toHaveValue('updated');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();
    
    render(
      <div>
        <Input data-testid="input1" />
        <Input data-testid="input2" />
      </div>
    );
    
    const input1 = screen.getByTestId('input1');
    const input2 = screen.getByTestId('input2');
    
    input1.focus();
    expect(input1).toHaveFocus();
    
    await user.tab();
    expect(input2).toHaveFocus();
  });

  it('has proper ARIA attributes', () => {
    render(
      <Input 
        label="Email" 
        error="Invalid email" 
        required 
        aria-describedby="email-help"
      />
    );
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('aria-describedby', 'email-help');
  });

  it('passes accessibility tests', async () => {
    const { container } = render(
      <div>
        <Input label="Name" />
        <Input label="Email" type="email" required />
        <Input label="Password" type="password" />
        <Input label="Disabled" disabled />
        <Input label="Error" error="This field has an error" />
      </div>
    );
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('applies custom className', () => {
    render(<Input className="custom-input" />);
    
    const input = screen.getByRole('textbox');
    expect(input).toHaveClass('custom-input');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    
    render(<Input ref={ref} />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('handles focus and blur events', async () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    const user = userEvent.setup();
    
    render(<Input onFocus={handleFocus} onBlur={handleBlur} />);
    
    const input = screen.getByRole('textbox');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalledTimes(1);
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalledTimes(1);
  });

  it('shows helper text', () => {
    render(<Input label="Password" helperText="Must be at least 8 characters" />);
    
    const helperText = screen.getByText(/must be at least 8 characters/i);
    expect(helperText).toBeInTheDocument();
    expect(helperText).toHaveClass('text-gray-500');
  });
});