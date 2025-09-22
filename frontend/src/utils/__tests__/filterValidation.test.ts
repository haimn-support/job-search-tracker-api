import {
  validateFilters,
  suggestFilterImprovements,
  optimizeFilters,
  describeFilters,
  areFiltersEqual,
  mergeFilters,
} from '../filterValidation';
import { PositionFilters, PositionStatus } from '../../types';

describe('filterValidation', () => {
  describe('validateFilters', () => {
    it('validates correct date range', () => {
      const filters: PositionFilters = {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('detects invalid date range order', () => {
      const filters: PositionFilters = {
        date_from: '2024-01-31',
        date_to: '2024-01-01',
      };

      const result = validateFilters(filters);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Start date must be before or equal to end date');
    });

    it('warns about future dates', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 30);
      
      const filters: PositionFilters = {
        date_from: futureDate.toISOString().split('T')[0],
      };

      const result = validateFilters(filters);
      expect(result.warnings).toContain('You have selected future dates. Most applications are in the past.');
    });

    it('warns about very old dates', () => {
      const veryOldDate = new Date();
      veryOldDate.setFullYear(veryOldDate.getFullYear() - 2);
      
      const filters: PositionFilters = {
        date_to: veryOldDate.toISOString().split('T')[0],
      };

      const result = validateFilters(filters);
      expect(result.warnings).toContain('You are filtering for very old applications. Consider expanding your date range.');
    });

    it('suggests removing company filter for rejected status', () => {
      const filters: PositionFilters = {
        status: PositionStatus.REJECTED,
        company: 'Google',
      };

      const result = validateFilters(filters);
      expect(result.suggestions).toContain('Consider removing company filter when looking at rejected applications to see patterns across companies.');
    });

    it('warns about too specific search', () => {
      const filters: PositionFilters = {
        search: 'senior software engineer react typescript remote',
      };

      const result = validateFilters(filters);
      expect(result.warnings).toContain('Your search might be too specific. Try using fewer keywords.');
    });
  });

  describe('suggestFilterImprovements', () => {
    it('suggests broadening criteria when no results', () => {
      const filters: PositionFilters = {
        status: PositionStatus.APPLIED,
        company: 'Google',
      };

      const suggestions = suggestFilterImprovements(filters, 0);
      expect(suggestions).toContain('No results found. Try removing some filters or broadening your search criteria.');
    });

    it('suggests adding filters when too many results', () => {
      const filters: PositionFilters = {};

      const suggestions = suggestFilterImprovements(filters, 100);
      expect(suggestions).toContain('Consider filtering by status to narrow down your results.');
    });

    it('provides positive feedback for good results', () => {
      const filters: PositionFilters = {
        status: PositionStatus.APPLIED,
      };

      const suggestions = suggestFilterImprovements(filters, 10);
      expect(suggestions).toContain('Great! These are your active applications. Consider following up on older ones.');
    });
  });

  describe('optimizeFilters', () => {
    it('trims whitespace from search and company', () => {
      const filters: PositionFilters = {
        search: '  developer  ',
        company: '  Google  ',
      };

      const optimized = optimizeFilters(filters);
      expect(optimized.search).toBe('developer');
      expect(optimized.company).toBe('Google');
    });

    it('removes empty values', () => {
      const filters: PositionFilters = {
        search: '',
        company: 'Google',
        status: PositionStatus.APPLIED,
      };

      const optimized = optimizeFilters(filters);
      expect(optimized.search).toBeUndefined();
      expect(optimized.company).toBe('Google');
      expect(optimized.status).toBe(PositionStatus.APPLIED);
    });

    it('fixes date range order', () => {
      const filters: PositionFilters = {
        date_from: '2024-01-31',
        date_to: '2024-01-01',
      };

      const optimized = optimizeFilters(filters);
      expect(optimized.date_from).toBe('2024-01-01');
      expect(optimized.date_to).toBe('2024-01-31');
    });
  });

  describe('describeFilters', () => {
    it('describes empty filters', () => {
      const filters: PositionFilters = {};
      const description = describeFilters(filters);
      expect(description).toBe('showing all positions');
    });

    it('describes single filter', () => {
      const filters: PositionFilters = {
        status: PositionStatus.APPLIED,
      };
      const description = describeFilters(filters);
      expect(description).toBe('applied positions');
    });

    it('describes multiple filters', () => {
      const filters: PositionFilters = {
        search: 'developer',
        status: PositionStatus.APPLIED,
        company: 'Google',
      };
      const description = describeFilters(filters);
      expect(description).toContain('searching for "developer"');
      expect(description).toContain('applied positions');
      expect(description).toContain('at Google');
    });

    it('describes date range', () => {
      const filters: PositionFilters = {
        date_from: '2024-01-01',
        date_to: '2024-01-31',
      };
      const description = describeFilters(filters);
      expect(description).toContain('applied between');
    });
  });

  describe('areFiltersEqual', () => {
    it('returns true for identical filters', () => {
      const filters1: PositionFilters = {
        search: 'developer',
        status: PositionStatus.APPLIED,
      };
      const filters2: PositionFilters = {
        search: 'developer',
        status: PositionStatus.APPLIED,
      };

      expect(areFiltersEqual(filters1, filters2)).toBe(true);
    });

    it('returns false for different filters', () => {
      const filters1: PositionFilters = {
        search: 'developer',
        status: PositionStatus.APPLIED,
      };
      const filters2: PositionFilters = {
        search: 'engineer',
        status: PositionStatus.APPLIED,
      };

      expect(areFiltersEqual(filters1, filters2)).toBe(false);
    });

    it('returns false for different number of filters', () => {
      const filters1: PositionFilters = {
        search: 'developer',
      };
      const filters2: PositionFilters = {
        search: 'developer',
        status: PositionStatus.APPLIED,
      };

      expect(areFiltersEqual(filters1, filters2)).toBe(false);
    });
  });

  describe('mergeFilters', () => {
    it('merges multiple filter sets', () => {
      const filters1: PositionFilters = {
        search: 'developer',
      };
      const filters2: PositionFilters = {
        status: PositionStatus.APPLIED,
      };
      const filters3: PositionFilters = {
        company: 'Google',
      };

      const merged = mergeFilters(filters1, filters2, filters3);
      expect(merged).toEqual({
        search: 'developer',
        status: PositionStatus.APPLIED,
        company: 'Google',
      });
    });

    it('handles conflicting values by using last one', () => {
      const filters1: PositionFilters = {
        search: 'developer',
        status: PositionStatus.APPLIED,
      };
      const filters2: PositionFilters = {
        search: 'engineer',
        company: 'Google',
      };

      const merged = mergeFilters(filters1, filters2);
      expect(merged.search).toBe('engineer');
      expect(merged.status).toBe(PositionStatus.APPLIED);
      expect(merged.company).toBe('Google');
    });

    it('ignores empty values', () => {
      const filters1: PositionFilters = {
        search: 'developer',
        company: '',
      };
      const filters2: PositionFilters = {
        status: PositionStatus.APPLIED,
      };

      const merged = mergeFilters(filters1, filters2);
      expect(merged.company).toBeUndefined();
      expect(merged.search).toBe('developer');
      expect(merged.status).toBe(PositionStatus.APPLIED);
    });
  });
});