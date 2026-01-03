"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { saveSubjectMarkConfig } from "@/lib/actions/subjectMarkConfigActions";

interface Subject {
  id: string;
  name: string;
  code: string;
}

interface SubjectMarkConfigFormProps {
  examId: string;
  examTotalMarks: number;
  subjects: Subject[];
  existingConfig?: {
    id: string;
    subjectId: string;
    theoryMaxMarks?: number;
    practicalMaxMarks?: number;
    internalMaxMarks?: number;
    totalMarks: number;
  };
}

export function SubjectMarkConfigForm({
  examId,
  examTotalMarks,
  subjects,
  existingConfig,
}: SubjectMarkConfigFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [subjectId, setSubjectId] = useState(existingConfig?.subjectId || "");
  const [theoryMaxMarks, setTheoryMaxMarks] = useState<string>(
    existingConfig?.theoryMaxMarks?.toString() || ""
  );
  const [practicalMaxMarks, setPracticalMaxMarks] = useState<string>(
    existingConfig?.practicalMaxMarks?.toString() || ""
  );
  const [internalMaxMarks, setInternalMaxMarks] = useState<string>(
    existingConfig?.internalMaxMarks?.toString() || ""
  );
  const [totalMarks, setTotalMarks] = useState<string>(
    existingConfig?.totalMarks?.toString() || examTotalMarks.toString()
  );

  // Calculate component sum
  const componentSum =
    (parseFloat(theoryMaxMarks) || 0) +
    (parseFloat(practicalMaxMarks) || 0) +
    (parseFloat(internalMaxMarks) || 0);

  const totalMarksNum = parseFloat(totalMarks) || 0;
  const isValidSum = componentSum === totalMarksNum;

  // Auto-update total marks when components change
  useEffect(() => {
    if (theoryMaxMarks || practicalMaxMarks || internalMaxMarks) {
      setTotalMarks(componentSum.toString());
    }
  }, [theoryMaxMarks, practicalMaxMarks, internalMaxMarks, componentSum]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Validation
    if (!subjectId) {
      setError("Please select a subject");
      return;
    }

    if (!theoryMaxMarks && !practicalMaxMarks && !internalMaxMarks) {
      setError("At least one mark component must be specified");
      return;
    }

    if (!isValidSum) {
      setError(`Component sum (${componentSum}) must equal total marks (${totalMarksNum})`);
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await saveSubjectMarkConfig({
        examId,
        subjectId,
        theoryMaxMarks: theoryMaxMarks ? parseFloat(theoryMaxMarks) : undefined,
        practicalMaxMarks: practicalMaxMarks ? parseFloat(practicalMaxMarks) : undefined,
        internalMaxMarks: internalMaxMarks ? parseFloat(internalMaxMarks) : undefined,
        totalMarks: totalMarksNum,
      });

      if (result.success) {
        setSuccess(true);
        // Reset form
        setSubjectId("");
        setTheoryMaxMarks("");
        setPracticalMaxMarks("");
        setInternalMaxMarks("");
        setTotalMarks(examTotalMarks.toString());
        
        // Refresh the page to show updated data
        router.refresh();
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.error || "Failed to save configuration");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="bg-green-50 text-green-900 border-green-200">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Configuration saved successfully!</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="subject">Subject *</Label>
          <Select value={subjectId} onValueChange={setSubjectId} disabled={isSubmitting}>
            <SelectTrigger id="subject">
              <SelectValue placeholder="Select subject" />
            </SelectTrigger>
            <SelectContent>
              {subjects.map((subject) => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name} ({subject.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="totalMarks">Total Marks *</Label>
          <Input
            id="totalMarks"
            type="number"
            step="0.01"
            min="0"
            value={totalMarks}
            onChange={(e) => setTotalMarks(e.target.value)}
            disabled={isSubmitting}
            placeholder="Total marks"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="theoryMaxMarks">Theory Max Marks</Label>
          <Input
            id="theoryMaxMarks"
            type="number"
            step="0.01"
            min="0"
            value={theoryMaxMarks}
            onChange={(e) => setTheoryMaxMarks(e.target.value)}
            disabled={isSubmitting}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="practicalMaxMarks">Practical Max Marks</Label>
          <Input
            id="practicalMaxMarks"
            type="number"
            step="0.01"
            min="0"
            value={practicalMaxMarks}
            onChange={(e) => setPracticalMaxMarks(e.target.value)}
            disabled={isSubmitting}
            placeholder="0"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="internalMaxMarks">Internal Max Marks</Label>
          <Input
            id="internalMaxMarks"
            type="number"
            step="0.01"
            min="0"
            value={internalMaxMarks}
            onChange={(e) => setInternalMaxMarks(e.target.value)}
            disabled={isSubmitting}
            placeholder="0"
          />
        </div>
      </div>

      {/* Validation feedback */}
      <div className="flex items-center justify-between p-3 bg-muted rounded-md">
        <div className="text-sm">
          <span className="text-muted-foreground">Component Sum: </span>
          <span className={`font-medium ${isValidSum ? 'text-green-600' : 'text-red-600'}`}>
            {componentSum}
          </span>
          <span className="text-muted-foreground"> / Total: </span>
          <span className="font-medium">{totalMarksNum}</span>
        </div>
        {isValidSum && componentSum > 0 ? (
          <CheckCircle2 className="h-5 w-5 text-green-600" />
        ) : componentSum > 0 ? (
          <AlertCircle className="h-5 w-5 text-red-600" />
        ) : null}
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setSubjectId("");
            setTheoryMaxMarks("");
            setPracticalMaxMarks("");
            setInternalMaxMarks("");
            setTotalMarks(examTotalMarks.toString());
            setError(null);
          }}
          disabled={isSubmitting}
        >
          Reset
        </Button>
        <Button type="submit" disabled={isSubmitting || !isValidSum || componentSum === 0}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {existingConfig ? "Update Configuration" : "Save Configuration"}
        </Button>
      </div>
    </form>
  );
}
