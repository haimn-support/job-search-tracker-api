import { expect } from '@jest/globals';

// Custom matcher to check if element has loading state
expect.extend({
  toHaveLoadingState(received: HTMLElement) {
    const hasLoadingClass = received.classList.contains('loading') || 
                           received.classList.contains('animate-pulse') ||
                           received.classList.contains('animate-spin');
    
    const hasLoadingAttribute = received.getAttribute('aria-busy') === 'true' ||
                               received.getAttribute('data-loading') === 'true';
    
    const hasLoadingText = received.textContent?.includes('Loading') ||
                          received.textContent?.includes('loading');
    
    const hasSpinner = received.querySelector('.spinner') !== null ||
                      received.querySelector('[data-testid="spinner"]') !== null;
    
    const isLoading = hasLoadingClass || hasLoadingAttribute || hasLoadingText || hasSpinner;
    
    if (isLoading) {
      return {
        message: () => `Expected element not to have loading state`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected element to have loading state`,
        pass: false,
      };
    }
  },

  // Custom matcher to check if element is accessible
  toBeAccessible(received: HTMLElement) {
    const issues: string[] = [];
    
    // Check for proper ARIA attributes
    if (received.tagName === 'BUTTON' && !received.getAttribute('aria-label') && !received.textContent?.trim()) {
      issues.push('Button missing accessible label');
    }
    
    if (received.tagName === 'INPUT' && !received.getAttribute('aria-label') && !received.getAttribute('aria-labelledby')) {
      const id = received.getAttribute('id');
      const hasLabel = id && document.querySelector(`label[for="${id}"]`);
      if (!hasLabel) {
        issues.push('Input missing accessible label');
      }
    }
    
    // Check for proper focus indicators
    const styles = window.getComputedStyle(received);
    if (received.matches(':focus') && styles.outline === 'none' && !styles.boxShadow.includes('focus')) {
      issues.push('Element missing focus indicator');
    }
    
    // Check for proper color contrast (basic check)
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    if (color === backgroundColor && color !== 'rgba(0, 0, 0, 0)') {
      issues.push('Poor color contrast detected');
    }
    
    if (issues.length === 0) {
      return {
        message: () => `Expected element not to be accessible`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected element to be accessible. Issues found: ${issues.join(', ')}`,
        pass: false,
      };
    }
  },

  // Custom matcher to check if element has error state
  toHaveErrorState(received: HTMLElement) {
    const hasErrorClass = received.classList.contains('error') || 
                         received.classList.contains('border-red-500') ||
                         received.classList.contains('text-red-500');
    
    const hasErrorAttribute = received.getAttribute('aria-invalid') === 'true' ||
                             received.getAttribute('data-error') === 'true';
    
    const hasErrorRole = received.getAttribute('role') === 'alert';
    
    const isError = hasErrorClass || hasErrorAttribute || hasErrorRole;
    
    if (isError) {
      return {
        message: () => `Expected element not to have error state`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected element to have error state`,
        pass: false,
      };
    }
  },

  // Custom matcher to check if form is valid
  toBeValidForm(received: HTMLFormElement) {
    const invalidInputs = received.querySelectorAll('input:invalid, select:invalid, textarea:invalid');
    const requiredEmptyInputs = received.querySelectorAll('input[required]:not([value]), select[required]:not([value]), textarea[required]:empty');
    
    if (invalidInputs.length === 0 && requiredEmptyInputs.length === 0) {
      return {
        message: () => `Expected form not to be valid`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected form to be valid. Found ${invalidInputs.length} invalid inputs and ${requiredEmptyInputs.length} empty required inputs`,
        pass: false,
      };
    }
  },

  // Custom matcher to check if element is visible
  toBeVisible(received: HTMLElement) {
    const styles = window.getComputedStyle(received);
    const isVisible = styles.display !== 'none' && 
                     styles.visibility !== 'hidden' && 
                     styles.opacity !== '0' &&
                     received.offsetWidth > 0 &&
                     received.offsetHeight > 0;
    
    if (isVisible) {
      return {
        message: () => `Expected element not to be visible`,
        pass: true,
      };
    } else {
      return {
        message: () => `Expected element to be visible`,
        pass: false,
      };
    }
  },
});

// Type declarations for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveLoadingState(): R;
      toBeAccessible(): R;
      toHaveErrorState(): R;
      toBeValidForm(): R;
      toBeVisible(): R;
    }
  }
}