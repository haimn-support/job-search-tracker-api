# Accessibility Features

This document outlines the accessibility features implemented in the Interview Position Tracker frontend application.

## Overview

The application has been designed and developed with accessibility in mind, following WCAG 2.1 AA guidelines to ensure it's usable by people with disabilities.

## Features Implemented

### 1. ARIA Labels and Roles

- **Semantic HTML**: All components use semantic HTML elements (`<main>`, `<nav>`, `<header>`, `<aside>`, etc.)
- **ARIA Labels**: Interactive elements have descriptive `aria-label` attributes
- **ARIA Roles**: Proper roles are assigned to custom components (`role="button"`, `role="menu"`, etc.)
- **ARIA States**: Dynamic states are communicated via `aria-expanded`, `aria-current`, `aria-invalid`
- **ARIA Descriptions**: Form elements are properly associated with help text and error messages

### 2. Keyboard Navigation

- **Skip Links**: "Skip to main content" link for keyboard users
- **Focus Management**: All interactive elements are keyboard accessible
- **Focus Indicators**: Clear visual focus indicators for all focusable elements
- **Tab Order**: Logical tab order throughout the application
- **Keyboard Shortcuts**: Standard keyboard interactions (Enter, Space, Escape)

### 3. High Contrast Mode

- **System Detection**: Automatically detects system high contrast preferences
- **Manual Toggle**: Users can manually enable/disable high contrast mode
- **Color Overrides**: High contrast colors for better visibility
- **Focus Indicators**: Enhanced focus indicators in high contrast mode

### 4. Dark Mode

- **System Detection**: Automatically detects system dark mode preferences
- **Manual Toggle**: Users can manually switch between light and dark modes
- **Color Scheme**: Proper dark mode color palette
- **Persistence**: User preferences are saved and restored

### 5. Screen Reader Support

- **Screen Reader Announcements**: Dynamic content changes are announced
- **Descriptive Text**: All interactive elements have descriptive text
- **Live Regions**: Status updates and notifications are announced
- **Hidden Content**: Decorative elements are hidden from screen readers

### 6. Form Accessibility

- **Label Association**: All form inputs are properly labeled
- **Error Handling**: Form errors are announced and associated with inputs
- **Required Fields**: Required fields are clearly marked
- **Help Text**: Help text is properly associated with form elements

### 7. SEO Optimization

- **Meta Tags**: Comprehensive meta tags for search engines
- **Open Graph**: Social media sharing optimization
- **Structured Data**: JSON-LD structured data for search engines
- **Sitemap**: XML sitemap for search engine crawling
- **Robots.txt**: Proper robots.txt configuration

### 8. Performance Monitoring

- **Core Web Vitals**: Monitoring of LCP, FID, CLS, FCP, and TTFB
- **Performance Observer**: Real-time performance monitoring
- **Analytics Integration**: Ready for analytics service integration

## Usage

### Theme Controls

The application includes theme controls in the header:

```tsx
import { ThemeToggle } from './components/ui/ThemeToggle';

// Theme toggle component with high contrast and dark mode options
<ThemeToggle />
```

### Screen Reader Announcements

Use the screen reader announcement component for dynamic content:

```tsx
import { ScreenReaderAnnouncement } from './components/ui/ScreenReaderAnnouncement';

<ScreenReaderAnnouncement 
  message="Position created successfully" 
  priority="polite" 
/>
```

### Skip Links

Skip links are automatically included in the header for keyboard navigation:

```tsx
import { SkipLink } from './components/ui/SkipLink';

<SkipLink href="#main-content">Skip to main content</SkipLink>
```

### Accessibility Testing

Use the built-in accessibility testing utilities:

```tsx
import { runAccessibilityTests, generateAccessibilityReport } from './utils/accessibility';

// Run all accessibility tests
const results = runAccessibilityTests();

// Generate a report
const report = generateAccessibilityReport();
console.log(report);
```

## Testing

### Automated Testing

The application includes automated accessibility testing using:

- **jest-axe**: Automated accessibility testing in unit tests
- **Custom Utilities**: Built-in accessibility testing functions
- **Performance Monitoring**: Core Web Vitals tracking

### Manual Testing

For manual accessibility testing:

1. **Keyboard Navigation**: Test all functionality using only the keyboard
2. **Screen Reader**: Test with screen readers (NVDA, JAWS, VoiceOver)
3. **High Contrast**: Test in high contrast mode
4. **Zoom**: Test at 200% zoom level
5. **Color Blindness**: Test with color blindness simulators

### Browser Testing

Test in multiple browsers and assistive technologies:

- Chrome with ChromeVox
- Firefox with NVDA
- Safari with VoiceOver
- Edge with Narrator

## Compliance

This application aims to meet:

- **WCAG 2.1 AA**: Web Content Accessibility Guidelines Level AA
- **Section 508**: US federal accessibility requirements
- **ADA**: Americans with Disabilities Act compliance

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)

## Contributing

When contributing to this project:

1. Follow accessibility best practices
2. Test with keyboard navigation
3. Test with screen readers
4. Ensure proper color contrast
5. Use semantic HTML elements
6. Add proper ARIA attributes
7. Test in high contrast mode

## Support

For accessibility-related issues or questions:

1. Check the accessibility testing utilities
2. Review the WCAG guidelines
3. Test with assistive technologies
4. Consult the accessibility community
