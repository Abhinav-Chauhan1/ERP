"use client";

import { ReportConfig } from "@/app/admin/reports/builder/page";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Filter, ArrowUpDown, BarChart3 } from "lucide-react";
import { ReportChart } from "./report-chart";
import { processChartData } from "@/lib/actions/reportBuilderActions";
import { useState, useEffect } from "react";

interface ReportPreviewProps {
  config: ReportConfig;
  data?: any[];
}

export function ReportPreview({ config, data }: ReportPreviewProps) {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    async function loadChartData() {
      if (config.chartConfig?.enabled && data && data.length > 0) {
        const processed = await processChartData(data, config.chartConfig);
        setChartData(processed);
      } else {
        setChartData([]);
      }
    }
    loadChartData();
  }, [config.chartConfig, data]);

  if (!config.dataSource || config.selectedFields.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Preview Available</h3>
        <p className="text-sm text-muted-foreground max-w-sm">
          Select a data source and at least one field to see a preview of your report
        </p>
      </div>
    );
  }

  // Use provided data or generate sample data
  const displayData = data && data.length > 0 ? data : generateSampleData(config);

  return (
    <div className="space-y-4">
      {/* Report Summary */}
      <div className="space-y-2">
        <h3 className="font-semibold">
          {config.name || "Untitled Report"}
        </h3>
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline">
            Source: {config.dataSource}
          </Badge>
          <Badge variant="outline">
            Fields: {config.selectedFields.length}
          </Badge>
          {config.filters.length > 0 && (
            <Badge variant="outline">
              <Filter className="h-3 w-3 mr-1" />
              {config.filters.length} Filter{config.filters.length > 1 ? 's' : ''}
            </Badge>
          )}
          {config.sorting.length > 0 && (
            <Badge variant="outline">
              <ArrowUpDown className="h-3 w-3 mr-1" />
              {config.sorting.length} Sort{config.sorting.length > 1 ? 's' : ''}
            </Badge>
          )}
          {config.chartConfig?.enabled && (
            <Badge variant="outline">
              <BarChart3 className="h-3 w-3 mr-1" />
              Chart: {config.chartConfig.type}
            </Badge>
          )}
        </div>
      </div>

      {/* Applied Filters */}
      {config.filters.length > 0 && (
        <Card className="p-3">
          <h4 className="text-sm font-semibold mb-2">Applied Filters</h4>
          <div className="space-y-1">
            {config.filters.map((filter, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                <span className="font-medium capitalize">
                  {filter.field.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                {' '}{filter.operator}{' '}
                <span className="font-medium">{filter.value}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Applied Sorting */}
      {config.sorting.length > 0 && (
        <Card className="p-3">
          <h4 className="text-sm font-semibold mb-2">Applied Sorting</h4>
          <div className="space-y-1">
            {config.sorting.map((sort, index) => (
              <div key={index} className="text-sm text-muted-foreground">
                <span className="font-medium capitalize">
                  {sort.field.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                {' - '}
                <span className="capitalize">{sort.direction}ending</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Chart Visualization */}
      {config.chartConfig?.enabled && chartData.length > 0 && (
        <ReportChart
          data={chartData}
          chartConfig={config.chartConfig}
          title={config.name}
        />
      )}

      {/* Data Preview */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted px-4 py-2">
          <h4 className="text-sm font-semibold">Data Preview (Sample)</h4>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {config.selectedFields.map((field) => (
                  <TableHead key={field} className="capitalize">
                    {field.replace(/([A-Z])/g, ' $1').trim()}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayData.map((row, rowIndex) => (
                <TableRow key={rowIndex}>
                  {config.selectedFields.map((field) => (
                    <TableCell key={field}>
                      {row[field] || '-'}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {data && data.length > 0
          ? `Showing ${data.length} record${data.length !== 1 ? 's' : ''} from your database`
          : "This is a preview with sample data. Click 'Generate Report' to see real data."}
      </p>
    </div>
  );
}

// Helper function to generate sample data
function generateSampleData(config: ReportConfig): Record<string, string>[] {
  const sampleCount = 5;
  const data: Record<string, string>[] = [];

  for (let i = 0; i < sampleCount; i++) {
    const row: Record<string, string> = {};
    
    config.selectedFields.forEach((field) => {
      // Generate sample data based on field name
      if (field.toLowerCase().includes('id')) {
        row[field] = `ID-${1000 + i}`;
      } else if (field.toLowerCase().includes('name')) {
        row[field] = `Sample ${field} ${i + 1}`;
      } else if (field.toLowerCase().includes('email')) {
        row[field] = `sample${i + 1}@example.com`;
      } else if (field.toLowerCase().includes('date')) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        row[field] = date.toLocaleDateString();
      } else if (field.toLowerCase().includes('status')) {
        row[field] = ['Active', 'Pending', 'Completed'][i % 3];
      } else if (field.toLowerCase().includes('amount') || field.toLowerCase().includes('salary') || field.toLowerCase().includes('marks')) {
        row[field] = `${(i + 1) * 1000}`;
      } else if (field.toLowerCase().includes('percentage')) {
        row[field] = `${75 + i * 5}%`;
      } else if (field.toLowerCase().includes('grade')) {
        row[field] = ['A', 'B', 'C', 'D'][i % 4];
      } else if (field.toLowerCase().includes('class')) {
        row[field] = `Class ${i + 1}`;
      } else if (field.toLowerCase().includes('section')) {
        row[field] = ['A', 'B', 'C'][i % 3];
      } else {
        row[field] = `Sample ${i + 1}`;
      }
    });
    
    data.push(row);
  }

  return data;
}
