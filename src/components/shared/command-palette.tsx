"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Home,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  FileText,
  Settings,
  Bell,
  BarChart3,
  UserPlus,
  ClipboardList,
  Bus,
  Building,
  Award,
  Search,
} from "lucide-react";

interface CommandAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: string;
  keywords?: string[];
}

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Command Palette Component
 * Requirements: 28.2
 * 
 * Provides a command palette with quick actions accessible via Ctrl+K
 */
export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");

  // Reset search when dialog closes
  useEffect(() => {
    if (!open) {
      setSearch("");
    }
  }, [open]);

  // Define available commands
  const commands: CommandAction[] = [
    // Navigation
    {
      id: "nav-dashboard",
      label: "Go to Dashboard",
      icon: <Home className="h-4 w-4" />,
      action: () => {
        router.push("/admin");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["home", "dashboard", "main"],
    },
    {
      id: "nav-students",
      label: "Go to Students",
      icon: <GraduationCap className="h-4 w-4" />,
      action: () => {
        router.push("/admin/users/students");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["students", "pupils", "learners"],
    },
    {
      id: "nav-teachers",
      label: "Go to Teachers",
      icon: <Users className="h-4 w-4" />,
      action: () => {
        router.push("/admin/users/teachers");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["teachers", "staff", "faculty"],
    },
    {
      id: "nav-parents",
      label: "Go to Parents",
      icon: <Users className="h-4 w-4" />,
      action: () => {
        router.push("/admin/users/parents");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["parents", "guardians"],
    },
    {
      id: "nav-classes",
      label: "Go to Classes",
      icon: <BookOpen className="h-4 w-4" />,
      action: () => {
        router.push("/admin/classes");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["classes", "sections", "grades"],
    },
    {
      id: "nav-attendance",
      label: "Go to Attendance",
      icon: <ClipboardList className="h-4 w-4" />,
      action: () => {
        router.push("/admin/attendance");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["attendance", "present", "absent"],
    },
    {
      id: "nav-finance",
      label: "Go to Finance",
      icon: <DollarSign className="h-4 w-4" />,
      action: () => {
        router.push("/admin/finance");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["finance", "fees", "payments", "money"],
    },
    {
      id: "nav-reports",
      label: "Go to Reports",
      icon: <BarChart3 className="h-4 w-4" />,
      action: () => {
        router.push("/admin/reports");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["reports", "analytics", "statistics"],
    },
    {
      id: "nav-library",
      label: "Go to Library",
      icon: <BookOpen className="h-4 w-4" />,
      action: () => {
        router.push("/admin/library");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["library", "books"],
    },
    {
      id: "nav-transport",
      label: "Go to Transport",
      icon: <Bus className="h-4 w-4" />,
      action: () => {
        router.push("/admin/transport");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["transport", "bus", "routes", "vehicles"],
    },
    {
      id: "nav-admissions",
      label: "Go to Admissions",
      icon: <UserPlus className="h-4 w-4" />,
      action: () => {
        router.push("/admin/admissions");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["admissions", "applications", "enrollment"],
    },
    {
      id: "nav-certificates",
      label: "Go to Certificates",
      icon: <Award className="h-4 w-4" />,
      action: () => {
        router.push("/admin/certificates");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["certificates", "awards", "documents"],
    },
    {
      id: "nav-settings",
      label: "Go to Settings",
      icon: <Settings className="h-4 w-4" />,
      action: () => {
        router.push("/admin/settings");
        onOpenChange(false);
      },
      category: "Navigation",
      keywords: ["settings", "preferences", "configuration"],
    },

    // Quick Actions
    {
      id: "action-add-student",
      label: "Add New Student",
      icon: <UserPlus className="h-4 w-4" />,
      action: () => {
        router.push("/admin/users/students?action=add");
        onOpenChange(false);
      },
      category: "Quick Actions",
      keywords: ["add", "new", "student", "enroll"],
    },
    {
      id: "action-add-teacher",
      label: "Add New Teacher",
      icon: <UserPlus className="h-4 w-4" />,
      action: () => {
        router.push("/admin/users/teachers?action=add");
        onOpenChange(false);
      },
      category: "Quick Actions",
      keywords: ["add", "new", "teacher", "staff"],
    },
    {
      id: "action-mark-attendance",
      label: "Mark Attendance",
      icon: <ClipboardList className="h-4 w-4" />,
      action: () => {
        router.push("/admin/attendance?action=mark");
        onOpenChange(false);
      },
      category: "Quick Actions",
      keywords: ["mark", "attendance", "present", "absent"],
    },
    {
      id: "action-generate-report",
      label: "Generate Report",
      icon: <FileText className="h-4 w-4" />,
      action: () => {
        router.push("/admin/reports?action=generate");
        onOpenChange(false);
      },
      category: "Quick Actions",
      keywords: ["generate", "report", "export"],
    },
  ];

  // Group commands by category
  const groupedCommands = commands.reduce((acc, command) => {
    if (!acc[command.category]) {
      acc[command.category] = [];
    }
    acc[command.category].push(command);
    return acc;
  }, {} as Record<string, CommandAction[]>);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Type a command or search..."
        value={search}
        onValueChange={setSearch}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        
        {Object.entries(groupedCommands).map(([category, categoryCommands], index) => (
          <div key={category}>
            {index > 0 && <CommandSeparator />}
            <CommandGroup heading={category}>
              {categoryCommands.map((command) => (
                <CommandItem
                  key={command.id}
                  onSelect={command.action}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  {command.icon}
                  <span>{command.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </div>
        ))}
      </CommandList>
    </CommandDialog>
  );
}
