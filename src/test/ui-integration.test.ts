/**
 * Comprehensive UI Integration Tests
 * 
 * Tests complete user workflows across all super-admin interfaces including:
 * - Billing and subscription management
 * - School management and analytics
 * - System administration
 * - Support ticket management
 * - Knowledge base management
 * - Dashboard and reporting
 * 
 * Requirements: All UI-related requirements
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/providers/theme-provider';

// Import components to test
import { BillingDashboard } from '@/components/super-admin/billing/billing-dashboard';
import { EnhancedSchoolManagement } from '@/components/super-admin/schools/enhanced-school-management';
import { AnalyticsDashboard } from '@/components/super-admin/analytics/analytics-dashboard';
import { SupportTicketManagement } from '@/components/super-admin/support/support-ticket-management';
import { KnowledgeBaseManagement } from '@/components/super-admin/support/knowledge-base-management';
import { MonitoringDashboard } from '@/components/super-admin/monitoring/monitoring-dashboard';
import { DashboardBuilder } from '@/components/ui/dashboard-builder';
import { ReportBuilder } from '@/components/ui/report-builder';
import { DataExportDialog } from '@/components/ui/data-export';

// Test utilities
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>
    <ThemeProvider>
      {children}
    </ThemeProvider>
  </BrowserRouter>
);

const renderWithWrapper = (component: React.ReactElement) => {
  return render(component, { wrapper: TestWrapper });
};

// Mock data
const mockSchools = [
  {
    id: 'school_1',
    name: 'Springfield Elementary',
    status: 'ACTIVE',
    studentCount: 450,
    subscriptionPlan: 'PREMIUM',
    createdAt: new Date('2024-01-01'),
  },
  {
    id: 'school_2',
    name: 'Riverside High School',
    status: 'ACTIVE',
    studentCount: 1200,
    subscriptionPlan: 'ENTERPRISE',
    createdAt: new Date('2024-01-15'),
  },
];

const mockTickets = [
  {
    id: 'ticket_1',
    ticketNumber: 'TKT-001',
    title: 'Login Issues',
    status: 'OPEN',
    priority: 'HIGH',
    school: { name: 'Springfield Elementary' },
    createdAt: new Date('2024-01-20'),
  },
];

// Mock API responses
const mockApiResponses = {
  schools: mockSchools,
  tickets: mockTickets,
  analytics: {
    revenue: 125000,
    activeSchools: 45,
    totalUsers: 12500,
    supportTickets: 23,
  },
};

describe('UI Integration Tests', () => {
  beforeEach(() => {
    // Mock fetch API
    global.fetch = vi.fn();
    
    // Mock window.matchMedia for responsive tests
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

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
      observe: vi.fn(),
      unobserve: vi.fn(),
      disconnect: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Billing Dashboard Integration', () => {
    it('should display billing metrics and allow subscription management', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<BillingDashboard />);

      // Check if main metrics are displayed
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('Active Subscriptions')).toBeInTheDocument();
      expect(screen.getByText('Payment Success Rate')).toBeInTheDocument();

      // Test subscription management
      const manageButton = screen.getByRole('button', { name: /manage subscriptions/i });
      await user.click(manageButton);

      // Should open subscription management dialog
      await waitFor(() => {
        expect(screen.getByText('Subscription Management')).toBeInTheDocument();
      });

      // Test plan comparison
      const compareButton = screen.getByRole('button', { name: /compare plans/i });
      await user.click(compareButton);

      await waitFor(() => {
        expect(screen.getByText('Plan Comparison')).toBeInTheDocument();
      });
    });

    it('should handle payment history filtering and export', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<BillingDashboard />);

      // Navigate to payment history
      const historyTab = screen.getByRole('tab', { name: /payment history/i });
      await user.click(historyTab);

      // Test date range filter
      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '2024-01-01');

      const endDateInput = screen.getByLabelText(/end date/i);
      await user.type(endDateInput, '2024-01-31');

      const applyFilterButton = screen.getByRole('button', { name: /apply filter/i });
      await user.click(applyFilterButton);

      // Test export functionality
      const exportButton = screen.getByRole('button', { name: /export/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Export Payment History')).toBeInTheDocument();
      });
    });
  });

  describe('School Management Integration', () => {
    it('should display schools list with search and filtering', async () => {
      const user = userEvent.setup();
      
      // Mock API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ schools: mockSchools, total: mockSchools.length }),
      });

      renderWithWrapper(<EnhancedSchoolManagement />);

      // Wait for schools to load
      await waitFor(() => {
        expect(screen.getByText('Springfield Elementary')).toBeInTheDocument();
        expect(screen.getByText('Riverside High School')).toBeInTheDocument();
      });

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search schools/i);
      await user.type(searchInput, 'Springfield');

      // Should filter results
      await waitFor(() => {
        expect(screen.getByText('Springfield Elementary')).toBeInTheDocument();
        expect(screen.queryByText('Riverside High School')).not.toBeInTheDocument();
      });

      // Test status filter
      const statusFilter = screen.getByRole('combobox', { name: /status/i });
      await user.click(statusFilter);
      
      const activeOption = screen.getByRole('option', { name: /active/i });
      await user.click(activeOption);

      // Should apply filter
      await waitFor(() => {
        expect(screen.getByText('Active schools only')).toBeInTheDocument();
      });
    });

    it('should handle bulk operations on schools', async () => {
      const user = userEvent.setup();
      
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ schools: mockSchools, total: mockSchools.length }),
      });

      renderWithWrapper(<EnhancedSchoolManagement />);

      await waitFor(() => {
        expect(screen.getByText('Springfield Elementary')).toBeInTheDocument();
      });

      // Select multiple schools
      const checkboxes = screen.getAllByRole('checkbox');
      await user.click(checkboxes[0]); // Select first school
      await user.click(checkboxes[1]); // Select second school

      // Bulk actions should be available
      const bulkActionsButton = screen.getByRole('button', { name: /bulk actions/i });
      expect(bulkActionsButton).toBeEnabled();

      await user.click(bulkActionsButton);

      // Should show bulk action options
      await waitFor(() => {
        expect(screen.getByText('Suspend Schools')).toBeInTheDocument();
        expect(screen.getByText('Update Subscription')).toBeInTheDocument();
      });
    });
  });

  describe('Analytics Dashboard Integration', () => {
    it('should display interactive charts with time range selection', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<AnalyticsDashboard />);

      // Check if charts are rendered
      expect(screen.getByText('Revenue Analytics')).toBeInTheDocument();
      expect(screen.getByText('User Growth')).toBeInTheDocument();
      expect(screen.getByText('School Distribution')).toBeInTheDocument();

      // Test time range selector
      const timeRangeSelect = screen.getByRole('combobox', { name: /time range/i });
      await user.click(timeRangeSelect);

      const lastMonthOption = screen.getByRole('option', { name: /last 30 days/i });
      await user.click(lastMonthOption);

      // Charts should update
      await waitFor(() => {
        expect(screen.getByText('Last 30 Days')).toBeInTheDocument();
      });

      // Test chart interaction
      const chartContainer = screen.getByTestId('revenue-chart');
      fireEvent.mouseOver(chartContainer);

      // Should show tooltip
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toBeInTheDocument();
      });
    });

    it('should handle metric drill-down and filtering', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<AnalyticsDashboard />);

      // Click on a metric card to drill down
      const revenueCard = screen.getByText('Total Revenue').closest('[role="button"]');
      if (revenueCard) {
        await user.click(revenueCard);

        // Should open detailed view
        await waitFor(() => {
          expect(screen.getByText('Revenue Breakdown')).toBeInTheDocument();
        });

        // Test filtering in detailed view
        const filterButton = screen.getByRole('button', { name: /filter/i });
        await user.click(filterButton);

        await waitFor(() => {
          expect(screen.getByText('Filter Options')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Support Ticket Management Integration', () => {
    it('should display tickets with SLA tracking and filtering', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<SupportTicketManagement />);

      // Check SLA compliance metrics
      expect(screen.getByText('SLA Compliance')).toBeInTheDocument();
      expect(screen.getByText('Avg Resolution Time')).toBeInTheDocument();

      // Test ticket filtering
      const priorityFilter = screen.getByRole('combobox', { name: /priority/i });
      await user.click(priorityFilter);

      const highPriorityOption = screen.getByRole('option', { name: /high/i });
      await user.click(highPriorityOption);

      // Should filter tickets
      await waitFor(() => {
        expect(screen.getByText('High priority tickets')).toBeInTheDocument();
      });

      // Test ticket creation
      const createTicketButton = screen.getByRole('button', { name: /create ticket/i });
      await user.click(createTicketButton);

      await waitFor(() => {
        expect(screen.getByText('Create Support Ticket')).toBeInTheDocument();
      });

      // Fill out ticket form
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Ticket');

      const descriptionInput = screen.getByLabelText(/description/i);
      await user.type(descriptionInput, 'This is a test ticket');

      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // Should create ticket
      await waitFor(() => {
        expect(screen.getByText('Ticket created successfully')).toBeInTheDocument();
      });
    });

    it('should handle ticket escalation and SLA monitoring', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<SupportTicketManagement />);

      // Find a ticket that can be escalated
      const ticketRow = screen.getByText('Login Issues').closest('[data-testid="ticket-row"]');
      if (ticketRow) {
        const escalateButton = within(ticketRow).getByRole('button', { name: /escalate/i });
        await user.click(escalateButton);

        // Should open escalation dialog
        await waitFor(() => {
          expect(screen.getByText('Escalate Ticket')).toBeInTheDocument();
        });

        const reasonInput = screen.getByLabelText(/reason/i);
        await user.type(reasonInput, 'SLA breach imminent');

        const confirmButton = screen.getByRole('button', { name: /escalate/i });
        await user.click(confirmButton);

        // Should escalate ticket
        await waitFor(() => {
          expect(screen.getByText('Ticket escalated successfully')).toBeInTheDocument();
        });
      }
    });
  });

  describe('Knowledge Base Management Integration', () => {
    it('should allow article creation and management', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<KnowledgeBaseManagement />);

      // Test article creation
      const createArticleButton = screen.getByRole('button', { name: /create article/i });
      await user.click(createArticleButton);

      await waitFor(() => {
        expect(screen.getByText('Create Knowledge Base Article')).toBeInTheDocument();
      });

      // Fill out article form
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'How to Reset Password');

      const categorySelect = screen.getByRole('combobox', { name: /category/i });
      await user.click(categorySelect);
      
      const userManagementOption = screen.getByRole('option', { name: /user management/i });
      await user.click(userManagementOption);

      const contentTextarea = screen.getByLabelText(/content/i);
      await user.type(contentTextarea, 'Step-by-step guide to reset passwords...');

      const tagsInput = screen.getByLabelText(/tags/i);
      await user.type(tagsInput, 'password, reset, help');

      const publishCheckbox = screen.getByLabelText(/publish immediately/i);
      await user.click(publishCheckbox);

      const saveButton = screen.getByRole('button', { name: /create article/i });
      await user.click(saveButton);

      // Should create article
      await waitFor(() => {
        expect(screen.getByText('Article created successfully')).toBeInTheDocument();
      });
    });

    it('should handle article search and filtering', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<KnowledgeBaseManagement />);

      // Test search functionality
      const searchInput = screen.getByPlaceholderText(/search articles/i);
      await user.type(searchInput, 'password');

      // Should filter articles
      await waitFor(() => {
        expect(screen.getByText('Password-related articles')).toBeInTheDocument();
      });

      // Test category filtering
      const categoryFilter = screen.getByRole('combobox', { name: /category/i });
      await user.click(categoryFilter);

      const technicalSupportOption = screen.getByRole('option', { name: /technical support/i });
      await user.click(technicalSupportOption);

      // Should apply category filter
      await waitFor(() => {
        expect(screen.getByText('Technical Support articles')).toBeInTheDocument();
      });
    });
  });

  describe('Dashboard Builder Integration', () => {
    it('should allow drag-and-drop widget management', async () => {
      const user = userEvent.setup();
      
      const mockLayout = {
        id: 'test-dashboard',
        name: 'Test Dashboard',
        widgets: [],
        columns: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const onLayoutChange = vi.fn();

      renderWithWrapper(
        <DashboardBuilder 
          layout={mockLayout} 
          onLayoutChange={onLayoutChange}
          isEditing={true}
        />
      );

      // Test adding a widget
      const addWidgetButton = screen.getByRole('button', { name: /add widget/i });
      await user.click(addWidgetButton);

      await waitFor(() => {
        expect(screen.getByText('Add Widget')).toBeInTheDocument();
      });

      // Select metric widget
      const metricWidgetCard = screen.getByText('Metric Widget').closest('[role="button"]');
      if (metricWidgetCard) {
        await user.click(metricWidgetCard);

        // Should add widget to dashboard
        expect(onLayoutChange).toHaveBeenCalledWith(
          expect.objectContaining({
            widgets: expect.arrayContaining([
              expect.objectContaining({
                type: 'metric',
                title: 'Metric Widget',
              })
            ])
          })
        );
      }
    });

    it('should handle widget configuration and resizing', async () => {
      const user = userEvent.setup();
      
      const mockLayout = {
        id: 'test-dashboard',
        name: 'Test Dashboard',
        widgets: [
          {
            id: 'widget_1',
            type: 'metric' as const,
            title: 'Test Metric',
            position: { x: 0, y: 0, width: 2, height: 1 },
            config: {},
            visible: true,
          }
        ],
        columns: 12,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const onLayoutChange = vi.fn();

      renderWithWrapper(
        <DashboardBuilder 
          layout={mockLayout} 
          onLayoutChange={onLayoutChange}
          isEditing={true}
        />
      );

      // Test widget configuration
      const configButton = screen.getByRole('button', { name: /configure/i });
      await user.click(configButton);

      await waitFor(() => {
        expect(screen.getByText('Configure Widget')).toBeInTheDocument();
      });

      // Update widget title
      const titleInput = screen.getByLabelText(/title/i);
      await user.clear(titleInput);
      await user.type(titleInput, 'Updated Metric');

      const saveButton = screen.getByRole('button', { name: /save/i });
      await user.click(saveButton);

      // Should update widget
      expect(onLayoutChange).toHaveBeenCalledWith(
        expect.objectContaining({
          widgets: expect.arrayContaining([
            expect.objectContaining({
              title: 'Updated Metric',
            })
          ])
        })
      );
    });
  });

  describe('Report Builder Integration', () => {
    it('should allow visual query building and preview', async () => {
      const user = userEvent.setup();
      
      const mockReport = {
        id: 'test-report',
        name: 'Test Report',
        query: {
          dataSource: '',
          fields: [],
          filters: [],
          sorts: [],
          groupBy: [],
        },
        visualization: { type: 'table' as const },
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'test-user',
      };

      const onSave = vi.fn();
      const onCancel = vi.fn();

      renderWithWrapper(
        <ReportBuilder 
          report={mockReport}
          onSave={onSave}
          onCancel={onCancel}
        />
      );

      // Select data source
      const dataSourceSelect = screen.getByRole('combobox', { name: /data source/i });
      await user.click(dataSourceSelect);

      const schoolsOption = screen.getByRole('option', { name: /schools/i });
      await user.click(schoolsOption);

      // Add fields
      const nameFieldButton = screen.getByRole('button', { name: /school name/i });
      await user.click(nameFieldButton);

      const statusFieldButton = screen.getByRole('button', { name: /status/i });
      await user.click(statusFieldButton);

      // Add filter
      const addFilterButton = screen.getByRole('button', { name: /add filter/i });
      await user.click(addFilterButton);

      // Configure filter
      const fieldSelect = screen.getByRole('combobox', { name: /field/i });
      await user.click(fieldSelect);

      const statusFieldOption = screen.getByRole('option', { name: /status/i });
      await user.click(statusFieldOption);

      const valueInput = screen.getByPlaceholderText(/value/i);
      await user.type(valueInput, 'ACTIVE');

      // Preview report
      const previewTab = screen.getByRole('tab', { name: /preview/i });
      await user.click(previewTab);

      const runPreviewButton = screen.getByRole('button', { name: /run preview/i });
      await user.click(runPreviewButton);

      // Should show preview data
      await waitFor(() => {
        expect(screen.getByText('Loading preview...')).toBeInTheDocument();
      });
    });
  });

  describe('Data Export Integration', () => {
    it('should handle various export formats and configurations', async () => {
      const user = userEvent.setup();
      
      const mockData = [
        { id: 1, name: 'School A', status: 'ACTIVE' },
        { id: 2, name: 'School B', status: 'INACTIVE' },
      ];

      const mockColumns = [
        { id: 'id', name: 'ID', type: 'number' },
        { id: 'name', name: 'Name', type: 'string' },
        { id: 'status', name: 'Status', type: 'string' },
      ];

      const onExport = vi.fn();

      renderWithWrapper(
        <DataExportDialog
          title="Export Schools"
          data={mockData}
          columns={mockColumns}
          onExport={onExport}
        >
          <button>Export Data</button>
        </DataExportDialog>
      );

      // Open export dialog
      const exportButton = screen.getByRole('button', { name: /export data/i });
      await user.click(exportButton);

      await waitFor(() => {
        expect(screen.getByText('Export Schools')).toBeInTheDocument();
      });

      // Select Excel format
      const excelFormatCard = screen.getByText('Excel').closest('[role="button"]');
      if (excelFormatCard) {
        await user.click(excelFormatCard);
      }

      // Configure filename
      const filenameInput = screen.getByLabelText(/filename/i);
      await user.clear(filenameInput);
      await user.type(filenameInput, 'schools-export');

      // Select columns
      const nameColumnCheckbox = screen.getByLabelText(/name/i);
      await user.click(nameColumnCheckbox); // Uncheck

      const statusColumnCheckbox = screen.getByLabelText(/status/i);
      await user.click(statusColumnCheckbox); // Uncheck

      // Set date range
      const startDateInput = screen.getByLabelText(/start date/i);
      await user.type(startDateInput, '2024-01-01');

      // Enable compression
      const compressionCheckbox = screen.getByLabelText(/compress file/i);
      await user.click(compressionCheckbox);

      // Export data
      const exportDataButton = screen.getByRole('button', { name: /export data/i });
      await user.click(exportDataButton);

      // Should call onExport with correct configuration
      expect(onExport).toHaveBeenCalledWith(
        expect.objectContaining({
          format: 'excel',
          filename: 'schools-export',
          compression: true,
          dateRange: expect.objectContaining({
            start: expect.any(Date),
          }),
        })
      );
    });
  });

  describe('Responsive Design Tests', () => {
    it('should adapt to mobile viewport', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('max-width: 768px'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithWrapper(<BillingDashboard />);

      // Should show mobile-optimized layout
      expect(screen.getByTestId('mobile-menu-button')).toBeInTheDocument();
      
      // Cards should stack vertically
      const metricCards = screen.getAllByTestId('metric-card');
      expect(metricCards).toHaveLength(4);
      
      // Each card should be full width on mobile
      metricCards.forEach(card => {
        expect(card).toHaveClass('w-full');
      });
    });

    it('should handle tablet viewport', async () => {
      // Mock tablet viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: vi.fn().mockImplementation(query => ({
          matches: query.includes('min-width: 768px') && query.includes('max-width: 1024px'),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });

      renderWithWrapper(<AnalyticsDashboard />);

      // Should show tablet-optimized layout
      const chartContainer = screen.getByTestId('charts-container');
      expect(chartContainer).toHaveClass('grid-cols-2'); // 2 columns on tablet
    });
  });

  describe('Accessibility Tests', () => {
    it('should support keyboard navigation', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<SupportTicketManagement />);

      // Test tab navigation
      await user.tab();
      expect(screen.getByRole('button', { name: /create ticket/i })).toHaveFocus();

      await user.tab();
      expect(screen.getByRole('combobox', { name: /priority/i })).toHaveFocus();

      // Test Enter key activation
      await user.keyboard('{Enter}');
      
      await waitFor(() => {
        expect(screen.getByRole('listbox')).toBeInTheDocument();
      });

      // Test arrow key navigation in dropdown
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      // Should select option
      expect(screen.getByDisplayValue('HIGH')).toBeInTheDocument();
    });

    it('should provide proper ARIA labels and roles', () => {
      renderWithWrapper(<MonitoringDashboard />);

      // Check for proper ARIA labels
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
      
      // Check for proper headings hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(4);

      // Check for proper button labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveAttribute('aria-label');
      });

      // Check for proper form labels
      const inputs = screen.getAllByRole('textbox');
      inputs.forEach(input => {
        expect(input).toHaveAccessibleName();
      });
    });

    it('should support screen reader announcements', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<BillingDashboard />);

      // Test live region announcements
      const refreshButton = screen.getByRole('button', { name: /refresh/i });
      await user.click(refreshButton);

      // Should announce loading state
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Loading data...');
      });

      // Should announce completion
      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent('Data refreshed successfully');
      });
    });
  });

  describe('Error Handling Tests', () => {
    it('should handle API errors gracefully', async () => {
      const user = userEvent.setup();
      
      // Mock API error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));

      renderWithWrapper(<EnhancedSchoolManagement />);

      // Should show error state
      await waitFor(() => {
        expect(screen.getByText('Failed to load schools')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
      });

      // Test retry functionality
      const retryButton = screen.getByRole('button', { name: /retry/i });
      await user.click(retryButton);

      // Should attempt to reload
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should validate form inputs and show errors', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<SupportTicketManagement />);

      // Open create ticket dialog
      const createButton = screen.getByRole('button', { name: /create ticket/i });
      await user.click(createButton);

      // Try to submit without required fields
      const submitButton = screen.getByRole('button', { name: /create/i });
      await user.click(submitButton);

      // Should show validation errors
      await waitFor(() => {
        expect(screen.getByText('Title is required')).toBeInTheDocument();
        expect(screen.getByText('Description is required')).toBeInTheDocument();
      });

      // Fill required fields
      const titleInput = screen.getByLabelText(/title/i);
      await user.type(titleInput, 'Test Ticket');

      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByText('Title is required')).not.toBeInTheDocument();
      });
    });
  });

  describe('Performance Tests', () => {
    it('should handle large datasets efficiently', async () => {
      const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
        id: `school_${i}`,
        name: `School ${i}`,
        status: i % 2 === 0 ? 'ACTIVE' : 'INACTIVE',
        studentCount: Math.floor(Math.random() * 1000) + 100,
      }));

      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ schools: largeDataset, total: largeDataset.length }),
      });

      const startTime = performance.now();
      
      renderWithWrapper(<EnhancedSchoolManagement />);

      await waitFor(() => {
        expect(screen.getByText('School 0')).toBeInTheDocument();
      });

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Should render within reasonable time (less than 2 seconds)
      expect(renderTime).toBeLessThan(2000);

      // Should implement virtualization for large lists
      const visibleItems = screen.getAllByTestId('school-item');
      expect(visibleItems.length).toBeLessThan(100); // Should not render all 1000 items
    });

    it('should debounce search inputs', async () => {
      const user = userEvent.setup();
      
      renderWithWrapper(<KnowledgeBaseManagement />);

      const searchInput = screen.getByPlaceholderText(/search articles/i);
      
      // Type rapidly
      await user.type(searchInput, 'password reset help');

      // Should only trigger search after debounce delay
      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledTimes(1);
      }, { timeout: 1000 });
    });
  });
});