"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { X, Plus, GripVertical, BarChart3 } from "lucide-react";
import { ReportConfig, ReportFilter, ReportSort } from "@/app/admin/reports/builder/page";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface ReportBuilderFormProps {
  config: ReportConfig;
  onChange: (config: ReportConfig) => void;
}

// Define available data sources
const DATA_SOURCES = [
  { value: "students", label: "Students", fields: ["id", "admissionId", "name", "email", "class", "section", "rollNumber", "dateOfBirth", "gender", "address", "phone"] },
  { value: "teachers", label: "Teachers", fields: ["id", "employeeId", "name", "email", "qualification", "joinDate", "salary", "subjects"] },
  { value: "attendance", label: "Attendance", fields: ["id", "studentId", "studentName", "date", "status", "class", "section", "remarks"] },
  { value: "fees", label: "Fee Payments", fields: ["id", "studentId", "studentName", "amount", "paymentDate", "status", "method", "class"] },
  { value: "exams", label: "Exam Results", fields: ["id", "studentId", "studentName", "examName", "subject", "marks", "totalMarks", "percentage", "grade"] },
  { value: "classes", label: "Classes", fields: ["id", "name", "section", "grade", "capacity", "teacher", "studentCount"] },
  { value: "assignments", label: "Assignments", fields: ["id", "title", "subject", "class", "dueDate", "status", "submissionCount", "teacher"] },
];

const FILTER_OPERATORS = [
  { value: "equals", label: "Equals" },
  { value: "notEquals", label: "Not Equals" },
  { value: "contains", label: "Contains" },
  { value: "greaterThan", label: "Greater Than" },
  { value: "lessThan", label: "Less Than" },
  { value: "between", label: "Between" },
];

export function ReportBuilderForm({ config, onChange }: ReportBuilderFormProps) {
  const [draggedField, setDraggedField] = useState<string | null>(null);

  const selectedDataSource = DATA_SOURCES.find(ds => ds.value === config.dataSource);
  const availableFields = selectedDataSource?.fields || [];

  const handleDataSourceChange = (value: string) => {
    onChange({
      ...config,
      dataSource: value,
      selectedFields: [],
      filters: [],
      sorting: [],
    });
  };

  const handleFieldToggle = (field: string) => {
    const isSelected = config.selectedFields.includes(field);
    if (isSelected) {
      onChange({
        ...config,
        selectedFields: config.selectedFields.filter(f => f !== field),
      });
    } else {
      onChange({
        ...config,
        selectedFields: [...config.selectedFields, field],
      });
    }
  };

  const handleAddFilter = () => {
    onChange({
      ...config,
      filters: [...config.filters, { field: "", operator: "equals", value: "" }],
    });
  };

  const handleRemoveFilter = (index: number) => {
    onChange({
      ...config,
      filters: config.filters.filter((_, i) => i !== index),
    });
  };

  const handleFilterChange = (index: number, filter: ReportFilter) => {
    const newFilters = [...config.filters];
    newFilters[index] = filter;
    onChange({
      ...config,
      filters: newFilters,
    });
  };

  const handleAddSort = () => {
    onChange({
      ...config,
      sorting: [...config.sorting, { field: "", direction: "asc" }],
    });
  };

  const handleRemoveSort = (index: number) => {
    onChange({
      ...config,
      sorting: config.sorting.filter((_, i) => i !== index),
    });
  };

  const handleSortChange = (index: number, sort: ReportSort) => {
    const newSorting = [...config.sorting];
    newSorting[index] = sort;
    onChange({
      ...config,
      sorting: newSorting,
    });
  };

  const handleDragStart = (field: string) => {
    setDraggedField(field);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedField && !config.selectedFields.includes(draggedField)) {
      onChange({
        ...config,
        selectedFields: [...config.selectedFields, draggedField],
      });
    }
    setDraggedField(null);
  };

  return (
    <div className="space-y-6">
      {/* Report Name */}
      <div className="space-y-2">
        <Label htmlFor="reportName">Report Name</Label>
        <Input
          id="reportName"
          placeholder="Enter report name"
          value={config.name}
          onChange={(e) => onChange({ ...config, name: e.target.value })}
        />
      </div>

      {/* Data Source Selection */}
      <div className="space-y-2">
        <Label htmlFor="dataSource">Data Source</Label>
        <Select value={config.dataSource} onValueChange={handleDataSourceChange}>
          <SelectTrigger id="dataSource">
            <SelectValue placeholder="Select a data source" />
          </SelectTrigger>
          <SelectContent>
            {DATA_SOURCES.map((source) => (
              <SelectItem key={source.value} value={source.value}>
                {source.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Field Selection */}
      {config.dataSource && (
        <div className="space-y-2">
          <Label>Available Fields</Label>
          <p className="text-sm text-muted-foreground mb-2">
            Drag fields to the selected area or click to add
          </p>
          <div className="grid grid-cols-2 gap-2">
            {availableFields.map((field) => (
              <div
                key={field}
                draggable
                onDragStart={() => handleDragStart(field)}
                className={`p-2 border rounded cursor-move hover:bg-accent transition-colors ${
                  config.selectedFields.includes(field) ? "bg-accent" : ""
                }`}
                onClick={() => handleFieldToggle(field)}
              >
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Selected Fields */}
      {config.selectedFields.length > 0 && (
        <div className="space-y-2">
          <Label>Selected Fields ({config.selectedFields.length})</Label>
          <Card
            className="p-4 min-h-[100px] border-dashed"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="flex flex-wrap gap-2">
              {config.selectedFields.map((field) => (
                <div
                  key={field}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1 rounded-md text-sm"
                >
                  <span className="capitalize">{field.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <button
                    onClick={() => handleFieldToggle(field)}
                    className="hover:bg-primary-foreground/20 rounded-full p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Filters</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddFilter}
            disabled={!config.dataSource}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Filter
          </Button>
        </div>
        {config.filters.map((filter, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Select
              value={filter.field}
              onValueChange={(value) =>
                handleFilterChange(index, { ...filter, field: value })
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={filter.operator}
              onValueChange={(value) =>
                handleFilterChange(index, { ...filter, operator: value })
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILTER_OPERATORS.map((op) => (
                  <SelectItem key={op.value} value={op.value}>
                    {op.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Value"
              value={filter.value}
              onChange={(e) =>
                handleFilterChange(index, { ...filter, value: e.target.value })
              }
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveFilter(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      {/* Sorting */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label>Sorting</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddSort}
            disabled={!config.dataSource}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Sort
          </Button>
        </div>
        {config.sorting.map((sort, index) => (
          <div key={index} className="flex gap-2 items-start">
            <Select
              value={sort.field}
              onValueChange={(value) =>
                handleSortChange(index, { ...sort, field: value })
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Select field" />
              </SelectTrigger>
              <SelectContent>
                {availableFields.map((field) => (
                  <SelectItem key={field} value={field}>
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sort.direction}
              onValueChange={(value: "asc" | "desc") =>
                handleSortChange(index, { ...sort, direction: value })
              }
            >
              <SelectTrigger className="flex-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asc">Ascending</SelectItem>
                <SelectItem value="desc">Descending</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => handleRemoveSort(index)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <Separator className="my-6" />

      {/* Chart Configuration */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <Label htmlFor="chartEnabled" className="text-base font-semibold">
              Chart Visualization
            </Label>
          </div>
          <Switch
            id="chartEnabled"
            checked={config.chartConfig?.enabled || false}
            onCheckedChange={(checked) =>
              onChange({
                ...config,
                chartConfig: {
                  enabled: checked,
                  type: config.chartConfig?.type || "bar",
                  xAxisField: config.chartConfig?.xAxisField || "",
                  yAxisField: config.chartConfig?.yAxisField || "",
                },
              })
            }
            disabled={!config.dataSource || config.selectedFields.length === 0}
          />
        </div>

        {config.chartConfig?.enabled && (
          <div className="space-y-4 pl-7">
            {/* Chart Type */}
            <div className="space-y-2">
              <Label htmlFor="chartType">Chart Type</Label>
              <Select
                value={config.chartConfig.type}
                onValueChange={(value: "bar" | "line" | "pie" | "area") =>
                  onChange({
                    ...config,
                    chartConfig: { ...config.chartConfig!, type: value },
                  })
                }
              >
                <SelectTrigger id="chartType">
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

            {/* X-Axis Field */}
            <div className="space-y-2">
              <Label htmlFor="xAxisField">X-Axis Field</Label>
              <Select
                value={config.chartConfig.xAxisField}
                onValueChange={(value) =>
                  onChange({
                    ...config,
                    chartConfig: { ...config.chartConfig!, xAxisField: value },
                  })
                }
              >
                <SelectTrigger id="xAxisField">
                  <SelectValue placeholder="Select X-axis field" />
                </SelectTrigger>
                <SelectContent>
                  {config.selectedFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Y-Axis Field */}
            <div className="space-y-2">
              <Label htmlFor="yAxisField">Y-Axis Field (Numeric)</Label>
              <Select
                value={config.chartConfig.yAxisField}
                onValueChange={(value) =>
                  onChange({
                    ...config,
                    chartConfig: { ...config.chartConfig!, yAxisField: value },
                  })
                }
              >
                <SelectTrigger id="yAxisField">
                  <SelectValue placeholder="Select Y-axis field" />
                </SelectTrigger>
                <SelectContent>
                  {config.selectedFields.map((field) => (
                    <SelectItem key={field} value={field}>
                      {field.replace(/([A-Z])/g, ' $1').trim()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Aggregation (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="aggregation">Aggregation (Optional)</Label>
              <Select
                value={config.chartConfig.aggregation || "none"}
                onValueChange={(value) =>
                  onChange({
                    ...config,
                    chartConfig: {
                      ...config.chartConfig!,
                      aggregation: value === "none" ? undefined : (value as any),
                    },
                  })
                }
              >
                <SelectTrigger id="aggregation">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="sum">Sum</SelectItem>
                  <SelectItem value="average">Average</SelectItem>
                  <SelectItem value="count">Count</SelectItem>
                  <SelectItem value="min">Minimum</SelectItem>
                  <SelectItem value="max">Maximum</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Group By (Optional) */}
            {config.chartConfig.aggregation && (
              <div className="space-y-2">
                <Label htmlFor="groupBy">Group By (Optional)</Label>
                <Select
                  value={config.chartConfig.groupBy || "none"}
                  onValueChange={(value) =>
                    onChange({
                      ...config,
                      chartConfig: {
                        ...config.chartConfig!,
                        groupBy: value === "none" ? undefined : value,
                      },
                    })
                  }
                >
                  <SelectTrigger id="groupBy">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {config.selectedFields.map((field) => (
                      <SelectItem key={field} value={field}>
                        {field.replace(/([A-Z])/g, ' $1').trim()}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
