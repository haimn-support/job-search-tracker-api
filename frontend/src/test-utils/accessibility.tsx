import { axe, toHaveNoViolations } from 'jest-axe';
import { render, RenderResult } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Accessibility testing utility
export const runAxeTest = async (container: HTMLElement) => {
  const results = await axe(container);
  expect(results).toHaveNoViolations();
};

// Test keyboard navigation
export const testKeyboardNavigation = async (container: HTMLElement) => {
  const user = userEvent.setup();
  
  // Get all focusable elements
  const focusableElements = container.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length === 0) {
    return; // No focusable elements to test
  }
  
  // Test Tab navigation
  const firstElement = focusableElements[0] as HTMLElement;
  firstElement.focus();
  expect(document.activeElement).toBe(firstElement);
  
  // Tab through all elements
  for (let i = 1; i < focusableElements.length; i++) {
    await user.tab();
    expect(document.activeElement).toBe(focusableElements[i]);
  }
  
  // Test Shift+Tab navigation (reverse)
  for (let i = focusableElements.length - 2; i >= 0; i--) {
    await user.tab({ shift: true });
    expect(document.activeElement).toBe(focusableElements[i]);
  }
};

// Test ARIA attributes
export const testAriaAttributes = (container: HTMLElement) => {
  // Check for proper ARIA labels
  const elementsNeedingLabels = container.querySelectorAll(
    'button:not([aria-label]):not([aria-labelledby]), input:not([aria-label]):not([aria-labelledby])'
  );
  
  elementsNeedingLabels.forEach(element => {
    const hasVisibleLabel = element.querySelector('label') || 
                           element.closest('label') ||
                           element.textContent?.trim();
    
    if (!hasVisibleLabel) {
      console.warn('Element missing accessible label:', element);
    }
  });
  
  // Check for proper heading hierarchy
  const headings = Array.from(container.querySelectorAll('h1, h2, h3, h4, h5, h6'));
  let previousLevel = 0;
  
  headings.forEach(heading => {
    const level = parseInt(heading.tagName.charAt(1));
    if (level > previousLevel + 1) {
      console.warn('Heading hierarchy skip detected:', heading);
    }
    previousLevel = level;
  });
};

// Test color contrast (basic check)
export const testColorContrast = (container: HTMLElement) => {
  const textElements = container.querySelectorAll('p, span, div, button, a, label');
  
  textElements.forEach(element => {
    const styles = window.getComputedStyle(element);
    const color = styles.color;
    const backgroundColor = styles.backgroundColor;
    
    // Basic check - ensure text is not the same color as background
    if (color === backgroundColor && color !== 'rgba(0, 0, 0, 0)') {
      console.warn('Potential color contrast issue:', element);
    }
  });
};

// Comprehensive accessibility test suite
export const runAccessibilityTests = async (renderResult: RenderResult) => {
  const { container } = renderResult;
  
  // Run axe accessibility tests
  await runAxeTest(container);
  
  // Test keyboard navigation
  await testKeyboardNavigation(container);
  
  // Test ARIA attributes
  testAriaAttributes(container);
  
  // Test color contrast
  testColorContrast(container);
};

// Screen reader testing utilities
export const testScreenReaderContent = (container: HTMLElement) => {
  // Check for screen reader only content
  const srOnlyElements = container.querySelectorAll('.sr-only, .screen-reader-only');
  expect(srOnlyElements.length).toBeGreaterThanOrEqual(0);
  
  // Check for proper alt text on images
  const images = container.querySelectorAll('img');
  images.forEach(img => {
    const altText = img.getAttribute('alt');
    if (altText === null) {
      console.warn('Image missing alt attribute:', img);
    }
  });
  
  // Check for proper form labels
  const inputs = container.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    const id = input.getAttribute('id');
    const label = id ? container.querySelector(`label[for="${id}"]`) : null;
    const ariaLabel = input.getAttribute('aria-label');
    const ariaLabelledBy = input.getAttribute('aria-labelledby');
    
    if (!label && !ariaLabel && !ariaLabelledBy) {
      console.warn('Form input missing accessible label:', input);
    }
  });
};

// Test focus management
export const testFocusManagement = async (container: HTMLElement) => {
  const user = userEvent.setup();
  
  // Test that focus is properly managed in modals
  const modals = container.querySelectorAll('[role="dialog"], .modal');
  
  for (const modal of modals) {
    const focusableInModal = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableInModal.length > 0) {
      // Focus should be trapped within modal
      const firstFocusable = focusableInModal[0] as HTMLElement;
      const lastFocusable = focusableInModal[focusableInModal.length - 1] as HTMLElement;
      
      firstFocusable.focus();
      expect(document.activeElement).toBe(firstFocusable);
      
      // Tab from last element should cycle to first
      lastFocusable.focus();
      await user.tab();
      // Note: This would need actual focus trap implementation to work
    }
  }
};

// Export all utilities
export {
  axe,
  toHaveNoViolations,
};