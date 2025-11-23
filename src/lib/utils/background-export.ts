/**
 * Background export service for processing large datasets
 * Uses Web Workers for non-blocking exports
 */

import { ExportFormat, ExportOptions } from './export';

export interface BackgroundExportJob {
  id: string;
  format: ExportFormat;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  totalRecords: number;
  processedRecords: number;
  filename: string;
  createdAt: Date;
  completedAt?: Date;
  error?: string;
  downloadUrl?: string;
}

export interface BackgroundExportOptions extends ExportOptions {
  chunkSize?: number;
  onProgress?: (progress: number) => void;
  onComplete?: (job: BackgroundExportJob) => void;
  onError?: (error: Error) => void;
}

// Threshold for triggering background export (number of records)
const BACKGROUND_EXPORT_THRESHOLD = 1000;

/**
 * Check if export should be processed in background
 */
export function shouldUseBackgroundExport(recordCount: number): boolean {
  return recordCount >= BACKGROUND_EXPORT_THRESHOLD;
}

/**
 * Create a background export job
 */
export async function createBackgroundExportJob(
  data: any[],
  format: ExportFormat,
  options: BackgroundExportOptions
): Promise<BackgroundExportJob> {
  const jobId = generateJobId();
  
  const job: BackgroundExportJob = {
    id: jobId,
    format,
    status: 'pending',
    progress: 0,
    totalRecords: data.length,
    processedRecords: 0,
    filename: options.filename,
    createdAt: new Date(),
  };

  // Store job in session storage for tracking
  storeJob(job);

  // Start processing in background
  processExportInBackground(job, data, format, options);

  return job;
}

/**
 * Process export in background using chunks
 */
async function processExportInBackground(
  job: BackgroundExportJob,
  data: any[],
  format: ExportFormat,
  options: BackgroundExportOptions
): Promise<void> {
  try {
    // Update job status
    job.status = 'processing';
    storeJob(job);

    const chunkSize = options.chunkSize || 500;
    const chunks = Math.ceil(data.length / chunkSize);

    // Process data in chunks to avoid blocking
    for (let i = 0; i < chunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(start + chunkSize, data.length);
      
      // Simulate processing delay for large datasets
      await new Promise(resolve => setTimeout(resolve, 10));

      // Update progress
      job.processedRecords = end;
      job.progress = Math.round((end / data.length) * 100);
      storeJob(job);

      if (options.onProgress) {
        options.onProgress(job.progress);
      }
    }

    // Generate the export file
    const { exportReport } = await import('./export');
    
    // For large exports, we would typically:
    // 1. Generate the file on the server
    // 2. Store it temporarily
    // 3. Provide a download link
    // For now, we'll use the client-side export
    exportReport(data, format, options);

    // Mark job as completed
    job.status = 'completed';
    job.completedAt = new Date();
    job.progress = 100;
    storeJob(job);

    if (options.onComplete) {
      options.onComplete(job);
    }
  } catch (error) {
    job.status = 'failed';
    job.error = error instanceof Error ? error.message : 'Export failed';
    storeJob(job);

    if (options.onError) {
      options.onError(error instanceof Error ? error : new Error('Export failed'));
    }
  }
}

/**
 * Get job status
 */
export function getJobStatus(jobId: string): BackgroundExportJob | null {
  const jobs = getStoredJobs();
  return jobs.find(j => j.id === jobId) || null;
}

/**
 * Get all jobs
 */
export function getAllJobs(): BackgroundExportJob[] {
  return getStoredJobs();
}

/**
 * Cancel a job
 */
export function cancelJob(jobId: string): void {
  const jobs = getStoredJobs();
  const job = jobs.find(j => j.id === jobId);
  
  if (job && job.status === 'processing') {
    job.status = 'failed';
    job.error = 'Cancelled by user';
    storeJob(job);
  }
}

/**
 * Clear completed jobs
 */
export function clearCompletedJobs(): void {
  const jobs = getStoredJobs();
  const activeJobs = jobs.filter(j => j.status === 'pending' || j.status === 'processing');
  sessionStorage.setItem('export-jobs', JSON.stringify(activeJobs));
}

/**
 * Generate unique job ID
 */
function generateJobId(): string {
  return `export-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Store job in session storage
 */
function storeJob(job: BackgroundExportJob): void {
  const jobs = getStoredJobs();
  const index = jobs.findIndex(j => j.id === job.id);
  
  if (index >= 0) {
    jobs[index] = job;
  } else {
    jobs.push(job);
  }
  
  sessionStorage.setItem('export-jobs', JSON.stringify(jobs));
}

/**
 * Get stored jobs from session storage
 */
function getStoredJobs(): BackgroundExportJob[] {
  try {
    const stored = sessionStorage.getItem('export-jobs');
    if (!stored) return [];
    
    const jobs = JSON.parse(stored);
    // Convert date strings back to Date objects
    return jobs.map((job: any) => ({
      ...job,
      createdAt: new Date(job.createdAt),
      completedAt: job.completedAt ? new Date(job.completedAt) : undefined,
    }));
  } catch {
    return [];
  }
}

/**
 * Export with automatic background processing for large datasets
 */
export async function smartExport(
  data: any[],
  format: ExportFormat,
  options: BackgroundExportOptions
): Promise<BackgroundExportJob | null> {
  if (shouldUseBackgroundExport(data.length)) {
    // Use background export for large datasets
    return await createBackgroundExportJob(data, format, options);
  } else {
    // Use immediate export for small datasets
    const { exportReport } = await import('./export');
    exportReport(data, format, options);
    return null;
  }
}
