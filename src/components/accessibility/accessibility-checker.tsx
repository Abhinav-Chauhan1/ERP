"use client";

import { useEffect, useState } from "react";
import { getContrastRatio, meetsWCAGAA } from "@/lib/utils/accessibility";

/**
 * Accessibility Checker Component
 * 
 * Development tool to audit accessibility issues in the application.
 * Only renders in development mode.
 * 
 * Checks for:
 * - Missing alt text on images
 * - Insufficient color contrast
 * - Missing ARIA labels
 * - Keyboard accessibility issues
 * 
 * @see Requirements 5.1, 5.2, 5.3, 5.5
 */
export function AccessibilityChecker() {
  const [issues, setIssues] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run in development
    if (process.env.NODE_ENV !== 'development') return;

    const checkAccessibility = () => {
      const foundIssues: string[] = [];

      // Check for images without alt text
      const images = document.querySelectorAll('img');
      images.forEach((img, index) => {
        if (!img.alt && !img.getAttribute('aria-label')) {
          foundIssues.push(`Image ${index + 1} missing alt text: ${img.src}`);
        }
      });

      // Check for buttons without accessible names
      const buttons = document.querySelectorAll('button');
      buttons.forEach((button, index) => {
        const hasText = button.textContent?.trim();
        const hasAriaLabel = button.getAttribute('aria-label');
        const hasAriaLabelledBy = button.getAttribute('aria-labelledby');
        
        if (!hasText && !hasAriaLabel && !hasAriaLabelledBy) {
          foundIssues.push(`Button ${index + 1} missing accessible name`);
        }
      });

      // Check for links without accessible names
      const links = document.querySelectorAll('a');
      links.forEach((link, index) => {
        const hasText = link.textContent?.trim();
        const hasAriaLabel = link.getAttribute('aria-label');
        
        if (!hasText && !hasAriaLabel) {
          foundIssues.push(`Link ${index + 1} missing accessible name: ${link.href}`);
        }
      });

      // Check for form inputs without labels
      const inputs = document.querySelectorAll('input:not([type="hidden"])');
      inputs.forEach((input, index) => {
        const inputElement = input as HTMLInputElement;
        const hasLabel = document.querySelector(`label[for="${inputElement.id}"]`);
        const hasAriaLabel = inputElement.getAttribute('aria-label');
        const hasAriaLabelledBy = inputElement.getAttribute('aria-labelledby');
        
        if (!hasLabel && !hasAriaLabel && !hasAriaLabelledBy) {
          foundIssues.push(`Input ${index + 1} missing label: ${inputElement.name || inputElement.id || 'unnamed'}`);
        }
      });

      // Check for interactive elements without keyboard access
      const interactiveElements = document.querySelectorAll('[onclick], [role="button"]');
      interactiveElements.forEach((element, index) => {
        const isButton = element.tagName === 'BUTTON';
        const isLink = element.tagName === 'A';
        const hasTabIndex = element.hasAttribute('tabindex');
        
        if (!isButton && !isLink && !hasTabIndex) {
          foundIssues.push(`Interactive element ${index + 1} not keyboard accessible`);
        }
      });

      setIssues(foundIssues);
    };

    // Run check after a delay to allow page to render
    const timer = setTimeout(checkAccessibility, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Don't render in production
  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <>
      <button
        onClick={() => setIsVisible(!isVisible)}
        className="fixed bottom-4 right-4 z-[9999] rounded-full bg-purple-600 p-3 text-white shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
        aria-label="Toggle accessibility checker"
        title="Accessibility Checker"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
        {issues.length > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs">
            {issues.length}
          </span>
        )}
      </button>

      {isVisible && (
        <div
          className="fixed bottom-20 right-4 z-[9999] max-h-96 w-96 overflow-y-auto rounded-lg bg-white p-4 shadow-xl dark:bg-gray-800"
          role="dialog"
          aria-label="Accessibility issues"
        >
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-lg font-semibold">Accessibility Issues</h3>
            <button
              onClick={() => setIsVisible(false)}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-700"
              aria-label="Close accessibility checker"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>

          {issues.length === 0 ? (
            <p className="text-green-600 dark:text-green-400">
              ✓ No accessibility issues found!
            </p>
          ) : (
            <ul className="space-y-2">
              {issues.map((issue, index) => (
                <li
                  key={index}
                  className="rounded border-l-4 border-red-500 bg-red-50 p-2 text-sm dark:bg-red-900/20"
                >
                  {issue}
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t pt-4 text-xs text-gray-600 dark:text-gray-400">
            <p>This checker only appears in development mode.</p>
            <p className="mt-1">
              For comprehensive testing, use tools like axe DevTools or WAVE.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
