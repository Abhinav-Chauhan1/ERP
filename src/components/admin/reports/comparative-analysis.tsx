"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { generateYearOverYearComparison, generateTermOverTermComparison, getAvailableAcademicYears, getAvailableTerms, ComparativeAnalysisConfig, ComparisonResult } from "@/lib/actions/reportBuilderActions";
import { SimpleLineChart, MultiBarChart } from "@/components/ui/charts";
import toast from "react-hot-toast";

export function ComparativeAnalysis() {
  const [comparisonType, setComparisonType] = useState<"year-over-year" | "term-over-term">("year-over-year");
  const [dataSource, setDataSource] = useState("attendance");
  const [metric, setMetric] = useState("attendance");
  const [aggregation, setAggregation] = useState<"sum" | "average" | "count">("average");
  const [currentPeriodId, setCurrentPeriodId] = useState("");
  const [previousPeriodId, setPreviousPeriodId] = useState("");
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => { loadAcademicYears(); }, []);
  useEffect(() => { if (comparisonType === "term-over-term") loadTerms(); }, [comparisonType]);

  const loadAcademicYears = async () => {
    const response = await getAvailableAcademicYears();
    if (response.success && response.data) {
      setAcademicYears(response.data);
      const current = response.data.find((y: any) => y.isCurrent);
      if (current) setCurrentPeriodId(current.id);
    }
  };

  const loadTerms = async () => {
    const response = await getAvailableTerms();
    if (response.success && response.data) setTerms(response.data);
  };

  const handleGenerate = async () => {
    if (!currentPeriodId) { toast.error("Please select a current period"); return; }
    setLoading(true); setResult(null);
    try {
      const config: ComparativeAnalysisConfig = { comparisonType, dataSource, metric, aggregation, currentPeriodId, previousPeriodId: previousPeriodId || undefined };
      const response = comparisonType === "year-over-year" ? await generateYearOverYearComparison(config) : await generateTermOverTermComparison(config);
      if (response.success && response.data) { setResult(response.data); toast.success("Comparison generated successfully"); }
      else { toast.error(response.error || "Failed to generate comparison"); }
    } catch (error) { console.error("Error generating comparison:", error); toast.error("An error occurred while generating comparison"); }
    finally { setLoading(false); }
  };

  const getTrendIcon = (trend: "up" | "down" | "stable") => {
    switch (trend) { case "up": return <TrendingUp className="h-5 w-5 text-green-600" />; case "down": return <TrendingDown className="h-5 w-5 text-red-600" />; case "stable": return <Minus className="h-5 w-5 text-gray-600" />; }
  };

  const getTrendColor = (trend: "up" | "down" | "stable") => {
    switch (trend) { case "up": return "text-green-600"; case "down": return "text-red-600"; case "stable": return "text-gray-600"; }
  };

  const periods = comparisonType === "year-over-year" ? academicYears : terms;

  return (
    <div className="space-y-6">
      <Card><CardHeader><CardTitle>Comparative Analysis</CardTitle><CardDescription>Compare performance metrics across different time periods</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Comparison Type</Label><Select value={comparisonType} onValueChange={(v: any) => setComparisonType(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="year-over-year">Year-over-Year</SelectItem><SelectItem value="term-over-term">Term-over-Term</SelectItem></SelectContent></Select></div>
            <div className="space-y-2"><Label>Data Source</Label><Select value={dataSource} onValueChange={setDataSource}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="attendance">Attendance</SelectItem><SelectItem value="fees">Fee Payments</SelectItem><SelectItem value="exams">Exam Results</SelectItem><SelectItem value="students">Student Enrollment</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Metric</Label><Select value={metric} onValueChange={setMetric}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{dataSource === "attendance" && <SelectItem value="attendance">Attendance Rate</SelectItem>}{dataSource === "fees" && <><SelectItem value="amount">Payment Amount</SelectItem><SelectItem value="count">Payment Count</SelectItem></>}{dataSource === "exams" && <><SelectItem value="marks">Marks</SelectItem><SelectItem value="percentage">Percentage</SelectItem></>}{dataSource === "students" && <SelectItem value="count">Enrollment Count</SelectItem>}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Aggregation</Label><Select value={aggregation} onValueChange={(v: any) => setAggregation(v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="average">Average</SelectItem><SelectItem value="sum">Sum</SelectItem><SelectItem value="count">Count</SelectItem></SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Current Period</Label><Select value={currentPeriodId} onValueChange={setCurrentPeriodId}><SelectTrigger><SelectValue placeholder="Select current period" /></SelectTrigger><SelectContent>{periods.map((p) => (<SelectItem key={p.id} value={p.id}>{comparisonType === "year-over-year" ? p.name : `${p.name} (${p.academicYear.name})`}</SelectItem>))}</SelectContent></Select></div>
            <div className="space-y-2"><Label>Previous Period (Optional)</Label><Select value={previousPeriodId} onValueChange={setPreviousPeriodId}><SelectTrigger><SelectValue placeholder="Auto-detect" /></SelectTrigger><SelectContent><SelectItem value="auto">Auto-detect</SelectItem>{periods.map((p) => (<SelectItem key={p.id} value={p.id}>{comparisonType === "year-over-year" ? p.name : `${p.name} (${p.academicYear.name})`}</SelectItem>))}</SelectContent></Select></div>
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full">{loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Generating...</> : "Generate Comparison"}</Button>
        </CardContent>
      </Card>
      {result && (<>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card><CardHeader className="pb-2"><CardDescription>Current Period</CardDescription><CardTitle className="text-2xl">{result.currentPeriod.name}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{result.currentPeriod.value.toFixed(2)}</div><p className="text-sm text-gray-500 mt-1">{result.currentPeriod.data.length} records</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Previous Period</CardDescription><CardTitle className="text-2xl">{result.previousPeriod.name}</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{result.previousPeriod.value.toFixed(2)}</div><p className="text-sm text-gray-500 mt-1">{result.previousPeriod.data.length} records</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Change</CardDescription><div className="flex items-center gap-2">{getTrendIcon(result.change.trend)}<CardTitle className={`text-2xl ${getTrendColor(result.change.trend)}`}>{result.change.percentage > 0 ? "+" : ""}{result.change.percentage.toFixed(1)}%</CardTitle></div></CardHeader><CardContent><div className={`text-2xl font-bold ${getTrendColor(result.change.trend)}`}>{result.change.absolute > 0 ? "+" : ""}{result.change.absolute.toFixed(2)}</div><p className="text-sm text-gray-500 mt-1">Absolute change</p></CardContent></Card>
        </div>
        <Card><CardHeader><CardTitle>Trend Comparison</CardTitle><CardDescription>Monthly comparison between {result.currentPeriod.name} and {result.previousPeriod.name}</CardDescription></CardHeader><CardContent><SimpleLineChart data={result.chartData} lines={[{ dataKey: "current", stroke: "#3b82f6", name: result.currentPeriod.name }, { dataKey: "previous", stroke: "#94a3b8", strokeDasharray: "5 5", name: result.previousPeriod.name }]} xAxisKey="period" height={400} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Side-by-Side Comparison</CardTitle><CardDescription>Direct comparison of values across periods</CardDescription></CardHeader><CardContent><MultiBarChart data={result.chartData} bars={[{ dataKey: "current", fill: "#3b82f6", name: result.currentPeriod.name }, { dataKey: "previous", fill: "#94a3b8", name: result.previousPeriod.name }]} xAxisKey="period" height={400} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Detailed Comparison</CardTitle><CardDescription>Month-by-month breakdown</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b"><th className="text-left p-2">Period</th><th className="text-right p-2">{result.currentPeriod.name}</th><th className="text-right p-2">{result.previousPeriod.name}</th><th className="text-right p-2">Difference</th><th className="text-right p-2">% Change</th></tr></thead><tbody>{result.chartData.map((row, i) => { const diff = row.current - row.previous; const pct = row.previous !== 0 ? ((diff / row.previous) * 100).toFixed(1) : "N/A"; return (<tr key={i} className="border-b hover:bg-gray-50"><td className="p-2">{row.period}</td><td className="text-right p-2">{row.current.toFixed(2)}</td><td className="text-right p-2">{row.previous.toFixed(2)}</td><td className={`text-right p-2 ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}`}>{diff > 0 ? '+' : ''}{diff.toFixed(2)}</td><td className={`text-right p-2 ${diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : ''}`}>{pct !== "N/A" && diff > 0 ? '+' : ''}{pct}{pct !== "N/A" && '%'}</td></tr>); })}</tbody></table></div></CardContent></Card>
      </>)}
    </div>
  );
}
