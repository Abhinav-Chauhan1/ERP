/**
 * Color Contrast Verification Script
 * Verifies WCAG AA compliance for parent dashboard colors
 * 
 * WCAG AA Requirements:
 * - Normal text (< 18pt): 4.5:1 contrast ratio
 * - Large text (>= 18pt or >= 14pt bold): 3:1 contrast ratio
 * - UI components and graphical objects: 3:1 contrast ratio
 */

// Convert HSL to RGB
function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  s /= 100;
  l /= 100;
  
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  
  let r = 0, g = 0, b = 0;
  
  if (h >= 0 && h < 60) {
    r = c; g = x; b = 0;
  } else if (h >= 60 && h < 120) {
    r = x; g = c; b = 0;
  } else if (h >= 120 && h < 180) {
    r = 0; g = c; b = x;
  } else if (h >= 180 && h < 240) {
    r = 0; g = x; b = c;
  } else if (h >= 240 && h < 300) {
    r = x; g = 0; b = c;
  } else if (h >= 300 && h < 360) {
    r = c; g = 0; b = x;
  }
  
  return [
    Math.round((r + m) * 255),
    Math.round((g + m) * 255),
    Math.round((b + m) * 255)
  ];
}

// Calculate relative luminance
function getLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
}

// Calculate contrast ratio
function getContrastRatio(rgb1: [number, number, number], rgb2: [number, number, number]): number {
  const lum1 = getLuminance(...rgb1);
  const lum2 = getLuminance(...rgb2);
  
  const lighter = Math.max(lum1, lum2);
  const darker = Math.min(lum1, lum2);
  
  return (lighter + 0.05) / (darker + 0.05);
}

// Theme colors from globals.css
const themeColors = {
  light: {
    background: [0, 0, 100] as [number, number, number], // HSL: 0 0% 100%
    foreground: [222.2, 84, 4.9] as [number, number, number], // HSL: 222.2 84% 4.9%
    card: [0, 0, 100] as [number, number, number], // HSL: 0 0% 100%
    cardForeground: [222.2, 84, 4.9] as [number, number, number], // HSL: 222.2 84% 4.9%
    primary: [24.6, 95, 39.5] as [number, number, number], // HSL: 24.6 95% 39.5% (Orange - darkened for WCAG AA)
    primaryForeground: [0, 0, 100] as [number, number, number], // HSL: 0 0% 100% (Pure white for better contrast)
    muted: [210, 40, 96.1] as [number, number, number], // HSL: 210 40% 96.1%
    mutedForeground: [215.4, 16.3, 46.9] as [number, number, number], // HSL: 215.4 16.3% 46.9%
    accent: [210, 40, 96.1] as [number, number, number], // HSL: 210 40% 96.1%
    accentForeground: [222.2, 47.4, 11.2] as [number, number, number], // HSL: 222.2 47.4% 11.2%
    destructive: [0, 84.2, 50] as [number, number, number], // HSL: 0 84.2% 50% (Darkened for WCAG AA)
    destructiveForeground: [0, 0, 100] as [number, number, number], // HSL: 0 0% 100% (Pure white for better contrast)
  },
  dark: {
    background: [222.2, 84, 4.9] as [number, number, number], // HSL: 222.2 84% 4.9%
    foreground: [210, 40, 98] as [number, number, number], // HSL: 210 40% 98%
    card: [222.2, 84, 4.9] as [number, number, number], // HSL: 222.2 84% 4.9%
    cardForeground: [210, 40, 98] as [number, number, number], // HSL: 210 40% 98%
    primary: [20.5, 90.2, 65] as [number, number, number], // HSL: 20.5 90.2% 65% (Orange dark - lightened for WCAG AA)
    primaryForeground: [222.2, 84, 4.9] as [number, number, number], // HSL: 222.2 84% 4.9% (Dark background for better contrast)
    muted: [217.2, 32.6, 17.5] as [number, number, number], // HSL: 217.2 32.6% 17.5%
    mutedForeground: [215, 20.2, 65.1] as [number, number, number], // HSL: 215 20.2% 65.1%
    accent: [217.2, 32.6, 17.5] as [number, number, number], // HSL: 217.2 32.6% 17.5%
    accentForeground: [210, 40, 98] as [number, number, number], // HSL: 210 40% 98%
    destructive: [0, 62.8, 30.6] as [number, number, number], // HSL: 0 62.8% 30.6%
    destructiveForeground: [210, 40, 98] as [number, number, number], // HSL: 210 40% 98%
  }
};

// Test color combinations
interface ColorTest {
  name: string;
  foreground: [number, number, number];
  background: [number, number, number];
  minRatio: number; // 4.5 for normal text, 3.0 for large text/UI
  isLargeText?: boolean;
}

function testColorContrast(mode: 'light' | 'dark') {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Testing ${mode.toUpperCase()} Mode Color Contrast`);
  console.log('='.repeat(60));
  
  const colors = themeColors[mode];
  
  const tests: ColorTest[] = [
    {
      name: 'Body text on background',
      foreground: colors.foreground,
      background: colors.background,
      minRatio: 4.5,
    },
    {
      name: 'Card text on card background',
      foreground: colors.cardForeground,
      background: colors.card,
      minRatio: 4.5,
    },
    {
      name: 'Primary button text',
      foreground: colors.primaryForeground,
      background: colors.primary,
      minRatio: 4.5,
    },
    {
      name: 'Muted text on background',
      foreground: colors.mutedForeground,
      background: colors.background,
      minRatio: 4.5,
    },
    {
      name: 'Muted text on card',
      foreground: colors.mutedForeground,
      background: colors.card,
      minRatio: 4.5,
    },
    {
      name: 'Accent text on accent background',
      foreground: colors.accentForeground,
      background: colors.accent,
      minRatio: 4.5,
    },
    {
      name: 'Destructive button text',
      foreground: colors.destructiveForeground,
      background: colors.destructive,
      minRatio: 4.5,
    },
    {
      name: 'Primary color on background (UI elements)',
      foreground: colors.primary,
      background: colors.background,
      minRatio: 3.0,
      isLargeText: true,
    },
    {
      name: 'Primary color on card (UI elements)',
      foreground: colors.primary,
      background: colors.card,
      minRatio: 3.0,
      isLargeText: true,
    },
  ];
  
  let passCount = 0;
  let failCount = 0;
  
  tests.forEach(test => {
    const fgRgb = hslToRgb(...test.foreground);
    const bgRgb = hslToRgb(...test.background);
    const ratio = getContrastRatio(fgRgb, bgRgb);
    const passes = ratio >= test.minRatio;
    
    if (passes) {
      passCount++;
    } else {
      failCount++;
    }
    
    const status = passes ? '✓ PASS' : '✗ FAIL';
    const statusColor = passes ? '\x1b[32m' : '\x1b[31m';
    const resetColor = '\x1b[0m';
    
    console.log(`\n${statusColor}${status}${resetColor} ${test.name}`);
    console.log(`  Contrast Ratio: ${ratio.toFixed(2)}:1`);
    console.log(`  Required: ${test.minRatio}:1 (${test.isLargeText ? 'Large text/UI' : 'Normal text'})`);
    console.log(`  Foreground: HSL(${test.foreground.join(', ')}) → RGB(${fgRgb.join(', ')})`);
    console.log(`  Background: HSL(${test.background.join(', ')}) → RGB(${bgRgb.join(', ')})`);
  });
  
  console.log(`\n${'-'.repeat(60)}`);
  console.log(`Results: ${passCount} passed, ${failCount} failed`);
  console.log('-'.repeat(60));
  
  return { passCount, failCount };
}

// Run tests
console.log('\n🎨 Parent Dashboard Color Contrast Verification');
console.log('WCAG AA Compliance Check\n');

const lightResults = testColorContrast('light');
const darkResults = testColorContrast('dark');

console.log(`\n${'='.repeat(60)}`);
console.log('OVERALL RESULTS');
console.log('='.repeat(60));
console.log(`Light Mode: ${lightResults.passCount} passed, ${lightResults.failCount} failed`);
console.log(`Dark Mode: ${darkResults.passCount} passed, ${darkResults.failCount} failed`);
console.log(`Total: ${lightResults.passCount + darkResults.passCount} passed, ${lightResults.failCount + darkResults.failCount} failed`);

if (lightResults.failCount === 0 && darkResults.failCount === 0) {
  console.log('\n✅ All color combinations meet WCAG AA standards!');
  process.exit(0);
} else {
  console.log('\n⚠️  Some color combinations do not meet WCAG AA standards.');
  console.log('Please review and adjust the failing combinations.');
  process.exit(1);
}
