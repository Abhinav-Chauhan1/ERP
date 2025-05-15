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
  subject: string;
};

interface SelectClassProps {
  classes: ClassInfo[];
  selected: ClassInfo | null;
  onSelect: (classInfo: ClassInfo) => void;
}

export function SelectClass({ classes, selected, onSelect }: SelectClassProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {selected ? `${selected.name} - ${selected.subject}` : 'Select Class'}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[200px]">
        {classes.map((classInfo) => (
          <DropdownMenuItem
            key={classInfo.id}
            onClick={() => onSelect(classInfo)}
            className="flex items-center justify-between"
          >
            <span>{classInfo.name} - {classInfo.subject}</span>
            {selected?.id === classInfo.id && <Check className="h-4 w-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
