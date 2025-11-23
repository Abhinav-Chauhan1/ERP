/**
 * Dynamic Import Utilities
 * 
 * Centralized dynamic imports for heavy components to enable code splitting
 * and improve initial page load performance.
 */

import dynamic from 'next/dynamic';
import React from 'react';

// Chart components (Recharts is heavy ~100KB)
export const DynamicChart = dynamic(
  () => import('@/components/dashboard/chart').then(mod => mod.Chart),
  {
    loading: () => React.createElement('div', { className: 'h-[300px] animate-pulse bg-muted rounded-lg' }),
    ssr: false, // Charts don't need SSR
  }
);

export const DynamicPerformanceChart = dynamic(
  () => import('@/components/student/performance-chart').then(mod => mod.PerformanceChart),
  {
    loading: () => React.createElement('div', { className: 'h-[400px] animate-pulse bg-muted rounded-lg' }),
    ssr: false,
  }
);

export const DynamicAttendanceTrendChart = dynamic(
  () => import('@/components/student/attendance-trend-chart').then(mod => mod.AttendanceTrendChart),
  {
    loading: () => React.createElement('div', { className: 'h-[300px] animate-pulse bg-muted rounded-lg' }),
    ssr: false,
  }
);

// Rich text editor (if used)
// export const DynamicRichTextEditor = dynamic(
//   () => import('@/components/shared/rich-text-editor').then(mod => mod.RichTextEditor),
//   {
//     loading: () => React.createElement('div', { className: 'h-[200px] animate-pulse bg-muted rounded-lg' }),
//     ssr: false,
//   }
// );

// Calendar components (react-datepicker is ~50KB)
// export const DynamicDatePicker = dynamic(
//   () => import('react-datepicker').then(mod => mod.default),
//   {
//     loading: () => React.createElement('div', { className: 'h-10 animate-pulse bg-muted rounded-md' }),
//     ssr: false,
//   }
// );

// Data table with heavy features
// export const DynamicDataTable = dynamic(
//   () => import('@/components/shared/data-table').then(mod => mod.DataTable),
//   {
//     loading: () => React.createElement('div', { className: 'h-[400px] animate-pulse bg-muted rounded-lg' }),
//   }
// );

// PDF viewer (if used)
// export const DynamicPDFViewer = dynamic(
//   () => import('@/components/shared/pdf-viewer').then(mod => mod.PDFViewer),
//   {
//     loading: () => React.createElement('div', { className: 'h-[600px] animate-pulse bg-muted rounded-lg flex items-center justify-center' }, 'Loading PDF...'),
//     ssr: false,
//   }
// );

// QR Code generator (qrcode library)
// export const DynamicQRCode = dynamic(
//   () => import('@/components/shared/qr-code').then(mod => mod.QRCode),
//   {
//     loading: () => React.createElement('div', { className: 'w-32 h-32 animate-pulse bg-muted rounded-lg' }),
//     ssr: false,
//   }
// );

// Barcode generator (jsbarcode library)
// export const DynamicBarcode = dynamic(
//   () => import('@/components/shared/barcode').then(mod => mod.Barcode),
//   {
//     loading: () => React.createElement('div', { className: 'w-48 h-16 animate-pulse bg-muted rounded-lg' }),
//     ssr: false,
//   }
// );

// Command palette (cmdk is ~30KB)
// export const DynamicCommandPalette = dynamic(
//   () => import('@/components/shared/command-palette').then(mod => mod.CommandPalette),
//   {
//     loading: () => null,
//     ssr: false,
//   }
// );

// Notification center
// export const DynamicNotificationCenter = dynamic(
//   () => import('@/components/shared/notification-center').then(mod => mod.NotificationCenter),
//   {
//     loading: () => null,
//     ssr: false,
//   }
// );

// Export dialogs (xlsx library is heavy)
// export const DynamicExportDialog = dynamic(
//   () => import('@/components/shared/export-dialog').then(mod => mod.ExportDialog),
//   {
//     loading: () => null,
//   }
// );

// Advanced filters
// export const DynamicAdvancedFilters = dynamic(
//   () => import('@/components/shared/advanced-filters').then(mod => mod.AdvancedFilters),
//   {
//     loading: () => React.createElement('div', { className: 'h-12 animate-pulse bg-muted rounded-md' }),
//   }
// );

// Modal/Dialog heavy components
// export const DynamicBulkImportDialog = dynamic(
//   () => import('@/components/admin/bulk-import-dialog').then(mod => mod.BulkImportDialog),
//   {
//     loading: () => null,
//   }
// );

// Certificate generation (jsPDF is heavy)
// export const DynamicCertificateGenerator = dynamic(
//   () => import('@/components/admin/certificates/certificate-generator').then(mod => mod.CertificateGenerator),
//   {
//     loading: () => React.createElement('div', { className: 'h-[400px] animate-pulse bg-muted rounded-lg' }),
//     ssr: false,
//   }
// );

// ID Card generation
// export const DynamicIDCardGenerator = dynamic(
//   () => import('@/components/admin/id-cards/id-card-generator').then(mod => mod.IDCardGenerator),
//   {
//     loading: () => React.createElement('div', { className: 'h-[400px] animate-pulse bg-muted rounded-lg' }),
//     ssr: false,
//   }
// );

// Report builder
// export const DynamicReportBuilder = dynamic(
//   () => import('@/components/admin/reports/report-builder').then(mod => mod.ReportBuilder),
//   {
//     loading: () => React.createElement('div', { className: 'h-[500px] animate-pulse bg-muted rounded-lg' }),
//   }
// );

// Video player (if used)
// export const DynamicVideoPlayer = dynamic(
//   () => import('@/components/shared/video-player').then(mod => mod.VideoPlayer),
//   {
//     loading: () => React.createElement('div', { className: 'aspect-video animate-pulse bg-muted rounded-lg' }),
//     ssr: false,
//   }
// );

// File uploader with preview
// export const DynamicFileUploader = dynamic(
//   () => import('@/components/shared/file-uploader').then(mod => mod.FileUploader),
//   {
//     loading: () => React.createElement('div', { className: 'h-32 animate-pulse bg-muted rounded-lg' }),
//   }
// );

/**
 * Preload a dynamic component
 * Useful for preloading components that will be needed soon
 */
export function preloadComponent(componentName: keyof typeof dynamicComponents) {
  const component = dynamicComponents[componentName];
  if (component && 'preload' in component) {
    (component as any).preload();
  }
}

const dynamicComponents = {
  Chart: DynamicChart,
  PerformanceChart: DynamicPerformanceChart,
  AttendanceTrendChart: DynamicAttendanceTrendChart,
  // RichTextEditor: DynamicRichTextEditor,
  // DatePicker: DynamicDatePicker,
  // DataTable: DynamicDataTable,
  // PDFViewer: DynamicPDFViewer,
  // QRCode: DynamicQRCode,
  // Barcode: DynamicBarcode,
  // CommandPalette: DynamicCommandPalette,
  // NotificationCenter: DynamicNotificationCenter,
  // ExportDialog: DynamicExportDialog,
  // AdvancedFilters: DynamicAdvancedFilters,
  // BulkImportDialog: DynamicBulkImportDialog,
  // CertificateGenerator: DynamicCertificateGenerator,
  // IDCardGenerator: DynamicIDCardGenerator,
  // ReportBuilder: DynamicReportBuilder,
  // VideoPlayer: DynamicVideoPlayer,
  // FileUploader: DynamicFileUploader,
};
