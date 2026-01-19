"use client";

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Check, ChevronDown } from 'lucide-react';

type ClassInfo = {
  id: string;
  name: string;
  subject?: string; // Deprecated but kept for compatibility
  sectionName?: string; // New: Section name for attendance
  sectionId?: string;
};

interface SelectClassProps {
  classes: ClassInfo[];
  selected: ClassInfo | null;
  onSelect: (classInfo: ClassInfo) => void;
}

export function SelectClass({ classes, selected, onSelect }: SelectClassProps) {
  // Display logic: prefer sectionName, fallback to subject, then nothing
  const getDisplayLabel = (classInfo: ClassInfo) => {
    const suffix = classInfo.sectionName || classInfo.subject;
    return suffix ? `${classInfo.name} - ${suffix}` : classInfo.name;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {selected ? getDisplayLabel(selected) : 'Select Class'}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {classes.map((classInfo) => (
          <DropdownMenuItem
            key={`${classInfo.id}-${classInfo.sectionId || 'all'}`}
            onClick={() => onSelect(classInfo)}
            className="flex items-center justify-between"
          >
            <span>{getDisplayLabel(classInfo)}</span>
            {selected?.id === classInfo.id && selected?.sectionId === classInfo.sectionId && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

