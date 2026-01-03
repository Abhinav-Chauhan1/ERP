"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Info, ArrowRight } from "lucide-react";
import toast from "react-hot-toast";
import {
  getAvailableFeeStructuresForBulkAssignment,
  bulkAssignFeeStructuresToClass,
  bulkRemoveFeeStructuresFromClass,
} from "@/lib/actions/feeStructureActions";

interface BulkClassAssignmentProps {
  classes: Array<{ id: string; name: string; academicYearId: string }>;
  academicYears: Array<{ id: string; name: string }>;
  onComplete?: () => void;
}

export function BulkClassAssignment({
  classes,
  academicYears,
  onComplete,
}: BulkClassAssignmentProps) {
  const [selectedAcademicYear, setSelectedAcademicYear] = useState<string>("");
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [assignedStructures, setAssignedStructures] = useState<any[]>([]);
  const [unassignedStructures, setUnassignedStructures] = useState<any[]>([]);
  const [selectedToAssign, setSelectedToAssign] = useState<string[]>([]);
  const [selectedToRemove, setSelectedToRemove] = useState<string[]>([]);
  const [operationResult, setOperationResult] = useState<any>(null);

  // Filter classes by selected academic year
  const filteredClasses = selectedAcademicYear
    ? classes.filter((c) => c.academicYearId === selectedAcademicYear)
    : [];

  const loadFeeStructures = useCallback(async function () {
    if (!selectedClass || !selectedAcademicYear) return;

    setLoading(true);
    setOperationResult(null);
    try {
      const result = await getAvailableFeeStructuresForBulkAssignment(
        selectedClass,
        selectedAcademicYear
      );

      if (result.success && result.data) {
        setAssignedStructures(result.data.assigned || []);
        setUnassignedStructures(result.data.unassigned || []);
        setSelectedToAssign([]);
        setSelectedToRemove([]);
      } else {
        toast.error(result.error || "Failed to load fee structures");
      }
    } catch (error) {
      console.error("Error loading fee structures:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedAcademicYear]);

  // Load fee structures when class is selected
  useEffect(() => {
    if (selectedClass && selectedAcademicYear) {
      loadFeeStructures();
    } else {
      setAssignedStructures([]);
      setUnassignedStructures([]);
      setSelectedToAssign([]);
      setSelectedToRemove([]);
      setOperationResult(null);
    }
  }, [selectedClass, selectedAcademicYear, loadFeeStructures]);

  // Handle select all for unassigned
  function handleSelectAllUnassigned(checked: boolean) {
    if (checked) {
      setSelectedToAssign(unassignedStructures.map((s) => s.id));
    } else {
      setSelectedToAssign([]);
    }
  }

  // Handle select all for assigned
  function handleSelectAllAssigned(checked: boolean) {
    if (checked) {
      setSelectedToRemove(assignedStructures.map((s) => s.id));
    } else {
      setSelectedToRemove([]);
    }
  }

  // Handle individual selection for unassigned
  function handleToggleUnassigned(structureId: string) {
    setSelectedToAssign((prev) =>
      prev.includes(structureId)
        ? prev.filter((id) => id !== structureId)
        : [...prev, structureId]
    );
  }

  // Handle individual selection for assigned
  function handleToggleAssigned(structureId: string) {
    setSelectedToRemove((prev) =>
      prev.includes(structureId)
        ? prev.filter((id) => id !== structureId)
        : [...prev, structureId]
    );
  }

  // Handle bulk assign
  async function handleBulkAssign() {
    if (selectedToAssign.length === 0) {
      toast.error("Please select at least one fee structure to assign");
      return;
    }

    setLoading(true);
    try {
      const result = await bulkAssignFeeStructuresToClass(
        selectedClass,
        selectedToAssign,
        selectedAcademicYear
      );

      if (result.success && result.data) {
        setOperationResult({
          type: "assign",
          ...result.data,
        });
        toast.success(
          `Successfully assigned ${result.data.successfulAssignments} fee structure(s)`
        );
        // Reload data
        await loadFeeStructures();
        if (onComplete) onComplete();
      } else {
        toast.error(result.error || "Failed to assign fee structures");
      }
    } catch (error) {
      console.error("Error assigning fee structures:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Handle bulk remove
  async function handleBulkRemove() {
    if (selectedToRemove.length === 0) {
      toast.error("Please select at least one fee structure to remove");
      return;
    }

    setLoading(true);
    try {
      const result = await bulkRemoveFeeStructuresFromClass(
        selectedClass,
        selectedToRemove
      );

      if (result.success && result.data) {
        setOperationResult({
          type: "remove",
          ...result.data,
        });
        toast.success(
          `Successfully removed ${result.data.successfulRemovals} fee structure(s)`
        );
        // Reload data
        await loadFeeStructures();
        if (onComplete) onComplete();
      } else {
        toast.error(result.error || "Failed to remove fee structures");
      }
    } catch (error) {
      console.error("Error removing fee structures:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  // Calculate total amount for selected structures
  function calculateTotalAmount(structures: any[]) {
    return structures.reduce((sum, structure) => {
      const structureTotal = structure.items?.reduce(
        (itemSum: number, item: any) => itemSum + item.amount,
        0
      ) || 0;
      return sum + structureTotal;
    }, 0);
  }

  const selectedClassObject = classes.find((c) => c.id === selectedClass);

  return (
    <div className="space-y-6">
      {/* Selection Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Bulk Class Assignment</CardTitle>
          <CardDescription>
            Assign multiple fee structures to a class at once or remove existing assignments
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Academic Year</label>
              <Select
                value={selectedAcademicYear}
                onValueChange={(value) => {
                  setSelectedAcademicYear(value);
                  setSelectedClass("");
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select academic year" />
                </SelectTrigger>
                <SelectContent>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Class</label>
              <Select
                value={selectedClass}
                onValueChange={setSelectedClass}
                disabled={!selectedAcademicYear}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {filteredClasses.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!selectedAcademicYear && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertTitle>Get Started</AlertTitle>
              <AlertDescription>
                Select an academic year and class to view available fee structures
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* Operation Result */}
      {operationResult && (
        <Alert
          variant={operationResult.conflicts > 0 ? "default" : "default"}
          className="border-green-200 bg-green-50"
        >
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertTitle className="text-green-900">Operation Complete</AlertTitle>
          <AlertDescription className="text-green-800">
            {operationResult.type === "assign" ? (
              <>
                <p>
                  Successfully assigned {operationResult.successfulAssignments} out of{" "}
                  {operationResult.totalRequested} fee structure(s).
                </p>
                {operationResult.conflicts > 0 && (
                  <p className="mt-1 text-amber-700">
                    {operationResult.conflicts} structure(s) were already assigned and skipped.
                  </p>
                )}
              </>
            ) : (
              <p>
                Successfully removed {operationResult.successfulRemovals} out of{" "}
                {operationResult.totalRequested} fee structure(s).
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Loading State */}
      {loading && selectedClass && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}

      {/* Fee Structures Lists */}
      {!loading && selectedClass && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Unassigned Structures */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Available Fee Structures</CardTitle>
                  <CardDescription>
                    {unassignedStructures.length} structure(s) available to assign
                  </CardDescription>
                </div>
                {unassignedStructures.length > 0 && (
                  <Checkbox
                    checked={
                      selectedToAssign.length === unassignedStructures.length &&
                      unassignedStructures.length > 0
                    }
                    onCheckedChange={handleSelectAllUnassigned}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {unassignedStructures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No available fee structures to assign</p>
                  <p className="text-sm mt-1">
                    All active fee structures for this academic year are already assigned
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {unassignedStructures.map((structure) => (
                    <div
                      key={structure.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedToAssign.includes(structure.id)}
                        onCheckedChange={() => handleToggleUnassigned(structure.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{structure.name}</p>
                        {structure.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {structure.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {structure.items?.length || 0} items
                          </Badge>
                          <span className="text-xs font-semibold text-primary">
                            ₹
                            {structure.items
                              ?.reduce((sum: number, item: any) => sum + item.amount, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedToAssign.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selected:</span>
                    <span className="font-medium">{selectedToAssign.length} structure(s)</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Amount:</span>
                    <span className="font-semibold text-primary">
                      ₹
                      {calculateTotalAmount(
                        unassignedStructures.filter((s) => selectedToAssign.includes(s.id))
                      ).toLocaleString()}
                    </span>
                  </div>
                  <Button
                    onClick={handleBulkAssign}
                    disabled={loading}
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Assigning...
                      </>
                    ) : (
                      <>
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Assign to {selectedClassObject?.name}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Assigned Structures */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    Assigned to {selectedClassObject?.name}
                  </CardTitle>
                  <CardDescription>
                    {assignedStructures.length} structure(s) currently assigned
                  </CardDescription>
                </div>
                {assignedStructures.length > 0 && (
                  <Checkbox
                    checked={
                      selectedToRemove.length === assignedStructures.length &&
                      assignedStructures.length > 0
                    }
                    onCheckedChange={handleSelectAllAssigned}
                  />
                )}
              </div>
            </CardHeader>
            <CardContent>
              {assignedStructures.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <p>No fee structures assigned yet</p>
                  <p className="text-sm mt-1">
                    Assign fee structures from the available list
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {assignedStructures.map((structure) => (
                    <div
                      key={structure.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <Checkbox
                        checked={selectedToRemove.includes(structure.id)}
                        onCheckedChange={() => handleToggleAssigned(structure.id)}
                        className="mt-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{structure.name}</p>
                        {structure.description && (
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {structure.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="secondary" className="text-xs">
                            {structure.items?.length || 0} items
                          </Badge>
                          <span className="text-xs font-semibold text-primary">
                            ₹
                            {structure.items
                              ?.reduce((sum: number, item: any) => sum + item.amount, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedToRemove.length > 0 && (
                <div className="mt-4 pt-4 border-t space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Selected:</span>
                    <span className="font-medium">{selectedToRemove.length} structure(s)</span>
                  </div>
                  <Button
                    onClick={handleBulkRemove}
                    disabled={loading}
                    variant="destructive"
                    className="w-full"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Removing...
                      </>
                    ) : (
                      <>
                        Remove from {selectedClassObject?.name}
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
