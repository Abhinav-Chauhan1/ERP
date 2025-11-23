"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getMeritListById } from "@/lib/actions/meritListActions";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { useParams } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function MeritListDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [meritList, setMeritList] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const data = await getMeritListById(id);
        setMeritList(data);
      } catch (error) {
        console.error("Error fetching merit list:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [id]);

  const handleExport = () => {
    if (!meritList) return;

    // Create CSV content
    const headers = ["Rank", "Application Number", "Student Name", "Parent Name", "Parent Email", "Parent Phone", "Submitted Date", "Score", "Status"];
    const rows = meritList.entries.map((entry: any) => [
      entry.rank,
      entry.application.applicationNumber,
      entry.application.studentName,
      entry.application.parentName,
      entry.application.parentEmail,
      entry.application.parentPhone,
      format(new Date(entry.application.submittedAt), "yyyy-MM-dd"),
      entry.score.toFixed(2),
      entry.application.status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `merit-list-${meritList.appliedClass.name}-${format(new Date(meritList.generatedAt), "yyyy-MM-dd")}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-[300px]" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-[200px]" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!meritList) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/admissions/merit-lists">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">Merit List Not Found</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/admissions/merit-lists">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">{meritList.config.name}</h1>
            <p className="text-muted-foreground">
              {meritList.appliedClass.name} • Generated on{" "}
              {format(new Date(meritList.generatedAt), "PPP 'at' p")}
            </p>
          </div>
        </div>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export to CSV
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Applications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{meritList.totalApplications}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-medium">{meritList.config.name}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Criteria Count
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(meritList.config.criteria as any[]).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ranking Criteria</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {(meritList.config.criteria as any[]).map((criterion, index) => (
              <div key={index} className="flex items-center gap-4 p-3 border rounded-lg">
                <Badge variant="outline">
                  {criterion.field === "submittedAt" ? "Submission Date" : "Date of Birth"}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  Weight: {criterion.weight}%
                </span>
                <span className="text-sm text-muted-foreground">
                  ({criterion.order === "asc" ? "Lower = Better" : "Higher = Better"})
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Merit List Rankings</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80px]">Rank</TableHead>
                <TableHead>Application #</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Parent Name</TableHead>
                <TableHead>Parent Contact</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {meritList.entries.map((entry: any) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-bold">#{entry.rank}</TableCell>
                  <TableCell>
                    <Link
                      href={`/admin/admissions/${entry.application.id}`}
                      className="text-primary hover:underline"
                    >
                      {entry.application.applicationNumber}
                    </Link>
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.application.studentName}
                  </TableCell>
                  <TableCell>{entry.application.parentName}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>{entry.application.parentEmail}</div>
                      <div className="text-muted-foreground">
                        {entry.application.parentPhone}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(entry.application.submittedAt), "PPP")}
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {entry.score.toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        entry.application.status === "ACCEPTED"
                          ? "default"
                          : "outline"
                      }
                    >
                      {entry.application.status.replace("_", " ")}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
