'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter } from 'lucide-react';

interface EventFiltersProps {
  currentCategory?: string;
  currentMonth: number;
  currentYear: number;
}

export function EventFilters({ currentCategory, currentMonth, currentYear }: EventFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCategoryChange = (category: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (category === 'all') {
      params.delete('category');
    } else {
      params.set('category', category);
    }
    params.set('month', currentMonth.toString());
    params.set('year', currentYear.toString());
    router.push(`/teacher/events?${params.toString()}`);
  };

  const categories = [
    { value: 'all', label: 'All Events' },
    { value: 'SCHOOL_EVENT', label: 'School Event' },
    { value: 'TEACHER_MEETING', label: 'Teacher Meeting' },
    { value: 'PARENT_TEACHER_CONFERENCE', label: 'Parent-Teacher Conference' },
    { value: 'PROFESSIONAL_DEVELOPMENT', label: 'Professional Development' },
    { value: 'HOLIDAY', label: 'Holiday' },
    { value: 'EXAM', label: 'Exam' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" aria-hidden="true" />
          <CardTitle>Filter Events</CardTitle>
        </div>
        <CardDescription>Filter events by category to find what you're looking for</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="category-filter">Event Category</Label>
            <Select
              value={currentCategory || 'all'}
              onValueChange={handleCategoryChange}
            >
              <SelectTrigger id="category-filter" aria-label="Filter by event category">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
