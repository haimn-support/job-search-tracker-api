import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FilterPresets, FilterPreset } from '../FilterPresets';
import { PositionFilters, PositionStatus } from '../../../types';

// Mock localStorage
const mockLocalStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

// Mock both window.localStorage and global localStorage
Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

// Also mock the global localStorage
Object.defineProperty(global, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
});

describe('FilterPresets', () => {
  const mockOnApplyPreset = jest.fn();
  const defaultProps = {
    currentFilters: {},
    onApplyPreset: mockOnApplyPreset,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
    mockLocalStorage.setItem.mockClear();
    mockLocalStorage.removeItem.mockClear();
  });

  it('renders default presets', () => {
    render(<FilterPresets {...defaultProps} />);
    
    expect(screen.getByText('Active Applications')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
    expect(screen.getByText('Recent Applications')).toBeInTheDocument();
    expect(screen.getByText('Needs Follow-up')).toBeInTheDocument();
  });

  it('applies preset when clicked', () => {
    render(<FilterPresets {...defaultProps} />);
    
    const activeApplicationsButton = screen.getByText('Active Applications');
    fireEvent.click(activeApplicationsButton);
    
    expect(mockOnApplyPreset).toHaveBeenCalledWith({
      status: PositionStatus.APPLIED,
    });
  });

  it('shows save preset button when filters are active', () => {
    const filtersWithActive: PositionFilters = {
      search: 'developer',
      status: PositionStatus.APPLIED,
    };
    
    render(<FilterPresets {...defaultProps} currentFilters={filtersWithActive} />);
    
    expect(screen.getByText('Save as preset')).toBeInTheDocument();
  });

  it('opens save modal when save preset is clicked', () => {
    const filtersWithActive: PositionFilters = {
      search: 'developer',
    };
    
    render(<FilterPresets {...defaultProps} currentFilters={filtersWithActive} />);
    
    const saveButton = screen.getByText('Save as preset');
    fireEvent.click(saveButton);
    
    expect(screen.getByText('Save Filter Preset')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter a name for this filter preset')).toBeInTheDocument();
  });

  it('saves new preset with valid name', async () => {
    const filtersWithActive: PositionFilters = {
      search: 'developer',
      status: PositionStatus.APPLIED,
    };
    
    render(<FilterPresets {...defaultProps} currentFilters={filtersWithActive} />);
    
    // Open save modal
    const saveButton = screen.getByText('Save as preset');
    fireEvent.click(saveButton);
    
    // Enter preset name
    const nameInput = screen.getByPlaceholderText('Enter a name for this filter preset');
    fireEvent.change(nameInput, { target: { value: 'My Custom Preset' } });
    
    // Save preset
    const savePresetButton = screen.getByRole('button', { name: 'Save Preset' });
    fireEvent.click(savePresetButton);
    
    // Check localStorage was called
    await waitFor(() => {
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith(
        'position-filter-presets',
        expect.stringContaining('My Custom Preset')
      );
    });
    
    // Check that the modal is closed
    expect(screen.queryByText('Save Filter Preset')).not.toBeInTheDocument();
  });

  it('shows share button when filters are active', () => {
    const filtersWithActive: PositionFilters = {
      search: 'developer',
    };
    
    render(<FilterPresets {...defaultProps} currentFilters={filtersWithActive} />);
    
    expect(screen.getByText('Share filters')).toBeInTheDocument();
  });

  it('opens share modal when share is clicked', () => {
    const filtersWithActive: PositionFilters = {
      search: 'developer',
    };
    
    render(<FilterPresets {...defaultProps} currentFilters={filtersWithActive} />);
    
    const shareButton = screen.getByText('Share filters');
    fireEvent.click(shareButton);
    
    expect(screen.getByText('Share Filters')).toBeInTheDocument();
    expect(screen.getByText('Shareable URL')).toBeInTheDocument();
  });

  it('highlights active preset', () => {
    const activeFilters: PositionFilters = {
      status: PositionStatus.APPLIED,
    };
    
    render(<FilterPresets {...defaultProps} currentFilters={activeFilters} />);
    
    const activeButton = screen.getByText('Active Applications');
    expect(activeButton).toHaveClass('bg-blue-600', 'text-white');
  });

  it('loads saved presets from localStorage', () => {
    const savedPresets: FilterPreset[] = [
      {
        id: 'custom-1',
        name: 'My Saved Preset',
        filters: { search: 'test' },
        isDefault: false,
        created_at: new Date().toISOString(),
        usage_count: 5,
      },
    ];
    
    // Set up localStorage mock before rendering
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedPresets));
    
    render(<FilterPresets {...defaultProps} />);
    
    // Debug: Check if localStorage.getItem was called
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('position-filter-presets');
    
    // The custom preset should appear in the list
    expect(screen.getByText('My Saved Preset')).toBeInTheDocument();
  });

  it('shows usage count for frequently used presets', () => {
    const savedPresets: FilterPreset[] = [
      {
        id: 'custom-1',
        name: 'Popular Preset',
        filters: { search: 'test' },
        isDefault: false,
        created_at: new Date().toISOString(),
        usage_count: 10,
      },
    ];
    
    // Set up localStorage mock before rendering
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedPresets));
    
    render(<FilterPresets {...defaultProps} />);
    
    // Should show the preset name and usage count
    expect(screen.getByText('Popular Preset')).toBeInTheDocument();
    expect(screen.getByText('(10)')).toBeInTheDocument();
  });

  it('allows deleting custom presets', () => {
    const customFilters: PositionFilters = {
      search: 'custom search',
    };
    
    const savedPresets: FilterPreset[] = [
      {
        id: 'custom-1',
        name: 'Custom Preset',
        filters: customFilters,
        isDefault: false,
        created_at: new Date().toISOString(),
        usage_count: 1,
      },
    ];
    
    // Set up localStorage mock before rendering
    mockLocalStorage.getItem.mockReturnValue(JSON.stringify(savedPresets));
    
    render(<FilterPresets {...defaultProps} currentFilters={customFilters} />);
    
    // Should show the custom preset and delete button
    expect(screen.getByText('Custom Preset')).toBeInTheDocument();
    expect(screen.getByText('Delete preset')).toBeInTheDocument();
  });

  it('does not show delete button for default presets', () => {
    const defaultFilters: PositionFilters = {
      status: PositionStatus.APPLIED,
    };
    
    render(<FilterPresets {...defaultProps} currentFilters={defaultFilters} />);
    
    expect(screen.queryByText('Delete preset')).not.toBeInTheDocument();
  });
});