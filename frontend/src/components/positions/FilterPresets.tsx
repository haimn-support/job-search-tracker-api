import React, { useState, useEffect } from 'react';
import {
  BookmarkIcon,
  PlusIcon,
  TrashIcon,
  ShareIcon,
  DocumentDuplicateIcon,
} from '@heroicons/react/24/outline';
import { BookmarkIcon as BookmarkSolidIcon } from '@heroicons/react/24/solid';
import { Button, Input, Modal } from '../ui';
import { PositionFilters, PositionStatus } from '../../types';
import { cn } from '../../utils';

export interface FilterPreset {
  id: string;
  name: string;
  filters: PositionFilters;
  isDefault?: boolean;
  created_at: string;
  usage_count: number;
}

interface FilterPresetsProps {
  currentFilters: PositionFilters;
  onApplyPreset: (filters: PositionFilters) => void;
  className?: string;
}

const DEFAULT_PRESETS: FilterPreset[] = [
  {
    id: 'active-applications',
    name: 'Active Applications',
    filters: {
      status: PositionStatus.APPLIED,
    },
    isDefault: true,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'in-progress',
    name: 'In Progress',
    filters: {
      status: PositionStatus.INTERVIEWING,
    },
    isDefault: true,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'recent-applications',
    name: 'Recent Applications',
    filters: {
      date_from: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Last 7 days
    },
    isDefault: true,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
  {
    id: 'needs-follow-up',
    name: 'Needs Follow-up',
    filters: {
      status: PositionStatus.SCREENING,
    },
    isDefault: true,
    created_at: new Date().toISOString(),
    usage_count: 0,
  },
];

export const FilterPresets: React.FC<FilterPresetsProps> = ({
  currentFilters,
  onApplyPreset,
  className,
}) => {
  const [presets, setPresets] = useState<FilterPreset[]>([]);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset | null>(null);
  const [presetName, setPresetName] = useState('');
  const [shareUrl, setShareUrl] = useState('');

  // Load presets from localStorage on mount
  useEffect(() => {
    const savedPresets = localStorage.getItem('position-filter-presets');
    if (savedPresets) {
      try {
        const parsed = JSON.parse(savedPresets);
        setPresets([...DEFAULT_PRESETS, ...parsed]);
      } catch (error) {
        console.error('Failed to parse saved presets:', error);
        setPresets(DEFAULT_PRESETS);
      }
    } else {
      setPresets(DEFAULT_PRESETS);
    }
  }, []);

  // Save presets to localStorage
  const savePresetsToStorage = (newPresets: FilterPreset[]) => {
    const customPresets = newPresets.filter(p => !p.isDefault);
    localStorage.setItem('position-filter-presets', JSON.stringify(customPresets));
  };

  // Check if current filters match any preset
  const getMatchingPreset = () => {
    return presets.find(preset => {
      const presetKeys = Object.keys(preset.filters);
      const currentKeys = Object.keys(currentFilters);
      
      if (presetKeys.length !== currentKeys.length) return false;
      
      return presetKeys.every(key => {
        const presetValue = preset.filters[key as keyof PositionFilters];
        const currentValue = currentFilters[key as keyof PositionFilters];
        return presetValue === currentValue;
      });
    });
  };

  const matchingPreset = getMatchingPreset();

  // Save current filters as a new preset
  const handleSavePreset = () => {
    if (!presetName.trim()) return;

    const newPreset: FilterPreset = {
      id: `custom-${Date.now()}`,
      name: presetName.trim(),
      filters: { ...currentFilters },
      isDefault: false,
      created_at: new Date().toISOString(),
      usage_count: 0,
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
    
    setPresetName('');
    setShowSaveModal(false);
  };

  // Delete a custom preset
  const handleDeletePreset = (presetId: string) => {
    const updatedPresets = presets.filter(p => p.id !== presetId);
    setPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
  };

  // Apply a preset
  const handleApplyPreset = (preset: FilterPreset) => {
    // Update usage count
    const updatedPresets = presets.map(p => 
      p.id === preset.id 
        ? { ...p, usage_count: p.usage_count + 1 }
        : p
    );
    setPresets(updatedPresets);
    savePresetsToStorage(updatedPresets);
    
    onApplyPreset(preset.filters);
  };

  // Generate shareable URL
  const handleSharePreset = (preset: FilterPreset) => {
    const params = new URLSearchParams();
    Object.entries(preset.filters).forEach(([key, value]) => {
      if (value) params.set(key, value);
    });
    
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    setShareUrl(url);
    setSelectedPreset(preset);
    setShowShareModal(true);
  };

  // Copy URL to clipboard
  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  };

  // Check if current filters have any values
  const hasActiveFilters = Object.values(currentFilters).some(value => 
    value !== undefined && value !== ''
  );

  return (
    <div className={cn('space-y-2', className)}>
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-2">
        {presets
          .sort((a, b) => b.usage_count - a.usage_count) // Sort by usage
          .slice(0, 6) // Show top 6 presets
          .map((preset) => {
            const isActive = matchingPreset?.id === preset.id;
            return (
              <Button
                key={preset.id}
                variant={isActive ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => handleApplyPreset(preset)}
                className={cn(
                  'flex items-center gap-1.5',
                  isActive && 'bg-blue-600 text-white'
                )}
              >
                {isActive ? (
                  <BookmarkSolidIcon className="h-3 w-3" />
                ) : (
                  <BookmarkIcon className="h-3 w-3" />
                )}
                {preset.name}
                {preset.usage_count > 0 && (
                  <span className="text-xs opacity-75">
                    ({preset.usage_count})
                  </span>
                )}
              </Button>
            );
          })}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSaveModal(true)}
            className="text-blue-600 hover:text-blue-700"
          >
            <PlusIcon className="h-4 w-4 mr-1" />
            Save as preset
          </Button>
        )}

        {matchingPreset && !matchingPreset.isDefault && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDeletePreset(matchingPreset.id)}
            className="text-red-600 hover:text-red-700"
          >
            <TrashIcon className="h-4 w-4 mr-1" />
            Delete preset
          </Button>
        )}

        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleSharePreset({ 
              id: 'current', 
              name: 'Current Filters', 
              filters: currentFilters,
              created_at: new Date().toISOString(),
              usage_count: 0
            })}
            className="text-gray-600 hover:text-gray-700"
          >
            <ShareIcon className="h-4 w-4 mr-1" />
            Share filters
          </Button>
        )}
      </div>

      {/* Save Preset Modal */}
      <Modal
        isOpen={showSaveModal}
        onClose={() => {
          setShowSaveModal(false);
          setPresetName('');
        }}
        title="Save Filter Preset"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="preset-name" className="block text-sm font-medium text-gray-700 mb-1">
              Preset Name
            </label>
            <Input
              id="preset-name"
              type="text"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              placeholder="Enter a name for this filter preset"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSavePreset();
                }
              }}
            />
          </div>

          <div className="bg-gray-50 p-3 rounded-md">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Current Filters:</h4>
            <div className="space-y-1 text-sm text-gray-600">
              {Object.entries(currentFilters).map(([key, value]) => (
                <div key={key} className="flex justify-between">
                  <span className="capitalize">{key.replace('_', ' ')}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => {
                setShowSaveModal(false);
                setPresetName('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleSavePreset}
              disabled={!presetName.trim()}
            >
              Save Preset
            </Button>
          </div>
        </div>
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={showShareModal}
        onClose={() => {
          setShowShareModal(false);
          setShareUrl('');
          setSelectedPreset(null);
        }}
        title="Share Filters"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Shareable URL
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={shareUrl}
                readOnly
                className="flex-1"
              />
              <Button
                variant="ghost"
                onClick={handleCopyUrl}
                className="flex-shrink-0"
              >
                <DocumentDuplicateIcon className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Anyone with this URL will see the same filtered results
            </p>
          </div>

          {selectedPreset && (
            <div className="bg-gray-50 p-3 rounded-md">
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                Filters in "{selectedPreset.name}":
              </h4>
              <div className="space-y-1 text-sm text-gray-600">
                {Object.entries(selectedPreset.filters).map(([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key.replace('_', ' ')}:</span>
                    <span className="font-medium">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end">
            <Button
              variant="primary"
              onClick={() => {
                setShowShareModal(false);
                setShareUrl('');
                setSelectedPreset(null);
              }}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FilterPresets;