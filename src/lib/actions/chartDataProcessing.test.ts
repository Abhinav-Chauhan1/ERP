import { describe, it, expect } from 'vitest';
import { processChartData, ChartConfig } from './reportBuilderActions';

describe('Chart Data Processing', () => {
  const sampleData = [
    { class: 'Grade 1', studentCount: '25', section: 'A' },
    { class: 'Grade 1', studentCount: '30', section: 'B' },
    { class: 'Grade 2', studentCount: '28', section: 'A' },
    { class: 'Grade 2', studentCount: '32', section: 'B' },
    { class: 'Grade 3', studentCount: '27', section: 'A' },
  ];

  it('should return empty array when chart is not enabled', () => {
    const chartConfig: ChartConfig = {
      enabled: false,
      type: 'bar',
      xAxisField: 'class',
      yAxisField: 'studentCount',
    };

    const result = processChartData(sampleData, chartConfig);
    expect(result).toEqual([]);
  });

  it('should process data without aggregation', () => {
    const chartConfig: ChartConfig = {
      enabled: true,
      type: 'bar',
      xAxisField: 'class',
      yAxisField: 'studentCount',
    };

    const result = processChartData(sampleData, chartConfig);
    
    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('class');
    expect(result[0]).toHaveProperty('studentCount');
    expect(typeof result[0].studentCount).toBe('number');
  });

  it('should aggregate data with sum', () => {
    const chartConfig: ChartConfig = {
      enabled: true,
      type: 'bar',
      xAxisField: 'class',
      yAxisField: 'studentCount',
      aggregation: 'sum',
      groupBy: 'class',
    };

    const result = processChartData(sampleData, chartConfig);
    
    expect(result).toHaveLength(3); // 3 unique classes
    
    const grade1 = result.find(r => r.class === 'Grade 1');
    expect(grade1?.studentCount).toBe(55); // 25 + 30
    
    const grade2 = result.find(r => r.class === 'Grade 2');
    expect(grade2?.studentCount).toBe(60); // 28 + 32
  });

  it('should aggregate data with average', () => {
    const chartConfig: ChartConfig = {
      enabled: true,
      type: 'line',
      xAxisField: 'class',
      yAxisField: 'studentCount',
      aggregation: 'average',
      groupBy: 'class',
    };

    const result = processChartData(sampleData, chartConfig);
    
    const grade1 = result.find(r => r.class === 'Grade 1');
    expect(grade1?.studentCount).toBe(27.5); // (25 + 30) / 2
  });

  it('should aggregate data with count', () => {
    const chartConfig: ChartConfig = {
      enabled: true,
      type: 'bar',
      xAxisField: 'class',
      yAxisField: 'studentCount',
      aggregation: 'count',
      groupBy: 'class',
    };

    const result = processChartData(sampleData, chartConfig);
    
    const grade1 = result.find(r => r.class === 'Grade 1');
    expect(grade1?.studentCount).toBe(2); // 2 sections
  });

  it('should aggregate data with min', () => {
    const chartConfig: ChartConfig = {
      enabled: true,
      type: 'bar',
      xAxisField: 'class',
      yAxisField: 'studentCount',
      aggregation: 'min',
      groupBy: 'class',
    };

    const result = processChartData(sampleData, chartConfig);
    
    const grade1 = result.find(r => r.class === 'Grade 1');
    expect(grade1?.studentCount).toBe(25); // min of 25 and 30
  });

  it('should aggregate data with max', () => {
    const chartConfig: ChartConfig = {
      enabled: true,
      type: 'bar',
      xAxisField: 'class',
      yAxisField: 'studentCount',
      aggregation: 'max',
      groupBy: 'class',
    };

    const result = processChartData(sampleData, chartConfig);
    
    const grade1 = result.find(r => r.class === 'Grade 1');
    expect(grade1?.studentCount).toBe(30); // max of 25 and 30
  });

  it('should handle empty data', () => {
    const chartConfig: ChartConfig = {
      enabled: true,
      type: 'bar',
      xAxisField: 'class',
      yAxisField: 'studentCount',
    };

    const result = processChartData([], chartConfig);
    expect(result).toEqual([]);
  });

  it('should handle non-numeric values gracefully', () => {
    const dataWithNonNumeric = [
      { class: 'Grade 1', studentCount: 'N/A' },
      { class: 'Grade 2', studentCount: '25' },
    ];

    const chartConfig: ChartConfig = {
      enabled: true,
      type: 'bar',
      xAxisField: 'class',
      yAxisField: 'studentCount',
    };

    const result = processChartData(dataWithNonNumeric, chartConfig);
    
    expect(result[0].studentCount).toBe(0); // N/A becomes 0
    expect(result[1].studentCount).toBe(25);
  });
});
