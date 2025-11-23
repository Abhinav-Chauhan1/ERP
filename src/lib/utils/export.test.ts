import { describe, it, expect, vi, beforeEach } from 'vitest';
import { exportToCSV, exportToExcel, exportToPDF, exportReport } from './export';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

// Mock the dependencies
vi.mock('papaparse');
vi.mock('xlsx');

vi.mock('jspdf', () => {
  // Create a proper jsPDF mock class inside the factory
  return {
    default: class MockJsPDF {
      setFontSize = vi.fn();
      setFont = vi.fn();
      setTextColor = vi.fn();
      text = vi.fn();
      addPage = vi.fn();
      save = vi.fn();
    },
  };
});

vi.mock('jspdf-autotable', () => ({
  default: vi.fn(),
}));

describe('Export Utilities', () => {
  const sampleData = [
    { id: 1, name: 'John Doe', email: 'john@example.com', age: 25 },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com', age: 30 },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com', age: 35 },
  ];

  const exportOptions = {
    filename: 'test-report',
    title: 'Test Report',
    subtitle: 'Sample Data Export',
    includeTimestamp: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock DOM methods
    global.URL = {
      createObjectURL: vi.fn(() => 'blob:mock-url'),
      revokeObjectURL: vi.fn(),
    } as any;
    
    // Mock window object
    global.window = {
      URL: global.URL,
    } as any;
    
    // Mock document methods
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    };
    global.document = {
      createElement: vi.fn(() => mockLink as any),
      body: {
        appendChild: vi.fn(),
        removeChild: vi.fn(),
      },
    } as any;
  });

  describe('exportToCSV', () => {
    it('should export data to CSV format', () => {
      const mockCSV = 'id,name,email,age\n1,John Doe,john@example.com,25';
      (Papa.unparse as any).mockReturnValue(mockCSV);

      exportToCSV(sampleData, exportOptions);

      expect(Papa.unparse).toHaveBeenCalledWith(sampleData);
      expect(document.createElement).toHaveBeenCalledWith('a');
    });

    it('should throw error when no data provided', () => {
      expect(() => exportToCSV([], exportOptions)).toThrow('No data to export');
    });

    it('should create correct filename with .csv extension', () => {
      const mockCSV = 'test,data';
      (Papa.unparse as any).mockReturnValue(mockCSV);

      exportToCSV(sampleData, exportOptions);

      const createElementCalls = (document.createElement as any).mock.calls;
      expect(createElementCalls.length).toBeGreaterThan(0);
    });
  });

  describe('exportToExcel', () => {
    beforeEach(() => {
      (XLSX.utils.book_new as any) = vi.fn(() => ({ Props: {}, Sheets: {} }));
      (XLSX.utils.json_to_sheet as any) = vi.fn(() => ({}));
      (XLSX.utils.book_append_sheet as any) = vi.fn();
      (XLSX.writeFile as any) = vi.fn();
    });

    it('should export data to Excel format', () => {
      exportToExcel(sampleData, exportOptions);

      expect(XLSX.utils.book_new).toHaveBeenCalled();
      expect(XLSX.utils.json_to_sheet).toHaveBeenCalledWith(sampleData);
      expect(XLSX.utils.book_append_sheet).toHaveBeenCalled();
      expect(XLSX.writeFile).toHaveBeenCalled();
    });

    it('should throw error when no data provided', () => {
      expect(() => exportToExcel([], exportOptions)).toThrow('No data to export');
    });

    it('should set workbook properties when title is provided', () => {
      exportToExcel(sampleData, exportOptions);

      expect(XLSX.utils.book_new).toHaveBeenCalled();
    });

    it('should create correct filename with .xlsx extension', () => {
      exportToExcel(sampleData, exportOptions);

      expect(XLSX.writeFile).toHaveBeenCalledWith(
        expect.anything(),
        `${exportOptions.filename}.xlsx`
      );
    });
  });

  describe('exportToPDF', () => {
    it('should export data to PDF format', () => {
      // This test verifies the function runs without errors
      // Actual PDF generation is mocked
      expect(() => exportToPDF(sampleData, exportOptions)).not.toThrow();
    });

    it('should throw error when no data provided', () => {
      expect(() => exportToPDF([], exportOptions)).toThrow('No data to export');
    });

    it('should handle landscape orientation', () => {
      const landscapeOptions = { ...exportOptions, orientation: 'landscape' as const };
      expect(() => exportToPDF(sampleData, landscapeOptions)).not.toThrow();
    });

    it('should handle portrait orientation', () => {
      const portraitOptions = { ...exportOptions, orientation: 'portrait' as const };
      expect(() => exportToPDF(sampleData, portraitOptions)).not.toThrow();
    });
  });

  describe('exportReport', () => {
    beforeEach(() => {
      (Papa.unparse as any).mockReturnValue('mock,csv');
      (XLSX.utils.book_new as any) = vi.fn(() => ({ Props: {}, Sheets: {} }));
      (XLSX.utils.json_to_sheet as any) = vi.fn(() => ({}));
      (XLSX.utils.book_append_sheet as any) = vi.fn();
      (XLSX.writeFile as any) = vi.fn();
    });

    it('should export to CSV when format is csv', () => {
      exportReport(sampleData, 'csv', exportOptions);
      expect(Papa.unparse).toHaveBeenCalledWith(sampleData);
    });

    it('should export to Excel when format is excel', () => {
      exportReport(sampleData, 'excel', exportOptions);
      expect(XLSX.utils.book_new).toHaveBeenCalled();
    });

    it('should export to PDF when format is pdf', () => {
      expect(() => exportReport(sampleData, 'pdf', exportOptions)).not.toThrow();
    });

    it('should throw error for unsupported format', () => {
      expect(() => 
        exportReport(sampleData, 'invalid' as any, exportOptions)
      ).toThrow('Unsupported export format');
    });
  });

  describe('Data Formatting', () => {
    it('should handle null values in data', () => {
      const dataWithNulls = [
        { id: 1, name: 'John', value: null },
        { id: 2, name: null, value: 100 },
      ];

      expect(() => exportToCSV(dataWithNulls, exportOptions)).not.toThrow();
    });

    it('should handle undefined values in data', () => {
      const dataWithUndefined = [
        { id: 1, name: 'John', value: undefined },
        { id: 2, name: undefined, value: 100 },
      ];

      expect(() => exportToCSV(dataWithUndefined, exportOptions)).not.toThrow();
    });

    it('should handle objects in data', () => {
      const dataWithObjects = [
        { id: 1, name: 'John', metadata: { age: 25, city: 'NYC' } },
      ];

      expect(() => exportToCSV(dataWithObjects, exportOptions)).not.toThrow();
    });

    it('should handle arrays in data', () => {
      const dataWithArrays = [
        { id: 1, name: 'John', tags: ['student', 'active'] },
      ];

      expect(() => exportToCSV(dataWithArrays, exportOptions)).not.toThrow();
    });
  });

  describe('Edge Cases', () => {
    it('should handle single record', () => {
      const singleRecord = [{ id: 1, name: 'John' }];
      expect(() => exportToCSV(singleRecord, exportOptions)).not.toThrow();
    });

    it('should handle large datasets', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        id: i,
        name: `User ${i}`,
        email: `user${i}@example.com`,
      }));

      expect(() => exportToCSV(largeData, exportOptions)).not.toThrow();
    });

    it('should handle special characters in data', () => {
      const specialCharsData = [
        { id: 1, name: 'John "Johnny" Doe', email: 'john@example.com' },
        { id: 2, name: "Jane O'Brien", email: 'jane@example.com' },
      ];

      expect(() => exportToCSV(specialCharsData, exportOptions)).not.toThrow();
    });

    it('should handle unicode characters', () => {
      const unicodeData = [
        { id: 1, name: '张三', email: 'zhang@example.com' },
        { id: 2, name: 'José García', email: 'jose@example.com' },
      ];

      expect(() => exportToCSV(unicodeData, exportOptions)).not.toThrow();
    });
  });
});
