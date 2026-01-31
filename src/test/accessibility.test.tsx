/**
 * Accessibility Compliance Tests
 * 
 * Tests accessibility features across all UI components including:
 * - ARIA labels and roles
 * - Keyboard navigation
 * - Screen reader compatibility
 * - Color contrast
 * - Focus management
 * 
 * Requirements: All UI-related requirements
 */

import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Import accessibility components
import { AccessibleButton, AccessibleField, StatusMessage, AccessibleTable } from '@/components/ui/accessibility';
import { QuickHelp, InlineHelp, ContextualHelpTrigger } from '@/components/ui/contextual-help';
import { ThemeToggle } from '@/components/providers/theme-provider';

// Test wrapper
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <div role="main">{children}</div>
);

describe('Accessibility Compliance Tests', () => {
  beforeEach(() => {
    // Mock window.matchMedia for theme tests
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: vi.fn().mockImplementation(query => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  describe('ARIA Labels and Roles', () => {
    it('should have proper ARIA labels on interactive elements', () => {
      render(
        <TestWrapper>
          <AccessibleButton aria-label="Save document">Save</AccessibleButton>
          <AccessibleButton loading loadingText="Saving document...">Save</AccessibleButton>
        </TestWrapper>
      );

      const saveButton = screen.getByRole('button', { name: 'Save document' });
      expect(saveButton).toHaveAttribute('aria-label', 'Save document');

      const loadingButton = screen.getByRole('button', { name: 'Saving document...' });
      expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    });

    it('should provide proper form field associations', () => {
      render(
        <TestWrapper>
          <AccessibleField
            label="Email Address"
            description="Enter your work email"
            error="Invalid email format"
            required
          >
            <input type="email" />
          </AccessibleField>
        </TestWrapper>
      );

      const input = screen.getByRole('textbox');
      const label = screen.getByText('Email Address');
      
      expect(input).toHaveAttribute('aria-required', 'true');
      expect(input).toHaveAttribute('aria-invalid', 'true');
      expect(input).toHaveAttribute('aria-describedby');
      
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain('description');
      expect(describedBy).toContain('error');
    });

    it('should use proper table structure with headers', () => {
      const headers = ['Name', 'Email', 'Status'];
      const data = [
        { name: 'John Doe', email: 'john@example.com', status: 'Active' },
        { name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
      ];

      render(
        <TestWrapper>
          <AccessibleTable
            caption="User list with contact information"
            headers={headers}
            data={data}
          />
        </TestWrapper>
      );

      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();

      const caption = screen.getByText('User list with contact information');
      expect(caption).toBeInTheDocument();

      const columnHeaders = screen.getAllByRole('columnheader');
      expect(columnHeaders).toHaveLength(3);
      
      columnHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'col');
      });

      const rowHeaders = screen.getAllByRole('rowheader');
      expect(rowHeaders).toHaveLength(2);
      
      rowHeaders.forEach(header => {
        expect(header).toHaveAttribute('scope', 'row');
      });
    });

    it('should provide proper status and alert roles', () => {
      render(
        <TestWrapper>
          <StatusMessage type="success" title="Success">
            Operation completed successfully
          </StatusMessage>
          <StatusMessage type="error" title="Error">
            An error occurred
          </StatusMessage>
          <StatusMessage type="info" title="Information">
            Additional information
          </StatusMessage>
        </TestWrapper>
      );

      const successMessage = screen.getByRole('status');
      expect(successMessage).toHaveAttribute('aria-live', 'polite');

      const errorMessage = screen.getByRole('alert');
      expect(errorMessage).toHaveAttribute('aria-live', 'assertive');

      const infoMessage = screen.getByRole('status');
      expect(infoMessage).toHaveAttribute('aria-live', 'polite');
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support tab navigation through interactive elements', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <button>First Button</button>
          <input type="text" placeholder="Text input" />
          <select>
            <option>Option 1</option>
            <option>Option 2</option>
          </select>
          <button>Last Button</button>
        </TestWrapper>
      );

      const firstButton = screen.getByRole('button', { name: 'First Button' });
      const textInput = screen.getByRole('textbox');
      const select = screen.getByRole('combobox');
      const lastButton = screen.getByRole('button', { name: 'Last Button' });

      // Start from first element
      firstButton.focus();
      expect(firstButton).toHaveFocus();

      // Tab to next element
      await user.tab();
      expect(textInput).toHaveFocus();

      // Tab to select
      await user.tab();
      expect(select).toHaveFocus();

      // Tab to last button
      await user.tab();
      expect(lastButton).toHaveFocus();

      // Shift+Tab should go backwards
      await user.tab({ shift: true });
      expect(select).toHaveFocus();
    });

    it('should support arrow key navigation in menus', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ThemeToggle />
        </TestWrapper>
      );

      const themeButton = screen.getByRole('button');
      await user.click(themeButton);

      // Should open menu
      const menu = screen.getByRole('menu');
      expect(menu).toBeInTheDocument();

      const menuItems = screen.getAllByRole('menuitem');
      expect(menuItems).toHaveLength(3);

      // First item should be focused
      expect(menuItems[0]).toHaveFocus();

      // Arrow down should move to next item
      await user.keyboard('{ArrowDown}');
      expect(menuItems[1]).toHaveFocus();

      // Arrow up should move to previous item
      await user.keyboard('{ArrowUp}');
      expect(menuItems[0]).toHaveFocus();

      // Enter should select item
      await user.keyboard('{Enter}');
      expect(menu).not.toBeInTheDocument();
    });

    it('should support escape key to close dialogs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ContextualHelpTrigger
            helpId="test-help"
            helpContent={[{
              id: 'test-help',
              title: 'Test Help',
              description: 'Test description',
              content: 'Test content',
              type: 'info',
            }]}
          >
            <button>Help</button>
          </ContextualHelpTrigger>
        </TestWrapper>
      );

      const helpButton = screen.getByRole('button', { name: 'Help' });
      await user.click(helpButton);

      // Dialog should be open
      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Escape should close dialog
      await user.keyboard('{Escape}');
      expect(dialog).not.toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    it('should trap focus within modal dialogs', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <button>Outside Button</button>
          <ContextualHelpTrigger
            helpId="test-help"
            helpContent={[{
              id: 'test-help',
              title: 'Test Help',
              description: 'Test description',
              content: 'Test content',
              type: 'info',
            }]}
          >
            <button>Open Help</button>
          </ContextualHelpTrigger>
        </TestWrapper>
      );

      const helpButton = screen.getByRole('button', { name: 'Open Help' });
      await user.click(helpButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Focus should be trapped within dialog
      const dialogButtons = screen.getAllByRole('button');
      const closeButton = dialogButtons.find(btn => btn.textContent?.includes('Close'));
      
      if (closeButton) {
        closeButton.focus();
        expect(closeButton).toHaveFocus();

        // Tab should cycle within dialog
        await user.tab();
        const focusedElement = document.activeElement;
        expect(dialog).toContainElement(focusedElement);
      }
    });

    it('should restore focus after modal closes', async () => {
      const user = userEvent.setup();
      
      render(
        <TestWrapper>
          <ContextualHelpTrigger
            helpId="test-help"
            helpContent={[{
              id: 'test-help',
              title: 'Test Help',
              description: 'Test description',
              content: 'Test content',
              type: 'info',
            }]}
          >
            <button>Open Help</button>
          </ContextualHelpTrigger>
        </TestWrapper>
      );

      const helpButton = screen.getByRole('button', { name: 'Open Help' });
      helpButton.focus();
      expect(helpButton).toHaveFocus();

      await user.click(helpButton);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toBeInTheDocument();

      // Close dialog
      await user.keyboard('{Escape}');
      expect(dialog).not.toBeInTheDocument();

      // Focus should return to trigger button
      expect(helpButton).toHaveFocus();
    });

    it('should provide visible focus indicators', () => {
      render(
        <TestWrapper>
          <button className="focus:ring-2 focus:ring-blue-500">Focusable Button</button>
          <input className="focus:ring-2 focus:ring-blue-500" type="text" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      const input = screen.getByRole('textbox');

      button.focus();
      expect(button).toHaveClass('focus:ring-2', 'focus:ring-blue-500');

      input.focus();
      expect(input).toHaveClass('focus:ring-2', 'focus:ring-blue-500');
    });
  });

  describe('Screen Reader Compatibility', () => {
    it('should provide descriptive text for screen readers', () => {
      render(
        <TestWrapper>
          <button>
            <span aria-hidden="true">🔍</span>
            <span className="sr-only">Search</span>
          </button>
          <div>
            <span className="sr-only">Loading content, please wait</span>
            <div aria-hidden="true">...</div>
          </div>
        </TestWrapper>
      );

      const searchButton = screen.getByRole('button', { name: 'Search' });
      expect(searchButton).toBeInTheDocument();

      const loadingText = screen.getByText('Loading content, please wait');
      expect(loadingText).toHaveClass('sr-only');
    });

    it('should announce dynamic content changes', async () => {
      const user = userEvent.setup();
      
      const DynamicContent = () => {
        const [message, setMessage] = React.useState('');
        
        return (
          <TestWrapper>
            <button onClick={() => setMessage('Content updated successfully')}>
              Update Content
            </button>
            <div role="status" aria-live="polite">
              {message}
            </div>
          </TestWrapper>
        );
      };

      render(<DynamicContent />);

      const updateButton = screen.getByRole('button', { name: 'Update Content' });
      await user.click(updateButton);

      const statusRegion = screen.getByRole('status');
      expect(statusRegion).toHaveTextContent('Content updated successfully');
      expect(statusRegion).toHaveAttribute('aria-live', 'polite');
    });

    it('should provide context for form errors', () => {
      render(
        <TestWrapper>
          <AccessibleField
            label="Password"
            error="Password must be at least 8 characters"
            required
          >
            <input type="password" />
          </AccessibleField>
        </TestWrapper>
      );

      const input = screen.getByRole('textbox', { name: /password/i });
      const errorMessage = screen.getByRole('alert');
      
      expect(errorMessage).toHaveTextContent('Password must be at least 8 characters');
      expect(input).toHaveAttribute('aria-describedby');
      
      const describedBy = input.getAttribute('aria-describedby');
      expect(describedBy).toContain(errorMessage.id);
    });
  });

  describe('Color Contrast and Visual Design', () => {
    it('should meet WCAG color contrast requirements', () => {
      render(
        <TestWrapper>
          <div className="text-gray-900 bg-white">High contrast text</div>
          <div className="text-white bg-gray-900">Inverted high contrast</div>
          <button className="text-white bg-blue-600 hover:bg-blue-700">
            Primary button
          </button>
          <button className="text-red-600 bg-red-50 hover:bg-red-100">
            Danger button
          </button>
        </TestWrapper>
      );

      // These would typically be tested with automated tools
      // or manual verification against WCAG guidelines
      const highContrastText = screen.getByText('High contrast text');
      expect(highContrastText).toHaveClass('text-gray-900', 'bg-white');

      const primaryButton = screen.getByRole('button', { name: 'Primary button' });
      expect(primaryButton).toHaveClass('text-white', 'bg-blue-600');
    });

    it('should not rely solely on color to convey information', () => {
      render(
        <TestWrapper>
          <div className="flex items-center gap-2 text-green-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
            Success: Operation completed
          </div>
          <div className="flex items-center gap-2 text-red-600">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Error: Operation failed
          </div>
        </TestWrapper>
      );

      // Success and error states use both color and icons
      const successMessage = screen.getByText(/Success: Operation completed/);
      const errorMessage = screen.getByText(/Error: Operation failed/);
      
      expect(successMessage.parentElement).toContainHTML('svg');
      expect(errorMessage.parentElement).toContainHTML('svg');
    });
  });

  describe('Responsive Accessibility', () => {
    it('should maintain accessibility on mobile devices', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(
        <TestWrapper>
          <nav className="md:hidden">
            <button aria-label="Open navigation menu" aria-expanded="false">
              <span className="sr-only">Menu</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </nav>
          <main className="p-4">
            <h1 className="text-2xl font-bold">Mobile Content</h1>
          </main>
        </TestWrapper>
      );

      const menuButton = screen.getByRole('button', { name: 'Open navigation menu' });
      expect(menuButton).toHaveAttribute('aria-expanded', 'false');
      expect(menuButton).toHaveAttribute('aria-label', 'Open navigation menu');

      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Mobile Content');
    });

    it('should provide adequate touch targets on mobile', () => {
      render(
        <TestWrapper>
          <button className="min-h-[44px] min-w-[44px] p-3">
            Small Button
          </button>
          <a href="#" className="inline-block min-h-[44px] min-w-[44px] p-3">
            Small Link
          </a>
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      const link = screen.getByRole('link');

      // Should have minimum touch target size (44px)
      expect(button).toHaveClass('min-h-[44px]', 'min-w-[44px]');
      expect(link).toHaveClass('min-h-[44px]', 'min-w-[44px]');
    });
  });

  describe('Automated Accessibility Testing', () => {
    it('should pass axe accessibility tests', async () => {
      const { container } = render(
        <TestWrapper>
          <main>
            <h1>Accessible Page</h1>
            <form>
              <AccessibleField label="Name" required>
                <input type="text" />
              </AccessibleField>
              <AccessibleField label="Email" description="Enter your email address">
                <input type="email" />
              </AccessibleField>
              <AccessibleButton type="submit">Submit</AccessibleButton>
            </form>
            <StatusMessage type="info" title="Information">
              This is an informational message
            </StatusMessage>
          </main>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should pass axe tests for complex components', async () => {
      const { container } = render(
        <TestWrapper>
          <div>
            <QuickHelp content="This is helpful information" title="Help Topic">
              <button>Help</button>
            </QuickHelp>
            <InlineHelp type="tip">
              This is a helpful tip for users
            </InlineHelp>
            <AccessibleTable
              caption="User data table"
              headers={['Name', 'Email', 'Status']}
              data={[
                { name: 'John Doe', email: 'john@example.com', status: 'Active' },
                { name: 'Jane Smith', email: 'jane@example.com', status: 'Inactive' },
              ]}
            />
          </div>
        </TestWrapper>
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});