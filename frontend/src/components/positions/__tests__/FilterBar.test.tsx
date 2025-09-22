import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { FilterBar } from '../FilterBar';
import { PositionFilters, PositionStatus } from '../../../types';

// Mock the react-router-dom hooks
const mockSetSearchParams = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
}));

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('FilterBar', () => {
  const mockOnFiltersChange = jest.fn();
  const defaultProps = {
    filters: {},
    onFiltersChange: mockOnFiltersChange,
    resultCount: 10,
    loading: false,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders search input and filter controls', () => {
    renderWithRouter(<FilterBar {...defaultProps} />);
    
    expect(screen.getByPlaceholderText(/search positions/i)).toBeInTheDocument();
    expect(screen.getByText(/filter by status/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/filter by company/i)).toBeInTheDocument();
    expect(screen.getByText(/advanced/i)).toBeInTheDocument();
  });

  it('displays result count', () => {
    renderWithRouter(<FilterBar {...defaultProps} resultCount={5} />);
    
    expect(screen.getByText('5 positions found')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    renderWithRouter(<FilterBar {...defaultProps} loading={true} />);
    
    expect(screen.getByText(/searching/i)).toBeInTheDocument();
  });

  it('calls onFiltersChange when search input changes', async () => {
    renderWithRouter(<FilterBar {...defaultProps} />);
    
    const searchInput = screen.getByPlaceholderText(/search positions/i);
    fireEvent.change(searchInput, { target: { value: 'developer' } });
    
    // Wait for debounced search
    await waitFor(() => {
      expect(mockOnFiltersChange).toHaveBeenCalledWith({
        search: 'developer',
      });
    }, { timeout: 500 });
  });

  it('calls onFiltersChange when status filter changes', () => {
    renderWithRouter(<FilterBar {...defaultProps} />);
    
    const statusSelect = screen.getByRole('combobox');
    fireEvent.change(statusSelect, { target: { value: PositionStatus.APPLIED } });
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({
      status: PositionStatus.APPLIED,
    });
  });

  it('shows active filter count', () => {
    const filtersWithActive: PositionFilters = {
      search: 'developer',
      status: PositionStatus.APPLIED,
    };
    
    renderWithRouter(
      <FilterBar {...defaultProps} filters={filtersWithActive} />
    );
    
    expect(screen.getByText('2 filters active')).toBeInTheDocument();
  });

  it('shows clear filters button when filters are active', () => {
    const filtersWithActive: PositionFilters = {
      search: 'developer',
    };
    
    renderWithRouter(
      <FilterBar {...defaultProps} filters={filtersWithActive} />
    );
    
    expect(screen.getByText(/clear all filters/i)).toBeInTheDocument();
  });

  it('clears all filters when clear button is clicked', () => {
    const filtersWithActive: PositionFilters = {
      search: 'developer',
      status: PositionStatus.APPLIED,
    };
    
    renderWithRouter(
      <FilterBar {...defaultProps} filters={filtersWithActive} />
    );
    
    const clearButton = screen.getByText(/clear all filters/i);
    fireEvent.click(clearButton);
    
    expect(mockOnFiltersChange).toHaveBeenCalledWith({});
  });

  it('shows advanced filters when toggle is clicked', () => {
    renderWithRouter(<FilterBar {...defaultProps} />);
    
    const advancedButton = screen.getByText(/advanced/i);
    fireEvent.click(advancedButton);
    
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument();
    expect(screen.getByText(/import/i)).toBeInTheDocument();
  });

  it('shows presets when presets toggle is clicked', () => {
    renderWithRouter(<FilterBar {...defaultProps} />);
    
    const presetsButton = screen.getByText(/presets/i);
    fireEvent.click(presetsButton);
    
    expect(screen.getByText(/active applications/i)).toBeInTheDocument();
    expect(screen.getByText(/in progress/i)).toBeInTheDocument();
  });
});