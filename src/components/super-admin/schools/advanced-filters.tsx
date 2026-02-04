"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { DatePicker } from "@/components/ui/date-picker";
import { Slider } from "@/components/ui/slider";

interface AdvancedFiltersProps {
  onApplyFilters: (filters: any) => void;
}

export function AdvancedFilters({ onApplyFilters }: AdvancedFiltersProps) {
  const [filters, setFilters] = useState({
    createdAfter: undefined as Date | undefined,
    createdBefore: undefined as Date | undefined,
    studentCountMin: 0,
    studentCountMax: 2000,
    teacherCountMin: 0,
    teacherCountMax: 200,
    onboardedOnly: false,
    paymentStatus: "ALL",
    usageThreshold: 50, // percentage
    lastLoginDays: 30,
  });

  const handleFilterChange = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onApplyFilters(filters);
  };

  const handleReset = () => {
    setFilters({
      createdAfter: undefined,
      createdBefore: undefined,
      studentCountMin: 0,
      studentCountMax: 2000,
      teacherCountMin: 0,
      teacherCountMax: 200,
      onboardedOnly: false,
      paymentStatus: "ALL",
      usageThreshold: 50,
      lastLoginDays: 30,
    });
  };

  return (
    <Card className="border-dashed">
      <CardContent className="p-4">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Date Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Created Date Range</Label>
              <div className="space-y-2">
                <DatePicker
                  date={filters.createdAfter}
                  onSelect={(date) => handleFilterChange('createdAfter', date)}
                  placeholder="From date"
                />
                <DatePicker
                  date={filters.createdBefore}
                  onSelect={(date) => handleFilterChange('createdBefore', date)}
                  placeholder="To date"
                />
              </div>
            </div>

            {/* Student Count Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Student Count: {filters.studentCountMin} - {filters.studentCountMax}
              </Label>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Min students"
                  value={filters.studentCountMin}
                  onChange={(e) => handleFilterChange('studentCountMin', parseInt(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  placeholder="Max students"
                  value={filters.studentCountMax}
                  onChange={(e) => handleFilterChange('studentCountMax', parseInt(e.target.value) || 2000)}
                />
              </div>
            </div>

            {/* Teacher Count Range */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Teacher Count: {filters.teacherCountMin} - {filters.teacherCountMax}
              </Label>
              <div className="space-y-2">
                <Input
                  type="number"
                  placeholder="Min teachers"
                  value={filters.teacherCountMin}
                  onChange={(e) => handleFilterChange('teacherCountMin', parseInt(e.target.value) || 0)}
                />
                <Input
                  type="number"
                  placeholder="Max teachers"
                  value={filters.teacherCountMax}
                  onChange={(e) => handleFilterChange('teacherCountMax', parseInt(e.target.value) || 200)}
                />
              </div>
            </div>

            {/* Payment Status */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Payment Status</Label>
              <Select 
                value={filters.paymentStatus} 
                onValueChange={(value) => handleFilterChange('paymentStatus', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Statuses</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="OVERDUE">Overdue</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Usage Threshold */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                Usage Above: {filters.usageThreshold}%
              </Label>
              <Slider
                value={[filters.usageThreshold]}
                onValueChange={(value) => handleFilterChange('usageThreshold', value[0])}
                max={100}
                step={5}
                className="w-full"
              />
            </div>

            {/* Last Login */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Last Login Within (days)</Label>
              <Input
                type="number"
                placeholder="Days"
                value={filters.lastLoginDays}
                onChange={(e) => handleFilterChange('lastLoginDays', parseInt(e.target.value) || 30)}
              />
            </div>
          </div>

          {/* Boolean Filters */}
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="onboarded"
                checked={filters.onboardedOnly}
                onCheckedChange={(checked) => handleFilterChange('onboardedOnly', checked)}
              />
              <Label htmlFor="onboarded" className="text-sm">
                Fully onboarded only
              </Label>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <Button variant="outline" onClick={handleReset}>
              Reset Filters
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => onApplyFilters({})}>
                Clear All
              </Button>
              <Button onClick={handleApply}>
                Apply Filters
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}