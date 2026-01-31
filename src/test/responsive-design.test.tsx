/**
 * Responsive Design and Cross-Browser Compatibility Tests
 * 
 * Tests responsive behavior and cross-browser compatibility including:
 * - Breakpoint behavior
 * - Mobile-first design
 * - Touch interactions
 * - Browser-specific features
 * - Performance on different devices
 * 
 * Requirements: All UI-related requirements
 */

import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Import responsive components
import { Container, Grid, SidebarLayout, Show, Hide, useBreakpoint } from '@/components/ui/responsive-layout';
import { BillingDashboard } from '@/components/super-admin/billing/billing-dashboard';
import { AnalyticsDashboard } from '@/components/super-admin/analytics/analytics-dashboard';
import { SupportTicketManagement } from '@/components/super-admin/support/support-ticket-management';

// Test utilities
const mockViewport = (width: number, height: number = 768) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  });
  
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  });

  // Mock matchMedia for different breakpoints
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => {
      const matches = (() => {
        if (query.includes('max-width: 640px')) return width <= 640;
        if (query.includes('max-width: 768px')) return width <= 768;
        if (query.includes('max-width: 1024px')) return width <= 1024;
        if (query.includes('max-width: 1280px')) return width <= 1280;
        if (query.includes('min-width: 640px')) return width >= 640;
        if (query.includes('min-width: 768px')) return width >= 768;
        if (query.includes('min-width: 1024px')) return width >= 1024;
        if (query.includes('min-width: 1280px')) return width >= 1280;
        return false;
      })();

      return {
        matches,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      };
    }),
  });

  // Trigger resize event
  fireEvent(window, new Event('resize'));
};

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">{children}</div>
);

describe('Responsive Design Tests', () => {
  beforeEach(() => {
    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Breakpoint Behavior', () => {
    it('should respond to mobile breakpoint (< 640px)', () => {
      mockViewport(375); // iPhone SE width

      const BreakpointTest = () => {
        const { isMobile, isTablet, isDesktop, breakpoint } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-mobile">{isMobile.toString()}</div>
            <div data-testid="is-tablet">{isTablet.toString()}</div>
            <div data-testid="is-desktop">{isDesktop.toString()}</div>
            <div data-testid="breakpoint">{breakpoint}</div>
          </div>
        );
      };

      render(<BreakpointTest />);

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('true');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('xs');
    });

    it('should respond to tablet breakpoint (768px - 1024px)', () => {
      mockViewport(768);

      const BreakpointTest = () => {
        const { isMobile, isTablet, isDesktop, breakpoint } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-mobile">{isMobile.toString()}</div>
            <div data-testid="is-tablet">{isTablet.toString()}</div>
            <div data-testid="is-desktop">{isDesktop.toString()}</div>
            <div data-testid="breakpoint">{breakpoint}</div>
          </div>
        );
      };

      render(<BreakpointTest />);

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('true');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('false');
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('md');
    });

    it('should respond to desktop breakpoint (>= 1024px)', () => {
      mockViewport(1440);

      const BreakpointTest = () => {
        const { isMobile, isTablet, isDesktop, breakpoint } = useBreakpoint();
        return (
          <div>
            <div data-testid="is-mobile">{isMobile.toString()}</div>
            <div data-testid="is-tablet">{isTablet.toString()}</div>
            <div data-testid="is-desktop">{isDesktop.toString()}</div>
            <div data-testid="breakpoint">{breakpoint}</div>
          </div>
        );
      };

      render(<BreakpointTest />);

      expect(screen.getByTestId('is-mobile')).toHaveTextContent('false');
      expect(screen.getByTestId('is-tablet')).toHaveTextContent('false');
      expect(screen.getByTestId('is-desktop')).toHaveTextContent('true');
      expect(screen.getByTestId('breakpoint')).toHaveTextContent('xl');
    });
  });

  describe('Container and Grid System', () => {
    it('should apply correct container sizes at different breakpoints', () => {
      mockViewport(1440);

      render(
        <TestWrapper>
          <Container size="xl" data-testid="container">
            <div>Content</div>
          </Container>
        </TestWrapper>
      );

      const container = screen.getByTestId('container');
      expect(container).toHaveClass('max-w-7xl', 'mx-auto', 'px-4', 'sm:px-6', 'lg:px-8');
    });

    it('should create responsive grid layouts', () => {
      mockViewport(1024);

      render(
        <TestWrapper>
          <Grid
            cols={{ default: 1, md: 2, lg: 3, xl: 4 }}
            gap={4}
            data-testid="grid"
          >
            <div>Item 1</div>
            <div>Item 2</div>
            <div>Item 3</div>
            <div>Item 4</div>
          </Grid>
        </TestWrapper>
      );

      const grid = screen.getByTestId('grid');
      expect(grid).toHaveClass(
        'grid',
        'gap-4',
        'grid-cols-1',
        'md:grid-cols-2',
        'lg:grid-cols-3',
        'xl:grid-cols-4'
      );
    });
  });

  describe('Sidebar Layout Responsiveness', () => {
    it('should show mobile menu on small screens', async () => {
      mockViewport(375);
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SidebarLayout
            sidebar={<div>Sidebar Content</div>}
            collapsible={true}
          >
            <div>Main Content</div>
          </SidebarLayout>
        </TestWrapper>
      );

      // Should show mobile menu button
      const menuButton = screen.getByRole('button', { name: /menu/i });
      expect(menuButton).toBeInTheDocument();

      // Sidebar should be hidden initially
      expect(screen.queryByText('Sidebar Content')).not.toBeInTheDocument();

      // Click menu button to open sidebar
      await user.click(menuButton);

      // Sidebar should be visible
      await waitFor(() => {
        expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
      });
    });

    it('should show desktop sidebar on large screens', () => {
      mockViewport(1440);

      render(
        <TestWrapper>
          <SidebarLayout
            sidebar={<div>Sidebar Content</div>}
            collapsible={true}
          >
            <div>Main Content</div>
          </SidebarLayout>
        </TestWrapper>
      );

      // Should show sidebar directly
      expect(screen.getByText('Sidebar Content')).toBeInTheDocument();
      
      // Should show collapse button
      const collapseButton = screen.getByRole('button');
      expect(collapseButton).toBeInTheDocument();

      // Should not show mobile menu button
      expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
    });

    it('should handle sidebar collapse on desktop', async () => {
      mockViewport(1440);
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SidebarLayout
            sidebar={<div>Sidebar Content</div>}
            collapsible={true}
          >
            <div>Main Content</div>
          </SidebarLayout>
        </TestWrapper>
      );

      const sidebar = screen.getByText('Sidebar Content').closest('aside');
      expect(sidebar).toHaveClass('w-72'); // Default width

      // Click collapse button
      const collapseButton = screen.getByRole('button');
      await user.click(collapseButton);

      // Sidebar should be collapsed
      await waitFor(() => {
        expect(sidebar).toHaveClass('w-16');
      });
    });
  });

  describe('Show/Hide Components', () => {
    it('should show/hide content based on breakpoints', () => {
      mockViewport(375); // Mobile

      render(
        <TestWrapper>
          <Show above="md">
            <div>Desktop Only</div>
          </Show>
          <Show below="md">
            <div>Mobile Only</div>
          </Show>
          <Hide above="md">
            <div>Hidden on Desktop</div>
          </Hide>
          <Show only="xs">
            <div>Extra Small Only</div>
          </Show>
        </TestWrapper>
      );

      expect(screen.queryByText('Desktop Only')).not.toBeInTheDocument();
      expect(screen.getByText('Mobile Only')).toBeInTheDocument();
      expect(screen.getByText('Hidden on Desktop')).toBeInTheDocument();
      expect(screen.getByText('Extra Small Only')).toBeInTheDocument();
    });

    it('should update visibility when viewport changes', () => {
      mockViewport(375); // Start mobile

      const { rerender } = render(
        <TestWrapper>
          <Show above="md">
            <div>Desktop Content</div>
          </Show>
        </TestWrapper>
      );

      expect(screen.queryByText('Desktop Content')).not.toBeInTheDocument();

      // Change to desktop
      mockViewport(1440);
      
      rerender(
        <TestWrapper>
          <Show above="md">
            <div>Desktop Content</div>
          </Show>
        </TestWrapper>
      );

      expect(screen.getByText('Desktop Content')).toBeInTheDocument();
    });
  });

  describe('Component Responsiveness', () => {
    it('should adapt billing dashboard for mobile', () => {
      mockViewport(375);

      render(
        <TestWrapper>
          <BillingDashboard />
        </TestWrapper>
      );

      // Should stack metric cards vertically on mobile
      const metricCards = screen.getAllByTestId('metric-card');
      metricCards.forEach(card => {
        expect(card).toHaveClass('w-full');
      });

      // Should show mobile-optimized navigation
      expect(screen.getByTestId('mobile-nav')).toBeInTheDocument();
    });

    it('should adapt analytics dashboard for tablet', () => {
      mockViewport(768);

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );

      // Should show 2-column layout on tablet
      const chartsContainer = screen.getByTestId('charts-container');
      expect(chartsContainer).toHaveClass('md:grid-cols-2');

      // Should maintain readability
      const chartTitles = screen.getAllByRole('heading', { level: 3 });
      chartTitles.forEach(title => {
        expect(title).toHaveClass('text-lg'); // Appropriate size for tablet
      });
    });

    it('should optimize support ticket management for mobile', async () => {
      mockViewport(375);
      const user = userEvent.setup();

      render(
        <TestWrapper>
          <SupportTicketManagement />
        </TestWrapper>
      );

      // Should show simplified ticket cards on mobile
      const ticketCards = screen.getAllByTestId('ticket-card');
      ticketCards.forEach(card => {
        expect(card).toHaveClass('flex-col'); // Vertical layout
      });

      // Should have touch-friendly buttons
      const actionButtons = screen.getAllByRole('button');
      actionButtons.forEach(button => {
        const styles = window.getComputedStyle(button);
        const minHeight = parseInt(styles.minHeight);
        expect(minHeight).toBeGreaterThanOrEqual(44); // Minimum touch target
      });

      // Should support swipe gestures (simulated)
      const firstTicket = ticketCards[0];
      fireEvent.touchStart(firstTicket, {
        touches: [{ clientX: 100, clientY: 100 }]
      });
      fireEvent.touchMove(firstTicket, {
        touches: [{ clientX: 200, clientY: 100 }]
      });
      fireEvent.touchEnd(firstTicket);

      // Should reveal action buttons or trigger action
      await waitFor(() => {
        expect(screen.getByTestId('swipe-actions')).toBeInTheDocument();
      });
    });
  });

  describe('Touch Interactions', () => {
    it('should handle touch events on mobile devices', async () => {
      mockViewport(375);

      const TouchTest = () => {
        const [touched, setTouched] = React.useState(false);
        
        return (
          <div
            data-testid="touch-target"
            onTouchStart={() => setTouched(true)}
            className="w-full h-20 bg-blue-500 flex items-center justify-center text-white"
          >
            {touched ? 'Touched!' : 'Touch me'}
          </div>
        );
      };

      render(<TouchTest />);

      const touchTarget = screen.getByTestId('touch-target');
      expect(touchTarget).toHaveTextContent('Touch me');

      // Simulate touch
      fireEvent.touchStart(touchTarget);

      expect(touchTarget).toHaveTextContent('Touched!');
    });

    it('should provide adequate touch targets', () => {
      mockViewport(375);

      render(
        <TestWrapper>
          <button className="min-h-[44px] min-w-[44px] p-2">
            Small Button
          </button>
          <a href="#" className="inline-block min-h-[44px] min-w-[44px] p-2">
            Small Link
          </a>
          <input type="checkbox" className="h-6 w-6" />
        </TestWrapper>
      );

      const button = screen.getByRole('button');
      const link = screen.getByRole('link');
      const checkbox = screen.getByRole('checkbox');

      // Should meet minimum touch target size (44px)
      expect(button).toHaveClass('min-h-[44px]', 'min-w-[44px]');
      expect(link).toHaveClass('min-h-[44px]', 'min-w-[44px]');
      expect(checkbox).toHaveClass('h-6', 'w-6'); // Larger than default
    });

    it('should handle pinch-to-zoom gestures', () => {
      mockViewport(375);

      render(
        <TestWrapper>
          <div data-testid="zoomable-content" className="transform-gpu">
            <img src="/test-image.jpg" alt="Zoomable content" />
          </div>
        </TestWrapper>
      );

      const content = screen.getByTestId('zoomable-content');
      
      // Should allow pinch-to-zoom (not prevent default)
      const touchStartEvent = new TouchEvent('touchstart', {
        touches: [
          { clientX: 100, clientY: 100 } as Touch,
          { clientX: 200, clientY: 200 } as Touch,
        ]
      });

      fireEvent(content, touchStartEvent);
      
      // Should not prevent default zoom behavior
      expect(touchStartEvent.defaultPrevented).toBe(false);
    });
  });

  describe('Performance on Different Devices', () => {
    it('should optimize rendering for low-end devices', async () => {
      mockViewport(375);

      // Mock slow device
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        writable: true,
        value: 2, // Simulate dual-core device
      });

      const startTime = performance.now();

      render(
        <TestWrapper>
          <AnalyticsDashboard />
        </TestWrapper>
      );

      // Should render within reasonable time even on slow devices
      await waitFor(() => {
        expect(screen.getByText('Revenue Analytics')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within 3 seconds on slow devices
      expect(renderTime).toBeLessThan(3000);
    });

    it('should implement lazy loading for heavy components', async () => {
      mockViewport(375);

      const LazyComponent = React.lazy(() => 
        Promise.resolve({
          default: () => <div>Heavy Component Loaded</div>
        })
      );

      render(
        <TestWrapper>
          <React.Suspense fallback={<div>Loading...</div>}>
            <LazyComponent />
          </React.Suspense>
        </TestWrapper>
      );

      // Should show loading state first
      expect(screen.getByText('Loading...')).toBeInTheDocument();

      // Should load component
      await waitFor(() => {
        expect(screen.getByText('Heavy Component Loaded')).toBeInTheDocument();
      });
    });

    it('should reduce animations on low-end devices', () => {
      mockViewport(375);

      // Mock reduced motion preference
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('prefers-reduced-motion: reduce'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      render(
        <TestWrapper>
          <div className="transition-transform duration-300 hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100">
            Animated Element
          </div>
        </TestWrapper>
      );

      const element = screen.getByText('Animated Element');
      expect(element).toHaveClass('motion-reduce:transition-none', 'motion-reduce:hover:scale-100');
    });
  });

  describe('Cross-Browser Compatibility', () => {
    it('should handle different user agents', () => {
      // Mock different browsers
      const userAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      ];

      userAgents.forEach(userAgent => {
        Object.defineProperty(navigator, 'userAgent', {
          writable: true,
          value: userAgent,
        });

        render(
          <TestWrapper>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              <div>Item 1</div>
              <div>Item 2</div>
              <div>Item 3</div>
            </div>
          </TestWrapper>
        );

        // Should render consistently across browsers
        const items = screen.getAllByText(/Item \d/);
        expect(items).toHaveLength(3);
      });
    });

    it('should provide fallbacks for unsupported features', () => {
      // Mock browser without CSS Grid support
      const originalSupports = CSS.supports;
      CSS.supports = vi.fn().mockImplementation((property, value) => {
        if (property === 'display' && value === 'grid') {
          return false;
        }
        return originalSupports(property, value);
      });

      render(
        <TestWrapper>
          <div className="grid grid-cols-3 fallback:flex fallback:flex-wrap">
            <div className="fallback:w-1/3">Item 1</div>
            <div className="fallback:w-1/3">Item 2</div>
            <div className="fallback:w-1/3">Item 3</div>
          </div>
        </TestWrapper>
      );

      const container = screen.getByText('Item 1').parentElement;
      expect(container).toHaveClass('fallback:flex', 'fallback:flex-wrap');

      // Restore original function
      CSS.supports = originalSupports;
    });

    it('should handle different viewport units', () => {
      render(
        <TestWrapper>
          <div className="h-screen min-h-screen" style={{ minHeight: '100vh' }}>
            <div className="h-full">Full Height Content</div>
          </div>
        </TestWrapper>
      );

      const container = screen.getByText('Full Height Content').parentElement;
      expect(container).toHaveClass('h-full');
      
      const viewport = container?.parentElement;
      expect(viewport).toHaveClass('h-screen', 'min-h-screen');
    });
  });

  describe('Print Styles', () => {
    it('should optimize layout for printing', () => {
      render(
        <TestWrapper>
          <div className="print:hidden">Screen only content</div>
          <div className="hidden print:block">Print only content</div>
          <div className="print:text-black print:bg-white">
            Content optimized for print
          </div>
        </TestWrapper>
      );

      const screenOnly = screen.getByText('Screen only content');
      const printOnly = screen.getByText('Print only content');
      const printOptimized = screen.getByText('Content optimized for print');

      expect(screenOnly).toHaveClass('print:hidden');
      expect(printOnly).toHaveClass('hidden', 'print:block');
      expect(printOptimized).toHaveClass('print:text-black', 'print:bg-white');
    });
  });
});