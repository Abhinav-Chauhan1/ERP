"use client";


import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateMeritList, getMeritListConfigs } from "@/lib/actions/meritListActions";
import { getAvailableClasses } from "@/lib/actions/admissionActions";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";

export default function GenerateMeritListPage() {
  const router = useRouter();
  const [classes, setClasses] = useState<any[]>([]);
  const [configs, setConfigs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedClassId, setAppliedClassId] = useState("");
  const [configId, setConfigId] = useState("");

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

  // Load configs when class is selected
  useEffect(() => {
    async function loadConfigs() {
      if (!appliedClassId) {
        setConfigs([]);
        setConfigId("");
        return;
      }

      try {
        const configsData = await getMeritListConfigs(appliedClassId);
        setConfigs(configsData);
      } catch (error) {
        console.error("Error loading configs:", error);
      }
    }
    loadConfigs();
  }, [appliedClassId]);

  const selectedConfig = configs.find((c) => c.id === configId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    try {
      const result = await generateMeritList({
        configId,
        appliedClassId,
      });

      if (result.success && result.data) {
        router.push(`/admin/admissions/merit-lists/${result.data.id}`);
      } else {
        alert(result.error || "Failed to generate merit list");
      }
    } catch (error) {
      console.error("Error generating merit list:", error);
      alert("Failed to generate merit list");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <Link href="/admin/admissions/merit-lists">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        <h1 className="text-3xl font-bold">Generate Merit List</h1>
      </div>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle>Merit List Generation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="class">Select Class</Label>
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

            {appliedClassId && (
              <div className="space-y-2">
                <Label htmlFor="config">Select Configuration</Label>
                <Select value={configId} onValueChange={setConfigId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select configuration" />
                  </SelectTrigger>
                  <SelectContent>
                    {configs.length === 0 ? (
                      <div className="p-4 text-sm text-muted-foreground text-center">
                        No configurations found for this class.
                        <br />
                        <Link
                          href="/admin/admissions/merit-lists/configs/new"
                          className="text-primary underline"
                        >
                          Create one first
                        </Link>
                      </div>
                    ) : (
                      configs.map((config) => (
                        <SelectItem key={config.id} value={config.id}>
                          {config.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            )}

            {selectedConfig && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="font-medium">Configuration Details</div>
                <div className="space-y-2">
                  <div className="text-sm">
                    <span className="text-muted-foreground">Name:</span>{" "}
                    {selectedConfig.name}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Class:</span>{" "}
                    {selectedConfig.appliedClass.name}
                  </div>
                  <div className="text-sm">
                    <span className="text-muted-foreground">Criteria:</span>
                  </div>
                  <div className="space-y-1 ml-4">
                    {(selectedConfig.criteria as any[]).map((criterion, index) => (
                      <div key={index} className="text-sm flex items-center gap-2">
                        <Badge variant="outline">
                          {criterion.field === "submittedAt"
                            ? "Submission Date"
                            : "Date of Birth"}
                        </Badge>
                        <span className="text-muted-foreground">
                          Weight: {criterion.weight}%
                        </span>
                        <span className="text-muted-foreground">
                          ({criterion.order === "asc" ? "Lower = Better" : "Higher = Better"})
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col-reverse sm:flex-row gap-4">
              <Link href="/admin/admissions/merit-lists" className="w-full sm:w-auto">
                <Button type="button" variant="outline" disabled={loading} className="w-full sm:w-auto">
                  Cancel
                </Button>
              </Link>
              <Button type="submit" disabled={loading || !configId} className="w-full sm:w-auto">
                {loading ? "Generating..." : "Generate Merit List"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

