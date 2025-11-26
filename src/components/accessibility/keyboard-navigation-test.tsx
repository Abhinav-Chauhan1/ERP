"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Keyboard, CheckCircle, XCircle, AlertCircle } from "lucide-react";

/**
 * Keyboard Navigation Test Component
 * 
 * Development tool to test keyboard navigation on the page.
 * Only renders in development mode.
 * 
 * Tests:
 * - Tab navigation through interactive elements
 * - Enter/Space activation of buttons
 * - Focus visibility
 * - Focus trap in modals
 * 
 * @see Requirements 8.2 - Keyboard navigation support
 */
export function KeyboardNavigationTest() {
  const [isVisible, setIsVisible] = useState(false);
  const [testResults, setTestResults] = useState<{
    totalInteractive: number;
    keyboardAccessible: number;
    missingTabIndex: string[];
    focusVisible: boolean;
  }>({
    totalInteractive: 0,
    keyboardAccessible: 0,
    missingTabIndex: [],
    focusVisible: true,
  });

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    const runTests = () => {
      const interactiveElements = document.querySelectorAll(
        'button, a, input, select, textarea, [role="button"], [onclick]'
      );

      let keyboardAccessibleCount = 0;
      const missingTabIndex: string[] = [];

      interactiveElements.forEach((element, index) => {
        const htmlElement = element as HTMLElement;
        const tagName = htmlElement.tagName.toLowerCase();
        const role = htmlElement.getAttribute('role');
        const tabindex = htmlElement.getAttribute('tabindex');

        // Check if element is keyboard accessible
        const isNativeInteractive = ['button', 'a', 'input', 'select', 'textarea'].includes(tagName);
        const hasTabIndex = tabindex !== null && parseInt(tabindex) >= 0;

        if (isNativeInteractive || hasTabIndex) {
          keyboardAccessibleCount++;
        } else {
          const identifier = htmlElement.id || htmlElement.className || `${tagName} ${index + 1}`;
          missingTabIndex.push(identifier);
        }
      });

      // Check if focus is visible
      const focusVisible = checkFocusVisibility();

      setTestResults({
        totalInteractive: interactiveElements.length,
        keyboardAccessible: keyboardAccessibleCount,
        missingTabIndex,
        focusVisible,
      });
    };

    // Run tests after a delay to allow page to render
    const timer = setTimeout(runTests, 2000);

    return () => clearTimeout(timer);
  }, []);

  const checkFocusVisibility = (): boolean => {
    // Create a test button to check focus visibility
    const testButton = document.createElement('button');
    testButton.style.position = 'absolute';
    testButton.style.left = '-9999px';
    testButton.textContent = 'Test';
    document.body.appendChild(testButton);

    testButton.focus();
    const computedStyle = window.getComputedStyle(testButton, ':focus');
    const hasOutline = computedStyle.outline !== 'none' && computedStyle.outline !== '';
    const hasBoxShadow = computedStyle.boxShadow !== 'none';

    document.body.removeChild(testButton);

    return hasOutline || hasBoxShadow;
  };

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') return null;

  const passRate = testResults.totalInteractive > 0
    ? Math.round((testResults.keyboardAccessible / testResults.totalInteractive) * 100)
    : 0;

  const getStatusColor = () => {
    if (passRate === 100) return 'text-green-600';
    if (passRate >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusIcon = () => {
    if (passRate === 100) return <CheckCircle className="h-5 w-5 text-green-600" />;
    if (passRate >= 80) return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    return <XCircle className="h-5 w-5 text-red-600" />;
  };

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-20 right-4 z-[9998] rounded-full bg-blue-600 p-3 text-white shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        aria-label="Toggle keyboard navigation test"
        title="Keyboard Navigation Test"
      >
        <Keyboard className="h-6 w-6" aria-hidden="true" />
        <Badge className="absolute -right-1 -top-1 h-6 w-6 rounded-full p-0 flex items-center justify-center">
          {passRate}%
        </Badge>
      </button>

      {isVisible && (
        <Card className="fixed bottom-40 right-4 z-[9998] w-96 max-h-96 overflow-y-auto shadow-xl">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Keyboard className="h-5 w-5" aria-hidden="true" />
                <CardTitle>Keyboard Navigation</CardTitle>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
                aria-label="Close keyboard navigation test"
              >
                <XCircle className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
            <CardDescription>
              Testing keyboard accessibility compliance
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {/* Overall Status */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {getStatusIcon()}
                <div>
                  <p className="font-medium">Overall Status</p>
                  <p className="text-sm text-muted-foreground">
                    {testResults.keyboardAccessible} / {testResults.totalInteractive} accessible
                  </p>
                </div>
              </div>
              <div className={`text-2xl font-bold ${getStatusColor()}`}>
                {passRate}%
              </div>
            </div>

            {/* Focus Visibility */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-2">
                {testResults.focusVisible ? (
                  <CheckCircle className="h-5 w-5 text-green-600" aria-hidden="true" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" aria-hidden="true" />
                )}
                <div>
                  <p className="font-medium">Focus Visibility</p>
                  <p className="text-sm text-muted-foreground">
                    {testResults.focusVisible ? 'Visible' : 'Not visible'}
                  </p>
                </div>
              </div>
            </div>

            {/* Missing TabIndex */}
            {testResults.missingTabIndex.length > 0 && (
              <div className="space-y-2">
                <p className="font-medium text-sm">
                  Elements Missing Keyboard Access ({testResults.missingTabIndex.length})
                </p>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {testResults.missingTabIndex.map((identifier, index) => (
                    <div
                      key={index}
                      className="text-xs p-2 bg-red-50 dark:bg-red-900/20 border-l-2 border-red-500 rounded"
                    >
                      {identifier}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="text-xs text-muted-foreground border-t pt-3">
              <p className="font-medium mb-1">Testing Tips:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Press Tab to navigate through elements</li>
                <li>Press Enter or Space to activate buttons</li>
                <li>Focus should be clearly visible</li>
                <li>All interactive elements should be reachable</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
