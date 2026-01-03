import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { SubModuleFormDialog } from '../sub-module-form-dialog';
import * as subModuleActions from '@/lib/actions/subModuleActions';

// Mock the actions
vi.mock('@/lib/actions/subModuleActions', () => ({
  createSubModule: vi.fn(),
  updateSubModule: vi.fn(),
}));

// Mock toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const mockOnClose = vi.fn();
const mockOnSuccess = vi.fn();

const mockSubModule = {
  id: 'sub1',
  title: 'Linear Equations',
  description: 'Introduction to linear equations',
  order: 1,
  moduleId: 'module1',
};

describe('SubModuleFormDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create form when no sub-module is provided', () => {
    render(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
      />
    );

    expect(screen.getByText('Add New Sub-module')).toBeInTheDocument();
    expect(screen.getByText('Add a new sub-module (topic) to this module')).toBeInTheDocument();
    expect(screen.getByText('Create Sub-module')).toBeInTheDocument();
  });

  it('renders edit form when sub-module is provided', () => {
    render(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
        subModule={mockSubModule}
      />
    );

    expect(screen.getByText('Edit Sub-module')).toBeInTheDocument();
    expect(screen.getByText('Update the details of this sub-module (topic)')).toBeInTheDocument();
    expect(screen.getByText('Update Sub-module')).toBeInTheDocument();
  });

  it('populates form fields when editing', () => {
    render(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
        subModule={mockSubModule}
      />
    );

    expect(screen.getByDisplayValue('Linear Equations')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Introduction to linear equations')).toBeInTheDocument();
    expect(screen.getByDisplayValue('1')).toBeInTheDocument();
  });

  it('calls createSubModule when creating new sub-module', async () => {
    const mockCreateSubModule = vi.mocked(subModuleActions.createSubModule);
    mockCreateSubModule.mockResolvedValue({ success: true });

    render(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
      />
    );

    const titleInput = screen.getByPlaceholderText('e.g. Linear Equations');
    const descriptionInput = screen.getByPlaceholderText('Brief description of the sub-module');
    const orderInput = screen.getByLabelText('Display Order *');

    fireEvent.change(titleInput, { target: { value: 'New Sub-module' } });
    fireEvent.change(descriptionInput, { target: { value: 'New description' } });
    fireEvent.change(orderInput, { target: { value: '2' } });

    const submitButton = screen.getByText('Create Sub-module');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockCreateSubModule).toHaveBeenCalledWith({
        title: 'New Sub-module',
        description: 'New description',
        order: 2,
        moduleId: 'module1',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('calls updateSubModule when editing existing sub-module', async () => {
    const mockUpdateSubModule = vi.mocked(subModuleActions.updateSubModule);
    mockUpdateSubModule.mockResolvedValue({ success: true });

    render(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
        subModule={mockSubModule}
      />
    );

    const titleInput = screen.getByDisplayValue('Linear Equations');
    fireEvent.change(titleInput, { target: { value: 'Updated Linear Equations' } });

    const submitButton = screen.getByText('Update Sub-module');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateSubModule).toHaveBeenCalledWith({
        id: 'sub1',
        title: 'Updated Linear Equations',
        description: 'Introduction to linear equations',
        order: 1,
        moduleId: 'module1',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('displays error message when submission fails', async () => {
    const mockCreateSubModule = vi.mocked(subModuleActions.createSubModule);
    mockCreateSubModule.mockResolvedValue({
      success: false,
      error: 'Failed to create sub-module',
    });

    render(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
      />
    );

    const titleInput = screen.getByPlaceholderText('e.g. Linear Equations');
    fireEvent.change(titleInput, { target: { value: 'New Sub-module' } });

    const submitButton = screen.getByText('Create Sub-module');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Failed to create sub-module')).toBeInTheDocument();
    });
  });

  it('validates required fields', async () => {
    render(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
      />
    );

    const submitButton = screen.getByText('Create Sub-module');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Title must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('closes dialog when cancel button is clicked', () => {
    render(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
      />
    );

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('disables form during submission', async () => {
    const mockCreateSubModule = vi.mocked(subModuleActions.createSubModule);
    mockCreateSubModule.mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve({ success: true }), 100))
    );

    render(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
      />
    );

    const titleInput = screen.getByPlaceholderText('e.g. Linear Equations');
    fireEvent.change(titleInput, { target: { value: 'New Sub-module' } });

    const submitButton = screen.getByText('Create Sub-module');
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Creating...')).toBeInTheDocument();
    });
  });

  it('resets form when dialog is closed and reopened', async () => {
    const { rerender } = render(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
      />
    );

    const titleInput = screen.getByPlaceholderText('e.g. Linear Equations');
    fireEvent.change(titleInput, { target: { value: 'Test Title' } });

    // Close dialog
    rerender(
      <SubModuleFormDialog
        open={false}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
      />
    );

    // Reopen dialog
    rerender(
      <SubModuleFormDialog
        open={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        moduleId="module1"
      />
    );

    await waitFor(() => {
      const newTitleInput = screen.getByPlaceholderText('e.g. Linear Equations');
      expect(newTitleInput).toHaveValue('');
    });
  });
});
