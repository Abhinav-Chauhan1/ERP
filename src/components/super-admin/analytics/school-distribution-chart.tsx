"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface SchoolDistributionChartProps {
  data: Array<{
    plan: string;
    count: number;
    percentage: string;
  }>;
}

export function SchoolDistributionChart({ data }: SchoolDistributionChartProps) {
  // Transform the data for the charts
  const planDistribution = data.map((item, index) => ({
    name: item.plan,
    value: item.count,
    color: ['#f59e0b', '#3b82f6', '#14b8a6'][index % 3],
  }));

  const statusDistribution = [
    { name: 'Active', value: 142, color: '#10b981' },
    { name: 'Suspended', value: 8, color: '#ef4444' },
    { name: 'Inactive', value: 6, color: '#6b7280' },
  ];

  const schoolsByRegion = [
    { region: 'North India', schools: 45, students: 12500 },
    { region: 'South India', schools: 38, students: 11200 },
    { region: 'West India', schools: 32, students: 9800 },
    { region: 'East India', schools: 28, students: 8500 },
    { region: 'Central India', schools: 13, students: 3230 },
  ];

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('en-IN').format(value);
  };

  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="white" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
        fontSize={12}
        fontWeight="bold"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>School Distribution Analytics</CardTitle>
        <CardDescription>Distribution by plan, status, and region</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Plan Distribution */}
          <div>
            <h4 className="text-sm font-medium mb-3">Distribution by Plan</h4>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={planDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {planDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value as number), 'Schools']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {planDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Status Distribution */}
          <div>
            <h4 className="text-sm font-medium mb-3">Distribution by Status</h4>
            <div className="flex items-center gap-6">
              <div className="flex-1">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => [formatNumber(value as number), 'Schools']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {statusDistribution.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm">{item.name}: {item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Regional Distribution */}
          <div>
            <h4 className="text-sm font-medium mb-3">Schools by Region</h4>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={schoolsByRegion} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" tickFormatter={formatNumber} fontSize={12} />
                <YAxis 
                  type="category" 
                  dataKey="region" 
                  fontSize={12}
                  width={80}
                />
                <Tooltip 
                  formatter={(value, name) => [
                    formatNumber(value as number), 
                    name === 'schools' ? 'Schools' : 'Students'
                  ]}
                />
                <Bar 
                  dataKey="schools" 
                  fill="#3b82f6" 
                  name="schools"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {planDistribution.reduce((sum, item) => sum + item.value, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Total Schools</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {Math.round((statusDistribution.find(s => s.name === 'Active')?.value || 0) / statusDistribution.reduce((sum, item) => sum + item.value, 0) * 100)}%
              </div>
              <div className="text-sm text-muted-foreground">Active Rate</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-teal-600">
                {formatNumber(schoolsByRegion.reduce((sum, item) => sum + item.students, 0))}
              </div>
              <div className="text-sm text-muted-foreground">Total Students</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}