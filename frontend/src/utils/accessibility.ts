/**
 * Accessibility utility functions for testing and validation
 */

export interface AccessibilityTestResult {
  passed: boolean;
  message: string;
  element?: HTMLElement;
}

/**
 * Test if an element has proper ARIA labels
 */
export const testAriaLabels = (element: HTMLElement): AccessibilityTestResult => {
  const hasAriaLabel = element.hasAttribute('aria-label');
  const hasAriaLabelledBy = element.hasAttribute('aria-labelledby');
  const hasAriaDescribedBy = element.hasAttribute('aria-describedby');
  
  if (hasAriaLabel || hasAriaLabelledBy || hasAriaDescribedBy) {
    return {
      passed: true,
      message: 'Element has proper ARIA labeling',
      element
    };
  }
  
  return {
    passed: false,
    message: 'Element missing ARIA labels',
    element
  };
};

/**
 * Test if an element is keyboard accessible
 */
export const testKeyboardAccessibility = (element: HTMLElement): AccessibilityTestResult => {
  const tabIndex = element.getAttribute('tabindex');
  const isFocusable = element.matches('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])');
  
  if (isFocusable || tabIndex !== null) {
    return {
      passed: true,
      message: 'Element is keyboard accessible',
      element
    };
  }
  
  return {
    passed: false,
    message: 'Element is not keyboard accessible',
    element
  };
};

/**
 * Test if an element has proper color contrast
 */
export const testColorContrast = (element: HTMLElement): AccessibilityTestResult => {
  const computedStyle = window.getComputedStyle(element);
  const backgroundColor = computedStyle.backgroundColor;
  const color = computedStyle.color;
  
  // This is a simplified check - in a real implementation, you'd use a proper contrast ratio calculator
  if (backgroundColor && color) {
    return {
      passed: true,
      message: 'Element has color contrast (manual verification recommended)',
      element
    };
  }
  
  return {
    passed: false,
    message: 'Element missing color contrast information',
    element
  };
};

/**
 * Test if an element has proper heading hierarchy
 */
export const testHeadingHierarchy = (): AccessibilityTestResult => {
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)));
  
  let previousLevel = 0;
  let hasError = false;
  
  for (const level of headingLevels) {
    if (level > previousLevel + 1) {
      hasError = true;
      break;
    }
    previousLevel = level;
  }
  
  if (!hasError) {
    return {
      passed: true,
      message: 'Heading hierarchy is correct',
    };
  }
  
  return {
    passed: false,
    message: 'Heading hierarchy has gaps or is incorrect',
  };
};

/**
 * Test if the page has proper focus management
 */
export const testFocusManagement = (): AccessibilityTestResult => {
  const focusableElements = document.querySelectorAll(
    'button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'
  );
  
  if (focusableElements.length > 0) {
    return {
      passed: true,
      message: `Found ${focusableElements.length} focusable elements`,
    };
  }
  
  return {
    passed: false,
    message: 'No focusable elements found',
  };
};

/**
 * Test if images have proper alt text
 */
export const testImageAltText = (): AccessibilityTestResult => {
  const images = document.querySelectorAll('img');
  const imagesWithoutAlt = Array.from(images).filter(img => !img.alt);
  
  if (imagesWithoutAlt.length === 0) {
    return {
      passed: true,
      message: 'All images have alt text',
    };
  }
  
  return {
    passed: false,
    message: `${imagesWithoutAlt.length} images missing alt text`,
  };
};

/**
 * Run all accessibility tests
 */
export const runAccessibilityTests = (): AccessibilityTestResult[] => {
  const results: AccessibilityTestResult[] = [];
  
  // Test heading hierarchy
  results.push(testHeadingHierarchy());
  
  // Test focus management
  results.push(testFocusManagement());
  
  // Test image alt text
  results.push(testImageAltText());
  
  // Test interactive elements
  const interactiveElements = document.querySelectorAll('button, input, select, textarea, a[href]');
  interactiveElements.forEach(element => {
    results.push(testAriaLabels(element as HTMLElement));
    results.push(testKeyboardAccessibility(element as HTMLElement));
  });
  
  return results;
};

/**
 * Generate accessibility report
 */
export const generateAccessibilityReport = (): string => {
  const results = runAccessibilityTests();
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  let report = `Accessibility Test Report\n`;
  report += `========================\n`;
  report += `Passed: ${passed}/${total}\n\n`;
  
  results.forEach((result, index) => {
    report += `${index + 1}. ${result.passed ? '✅' : '❌'} ${result.message}\n`;
  });
  
  return report;
};

/**
 * Announce to screen readers
 */
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};
