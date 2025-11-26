"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface AchievementDialogTriggerProps {
  title: string;
  children: React.ReactNode;
}

export function AchievementDialogTrigger({ title, children }: AchievementDialogTriggerProps) {
  const [open, setOpen] = useState(false);
  
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-[44px]">
          <PlusCircle className="h-4 w-4 mr-2" />
          {title}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        {/* Clone children and add onSuccess prop to close dialog */}
        {React.cloneElement(children as React.ReactElement, {
          onSuccess: () => setOpen(false)
        })}
      </DialogContent>
    </Dialog>
  );
}
