import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { PositionCard } from '../PositionCard';
import { createMockPosition, createMockInterview } from '../../../test-utils/test-data';
import { PositionStatus, InterviewType, InterviewPlace, InterviewOutcome } from '../../../types';

describe('PositionCard Component', () => {
  const mockOnEdit = jest.fn();
  const mockOnDelete = jest.fn();
  const mockOnAddInterview = jest.fn();

  const defaultPosition = createMockPosition({
    title: 'Frontend Developer',
    company: 'Tech Corp',
    status: PositionStatus.APPLIED,
    application_date: '2023-01-15',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders position information correctly', () => {
    render(
      <PositionCard
        position={defaultPosition}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    expect(screen.getByText('Frontend Developer')).toBeInTheDocument();
    expect(screen.getByText('Tech Corp')).toBeInTheDocument();
    expect(screen.getByText('Applied')).toBeInTheDocument();
    expect(screen.getByText('Applied Jan 15, 2023')).toBeInTheDocument();
  });

  it('displays status badge with correct styling', () => {
    const { rerender } = render(
      <PositionCard
        position={{ ...defaultPosition, status: PositionStatus.APPLIED }}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    let statusBadge = screen.getByText('Applied');
    expect(statusBadge).toHaveClass('bg-blue-100', 'text-blue-800');

    rerender(
      <PositionCard
        position={{ ...defaultPosition, status: PositionStatus.INTERVIEWING }}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    statusBadge = screen.getByText('Interviewing');
    expect(statusBadge).toHaveClass('bg-purple-100', 'text-purple-800');

    rerender(
      <PositionCard
        position={{ ...defaultPosition, status: PositionStatus.OFFER }}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    statusBadge = screen.getByText('Offer');
    expect(statusBadge).toHaveClass('bg-green-100', 'text-green-800');

    rerender(
      <PositionCard
        position={{ ...defaultPosition, status: PositionStatus.REJECTED }}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    statusBadge = screen.getByText('Rejected');
    expect(statusBadge).toHaveClass('bg-red-100', 'text-red-800');
  });

  it('shows interview preview when interviews exist', () => {
    const interview = createMockInterview({
      type: InterviewType.TECHNICAL,
      scheduled_date: '2023-02-01T10:00:00Z',
      outcome: InterviewOutcome.PENDING,
    });

    const positionWithInterview = {
      ...defaultPosition,
      interviews: [interview],
    };

    render(
      <PositionCard
        position={positionWithInterview}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    expect(screen.getByText('1 interview')).toBeInTheDocument();
    expect(screen.getByText('Technical')).toBeInTheDocument();
    expect(screen.getByText('Feb 1, 12:00 PM')).toBeInTheDocument();
  });

  it('shows multiple interviews count', () => {
    const interviews = [
      createMockInterview({ type: InterviewType.TECHNICAL }),
      createMockInterview({ type: InterviewType.BEHAVIORAL }),
    ];

    const positionWithInterviews = {
      ...defaultPosition,
      interviews,
    };

    render(
      <PositionCard
        position={positionWithInterviews}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    expect(screen.getByText('2 interviews')).toBeInTheDocument();
  });

  it('shows "Add Interview" button when no interviews exist', () => {
    render(
      <PositionCard
        position={defaultPosition}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    const addButton = screen.getByRole('button', { name: /add first interview/i });
    expect(addButton).toBeInTheDocument();
  });

  it('calls onAddInterview when "Add Interview" button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PositionCard
        position={defaultPosition}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    const addButton = screen.getByRole('button', { name: /add first interview/i });
    await user.click(addButton);

    expect(mockOnAddInterview).toHaveBeenCalledWith(defaultPosition.id);
  });

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PositionCard
        position={defaultPosition}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    // Open the menu first
    const menuButton = screen.getByRole('button', { name: /position options menu/i });
    await user.click(menuButton);
    
    const editButton = screen.getByRole('button', { name: /edit position/i });
    await user.click(editButton);

    expect(mockOnEdit).toHaveBeenCalledWith(defaultPosition);
  });

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PositionCard
        position={defaultPosition}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    // Open the menu first
    const menuButton = screen.getByRole('button', { name: /position options menu/i });
    await user.click(menuButton);
    
    const deleteButton = screen.getByRole('button', { name: /delete position/i });
    await user.click(deleteButton);

    expect(mockOnDelete).toHaveBeenCalledWith(defaultPosition.id);
  });

  it('highlights overdue interviews', () => {
    const overdueInterview = createMockInterview({
      scheduled_date: '2023-01-01T10:00:00Z', // Past date
      outcome: InterviewOutcome.PENDING,
    });

    const positionWithOverdueInterview = {
      ...defaultPosition,
      interviews: [overdueInterview],
    };

    render(
      <PositionCard
        position={positionWithOverdueInterview}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    const interviewPreview = screen.getByTestId('interview-preview');
    expect(interviewPreview).toHaveClass('border-red-200', 'bg-red-50');
  });

  it('highlights today\'s interviews', () => {
    const todayInterview = createMockInterview({
      scheduled_date: new Date().toISOString(),
      outcome: InterviewOutcome.PENDING,
    });

    const positionWithTodayInterview = {
      ...defaultPosition,
      interviews: [todayInterview],
    };

    render(
      <PositionCard
        position={positionWithTodayInterview}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    const interviewPreview = screen.getByTestId('interview-preview');
    expect(interviewPreview).toHaveClass('border-yellow-200', 'bg-yellow-50');
  });

  it('supports keyboard navigation', async () => {
    const user = userEvent.setup();

    render(
      <PositionCard
        position={defaultPosition}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    const card = screen.getByRole('article');
    
    // Open the menu to access edit/delete buttons
    const menuButton = screen.getByRole('button', { name: /position options menu/i });
    await user.click(menuButton);
    
    const editButton = screen.getByRole('button', { name: /edit position/i });
    const deleteButton = screen.getByRole('button', { name: /delete position/i });
    const addButton = screen.getByRole('button', { name: /add interview for/i });

    // Tab through interactive elements
    await user.tab();
    expect(editButton).toHaveFocus();

    await user.tab();
    expect(addButton).toHaveFocus();

    await user.tab();
    expect(deleteButton).toHaveFocus();
  });

  it('has proper ARIA attributes', async () => {
    render(
      <PositionCard
        position={defaultPosition}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    const card = screen.getByRole('article');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Frontend Developer'));

    // Open the menu to access edit/delete buttons
    const user = userEvent.setup();
    const menuButton = screen.getByRole('button', { name: /position options menu/i });
    await user.click(menuButton);

    const editButton = screen.getByRole('button', { name: /edit position/i });
    expect(editButton).toHaveAttribute('aria-label', 'Edit position Frontend Developer');

    const deleteButton = screen.getByRole('button', { name: /delete position/i });
    expect(deleteButton).toHaveAttribute('aria-label', 'Delete position Frontend Developer');
  });

  it('passes accessibility tests', async () => {
    const { container } = render(
      <PositionCard
        position={defaultPosition}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('shows salary range when available', () => {
    const positionWithSalary = {
      ...defaultPosition,
      salary_range: '$80,000 - $120,000',
    };

    render(
      <PositionCard
        position={positionWithSalary}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    expect(screen.getByText('$80,000 - $120,000')).toBeInTheDocument();
  });

  it('shows location when available', () => {
    const positionWithLocation = {
      ...defaultPosition,
      location: 'San Francisco, CA',
    };

    render(
      <PositionCard
        position={positionWithLocation}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    expect(screen.getByText('San Francisco, CA')).toBeInTheDocument();
  });

  it('handles hover effects', async () => {
    const user = userEvent.setup();

    render(
      <PositionCard
        position={defaultPosition}
        onEdit={mockOnEdit}
        onDelete={mockOnDelete}
        onAddInterview={mockOnAddInterview}
      />
    );

    const card = screen.getByRole('article');

    await user.hover(card);
    expect(card).toHaveClass('hover:shadow-lg');

    await user.unhover(card);
    expect(card).toHaveClass('shadow-sm');
  });
});