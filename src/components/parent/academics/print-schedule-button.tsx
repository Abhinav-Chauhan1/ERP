"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export function PrintScheduleButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => window.print()}
      className="hidden md:flex"
    >
      <Printer className="h-4 w-4 mr-2" />
      Print Schedule
    </Button>
  );
}
