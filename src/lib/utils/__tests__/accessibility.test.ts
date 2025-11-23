import { describe, it, expect } from 'vitest';
import {
  getContrastRatio,
  meetsWCAGAA,
  meetsWCAGAAA,
  getAriaDateLabel,
  getAriaTimeLabel,
  getAriaPercentageLabel,
  getAriaStatusLabel,
  generateAltText,
} from '../accessibility';

describe('Accessibility Utilities', () => {
  describe('Color Contrast', () => {
    it('should calculate contrast ratio correctly', () => {
      // Black on white should have maximum contrast
      const ratio = getContrastRatio('#000000', '#ffffff');
      expect(ratio).toBe(21);
    });

    it('should calculate contrast ratio for same colors', () => {
      const ratio = getContrastRatio('#000000', '#000000');
      expect(ratio).toBe(1);
    });

    it('should meet WCAG AA for normal text with 4.5:1 ratio', () => {
      // These colors have approximately 4.5:1 ratio
      expect(meetsWCAGAA('#767676', '#ffffff', false)).toBe(true);
    });

    it('should meet WCAG AA for large text with 3:1 ratio', () => {
      // These colors have approximately 3:1 ratio
      expect(meetsWCAGAA('#959595', '#ffffff', true)).toBe(true);
    });

    it('should not meet WCAG AA for insufficient contrast', () => {
      // Light gray on white has poor contrast
      expect(meetsWCAGAA('#cccccc', '#ffffff', false)).toBe(false);
    });

    it('should meet WCAG AAA for 7:1 ratio', () => {
      // Black on white meets AAA
      expect(meetsWCAGAAA('#000000', '#ffffff', false)).toBe(true);
    });

    it('should throw error for invalid hex colors', () => {
      expect(() => getContrastRatio('invalid', '#ffffff')).toThrow();
    });
  });

  describe('ARIA Label Generators', () => {
    it('should generate readable date label', () => {
      const date = new Date('2024-01-15');
      const label = getAriaDateLabel(date);
      expect(label).toContain('January');
      expect(label).toContain('15');
      expect(label).toContain('2024');
    });

    it('should generate readable time label', () => {
      const date = new Date('2024-01-15T14:30:00');
      const label = getAriaTimeLabel(date);
      expect(label).toMatch(/\d{1,2}:\d{2}\s?(AM|PM)/i);
    });

    it('should generate percentage label', () => {
      expect(getAriaPercentageLabel(75)).toBe('75 percent');
      expect(getAriaPercentageLabel(0)).toBe('0 percent');
      expect(getAriaPercentageLabel(100)).toBe('100 percent');
    });

    it('should generate status label', () => {
      expect(getAriaStatusLabel('IN_PROGRESS')).toBe('in progress');
      expect(getAriaStatusLabel('COMPLETED')).toBe('completed');
      expect(getAriaStatusLabel('NOT_STARTED')).toBe('not started');
    });
  });

  describe('Alt Text Generation', () => {
    it('should generate profile alt text', () => {
      expect(generateAltText('profile', 'John Doe')).toBe('Profile photo of John Doe');
      expect(generateAltText('profile')).toBe('Profile photo');
    });

    it('should generate document alt text', () => {
      expect(generateAltText('document', 'Report Card')).toBe('Document: Report Card');
      expect(generateAltText('document')).toBe('Document');
    });

    it('should generate chart alt text', () => {
      expect(generateAltText('chart', 'attendance trends')).toBe('Chart showing attendance trends');
      expect(generateAltText('chart')).toBe('Data visualization chart');
    });

    it('should generate logo alt text', () => {
      expect(generateAltText('logo', 'School ERP')).toBe('School ERP logo');
      expect(generateAltText('logo')).toBe('Logo');
    });

    it('should generate icon alt text', () => {
      expect(generateAltText('icon', 'settings')).toBe('settings icon');
      expect(generateAltText('icon')).toBe('Icon');
    });
  });
});
