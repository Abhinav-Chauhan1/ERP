"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { User } from "lucide-react";

interface Child {
  id: string;
  user: {
    firstName: string;
    lastName: string;
  };
  enrollments?: Array<{
    class: {
      name: string;
    };
    section: {
      name: string;
    };
  }>;
}

interface ChildSelectorProps {
  selectedChildId?: string;
}

export function ChildSelector({ selectedChildId }: ChildSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [children, setChildren] = useState<Child[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChildren();
  }, []);

  const fetchChildren = async () => {
    try {
      const response = await fetch("/api/parent/children");
      const data = await response.json();

      if (data.success) {
        setChildren(data.children || []);
        
        // If no child is selected and we have children, select the first one
        if (!selectedChildId && data.children.length > 0) {
          handleChildChange(data.children[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch children:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChildChange = (childId: string) => {
    // Update URL with new childId
    const url = new URL(window.location.href);
    url.searchParams.set("childId", childId);
    router.push(`${pathname}?${url.searchParams.toString()}`);
  };

  if (loading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[250px]">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (children.length === 0) {
    return null;
  }

  return (
    <Select value={selectedChildId} onValueChange={handleChildChange}>
      <SelectTrigger className="w-[250px]" aria-label="Select a child to view">
        <User className="h-4 w-4 mr-2" aria-hidden="true" />
        <SelectValue placeholder="Select a child" />
      </SelectTrigger>
      <SelectContent>
        {children.map((child) => {
          const enrollment = child.enrollments?.[0];
          const className = enrollment
            ? `${enrollment.class.name} - ${enrollment.section.name}`
            : "";

          return (
            <SelectItem key={child.id} value={child.id}>
              <div className="flex flex-col">
                <span className="font-medium">
                  {child.user.firstName} {child.user.lastName}
                </span>
                {className && (
                  <span className="text-xs text-gray-500">{className}</span>
                )}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
