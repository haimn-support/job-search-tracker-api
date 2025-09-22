import React, { useState } from 'react';
import { runAccessibilityTests, generateAccessibilityReport } from '../../utils/accessibility';
import { Button } from '../ui/Button';

export const AccessibilityTester: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState<string>('');

  const runTests = () => {
    const testReport = generateAccessibilityReport();
    setReport(testReport);
    setIsVisible(true);
  };

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Button
        onClick={runTests}
        variant="outline"
        size="sm"
        className="mb-2"
        aria-label="Run accessibility tests"
      >
        Test A11y
      </Button>
      
      {isVisible && (
        <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-4 max-w-md max-h-96 overflow-auto">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-sm font-medium">Accessibility Test Results</h3>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              aria-label="Close accessibility test results"
            >
              ×
            </Button>
          </div>
          <pre className="text-xs whitespace-pre-wrap font-mono">
            {report}
          </pre>
        </div>
      )}
    </div>
  );
};

export default AccessibilityTester;
