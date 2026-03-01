"use client";

import Link from "next/link";
import { CreditCard, MessageSquare, Calendar, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  color: string;
}

const quickActions: QuickAction[] = [
  {
    label: "Pay Fees",
    icon: CreditCard,
    href: "/parent/fees",
    color: "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-500",
  },
  {
    label: "Send Message",
    icon: MessageSquare,
    href: "/parent/communication",
    color: "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-500",
  },
  {
    label: "Schedule Meeting",
    icon: Calendar,
    href: "/parent/meetings/schedule",
    color: "text-teal-600 bg-teal-100 dark:bg-teal-900/30 dark:text-teal-500",
  },
  {
    label: "View Reports",
    icon: FileText,
    href: "/parent/performance",
    color: "text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-500",
  },
];

export function QuickActionsPanel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-accent cursor-pointer transition-colors min-h-[100px] justify-center"
                aria-label={`Navigate to ${action.label}`}
              >
                <div className={cn("p-3 rounded-full", action.color)}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <span className="text-xs text-center font-medium">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
