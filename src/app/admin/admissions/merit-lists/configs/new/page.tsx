"use client";


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createMeritListConfig } from "@/lib/actions/meritListActions";
import { getAvailableClasses } from "@/lib/actions/admissionActions";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function NewMeritListConfigPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [appliedClassId, setAppliedClassId] = useState("");
  const [criteria, setCriteria] = useState<Array<{ field: string; weight: number; order: string }>>([
    { field: "submittedAt", weight: 100, order: "asc" },
  ]);

  // Load classes on mount
  useEffect(() => {
    async function loadClasses() {
      try {
        const classesData = await getAvailableClasses();
        setClasses(classesData);
      } catch (error) {
        console.error("Error loading classes:", error);
      }
    }
    loadClasses();
  }, []);

  const addCriterion = () => {
    setCriteria([...criteria, { field: "submittedAt", weight: 0, order: "asc" }]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (index: number, field: string, value: any) => {
    const updated = [...criteria];
    updated[index] = { ...updated[index], [field]: value };
    setCriteria(updated);
  };

  const totalWeight = criteria.reduce((sum, c) => sum + Number(c.weight), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (Math.abs(totalWeight - 100) > 0.01) {
      alert(`Total weight must equal 100%. Current total: ${totalWeight}%`);
      return;
    }

    setLoading(true);
    try {
      const result = await createMeritListConfig({
        name,
        appliedClassId,
        criteria: criteria.map((c) => ({
          field: c.field as "submittedAt" | "dateOfBirth" | "previousSchool",
          weight: Number(c.weight),
          order: c.order as "asc" | "desc",
        })),
      });

      if (result.success) {
        router.push("/admin/admissions/merit-lists/configs");
      } else {
        alert(result.error || "Failed to create configuration");
      }
    } catch (error) {
      console.error("Error creating config:", error);
      alert("Failed to create configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/admin/admissions/merit-lists/configs">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">New Merit List Configuration</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Configuration Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name">Configuration Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Grade 1 Merit List 2024"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="class">Applied Class</Label>
              <Select value={appliedClassId} onValueChange={setAppliedClassId} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => (
                    <SelectItem key={cls.id} value={cls.id}>
                      {cls.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Ranking Criteria</Label>
                <Button type="button" variant="outline" size="sm" onClick={addCriterion}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Criterion
                </Button>
              </div>

              <div className="space-y-4">
                {criteria.map((criterion, index) => (
                  <div key={index} className="flex gap-4 items-end p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Label>Field</Label>
                      <Select
                        value={criterion.field}
                        onValueChange={(value) => updateCriterion(index, "field", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="submittedAt">Submission Date</SelectItem>
                          <SelectItem value="dateOfBirth">Date of Birth</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="w-32 space-y-2">
                      <Label>Weight (%)</Label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        value={criterion.weight}
                        onChange={(e) => updateCriterion(index, "weight", e.target.value)}
                        required
                      />
                    </div>

                    <div className="w-32 space-y-2">
                      <Label>Order</Label>
                      <Select
                        value={criterion.order}
                        onValueChange={(value) => updateCriterion(index, "order", value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="asc">Lower = Better</SelectItem>
                          <SelectItem value="desc">Higher = Better</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {criteria.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeCriterion(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <span className="font-medium">Total Weight:</span>
                <span
                  className={`font-bold ${Math.abs(totalWeight - 100) < 0.01
                      ? "text-green-600"
                      : "text-destructive"
                    }`}
                >
                  {totalWeight}%
                </span>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-4">
              <Link href="/admin/admissions/merit-lists/configs" className="w-full sm:w-auto">
                <Button type="button" variant="outline" disabled={loading} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || Math.abs(totalWeight - 100) > 0.01} className="w-full sm:w-auto">
                {loading ? "Creating..." : "Create Configuration"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

