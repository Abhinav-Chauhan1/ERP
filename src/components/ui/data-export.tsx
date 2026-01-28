"use client";

import { ReactNode, useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  Database,
  Image,
  Settings,
  Calendar,
  Filter,
  CheckCircle,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
  Eye,
  Share
} from "lucide-react";

// Export format definitions
export interface ExportFormat {
  id: string;
  name: string;
  description: string;
  extension: string;
  icon: ReactNode;
  mimeType: string;
  supportsFiltering: boolean;
  supportsFormatting: boolean;
  maxRows?: number;
}

export const exportFormats: ExportFormat[] = [
  {
    id: 'csv',
    name: 'CSV',
    description: 'Comma-separated values, compatible with Excel and other spreadsheet applications',
    extension: 'csv',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    mimeType: 'text/csv',
    supportsFiltering: true,
    supportsFormatting: false,
  },
  {
    id: 'excel',
    name: 'Excel',
    description: 'Microsoft Excel format with formatting and multiple sheets support',
    extension: 'xlsx',
    icon: <FileSpreadsheet className="h-4 w-4" />,
    mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    supportsFiltering: true,
    supportsFormatting: true,
  },
  {
    id: 'pdf',
    name: 'PDF',
    description: 'Portable Document Format, ideal for reports and presentations',
    extension: 'pdf',
    icon: <FileText className="h-4 w-4" />,
    mimeType: 'application/pdf',
    supportsFiltering: true,
    supportsFormatting: true,
    maxRows: 1000,
  },
  {
    id: 'json',
    name: 'JSON',
    description: 'JavaScript Object Notation, perfect for API integration',
    extension: 'json',
    icon: <Database className="h-4 w-4" />,
    mimeType: 'application/json',
    supportsFiltering: true,
    supportsFormatting: false,
  },
];

// Export configuration
export interface ExportConfig {
  format: string;
  filename: string;
  includeHeaders: boolean;
  dateRange?: {
    start: Date;
    end: Date;
  };
  filters?: Record<string, any>;
  columns?: string[];
  formatting?: {
    numberFormat?: string;
    dateFormat?: string;
    includeCharts?: boolean;
    includeImages?: boolean;
  };
  compression?: boolean;
  password?: string;
}

// Export job status
export interface ExportJob {
  id: string;
  name: string;
  format: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: Date;
  completedAt?: Date;
  downloadUrl?: string;
  error?: string;
  fileSize?: number;
  rowCount?: number;
}

// Data Export Dialog Component
interface DataExportDialogProps {
  title: string;
  description?: string;
  data?: any[];
  columns?: Array<{ id: string; name: string; type: string }>;
  onExport: (config: ExportConfig) => Promise<void>;
  children: ReactNode;
  className?: string;
}

export function DataExportDialog({
  title,
  description,
  data = [],
  columns = [],
  onExport,
  children,
  className,
}: DataExportDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    format: 'csv',
    filename: 'export',
    includeHeaders: true,
    columns: columns.map(c => c.id),
  });
  const [isExporting, setIsExporting] = useState(false);

  const selectedFormat = exportFormats.find(f => f.id === config.format);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      await onExport(config);
      setIsOpen(false);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [config, onExport]);

  const updateConfig = useCallback((updates: Partial<ExportConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  }, []);

  const toggleColumn = useCallback((columnId: string) => {
    const currentColumns = config.columns || [];
    const newColumns = currentColumns.includes(columnId)
      ? currentColumns.filter(id => id !== columnId)
      : [...currentColumns, columnId];
    updateConfig({ columns: newColumns });
  }, [config.columns, updateConfig]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            {title}
          </DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              {exportFormats.map(format => (
                <Card
                  key={format.id}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    config.format === format.id && 'ring-2 ring-primary'
                  )}
                  onClick={() => updateConfig({ format: format.id })}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      {format.icon}
                      <div>
                        <div className="font-medium">{format.name}</div>
                        <div className="text-xs text-muted-foreground">
                          .{format.extension}
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {format.description}
                    </p>
                    {format.maxRows && (
                      <Badge variant="outline" className="mt-2 text-xs">
                        Max {format.maxRows.toLocaleString()} rows
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Basic Settings */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Basic Settings</Label>
            
            <div className="space-y-2">
              <Label htmlFor="filename">Filename</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="filename"
                  value={config.filename}
                  onChange={(e) => updateConfig({ filename: e.target.value })}
                  placeholder="Enter filename"
                />
                <span className="text-sm text-muted-foreground">
                  .{selectedFormat?.extension}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-headers"
                checked={config.includeHeaders}
                onCheckedChange={(checked) => updateConfig({ includeHeaders: !!checked })}
              />
              <Label htmlFor="include-headers">Include column headers</Label>
            </div>
          </div>

          {/* Column Selection */}
          {columns.length > 0 && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Columns to Export</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {columns.map(column => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`column-${column.id}`}
                      checked={config.columns?.includes(column.id) ?? true}
                      onCheckedChange={() => toggleColumn(column.id)}
                    />
                    <Label htmlFor={`column-${column.id}`} className="text-sm">
                      {column.name}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="text-xs text-muted-foreground">
                {config.columns?.length || columns.length} of {columns.length} columns selected
              </div>
            </div>
          )}

          {/* Date Range Filter */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Date Range (Optional)</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date">Start Date</Label>
                <Input
                  id="start-date"
                  type="date"
                  value={config.dateRange?.start?.toISOString().split('T')[0] || ''}
                  onChange={(e) => updateConfig({
                    dateRange: {
                      ...config.dateRange,
                      start: new Date(e.target.value),
                      end: config.dateRange?.end || new Date(),
                    }
                  })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date">End Date</Label>
                <Input
                  id="end-date"
                  type="date"
                  value={config.dateRange?.end?.toISOString().split('T')[0] || ''}
                  onChange={(e) => updateConfig({
                    dateRange: {
                      ...config.dateRange,
                      start: config.dateRange?.start || new Date(),
                      end: new Date(e.target.value),
                    }
                  })}
                />
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          {selectedFormat?.supportsFormatting && (
            <div className="space-y-3">
              <Label className="text-base font-medium">Formatting Options</Label>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="number-format">Number Format</Label>
                  <Select
                    value={config.formatting?.numberFormat || 'default'}
                    onValueChange={(value) => updateConfig({
                      formatting: {
                        ...config.formatting,
                        numberFormat: value,
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="currency">Currency ($1,234.56)</SelectItem>
                      <SelectItem value="percentage">Percentage (12.34%)</SelectItem>
                      <SelectItem value="scientific">Scientific (1.23E+3)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="date-format">Date Format</Label>
                  <Select
                    value={config.formatting?.dateFormat || 'default'}
                    onValueChange={(value) => updateConfig({
                      formatting: {
                        ...config.formatting,
                        dateFormat: value,
                      }
                    })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="iso">ISO (2024-01-15)</SelectItem>
                      <SelectItem value="us">US (01/15/2024)</SelectItem>
                      <SelectItem value="eu">EU (15/01/2024)</SelectItem>
                      <SelectItem value="long">Long (January 15, 2024)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {config.format === 'excel' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-charts"
                      checked={config.formatting?.includeCharts || false}
                      onCheckedChange={(checked) => updateConfig({
                        formatting: {
                          ...config.formatting,
                          includeCharts: !!checked,
                        }
                      })}
                    />
                    <Label htmlFor="include-charts">Include charts and graphs</Label>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security Options */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Security Options</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="compression"
                checked={config.compression || false}
                onCheckedChange={(checked) => updateConfig({ compression: !!checked })}
              />
              <Label htmlFor="compression">Compress file (ZIP)</Label>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password Protection (Optional)</Label>
              <Input
                id="password"
                type="password"
                value={config.password || ''}
                onChange={(e) => updateConfig({ password: e.target.value })}
                placeholder="Enter password to protect file"
              />
            </div>
          </div>

          {/* Export Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2">Export Summary</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>Format:</span>
                <span>{selectedFormat?.name} (.{selectedFormat?.extension})</span>
              </div>
              <div className="flex justify-between">
                <span>Estimated rows:</span>
                <span>{data.length.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Columns:</span>
                <span>{config.columns?.length || columns.length}</span>
              </div>
              {selectedFormat?.maxRows && data.length > selectedFormat.maxRows && (
                <div className="flex items-center gap-2 text-orange-600 mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">
                    Export will be limited to {selectedFormat.maxRows.toLocaleString()} rows
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExport} disabled={isExporting}>
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Export Job Monitor Component
interface ExportJobMonitorProps {
  jobs: ExportJob[];
  onDownload: (job: ExportJob) => void;
  onCancel: (jobId: string) => void;
  onRetry: (jobId: string) => void;
  className?: string;
}

export function ExportJobMonitor({
  jobs,
  onDownload,
  onCancel,
  onRetry,
  className,
}: ExportJobMonitorProps) {
  const getStatusIcon = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ExportJob['status']) => {
    switch (status) {
      case 'pending':
        return 'text-yellow-600';
      case 'processing':
        return 'text-blue-600';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (jobs.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Download className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No export jobs yet</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Jobs
        </CardTitle>
        <CardDescription>
          Monitor the progress of your data exports
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map(job => (
            <div key={job.id} className="border rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {getStatusIcon(job.status)}
                  <div>
                    <h4 className="font-medium">{job.name}</h4>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>Format: {job.format.toUpperCase()}</span>
                      <span>Created: {job.createdAt.toLocaleString()}</span>
                      {job.rowCount && <span>Rows: {job.rowCount.toLocaleString()}</span>}
                      {job.fileSize && <span>Size: {formatFileSize(job.fileSize)}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {job.status === 'completed' && job.downloadUrl && (
                    <Button size="sm" onClick={() => onDownload(job)}>
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  )}
                  {job.status === 'failed' && (
                    <Button size="sm" variant="outline" onClick={() => onRetry(job.id)}>
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  )}
                  {(job.status === 'pending' || job.status === 'processing') && (
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => onCancel(job.id)}
                      className="text-red-600"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              {job.status === 'processing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                </div>
              )}

              {/* Status Message */}
              <div className={cn('text-sm', getStatusColor(job.status))}>
                {job.status === 'pending' && 'Waiting to start...'}
                {job.status === 'processing' && 'Processing export...'}
                {job.status === 'completed' && job.completedAt && 
                  `Completed at ${job.completedAt.toLocaleString()}`
                }
                {job.status === 'failed' && job.error && (
                  <div className="flex items-center gap-2">
                    <span>Failed:</span>
                    <span className="text-xs">{job.error}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Quick Export Button Component
interface QuickExportButtonProps {
  data: any[];
  filename?: string;
  format?: string;
  onExport?: (config: ExportConfig) => Promise<void>;
  children?: ReactNode;
  className?: string;
}

export function QuickExportButton({
  data,
  filename = 'export',
  format = 'csv',
  onExport,
  children,
  className,
}: QuickExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleQuickExport = useCallback(async () => {
    if (!onExport) {
      // Default export behavior - download as CSV
      const csvContent = convertToCSV(data);
      downloadFile(csvContent, `${filename}.csv`, 'text/csv');
      return;
    }

    setIsExporting(true);
    try {
      await onExport({
        format,
        filename,
        includeHeaders: true,
      });
    } catch (error) {
      console.error('Quick export failed:', error);
    } finally {
      setIsExporting(false);
    }
  }, [data, filename, format, onExport]);

  const convertToCSV = (data: any[]) => {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          // Escape commas and quotes
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ];
    
    return csvRows.join('\n');
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <Button
      onClick={handleQuickExport}
      disabled={isExporting || data.length === 0}
      className={className}
    >
      {isExporting ? (
        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
      ) : (
        <Download className="h-4 w-4 mr-2" />
      )}
      {children || 'Export'}
    </Button>
  );
}