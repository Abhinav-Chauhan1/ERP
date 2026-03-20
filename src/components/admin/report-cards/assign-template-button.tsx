"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { assignTemplateToClass } from "@/lib/actions/reportCardTemplateActions";
import { useRouter } from "next/navigation";

interface Props {
  templateId: string;
  templateName: string;
  cbseLevel: string;
  classes: Array<{ id: string; name: string }>;
}

export function AssignTemplateButton({ templateId, templateName, classes }: Props) {
  const [open, setOpen] = useState(false);
  const [classId, setClassId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleAssign() {
    if (!classId) return;
    setLoading(true);
    setError(null);
    const result = await assignTemplateToClass(templateId, classId);
    setLoading(false);
    if (result.success) {
      setOpen(false);
      setClassId("");
      router.refresh();
    } else {
      setError(result.error ?? "Failed to assign template");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="w-full">
          Assign to Class
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Assign Template</DialogTitle>
          <DialogDescription>
            Assign <strong>{templateName}</strong> to a class. This will be used when generating
            report cards for that class.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label htmlFor="class-select">Select Class</Label>
          <Select value={classId} onValueChange={setClassId}>
            <SelectTrigger id="class-select">
              <SelectValue placeholder="Choose a class..." />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!classId || loading}>
            {loading ? "Assigning..." : "Assign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
