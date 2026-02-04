"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckSquare,
  Play,
  Pause,
  Trash2,
  Download,
  Send,
  Settings,
  X
} from "lucide-react";

interface BulkActionsBarProps {
  selectedCount: number;
  onAction: (action: string) => void;
  isLoading?: boolean;
}

export function BulkActionsBar({ selectedCount, onAction, isLoading = false }: BulkActionsBarProps) {
  return (
    <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-800">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-4 w-4 text-blue-600" />
              <span className="font-medium text-blue-900 dark:text-blue-100">
                {selectedCount} school{selectedCount !== 1 ? 's' : ''} selected
              </span>
            </div>
            <Badge variant="outline" className="bg-[hsl(var(--card))]">
              Bulk Actions Available
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction('activate')}
              disabled={isLoading}
            >
              <Play className="h-4 w-4 mr-2" />
              Activate
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction('suspend')}
              disabled={isLoading}
            >
              <Pause className="h-4 w-4 mr-2" />
              Suspend
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction('export')}
              disabled={isLoading}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction('message')}
              disabled={isLoading}
            >
              <Send className="h-4 w-4 mr-2" />
              Send Message
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => onAction('settings')}
              disabled={isLoading}
            >
              <Settings className="h-4 w-4 mr-2" />
              Bulk Settings
            </Button>

            <Button
              variant="destructive"
              size="sm"
              onClick={() => onAction('delete')}
              disabled={isLoading}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => onAction('clear')}
              disabled={isLoading}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}