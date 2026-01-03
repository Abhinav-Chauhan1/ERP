"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Trophy, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  calculateClassRanks,
  getClassesAndTermsForRanks,
  getRankStatistics,
} from "@/lib/actions/rankCalculationActions";

interface ClassData {
  id: string;
  name: string;
  academicYear: {
    name: string;
    terms: Array<{
      id: string;
      name: string;
    }>;
  };
}

export function RankCalculationDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [selectedTerm, setSelectedTerm] = useState<string>("");
  const [statistics, setStatistics] = useState<any>(null);
  const [showStatistics, setShowStatistics] = useState(false);

  async function loadClassesAndTerms() {
    setLoading(true);
    try {
      const result = await getClassesAndTermsForRanks();
      if (result.success && result.data) {
        setClasses(result.data);
      } else {
        toast.error(result.error || "Failed to load classes and terms");
      }
    } catch (error) {
      console.error("Error loading classes:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Load classes and terms when dialog opens
  useEffect(() => {
    if (open) {
      loadClassesAndTerms();
    }
  }, [open]);

  const loadStatistics = useCallback(async function () {
    if (!selectedClass || !selectedTerm) return;

    try {
      const result = await getRankStatistics(selectedClass, selectedTerm);
      if (result.success && result.data) {
        setStatistics(result.data);
        setShowStatistics(true);
      } else {
        setStatistics(null);
        setShowStatistics(false);
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
      setStatistics(null);
      setShowStatistics(false);
    }
  }, [selectedClass, selectedTerm]);

  // Load statistics when class and term are selected
  useEffect(() => {
    if (selectedClass && selectedTerm) {
      loadStatistics();
    }
  }, [selectedClass, selectedTerm, loadStatistics]);

  async function handleCalculateRanks() {
    if (!selectedClass || !selectedTerm) {
      toast.error("Please select both class and term");
      return;
    }

    setCalculating(true);
    try {
      const result = await calculateClassRanks(selectedClass, selectedTerm);

      if (result.success) {
        toast.success(result.message || "Ranks calculated successfully");
        // Reload statistics to show updated ranks
        await loadStatistics();
      } else {
        toast.error(result.error || "Failed to calculate ranks");
      }
    } catch (error) {
      console.error("Error calculating ranks:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setCalculating(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setSelectedClass("");
    setSelectedTerm("");
    setStatistics(null);
    setShowStatistics(false);
  }

  const selectedClassData = classes.find((c) => c.id === selectedClass);
  const availableTerms = selectedClassData?.academicYear.terms || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Trophy className="h-4 w-4" />
          Calculate Ranks
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculate Class Ranks</DialogTitle>
          <DialogDescription>
            Calculate and assign ranks to students based on their total marks for a term.
            Students with equal marks will receive the same rank.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="class">Class</Label>
            <Select
              value={selectedClass}
              onValueChange={(value) => {
                setSelectedClass(value);
                setSelectedTerm("");
                setStatistics(null);
                setShowStatistics(false);
              }}
              disabled={loading}
            >
              <SelectTrigger id="class">
                <SelectValue placeholder="Select a class" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name} ({cls.academicYear.name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Term Selection */}
          <div className="space-y-2">
            <Label htmlFor="term">Term</Label>
            <Select
              value={selectedTerm}
              onValueChange={setSelectedTerm}
              disabled={!selectedClass || loading}
            >
              <SelectTrigger id="term">
                <SelectValue placeholder="Select a term" />
              </SelectTrigger>
              <SelectContent>
                {availableTerms.map((term) => (
                  <SelectItem key={term.id} value={term.id}>
                    {term.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Information Alert */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Ranks will be calculated based on total marks in descending order.
              Students with equal marks will be assigned the same rank.
              Only students with report cards containing marks will be ranked.
            </AlertDescription>
          </Alert>

          {/* Statistics Display */}
          {showStatistics && statistics && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <h4 className="font-semibold text-sm flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                Current Statistics
              </h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Students</p>
                  <p className="font-semibold">{statistics.totalStudents}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ranked Students</p>
                  <p className="font-semibold">{statistics.rankedStudents}</p>
                </div>
                {statistics.topStudent && (
                  <>
                    <div>
                      <p className="text-muted-foreground">Top Rank</p>
                      <p className="font-semibold">#{statistics.topRank}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Top Student</p>
                      <p className="font-semibold">{statistics.topStudent}</p>
                    </div>
                  </>
                )}
              </div>

              {statistics.tiedRanks && statistics.tiedRanks.length > 0 && (
                <div className="pt-2 border-t">
                  <p className="text-muted-foreground text-xs mb-1">Tied Ranks</p>
                  <div className="flex flex-wrap gap-2">
                    {statistics.tiedRanks.map((tied: any) => (
                      <span
                        key={tied.rank}
                        className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded"
                      >
                        Rank #{tied.rank}: {tied.count} students
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No data message */}
          {showStatistics && !statistics && selectedClass && selectedTerm && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                No report cards with marks found for this class and term.
                Please ensure marks have been entered and report cards generated.
              </AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={calculating}>
            Cancel
          </Button>
          <Button
            onClick={handleCalculateRanks}
            disabled={!selectedClass || !selectedTerm || calculating || loading}
          >
            {calculating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Trophy className="mr-2 h-4 w-4" />
                Calculate Ranks
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
