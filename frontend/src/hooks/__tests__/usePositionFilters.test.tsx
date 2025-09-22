import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { usePositionFilters } from '../usePositionFilters';
import { PositionStatus } from '../../types';

// Mock react-router-dom
const mockSetSearchParams = jest.fn();
let mockSearchParams = new URLSearchParams();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useSearchParams: () => [mockSearchParams, mockSetSearchParams],
}));

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('usePositionFilters', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSearchParams = new URLSearchParams();
  });

  it('initializes with empty filters', () => {
    const { result } = renderHook(() => usePositionFilters(), { wrapper });
    
    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('updates filters correctly', () => {
    const { result } = renderHook(() => usePositionFilters(), { wrapper });
    
    act(() => {
      result.current.setFilters({
        search: 'developer',
        status: PositionStatus.APPLIED,
      });
    });
    
    expect(result.current.filters).toEqual({
      search: 'developer',
      status: PositionStatus.APPLIED,
    });
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.activeFilterCount).toBe(2);
  });

  it('updates single filter correctly', () => {
    const { result } = renderHook(() => usePositionFilters(), { wrapper });
    
    act(() => {
      result.current.updateFilter('search', 'engineer');
    });
    
    expect(result.current.filters).toEqual({
      search: 'engineer',
    });
    expect(result.current.hasActiveFilters).toBe(true);
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('removes filter when value is empty', () => {
    const { result } = renderHook(() => usePositionFilters(), { wrapper });
    
    // Set initial filter
    act(() => {
      result.current.setFilters({
        search: 'developer',
        status: PositionStatus.APPLIED,
      });
    });
    
    // Remove search filter
    act(() => {
      result.current.updateFilter('search', '');
    });
    
    expect(result.current.filters).toEqual({
      status: PositionStatus.APPLIED,
    });
    expect(result.current.activeFilterCount).toBe(1);
  });

  it('clears all filters', () => {
    const { result } = renderHook(() => usePositionFilters(), { wrapper });
    
    // Set initial filters
    act(() => {
      result.current.setFilters({
        search: 'developer',
        status: PositionStatus.APPLIED,
        company: 'Google',
      });
    });
    
    expect(result.current.activeFilterCount).toBe(3);
    
    // Clear all filters
    act(() => {
      result.current.clearFilters();
    });
    
    expect(result.current.filters).toEqual({});
    expect(result.current.hasActiveFilters).toBe(false);
    expect(result.current.activeFilterCount).toBe(0);
  });

  it('updates URL when filters change', () => {
    const { result } = renderHook(() => usePositionFilters(), { wrapper });
    
    act(() => {
      result.current.setFilters({
        search: 'developer',
        status: PositionStatus.APPLIED,
      });
    });
    
    expect(mockSetSearchParams).toHaveBeenCalledWith(
      expect.any(URLSearchParams),
      { replace: true }
    );
  });
});