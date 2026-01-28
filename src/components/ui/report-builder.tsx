"use client";

import { ReactNode, useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Trash2, 
  Play, 
  Save, 
  Download, 
  Filter, 
  SortAsc, 
  SortDesc,
  Calendar,
  Database,
  BarChart3,
  Table,
  FileText,
  Settings,
  Eye,
  Copy,
  Share,
  Clock,
  AlertCircle
} from "lucide-react";

// Data source and field definitions
export interface DataSource {
  id: string;
  name: string;
  description: string;
  type: 'table' | 'view' | 'api';
  fields: DataField[];
  relationships?: DataRelationship[];
}

export interface DataField {
  id: string;
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'json';
  nullable: boolean;
  description?: string;
  aggregatable?: boolean;
  filterable?: boolean;
  sortable?: boolean;
}

export interface DataRelationship {
  id: string;
  name: string;
  targetSource: string;
  type: 'one-to-one' | 'one-to-many' | 'many-to-many';
  joinCondition: string;
}

// Query builder interfaces
export interface QueryFilter {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'greater_than' | 'less_than' | 'between' | 'in' | 'not_in' | 'is_null' | 'is_not_null';
  value: any;
  logicalOperator?: 'AND' | 'OR';
}

export interface QuerySort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface QueryGroupBy {
  field: string;
  aggregation?: 'count' | 'sum' | 'avg' | 'min' | 'max';
}

export interface ReportQuery {
  dataSource: string;
  fields: string[];
  filters: QueryFilter[];
  sorts: QuerySort[];
  groupBy: QueryGroupBy[];
  limit?: number;
  offset?: number;
}

export interface Report {
  id: string;
  name: string;
  description?: string;
  query: ReportQuery;
  visualization: {
    type: 'table' | 'chart';
    chartType?: 'line' | 'bar' | 'pie' | 'area';
    config?: Record<string, any>;
  };
  schedule?: {
    enabled: boolean;
    frequency: 'daily' | 'weekly' | 'monthly';
    time: string;
    recipients: string[];
  };
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// Mock data sources
const mockDataSources: DataSource[] = [
  {
    id: 'schools',
    name: 'Schools',
    description: 'School information and statistics',
    type: 'table',
    fields: [
      { id: 'id', name: 'id', displayName: 'ID', type: 'string', nullable: false, filterable: true },
      { id: 'name', name: 'name', displayName: 'School Name', type: 'string', nullable: false, filterable: true, sortable: true },
      { id: 'status', name: 'status', displayName: 'Status', type: 'string', nullable: false, filterable: true },
      { id: 'student_count', name: 'student_count', displayName: 'Student Count', type: 'number', nullable: false, aggregatable: true, sortable: true },
      { id: 'created_at', name: 'created_at', displayName: 'Created Date', type: 'date', nullable: false, filterable: true, sortable: true },
      { id: 'subscription_plan', name: 'subscription_plan', displayName: 'Subscription Plan', type: 'string', nullable: true, filterable: true },
    ]
  },
  {
    id: 'support_tickets',
    name: 'Support Tickets',
    description: 'Support ticket data and metrics',
    type: 'table',
    fields: [
      { id: 'id', name: 'id', displayName: 'Ticket ID', type: 'string', nullable: false, filterable: true },
      { id: 'title', name: 'title', displayName: 'Title', type: 'string', nullable: false, filterable: true },
      { id: 'status', name: 'status', displayName: 'Status', type: 'string', nullable: false, filterable: true },
      { id: 'priority', name: 'priority', displayName: 'Priority', type: 'string', nullable: false, filterable: true },
      { id: 'created_at', name: 'created_at', displayName: 'Created Date', type: 'date', nullable: false, filterable: true, sortable: true },
      { id: 'resolved_at', name: 'resolved_at', displayName: 'Resolved Date', type: 'date', nullable: true, filterable: true, sortable: true },
      { id: 'school_id', name: 'school_id', displayName: 'School ID', type: 'string', nullable: false, filterable: true },
    ]
  },
  {
    id: 'billing',
    name: 'Billing',
    description: 'Billing and payment information',
    type: 'table',
    fields: [
      { id: 'id', name: 'id', displayName: 'Payment ID', type: 'string', nullable: false, filterable: true },
      { id: 'amount', name: 'amount', displayName: 'Amount', type: 'number', nullable: false, aggregatable: true, sortable: true },
      { id: 'status', name: 'status', displayName: 'Status', type: 'string', nullable: false, filterable: true },
      { id: 'payment_date', name: 'payment_date', displayName: 'Payment Date', type: 'date', nullable: false, filterable: true, sortable: true },
      { id: 'school_id', name: 'school_id', displayName: 'School ID', type: 'string', nullable: false, filterable: true },
      { id: 'plan_type', name: 'plan_type', displayName: 'Plan Type', type: 'string', nullable: false, filterable: true },
    ]
  }
];

// Report Builder Component
interface ReportBuilderProps {
  report?: Report;
  onSave: (report: Report) => void;
  onCancel: () => void;
  className?: string;
}

export function ReportBuilder({ report, onSave, onCancel, className }: ReportBuilderProps) {
  const [currentReport, setCurrentReport] = useState<Report>(
    report || {
      id: `report_${Date.now()}`,
      name: 'New Report',
      description: '',
      query: {
        dataSource: '',
        fields: [],
        filters: [],
        sorts: [],
        groupBy: [],
      },
      visualization: {
        type: 'table',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'current_user',
    }
  );

  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('query');

  // Get selected data source
  const selectedDataSource = useMemo(() => 
    mockDataSources.find(ds => ds.id === currentReport.query.dataSource),
    [currentReport.query.dataSource]
  );

  // Update report
  const updateReport = useCallback((updates: Partial<Report>) => {
    setCurrentReport(prev => ({
      ...prev,
      ...updates,
      updatedAt: new Date(),
    }));
  }, []);

  const updateQuery = useCallback((updates: Partial<ReportQuery>) => {
    updateReport({
      query: {
        ...currentReport.query,
        ...updates,
      },
    });
  }, [currentReport.query, updateReport]);

  // Field management
  const addField = useCallback((fieldId: string) => {
    if (!currentReport.query.fields.includes(fieldId)) {
      updateQuery({
        fields: [...currentReport.query.fields, fieldId],
      });
    }
  }, [currentReport.query.fields, updateQuery]);

  const removeField = useCallback((fieldId: string) => {
    updateQuery({
      fields: currentReport.query.fields.filter(f => f !== fieldId),
    });
  }, [currentReport.query.fields, updateQuery]);

  // Filter management
  const addFilter = useCallback(() => {
    const newFilter: QueryFilter = {
      id: `filter_${Date.now()}`,
      field: selectedDataSource?.fields[0]?.id || '',
      operator: 'equals',
      value: '',
    };
    updateQuery({
      filters: [...currentReport.query.filters, newFilter],
    });
  }, [currentReport.query.filters, selectedDataSource, updateQuery]);

  const updateFilter = useCallback((filterId: string, updates: Partial<QueryFilter>) => {
    updateQuery({
      filters: currentReport.query.filters.map(f =>
        f.id === filterId ? { ...f, ...updates } : f
      ),
    });
  }, [currentReport.query.filters, updateQuery]);

  const removeFilter = useCallback((filterId: string) => {
    updateQuery({
      filters: currentReport.query.filters.filter(f => f.id !== filterId),
    });
  }, [currentReport.query.filters, updateQuery]);

  // Sort management
  const addSort = useCallback((fieldId: string, direction: 'asc' | 'desc') => {
    const existingIndex = currentReport.query.sorts.findIndex(s => s.field === fieldId);
    if (existingIndex >= 0) {
      // Update existing sort
      const newSorts = [...currentReport.query.sorts];
      newSorts[existingIndex] = { field: fieldId, direction };
      updateQuery({ sorts: newSorts });
    } else {
      // Add new sort
      updateQuery({
        sorts: [...currentReport.query.sorts, { field: fieldId, direction }],
      });
    }
  }, [currentReport.query.sorts, updateQuery]);

  const removeSort = useCallback((fieldId: string) => {
    updateQuery({
      sorts: currentReport.query.sorts.filter(s => s.field !== fieldId),
    });
  }, [currentReport.query.sorts, updateQuery]);

  // Preview data
  const runPreview = useCallback(async () => {
    if (!selectedDataSource || currentReport.query.fields.length === 0) return;

    setIsPreviewLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate mock data based on query
    const mockData = Array.from({ length: 10 }, (_, i) => {
      const row: any = {};
      currentReport.query.fields.forEach(fieldId => {
        const field = selectedDataSource.fields.find(f => f.id === fieldId);
        if (field) {
          switch (field.type) {
            case 'string':
              row[fieldId] = `Sample ${field.displayName} ${i + 1}`;
              break;
            case 'number':
              row[fieldId] = Math.floor(Math.random() * 1000) + 1;
              break;
            case 'date':
              row[fieldId] = new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000);
              break;
            case 'boolean':
              row[fieldId] = Math.random() > 0.5;
              break;
            default:
              row[fieldId] = `Value ${i + 1}`;
          }
        }
      });
      return row;
    });

    setPreviewData(mockData);
    setIsPreviewLoading(false);
  }, [selectedDataSource, currentReport.query.fields]);

  // Get field display name
  const getFieldDisplayName = useCallback((fieldId: string) => {
    return selectedDataSource?.fields.find(f => f.id === fieldId)?.displayName || fieldId;
  }, [selectedDataSource]);

  // Get operator options
  const getOperatorOptions = (fieldType: string) => {
    const baseOptions = [
      { value: 'equals', label: 'Equals' },
      { value: 'not_equals', label: 'Not Equals' },
      { value: 'is_null', label: 'Is Null' },
      { value: 'is_not_null', label: 'Is Not Null' },
    ];

    if (fieldType === 'string') {
      return [
        ...baseOptions,
        { value: 'contains', label: 'Contains' },
        { value: 'not_contains', label: 'Does Not Contain' },
        { value: 'in', label: 'In' },
        { value: 'not_in', label: 'Not In' },
      ];
    }

    if (fieldType === 'number' || fieldType === 'date') {
      return [
        ...baseOptions,
        { value: 'greater_than', label: 'Greater Than' },
        { value: 'less_than', label: 'Less Than' },
        { value: 'between', label: 'Between' },
      ];
    }

    return baseOptions;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Input
            value={currentReport.name}
            onChange={(e) => updateReport({ name: e.target.value })}
            className="text-xl font-semibold border-none p-0 h-auto bg-transparent"
            placeholder="Report Name"
          />
          <Textarea
            value={currentReport.description || ''}
            onChange={(e) => updateReport({ description: e.target.value })}
            placeholder="Report description..."
            className="mt-2 border-none p-0 bg-transparent resize-none"
            rows={2}
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={() => onSave(currentReport)}>
            <Save className="h-4 w-4 mr-2" />
            Save Report
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="query">Query Builder</TabsTrigger>
          <TabsTrigger value="visualization">Visualization</TabsTrigger>
          <TabsTrigger value="schedule">Schedule</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="query" className="space-y-6">
          {/* Data Source Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Data Source
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select
                value={currentReport.query.dataSource}
                onValueChange={(value) => updateQuery({ dataSource: value, fields: [], filters: [], sorts: [] })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a data source" />
                </SelectTrigger>
                <SelectContent>
                  {mockDataSources.map(ds => (
                    <SelectItem key={ds.id} value={ds.id}>
                      <div>
                        <div className="font-medium">{ds.name}</div>
                        <div className="text-xs text-muted-foreground">{ds.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {selectedDataSource && (
            <>
              {/* Field Selection */}
              <Card>
                <CardHeader>
                  <CardTitle>Fields</CardTitle>
                  <CardDescription>
                    Select the fields you want to include in your report
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Available Fields */}
                    <div>
                      <Label className="text-sm font-medium">Available Fields</Label>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-2">
                        {selectedDataSource.fields.map(field => (
                          <Button
                            key={field.id}
                            variant={currentReport.query.fields.includes(field.id) ? "default" : "outline"}
                            size="sm"
                            onClick={() => 
                              currentReport.query.fields.includes(field.id) 
                                ? removeField(field.id)
                                : addField(field.id)
                            }
                            className="justify-start"
                          >
                            {field.displayName}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Selected Fields */}
                    {currentReport.query.fields.length > 0 && (
                      <div>
                        <Label className="text-sm font-medium">Selected Fields</Label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {currentReport.query.fields.map(fieldId => (
                            <Badge key={fieldId} variant="default" className="flex items-center gap-1">
                              {getFieldDisplayName(fieldId)}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 hover:bg-transparent"
                                onClick={() => removeField(fieldId)}
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Filters */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filters
                      </CardTitle>
                      <CardDescription>
                        Add conditions to filter your data
                      </CardDescription>
                    </div>
                    <Button size="sm" onClick={addFilter}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Filter
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {currentReport.query.filters.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No filters added. Click "Add Filter" to get started.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {currentReport.query.filters.map((filter, index) => {
                        const field = selectedDataSource.fields.find(f => f.id === filter.field);
                        return (
                          <div key={filter.id} className="flex items-center gap-2 p-3 border rounded-lg">
                            {index > 0 && (
                              <Select
                                value={filter.logicalOperator || 'AND'}
                                onValueChange={(value: 'AND' | 'OR') => 
                                  updateFilter(filter.id, { logicalOperator: value })
                                }
                              >
                                <SelectTrigger className="w-20">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="AND">AND</SelectItem>
                                  <SelectItem value="OR">OR</SelectItem>
                                </SelectContent>
                              </Select>
                            )}
                            
                            <Select
                              value={filter.field}
                              onValueChange={(value) => updateFilter(filter.id, { field: value })}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {selectedDataSource.fields.filter(f => f.filterable).map(field => (
                                  <SelectItem key={field.id} value={field.id}>
                                    {field.displayName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            <Select
                              value={filter.operator}
                              onValueChange={(value) => updateFilter(filter.id, { operator: value as any })}
                            >
                              <SelectTrigger className="w-40">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {getOperatorOptions(field?.type || 'string').map(option => (
                                  <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>

                            {!['is_null', 'is_not_null'].includes(filter.operator) && (
                              <Input
                                value={filter.value}
                                onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
                                placeholder="Value"
                                className="flex-1"
                              />
                            )}

                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFilter(filter.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Sorting */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <SortAsc className="h-5 w-5" />
                    Sorting
                  </CardTitle>
                  <CardDescription>
                    Configure how your data should be sorted
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {selectedDataSource.fields.filter(f => f.sortable).map(field => {
                      const existingSort = currentReport.query.sorts.find(s => s.field === field.id);
                      return (
                        <div key={field.id} className="flex items-center justify-between p-2 border rounded">
                          <span className="font-medium">{field.displayName}</span>
                          <div className="flex items-center gap-1">
                            <Button
                              variant={existingSort?.direction === 'asc' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => addSort(field.id, 'asc')}
                            >
                              <SortAsc className="h-4 w-4" />
                            </Button>
                            <Button
                              variant={existingSort?.direction === 'desc' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => addSort(field.id, 'desc')}
                            >
                              <SortDesc className="h-4 w-4" />
                            </Button>
                            {existingSort && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeSort(field.id)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="visualization" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Visualization Settings</CardTitle>
              <CardDescription>
                Choose how to display your report data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Visualization Type</Label>
                <Select
                  value={currentReport.visualization.type}
                  onValueChange={(value: 'table' | 'chart') => 
                    updateReport({
                      visualization: {
                        ...currentReport.visualization,
                        type: value,
                      },
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="table">
                      <div className="flex items-center gap-2">
                        <Table className="h-4 w-4" />
                        Table
                      </div>
                    </SelectItem>
                    <SelectItem value="chart">
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4" />
                        Chart
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {currentReport.visualization.type === 'chart' && (
                <div className="space-y-2">
                  <Label>Chart Type</Label>
                  <Select
                    value={currentReport.visualization.chartType || 'bar'}
                    onValueChange={(value) => 
                      updateReport({
                        visualization: {
                          ...currentReport.visualization,
                          chartType: value as any,
                        },
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bar">Bar Chart</SelectItem>
                      <SelectItem value="line">Line Chart</SelectItem>
                      <SelectItem value="pie">Pie Chart</SelectItem>
                      <SelectItem value="area">Area Chart</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="schedule" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Report Scheduling
              </CardTitle>
              <CardDescription>
                Automatically generate and send this report on a schedule
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="schedule-enabled"
                  checked={currentReport.schedule?.enabled || false}
                  onChange={(e) => 
                    updateReport({
                      schedule: {
                        ...currentReport.schedule,
                        enabled: e.target.checked,
                        frequency: 'daily',
                        time: '09:00',
                        recipients: [],
                      },
                    })
                  }
                  className="rounded"
                />
                <Label htmlFor="schedule-enabled">Enable scheduled reports</Label>
              </div>

              {currentReport.schedule?.enabled && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Frequency</Label>
                      <Select
                        value={currentReport.schedule.frequency}
                        onValueChange={(value: 'daily' | 'weekly' | 'monthly') => 
                          updateReport({
                            schedule: {
                              ...currentReport.schedule!,
                              frequency: value,
                            },
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input
                        type="time"
                        value={currentReport.schedule.time}
                        onChange={(e) => 
                          updateReport({
                            schedule: {
                              ...currentReport.schedule!,
                              time: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Recipients</Label>
                    <Textarea
                      placeholder="Enter email addresses, one per line"
                      value={currentReport.schedule.recipients.join('\n')}
                      onChange={(e) => 
                        updateReport({
                          schedule: {
                            ...currentReport.schedule!,
                            recipients: e.target.value.split('\n').filter(email => email.trim()),
                          },
                        })
                      }
                      rows={3}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Report Preview
                  </CardTitle>
                  <CardDescription>
                    Preview your report with sample data
                  </CardDescription>
                </div>
                <Button onClick={runPreview} disabled={isPreviewLoading || !selectedDataSource || currentReport.query.fields.length === 0}>
                  <Play className="h-4 w-4 mr-2" />
                  {isPreviewLoading ? 'Loading...' : 'Run Preview'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {!selectedDataSource || currentReport.query.fields.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Select a data source and at least one field to preview your report.</p>
                </div>
              ) : isPreviewLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-2 text-muted-foreground">Loading preview...</p>
                </div>
              ) : previewData.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse border border-border">
                    <thead>
                      <tr className="bg-muted">
                        {currentReport.query.fields.map(fieldId => (
                          <th key={fieldId} className="border border-border px-4 py-2 text-left font-medium">
                            {getFieldDisplayName(fieldId)}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.map((row, index) => (
                        <tr key={index} className="hover:bg-muted/50">
                          {currentReport.query.fields.map(fieldId => (
                            <td key={fieldId} className="border border-border px-4 py-2">
                              {typeof row[fieldId] === 'object' && row[fieldId] instanceof Date
                                ? row[fieldId].toLocaleDateString()
                                : String(row[fieldId])
                              }
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No data to display. Try adjusting your query parameters.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Report List Component
interface ReportListProps {
  reports: Report[];
  onEdit: (report: Report) => void;
  onDelete: (reportId: string) => void;
  onDuplicate: (report: Report) => void;
  onRun: (report: Report) => void;
  className?: string;
}

export function ReportList({ 
  reports, 
  onEdit, 
  onDelete, 
  onDuplicate, 
  onRun, 
  className 
}: ReportListProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {reports.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No reports yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first report to get started with data analysis
            </p>
          </CardContent>
        </Card>
      ) : (
        reports.map(report => (
          <Card key={report.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{report.name}</CardTitle>
                  {report.description && (
                    <CardDescription>{report.description}</CardDescription>
                  )}
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Created: {report.createdAt.toLocaleDateString()}</span>
                    <span>Updated: {report.updatedAt.toLocaleDateString()}</span>
                    <Badge variant="outline">
                      {report.visualization.type === 'chart' 
                        ? `${report.visualization.chartType} chart`
                        : 'table'
                      }
                    </Badge>
                    {report.schedule?.enabled && (
                      <Badge variant="secondary">
                        <Clock className="h-3 w-3 mr-1" />
                        Scheduled
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => onRun(report)}>
                    <Play className="h-4 w-4 mr-1" />
                    Run
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onEdit(report)}>
                    <Settings className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => onDuplicate(report)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => onDelete(report.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>
        ))
      )}
    </div>
  );
}