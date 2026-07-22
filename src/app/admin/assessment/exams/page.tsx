"use client";


import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import {
  ArrowLeft, ArrowRight, Edit, Trash2, PlusCircle, Plus,
  Search, Calendar, Clock, BookOpen,
  MoreVertical, Download, Printer, FileText,
  CheckCircle2, School, Loader2, AlertCircle, Sparkles,
  Settings2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExamsTable } from "@/components/admin/exams-table";
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
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";

// Import schema validation and server actions
import { examSchema, ExamFormValues } from "@/lib/schemaValidation/examsSchemaValidation";
import {
  getUpcomingExams,
  getPastExams,
  getExamsPageData,
  createExam,
  updateExam,
  deleteExam,
  getExamStatistics,
  autoGenerateCBSEExams,
  getClassesMissingSubjects,
} from "@/lib/actions/examsActions";
import type { AutoGenerateExamsInput } from "@/lib/constants/cbse-exam-schedules";
import {
  CBSE_PRIMARY_SCHEDULE,
  CBSE_SECONDARY_SCHEDULE,
  CBSE_SENIOR_SCHEDULE,
} from "@/lib/constants/cbse-exam-schedules";
import { ExamTypesPanel } from "@/components/admin/assessment/exam-types-panel";
import { AssessmentRulesPanel } from "@/components/admin/assessment/assessment-rules-panel";
import { applyPTPatternForCurrentSchool } from "@/lib/actions/ptPatternActions";
import type { PTGroupDefinition } from "@/lib/actions/ptPatternActions";

export default function ExamsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [examTypeFilter, setExamTypeFilter] = useState("all");

  const [examDialogOpen, setExamDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [selectedExamForDelete, setSelectedExamForDelete] = useState<{
    id: string;
    title: string;
    resultsCount: number;
  } | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [viewTab, setViewTab] = useState<string>("upcoming");

  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [upcomingExams, setUpcomingExams] = useState<any[]>([]);
  const [pastExams, setPastExams] = useState<any[]>([]);
  const [examTypes, setExamTypes] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [allTerms, setAllTerms] = useState<any[]>([]);
  const [statistics, setStatistics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const initialLoadStarted = useRef(false);

  // Auto-generate CBSE exams (3-step wizard) state
  //   Step 1: Schedule scope (level, terms, classes, shared marks, pattern name)
  //   Step 2: PT pattern per term
  //   Step 3: Review + Apply
  const [autoGenOpen, setAutoGenOpen] = useState(false);
  const [autoGenLoading, setAutoGenLoading] = useState(false);
  const [autoGenStep, setAutoGenStep] = useState<1 | 2 | 3>(1);

  // Step 1 — Schedule
  const [autoGenLevel, setAutoGenLevel] = useState<"CBSE_PRIMARY" | "CBSE_SECONDARY" | "CBSE_SENIOR">("CBSE_PRIMARY");
  const [autoGenTermIds, setAutoGenTermIds] = useState<string[]>([]);
  const [autoGenClassIds, setAutoGenClassIds] = useState<string[]>([]);

  // Shared across all terms in a year
  const [perMarks, setPerMarks] = useState<number>(10);
  const [passingMarks, setPassingMarks] = useState<number>(3.3);
  const [patternName, setPatternName] = useState<string>("Standard PT Pattern");

  // Optional per-component (MA/Portfolio/Half Yearly/Annual) marks overrides
  const [showComponentOverrides, setShowComponentOverrides] = useState(false);
  const [componentOverrides, setComponentOverrides] = useState<
    Record<string, { totalMarks: number; passingMarks: number; durationMinutes: number }>
  >({});

  // Classes selected in Step 1 with zero subjects mapped — surfaced as a warning in Step 3
  const [classesMissingSubjects, setClassesMissingSubjects] = useState<{ id: string; name: string }[]>([]);
  const [checkingClassSubjects, setCheckingClassSubjects] = useState(false);

  // Step 2 — Per-term PT pattern
  interface TermPatternState {
    termId: string;
    ptCount: 1 | 2 | 3 | 4;
    aggregation: "SUM" | "AVERAGE" | "BEST_OF" | "USE_LAST" | "CUSTOM_GROUPS";
    bestOfCount: number;
    groups: PTGroupDefinition[];
  }
  const [termPatterns, setTermPatterns] = useState<TermPatternState[]>([]);

  const sortedSelectedTerms = useMemo(() => {
    const map = new Map(allTerms.map((t: any) => [t.id, t]));
    return autoGenTermIds
      .map((id) => map.get(id))
      .filter((t): t is any => Boolean(t))
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
  }, [autoGenTermIds, allTerms]);

  // Non-PT schedule components (MA/Portfolio/Half Yearly/Annual) available for the current
  // CBSE level — PT is excluded since its marks are already configurable via perMarks/passingMarks.
  // Half Yearly is shown as the representative row; the server remaps it to Annual for Term 2.
  const componentOverrideEntries = useMemo(() => {
    const schedule =
      autoGenLevel === "CBSE_SENIOR"
        ? CBSE_SENIOR_SCHEDULE
        : autoGenLevel === "CBSE_SECONDARY"
        ? CBSE_SECONDARY_SCHEDULE
        : CBSE_PRIMARY_SCHEDULE;
    return schedule.filter((s) => s.cbseComponent !== "PT");
  }, [autoGenLevel]);

  // Fetch classes with zero subjects mapped once the admin reaches the review step
  useEffect(() => {
    if (autoGenStep !== 3) return;
    setCheckingClassSubjects(true);
    getClassesMissingSubjects(autoGenClassIds)
      .then((res) => setClassesMissingSubjects(res.success ? res.data ?? [] : []))
      .finally(() => setCheckingClassSubjects(false));
  }, [autoGenStep, autoGenClassIds]);

  // Keep termPatterns aligned with autoGenTermIds (preserve user edits, drop removed terms)
  useEffect(() => {
    setTermPatterns((prev) => {
      const prevById = new Map(prev.map((p) => [p.termId, p]));
      return sortedSelectedTerms.map((term, idx) => {
        const existing = prevById.get(term.id);
        if (existing) return existing;
        return makeDefaultTermPattern(term.id, idx);
      });
    });
  }, [sortedSelectedTerms]);

  function startNumberFor(termId: string): number {
    let acc = 1;
    for (const tp of termPatterns) {
      if (tp.termId === termId) return acc;
      acc += tp.ptCount;
    }
    return acc;
  }

  function ptNumbersFor(termId: string): number[] {
    const start = startNumberFor(termId);
    const tp = termPatterns.find((p) => p.termId === termId);
    if (!tp) return [];
    return Array.from({ length: tp.ptCount }, (_, i) => start + i);
  }

  function patchTermPattern(termId: string, patch: Partial<TermPatternState>) {
    setTermPatterns((prev) =>
      prev.map((tp) => (tp.termId === termId ? { ...tp, ...patch } : tp)),
    );
  }

  function setPtCountFor(termId: string, n: 1 | 2 | 3 | 4) {
    const current = termPatterns.find((p) => p.termId === termId);
    patchTermPattern(termId, {
      ptCount: n,
      aggregation: n === 1 ? "SUM" : current?.aggregation ?? "BEST_OF",
      bestOfCount: Math.min(current?.bestOfCount ?? 1, Math.max(1, n - 1)),
    });
  }

  function toggleTerm(termId: string) {
    setAutoGenTermIds((prev) =>
      prev.includes(termId) ? prev.filter((id) => id !== termId) : [...prev, termId],
    );
  }

  function selectAllTermsInYear(yearName: string) {
    const ids = allTerms
      .filter((t: any) => t.academicYear?.name === yearName)
      .map((t: any) => t.id);
    const allSelected = ids.every((id: string) => autoGenTermIds.includes(id));
    if (allSelected) {
      setAutoGenTermIds((prev) => prev.filter((id) => !ids.includes(id)));
    } else {
      const merged = Array.from(new Set([...autoGenTermIds, ...ids]));
      setAutoGenTermIds(merged);
    }
  }

  function togglePTInGroup(termId: string, groupIdx: number, pt: number) {
    setTermPatterns((prev) =>
      prev.map((tp) => {
        if (tp.termId !== termId) return tp;
        return {
          ...tp,
          groups: tp.groups.map((g, i) => {
            if (i !== groupIdx) return g;
            const has = g.ptNumbers.includes(pt);
            return {
              ...g,
              ptNumbers: has
                ? g.ptNumbers.filter((n) => n !== pt)
                : [...g.ptNumbers, pt].sort((a, b) => a - b),
            };
          }),
        };
      }),
    );
  }
  function addGroupFor(termId: string) {
    setTermPatterns((prev) =>
      prev.map((tp) =>
        tp.termId !== termId || tp.groups.length >= 4
          ? tp
          : { ...tp, groups: [...tp.groups, { ptNumbers: [], op: "AVERAGE", weight: 0.25 }] },
      ),
    );
  }
  function removeGroupFor(termId: string, idx: number) {
    setTermPatterns((prev) =>
      prev.map((tp) =>
        tp.termId !== termId ? tp : { ...tp, groups: tp.groups.filter((_, i) => i !== idx) },
      ),
    );
  }
  function patchGroupFor(termId: string, groupIdx: number, patch: Partial<PTGroupDefinition>) {
    setTermPatterns((prev) =>
      prev.map((tp) =>
        tp.termId !== termId
          ? tp
          : { ...tp, groups: tp.groups.map((g, i) => (i === groupIdx ? { ...g, ...patch } : g)) },
      ),
    );
  }

  function makeDefaultTermPattern(termId: string, index: number): TermPatternState {
    // Common-defaults heuristic:
    //   first selected term  → ptCount=2, BEST_OF 1   (Half-Yearly: best of PT1+PT2)
    //   any subsequent term  → ptCount=1, SUM         (Annual: only PT3)
    if (index === 0) {
      return {
        termId,
        ptCount: 2,
        aggregation: "BEST_OF",
        bestOfCount: 1,
        groups: [
          { ptNumbers: [1, 2], op: "AVERAGE", weight: 0.5 },
          { ptNumbers: [3, 4], op: "AVERAGE", weight: 0.5 },
        ],
      };
    }
    return {
      termId,
      ptCount: 1,
      aggregation: "SUM",
      bestOfCount: 1,
      groups: [
        { ptNumbers: [1, 2], op: "AVERAGE", weight: 0.5 },
        { ptNumbers: [3, 4], op: "AVERAGE", weight: 0.5 },
      ],
    };
  }

  function availableAggregationsFor(ptCount: number): TermPatternState["aggregation"][] {
    if (ptCount === 1) return ["SUM"];
    return ["AVERAGE", "BEST_OF", "USE_LAST", "CUSTOM_GROUPS"];
  }

  function aggregationLabel(a: TermPatternState["aggregation"], ptCount: number, bestOfCount: number): string {
    switch (a) {
      case "SUM": return `Sum (PT1${ptCount > 1 ? `…PT${ptCount}` : ""})`;
      case "AVERAGE": return `Average of all ${ptCount} PTs`;
      case "BEST_OF": return `Best ${bestOfCount} of ${ptCount}`;
      case "USE_LAST": return `Only the last PT`;
      case "CUSTOM_GROUPS": return `Custom groups`;
    }
  }

  function groupsValidFor(g: PTGroupDefinition[], ptCount: number): boolean {
    const sum = g.reduce((s, x) => s + (Number.isFinite(x.weight) ? x.weight : 0), 0);
    if (Math.abs(sum - 1) >= 0.001) return false;
    if (g.length === 0) return false;
    const seen = new Set<number>();
    for (const grp of g) {
      if (grp.ptNumbers.length === 0) return false;
      if (grp.weight <= 0 || grp.weight > 1) return false;
      for (const n of grp.ptNumbers) {
        if (n < 1 || n > ptCount) return false;
        if (seen.has(n)) return false;
        seen.add(n);
      }
    }
    for (let n = 1; n <= ptCount; n++) if (!seen.has(n)) return false;
    return true;
  }

  function canProceedFromStep1() {
    return (
      autoGenTermIds.length > 0 &&
      autoGenClassIds.length > 0 &&
      perMarks > 0 &&
      passingMarks >= 0 &&
      passingMarks <= perMarks
    );
  }
  function canProceedFromStep2() {
    if (termPatterns.length === 0) return false;
    for (const tp of termPatterns) {
      if (tp.aggregation === "BEST_OF" && (tp.bestOfCount < 1 || tp.bestOfCount > tp.ptCount)) return false;
      if (tp.aggregation === "CUSTOM_GROUPS" && !groupsValidFor(tp.groups, tp.ptCount)) return false;
    }
    return patternName.trim().length > 0;
  }

  // Initialize exam form
  const form = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      title: "",
      totalMarks: 100,
      passingMarks: 40,
      instructions: "",
    },
  });

  useEffect(() => {
    if (initialLoadStarted.current) return;
    initialLoadStarted.current = true;
    loadAll();
  }, []);

  async function loadAll() {
    setLoading(true);
    setStatsLoading(true);
    setError(null);
    try {
      const result = await getExamsPageData();

      if (result.success) {
        setUpcomingExams(result.data.upcomingExams || []);
        setPastExams(result.data.pastExams || []);
        setExamTypes(result.data.examTypes || []);
        setSubjects(result.data.subjects || []);
        setClasses(result.data.classes || []);
        setTerms(result.data.terms || []);
        setAllTerms(result.data.allTerms || []);
        setStatistics(result.data.statistics);
      } else {
        setError(result.error || "Failed to load exams");
      }
    } catch (err) {
      setError("An unexpected error occurred");
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
      setStatsLoading(false);
    }
  }

  async function fetchExams() {
    setLoading(true);
    try {
      const [upcomingResult, pastResult] = await Promise.all([getUpcomingExams(), getPastExams()]);
      if (upcomingResult.success) setUpcomingExams(upcomingResult.data || []);
      if (pastResult.success) setPastExams(pastResult.data || []);
    } catch {
      toast.error("Failed to refresh exams");
    } finally {
      setLoading(false);
    }
  }

  async function fetchStatistics() {
    setStatsLoading(true);
    try {
      const result = await getExamStatistics();
      if (result.success) setStatistics(result.data);
    } catch {
      console.error("Error fetching statistics");
    } finally {
      setStatsLoading(false);
    }
  }

  function handleCreateExam() {
    form.reset({
      title: "",
      totalMarks: 100,
      passingMarks: 40,
      instructions: "",
      examDate: undefined,
      startTime: undefined,
      endTime: undefined,
      examTypeId: "",
      subjectId: "",
      classId: "",
      termId: "",
    });
    setSelectedExamId(null);
    setExamDialogOpen(true);
  }

  function handleEditExam(examId: string) {
    const examToEdit = upcomingExams.find(e => e.id === examId) || pastExams.find(e => e.id === examId);

    if (examToEdit) {
      form.reset({
        title: examToEdit.title,
        examTypeId: examToEdit.examTypeId,
        subjectId: examToEdit.subjectId,
        classId: examToEdit.classId,
        termId: examToEdit.termId,
        examDate: new Date(examToEdit.examDate),
        startTime: new Date(examToEdit.startTime),
        endTime: new Date(examToEdit.endTime),
        totalMarks: examToEdit.totalMarks,
        passingMarks: examToEdit.passingMarks,
        instructions: examToEdit.instructions || "",
      });

      setSelectedExamId(examId);
      setExamDialogOpen(true);
    }
  }

  function handleDeleteExam(examId: string) {
    const all = [...upcomingExams, ...pastExams];
    const exam = all.find((e) => e.id === examId);
    setSelectedExamForDelete({
      id: examId,
      title: exam?.title ?? "",
      resultsCount: exam?._count?.results ?? 0,
    });
    setDeleteConfirmText("");
    setDeleteDialogOpen(true);
  }

  async function onSubmit(values: ExamFormValues) {
    try {
      setLoading(true);

      if (selectedExamId) {
        // Update existing exam
        const result = await updateExam({ ...values, id: selectedExamId });

        if (result.success) {
          toast.success("Exam updated successfully");
          fetchExams();
          fetchStatistics();
          setExamDialogOpen(false);
        } else {
          toast.error(result.error || "Failed to update exam");
        }
      } else {
        // Create new exam - no teacherId needed for admin
        const result = await createExam(values);

        if (result.success) {
          toast.success("Exam created successfully");
          fetchExams();
          fetchStatistics();
          setExamDialogOpen(false);
        } else {
          toast.error(result.error || "Failed to create exam");
        }
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleAutoGenerateExams() {
    if (autoGenTermIds.length === 0) { toast.error("Select at least one term"); return; }
    if (autoGenClassIds.length === 0) { toast.error("Select at least one class"); return; }
    if (termPatterns.length !== autoGenTermIds.length) { toast.error("PT pattern not configured for all terms"); return; }
    setAutoGenLoading(true);
    try {
      // Derive termNumber from term name: Term 2 / Annual / Final -> 2, else 1.
      // "Half Yearly" is explicitly Term 1 despite containing "yearly".
      const getTermNumber = (termId: string): 1 | 2 => {
        const t = allTerms.find((x: any) => x.id === termId);
        if (!t) return 1;
        const n = (t.name || "").toLowerCase();
        if (n.includes("half yearly") || n.includes("half-yearly") || /\bterm\s*1\b/.test(n) || /\bt1\b/.test(n)) return 1;
        if (n.includes("annual") || n.includes("final") || /\byearly\b/.test(n) || /\bterm\s*2\b/.test(n) || /\bt2\b/.test(n)) return 2;
        return 1;
      };

      // Step 1: Save the PT pattern PER selected term.
      // Per-term ptStartNumber is computed from the running total of ptCounts in chronological order.
      const patternFailures: string[] = [];
      for (const tp of termPatterns) {
        const startNumber = startNumberFor(tp.termId);
        const patternRes = await applyPTPatternForCurrentSchool({
          name: patternName.trim() || "Standard PT Pattern",
          classId: null,
          termId: tp.termId,
          cbseLevel: autoGenLevel,
          config: {
            ptCount: tp.ptCount,
            ptStartNumber: startNumber,
            perMarks,
            passingMarks,
            aggregation: tp.aggregation,
            bestOfCount: tp.aggregation === "BEST_OF" ? tp.bestOfCount : undefined,
            groups: tp.aggregation === "CUSTOM_GROUPS" ? tp.groups : undefined,
          },
          scopeClassIds: autoGenClassIds,
        });
        if (!patternRes.success) {
          const t = allTerms.find((x: any) => x.id === tp.termId);
          patternFailures.push(`${t?.name ?? tp.termId}: ${patternRes.error || "failed"}`);
        }
      }

      if (patternFailures.length === termPatterns.length && patternFailures.length > 0) {
        // Every term failed — bail out before generating exams
        toast.error(`All PT patterns failed: ${patternFailures.join("; ")}`);
        setAutoGenLoading(false);
        return;
      }
      if (patternFailures.length > 0) {
        toast.error(`Some PT patterns failed: ${patternFailures.join("; ")}`);
      }

      // Step 2: Run auto-generate for EACH selected term sequentially
      const failures: string[] = [];
      let totalCreated = 0;
      for (const termId of autoGenTermIds) {
        const result = await autoGenerateCBSEExams({
          termId,
          classIds: autoGenClassIds,
          cbseLevel: autoGenLevel,
          termNumber: getTermNumber(termId),
          componentOverrides: Object.keys(componentOverrides).length > 0 ? componentOverrides : undefined,
        });
        if (!result.success) {
          const t = allTerms.find((x: any) => x.id === termId);
          failures.push(`${t?.name ?? termId}: ${result.error || "failed"}`);
        } else if (typeof result.created === "number") {
          totalCreated += result.created;
        }
      }

      if (failures.length === 0) {
        toast.success(
          autoGenTermIds.length === 1
            ? "Exams generated"
            : `Exams generated for ${autoGenTermIds.length} terms (${totalCreated} new)`,
        );
        setAutoGenOpen(false);
        setAutoGenStep(1);
        fetchExams();
        fetchStatistics();
      } else if (failures.length < autoGenTermIds.length) {
        toast.error(`Partial success. Failed: ${failures.join("; ")}`);
        fetchExams();
        fetchStatistics();
      } else {
        toast.error(`All terms failed: ${failures.join("; ")}`);
      }
    } catch {
      toast.error("An unexpected error occurred");
    } finally {
      setAutoGenLoading(false);
    }
  }

  function closeAutoGen() {
    setAutoGenOpen(false);
    setAutoGenStep(1);
    setShowComponentOverrides(false);
    setComponentOverrides({});
    setClassesMissingSubjects([]);
  }

  async function confirmDelete() {
    if (!selectedExamForDelete) return;
    const { id, resultsCount } = selectedExamForDelete;
    try {
      const result = await deleteExam(id, { force: resultsCount > 0 });

      if (result.success) {
        const deletedResults =
          "deletedResults" in result && typeof result.deletedResults === "number"
            ? result.deletedResults
            : 0;
        const msg =
          deletedResults > 0
            ? `Exam and ${deletedResults} result${deletedResults !== 1 ? "s" : ""} deleted`
            : "Exam deleted successfully";
        toast.success(msg);
        fetchExams();
        fetchStatistics();
        setDeleteDialogOpen(false);
        setSelectedExamForDelete(null);
        setDeleteConfirmText("");
      } else {
        toast.error(result.error || "Failed to delete exam");
      }
    } catch (err) {
      toast.error("An unexpected error occurred");
    }
  }

  function closeDeleteDialog(open: boolean) {
    setDeleteDialogOpen(open);
    if (!open) {
      setSelectedExamForDelete(null);
      setDeleteConfirmText("");
    }
  }

  // Filter exams based on search and filters
  function applyFilters(exam: any) {
    const matchesSearch =
      exam.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exam.subject.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSubject = subjectFilter === "all" || exam.subjectId === subjectFilter;
    const matchesTerm = termFilter === "all" || exam.termId === termFilter;
    const matchesClass = classFilter === "all" || exam.classId === classFilter;
    const matchesExamType = examTypeFilter === "all" || exam.examTypeId === examTypeFilter;
    const now = new Date();
    const examDate = new Date(exam.examDate);
    const oneDayInMs = 24 * 60 * 60 * 1000;
    const examStatus =
      examDate < now ? "completed" :
      examDate.getTime() - now.getTime() < oneDayInMs ? "today" : "upcoming";
    const matchesStatus = statusFilter === "all" || examStatus === statusFilter;
    return matchesSearch && matchesSubject && matchesTerm && matchesClass && matchesExamType && matchesStatus;
  }

  const filteredUpcomingExams = upcomingExams.filter(applyFilters);
  const filteredPastExams = pastExams.filter(applyFilters);
  const allFilteredExams = [...filteredUpcomingExams, ...filteredPastExams];

  const activeFilterCount = [subjectFilter, termFilter, classFilter, examTypeFilter, statusFilter]
    .filter(v => v !== "all").length;

  // Utility function to format date-time
  const formatDateTime = (date: string | Date) => {
    if (!date) return "";
    const parsedDate = typeof date === 'string' ? parseISO(date) : date;
    return format(parsedDate, "MMM d, yyyy h:mm a");
  };

  // Get status color for badges
  const getStatusColor = (examDate: string) => {
    const now = new Date();
    const date = new Date(examDate);
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (date < now) {
      return 'bg-green-100 text-green-800'; // Past
    } else if (date.getTime() - now.getTime() < oneDayInMs) {
      return 'bg-amber-100 text-amber-800'; // Today/tomorrow
    } else {
      return 'bg-primary/10 text-primary'; // Upcoming
    }
  };

  // Get status text
  const getStatusText = (examDate: string) => {
    const now = new Date();
    const date = new Date(examDate);
    const oneDayInMs = 24 * 60 * 60 * 1000;

    if (date < now) {
      return 'Completed';
    } else if (date.getTime() - now.getTime() < oneDayInMs) {
      return 'Today/Tomorrow';
    } else {
      return 'Upcoming';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Link href="/admin/assessment">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Exam Setup</h1>
        </div>
      </div>

      {/* Top-level tabs: Exams | Exam Types & Rules */}
      <Tabs defaultValue="exams" className="w-full">
        <TabsList className="mb-2">
          <TabsTrigger value="exams">Exams</TabsTrigger>
          <TabsTrigger value="types-rules">Exam Types &amp; Rules</TabsTrigger>
        </TabsList>

        {/* ── EXAM TYPES & RULES TAB ── */}
        <TabsContent value="types-rules" className="flex flex-col gap-8 mt-0">
          <ExamTypesPanel />
          <div className="border-t pt-6">
            <AssessmentRulesPanel />
          </div>
        </TabsContent>

        {/* ── EXAMS TAB ── */}
        <TabsContent value="exams" className="flex flex-col gap-4 mt-0">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div />
            <div className="flex gap-2 w-full sm:w-auto">
              <Button variant="outline" onClick={() => setAutoGenOpen(true)} className="w-full sm:w-auto">
                <Sparkles className="mr-2 h-4 w-4" /> Auto Generate CBSE
              </Button>
              <Dialog open={examDialogOpen} onOpenChange={setExamDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={handleCreateExam} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Create Exam
                  </Button>
                </DialogTrigger>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{selectedExamId ? "Edit Exam" : "Create New Exam"}</DialogTitle>
              <DialogDescription>
                {selectedExamId ? "Update the details of this exam" : "Set up a new exam for your students"}
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Exam Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g. Mid-Term Physics Exam" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="examTypeId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select exam type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {examTypes.map(type => (
                              <SelectItem key={type.id} value={type.id}>
                                {type.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="subjectId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Subject</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select subject" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {subjects.map(subject => (
                              <SelectItem key={subject.id} value={subject.id}>
                                {subject.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes.map(cls => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="termId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Term</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select term" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {terms.map(term => (
                              <SelectItem key={term.id} value={term.id}>
                                {term.name} ({term.academicYear.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="examDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Exam Date</FormLabel>
                        <FormControl>
                          <DatePicker
                            date={field.value}
                            onSelect={field.onChange}
                            placeholder="Select date"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="startTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <TimePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="endTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <TimePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="totalMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Marks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="passingMarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Passing Marks</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="instructions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Instructions (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Instructions for students taking the exam"
                          rows={4}
                          {...field}
                          value={field.value || ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setExamDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">
                    {selectedExamId ? "Save Changes" : "Create Exam"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Search and filters */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search exams by title or subject..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground self-center"
              onClick={() => {
                setSubjectFilter("all");
                setTermFilter("all");
                setClassFilter("all");
                setExamTypeFilter("all");
                setStatusFilter("all");
              }}
            >
              Clear filters ({activeFilterCount})
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={classFilter} onValueChange={setClassFilter}>
            <SelectTrigger className={`w-[140px] ${classFilter !== "all" ? "border-primary text-primary" : ""}`}>
              <SelectValue placeholder="Class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classes.map(cls => (
                <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={subjectFilter} onValueChange={setSubjectFilter}>
            <SelectTrigger className={`w-[150px] ${subjectFilter !== "all" ? "border-primary text-primary" : ""}`}>
              <SelectValue placeholder="Subject" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={examTypeFilter} onValueChange={setExamTypeFilter}>
            <SelectTrigger className={`w-[160px] ${examTypeFilter !== "all" ? "border-primary text-primary" : ""}`}>
              <SelectValue placeholder="Exam Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Exam Types</SelectItem>
              {examTypes.map(type => (
                <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={termFilter} onValueChange={setTermFilter}>
            <SelectTrigger className={`w-[180px] ${termFilter !== "all" ? "border-primary text-primary" : ""}`}>
              <SelectValue placeholder="Term" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Terms</SelectItem>
              {terms.map(term => (
                <SelectItem key={term.id} value={term.id}>
                  {term.name} ({term.academicYear.name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className={`w-[140px] ${statusFilter !== "all" ? "border-primary text-primary" : ""}`}>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="upcoming">Upcoming</SelectItem>
              <SelectItem value="today">Today / Tomorrow</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Exams List Card */}
      <Card>
        <CardHeader>
          <CardTitle>All Exams</CardTitle>
          <CardDescription>Manage all scheduled examinations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : allFilteredExams.length > 0 ? (
            <ExamsTable
              exams={allFilteredExams}
              onEdit={handleEditExam}
              onDelete={handleDeleteExam}
              emptyMessage="No exams found"
            />
          ) : (
            <div className="text-center py-10">
              <FileText className="h-10 w-10 text-gray-300 mx-auto mb-3" />
              <h3 className="text-lg font-medium mb-1">No exams found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                {searchTerm || subjectFilter !== "all" || termFilter !== "all"
                  ? "Try adjusting your filters or search terms"
                  : "No exams have been scheduled yet"}
              </p>
              <Button onClick={handleCreateExam}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Exam
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Render tab content based on view */}
      <Tabs defaultValue="upcoming" onValueChange={setViewTab}>
        {/* ...existing tabs code... */}
      </Tabs>

      <Card className="mt-2">
        <CardHeader>
          <CardTitle className="text-lg">Exam Statistics</CardTitle>
          <CardDescription>Overview of exam performance and trends</CardDescription>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="flex justify-center items-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-primary/10 rounded-md text-primary">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">Upcoming Exams</h3>
                </div>
                <p className="text-3xl font-bold ml-11">{statistics?.upcomingExamsCount || 0}</p>
                <p className="text-sm text-muted-foreground ml-11">
                  Next: {statistics?.nextExam || "None scheduled"}
                </p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-green-50 rounded-md text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">Completed Exams</h3>
                </div>
                <p className="text-3xl font-bold ml-11">{statistics?.completedExamsCount || 0}</p>
                <p className="text-sm text-muted-foreground ml-11">This term: {pastExams.length}</p>
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3 mb-1">
                  <div className="p-2 bg-teal-50 rounded-md text-teal-600">
                    <School className="h-5 w-5" />
                  </div>
                  <h3 className="font-medium">Highest Performers</h3>
                </div>
                <p className="text-3xl font-bold ml-11">{statistics?.highestPerformingClass || "N/A"}</p>
                <p className="text-sm text-muted-foreground ml-11">
                  Avg score: {statistics?.highestPerformingAverage ? `${statistics.highestPerformingAverage}%` : "N/A"}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Auto-Generate CBSE Exams Dialog (3-step unified wizard) */}
      <Dialog open={autoGenOpen} onOpenChange={(v) => (v ? setAutoGenOpen(true) : closeAutoGen())}>
        <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
          <div className="p-6 pb-3 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Auto-Generate CBSE Exams
              </DialogTitle>
              <DialogDescription>
                Configure your CBSE exam schedule and PT pattern per term. Step {autoGenStep} of 3.
              </DialogDescription>
            </DialogHeader>

            {/* Stepper indicator */}
            <div className="flex items-center gap-2 text-xs mt-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex-1 flex items-center gap-1">
                  <div
                    className={`h-6 w-6 rounded-full flex items-center justify-center font-medium ${
                      autoGenStep >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {autoGenStep > n ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                  </div>
                  {n < 3 && (
                    <div className={`flex-1 h-0.5 ${autoGenStep > n ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1 px-1">
              <span>Schedule</span>
              <span>PT Pattern</span>
              <span>Review</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4">
            {/* STEP 1 — Schedule (terms + classes + CBSE level + shared marks) */}
            {autoGenStep === 1 && (
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label>CBSE Level</Label>
                  <Select value={autoGenLevel} onValueChange={(v) => setAutoGenLevel(v as any)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CBSE_PRIMARY">Primary (Class 1–8)</SelectItem>
                      <SelectItem value="CBSE_SECONDARY">Secondary (Class 9–10)</SelectItem>
                      <SelectItem value="CBSE_SENIOR">Senior Secondary (Class 11–12)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label>Terms ({autoGenTermIds.length} selected)</Label>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Select all terms across the most recent academic year only
                          const years = Array.from(new Set(allTerms.map((t: any) => t.academicYear?.name).filter(Boolean)));
                          if (years.length === 0) return;
                          // pick the first year as "most recent" (same as dialog order)
                          selectAllTermsInYear(years[0] as string);
                        }}
                      >
                        Half + Annual
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => setAutoGenTermIds([])}>
                        Clear
                      </Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[140px] border rounded-md p-2">
                    <div className="space-y-1">
                      {allTerms.map((term: any) => (
                        <div
                          key={term.id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => toggleTerm(term.id)}
                        >
                          <Checkbox
                            checked={autoGenTermIds.includes(term.id)}
                            onCheckedChange={() => toggleTerm(term.id)}
                          />
                          <span className="text-sm">
                            {term.name}
                            <span className="text-xs text-muted-foreground ml-1">
                              ({term.academicYear?.name})
                            </span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <Label>Classes ({autoGenClassIds.length} selected)</Label>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setAutoGenClassIds(classes.map((c: any) => c.id))}>All</Button>
                      <Button variant="outline" size="sm" onClick={() => setAutoGenClassIds([])}>Clear</Button>
                    </div>
                  </div>
                  <ScrollArea className="h-[180px] border rounded-md p-2">
                    <div className="space-y-1">
                      {classes.map((cls: any) => (
                        <div
                          key={cls.id}
                          className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer"
                          onClick={() => setAutoGenClassIds((prev) =>
                            prev.includes(cls.id) ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                          )}
                        >
                          <Checkbox
                            checked={autoGenClassIds.includes(cls.id)}
                            onCheckedChange={() => setAutoGenClassIds((prev) =>
                              prev.includes(cls.id) ? prev.filter((id) => id !== cls.id) : [...prev, cls.id]
                            )}
                          />
                          <span className="text-sm">{cls.name}</span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label>Marks per PT (shared)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={perMarks}
                      onChange={(e) => setPerMarks(Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Passing marks (shared)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={perMarks}
                      step={0.1}
                      value={passingMarks}
                      onChange={(e) => setPassingMarks(Number(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label>Pattern name (for your reference)</Label>
                  <Input value={patternName} onChange={(e) => setPatternName(e.target.value)} />
                </div>

                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs"
                    onClick={() => setShowComponentOverrides((v) => !v)}
                  >
                    <Settings2 className="h-3.5 w-3.5 mr-1" />
                    {showComponentOverrides ? "Hide" : "Customize"} marks for MA / Portfolio / Half Yearly / Annual
                  </Button>

                  {showComponentOverrides && (
                    <div className="space-y-3 border rounded-md p-3">
                      <p className="text-xs text-muted-foreground">
                        Leave blank to use the default for each. Half Yearly's values also apply to Annual Exam
                        (used automatically for Term 2).
                      </p>
                      {componentOverrideEntries.map((entry) => {
                        const override = componentOverrides[entry.cbseComponent];
                        return (
                          <div key={entry.cbseComponent} className="grid grid-cols-4 gap-2 items-end">
                            <div className="col-span-1 text-xs font-medium">{entry.examTypeName}</div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Total marks</Label>
                              <Input
                                type="number"
                                min={1}
                                placeholder={String(entry.totalMarks)}
                                value={override?.totalMarks ?? ""}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  setComponentOverrides((prev) => ({
                                    ...prev,
                                    [entry.cbseComponent]: {
                                      totalMarks: e.target.value === "" ? entry.totalMarks : value,
                                      passingMarks: prev[entry.cbseComponent]?.passingMarks ?? entry.passingMarks,
                                      durationMinutes: prev[entry.cbseComponent]?.durationMinutes ?? entry.durationMinutes,
                                    },
                                  }));
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Passing marks</Label>
                              <Input
                                type="number"
                                min={0}
                                placeholder={String(entry.passingMarks)}
                                value={override?.passingMarks ?? ""}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  setComponentOverrides((prev) => ({
                                    ...prev,
                                    [entry.cbseComponent]: {
                                      totalMarks: prev[entry.cbseComponent]?.totalMarks ?? entry.totalMarks,
                                      passingMarks: e.target.value === "" ? entry.passingMarks : value,
                                      durationMinutes: prev[entry.cbseComponent]?.durationMinutes ?? entry.durationMinutes,
                                    },
                                  }));
                                }}
                              />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-[10px] text-muted-foreground">Duration (min)</Label>
                              <Input
                                type="number"
                                min={1}
                                placeholder={String(entry.durationMinutes)}
                                value={override?.durationMinutes ?? ""}
                                onChange={(e) => {
                                  const value = Number(e.target.value);
                                  setComponentOverrides((prev) => ({
                                    ...prev,
                                    [entry.cbseComponent]: {
                                      totalMarks: prev[entry.cbseComponent]?.totalMarks ?? entry.totalMarks,
                                      passingMarks: prev[entry.cbseComponent]?.passingMarks ?? entry.passingMarks,
                                      durationMinutes: e.target.value === "" ? entry.durationMinutes : value,
                                    },
                                  }));
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 — PT pattern per selected term */}
            {autoGenStep === 2 && (
              <div className="space-y-4">
                {sortedSelectedTerms.length === 0 ? (
                  <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>No terms selected</AlertTitle>
                    <AlertDescription>Go back and select at least one term.</AlertDescription>
                  </Alert>
                ) : (
                  sortedSelectedTerms.map((term, idx) => {
                    const tp = termPatterns.find((p) => p.termId === term.id);
                    if (!tp) return null;
                    const ptNumbers = ptNumbersFor(term.id);
                    const availAgg = availableAggregationsFor(tp.ptCount);
                    return (
                      <Card key={term.id} className="border-primary/30">
                        <CardHeader className="py-3 px-4">
                          <CardTitle className="text-sm flex items-center justify-between">
                            <span>
                              {idx === 0 ? "Term 1 — " : `Term ${idx + 1} — `}
                              {term.name}
                              <span className="text-xs text-muted-foreground ml-1">({term.academicYear?.name})</span>
                            </span>
                            <Badge variant="outline" className="font-mono text-xs">
                              {ptNumbers.map((n) => `PT${n}`).join(", ") || "—"}
                            </Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="py-2 px-4 space-y-3">
                          <div>
                            <Label className="text-xs font-medium">How many PTs in this term?</Label>
                            <div className="mt-1.5 grid grid-cols-4 gap-2">
                              {([1, 2, 3, 4] as const).map((n) => (
                                <Button
                                  key={n}
                                  type="button"
                                  size="sm"
                                  variant={tp.ptCount === n ? "default" : "outline"}
                                  onClick={() => setPtCountFor(term.id, n)}
                                >
                                  {n}
                                </Button>
                              ))}
                            </div>
                          </div>

                          {tp.ptCount >= 2 && (
                            <div>
                              <Label className="text-xs font-medium">How to combine?</Label>
                              <div className="mt-1.5 space-y-1.5">
                                {availAgg.map((a) => (
                                  <label
                                    key={a}
                                    className={`flex items-start gap-2 p-2 border rounded-md cursor-pointer hover:bg-muted/40 ${
                                      tp.aggregation === a ? "border-primary bg-primary/5" : ""
                                    }`}
                                  >
                                    <input
                                      type="radio"
                                      name={`agg-${term.id}`}
                                      value={a}
                                      checked={tp.aggregation === a}
                                      onChange={() => patchTermPattern(term.id, { aggregation: a })}
                                      className="mt-1"
                                    />
                                    <span className="text-xs">{aggregationLabel(a, tp.ptCount, tp.bestOfCount)}</span>
                                  </label>
                                ))}
                              </div>
                            </div>
                          )}

                          {tp.aggregation === "BEST_OF" && tp.ptCount >= 2 && (
                            <div className="space-y-1.5 border rounded-md p-2 bg-muted/30">
                              <div className="flex justify-between items-center">
                                <Label className="text-xs">Best how many?</Label>
                                <span className="text-xs font-semibold">{tp.bestOfCount} of {tp.ptCount}</span>
                              </div>
                              <Slider
                                min={1}
                                max={Math.max(1, tp.ptCount - 1)}
                                step={1}
                                value={[tp.bestOfCount]}
                                onValueChange={(v) => patchTermPattern(term.id, { bestOfCount: v[0] ?? 1 })}
                              />
                            </div>
                          )}

                          {tp.aggregation === "CUSTOM_GROUPS" && tp.ptCount >= 2 && (
                            <div className="space-y-2 border rounded-md p-2 bg-muted/30">
                              <div className="flex items-center justify-between">
                                <Label className="text-xs">Groups</Label>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => addGroupFor(term.id)}
                                  disabled={tp.groups.length >= 4}
                                >
                                  <Plus className="h-3.5 w-3.5 mr-1" /> Add group
                                </Button>
                              </div>
                              {tp.groups.map((g, idx) => {
                                const weightSum = tp.groups.reduce((s, x) => s + (Number.isFinite(x.weight) ? x.weight : 0), 0);
                                const valid = groupsValidFor(tp.groups, tp.ptCount);
                                return (
                                  <Card key={idx} className="border-dashed">
                                    <CardHeader className="py-1.5 px-2">
                                      <div className="flex items-center justify-between">
                                        <CardTitle className="text-xs">Group {idx + 1}</CardTitle>
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="sm"
                                          onClick={() => removeGroupFor(term.id, idx)}
                                          disabled={tp.groups.length <= 1}
                                        >
                                          <Trash2 className="h-3 w-3" />
                                        </Button>
                                      </div>
                                    </CardHeader>
                                    <CardContent className="py-1.5 px-2 space-y-1.5">
                                      <div className="flex flex-wrap gap-1.5">
                                        {Array.from({ length: tp.ptCount }, (_, i) => i + 1).map((pt) => (
                                          <label key={pt} className="flex items-center gap-1 text-xs">
                                            <Checkbox
                                              checked={g.ptNumbers.includes(pt)}
                                              onCheckedChange={() => togglePTInGroup(term.id, idx, pt)}
                                            />
                                            PT{pt}
                                          </label>
                                        ))}
                                      </div>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div className="space-y-1">
                                          <Label className="text-xs">Operation</Label>
                                          <Select
                                            value={g.op}
                                            onValueChange={(v) => patchGroupFor(term.id, idx, { op: v as PTGroupDefinition["op"] })}
                                          >
                                            <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                              <SelectItem value="AVERAGE">Average</SelectItem>
                                              <SelectItem value="SUM">Sum</SelectItem>
                                              <SelectItem value="BEST_OF">Best of N</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        </div>
                                        <div className="space-y-1">
                                          <Label className="text-xs">Weight (0–1)</Label>
                                          <Input
                                            type="number"
                                            step={0.05}
                                            min={0}
                                            max={1}
                                            value={g.weight}
                                            onChange={(e) => {
                                              const v = Number(e.target.value);
                                              patchGroupFor(term.id, idx, { weight: Number.isFinite(v) ? v : 0 });
                                            }}
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                      </div>
                                      {g.op === "BEST_OF" && (
                                        <div className="space-y-1">
                                          <Label className="text-xs">Count (K of N)</Label>
                                          <Input
                                            type="number"
                                            min={1}
                                            max={g.ptNumbers.length}
                                            value={g.count ?? 1}
                                            onChange={(e) => {
                                              const v = Number(e.target.value);
                                              patchGroupFor(term.id, idx, { count: Number.isFinite(v) ? v : 1 });
                                            }}
                                            className="h-7 text-xs"
                                          />
                                        </div>
                                      )}
                                    </CardContent>
                                    <div className="px-2 pb-2 text-[10px] text-muted-foreground">
                                      total weight in term: {weightSum.toFixed(2)} {valid ? "✓" : "✗"}
                                    </div>
                                  </Card>
                                );
                              })}
                            </div>
                          )}

                          {tp.ptCount === 1 && tp.aggregation === "SUM" && (
                            <div className="rounded-md border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                              Single PT — will be saved as-is (default CBSE behavior).
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            )}

            {/* STEP 3 — Review (per-term) */}
            {autoGenStep === 3 && (
              <div className="space-y-4">
                <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
                  <div className="text-xs text-muted-foreground">Shared</div>
                  <div className="text-sm font-medium">{patternName}</div>
                  <div className="text-xs text-muted-foreground">
                    {autoGenLevel.replace("CBSE_", "").toLowerCase().replace(/^./, c => c.toUpperCase())} · {perMarks} marks per PT · pass at {passingMarks} · {autoGenClassIds.length} class{autoGenClassIds.length !== 1 ? "es" : ""}
                  </div>
                  {Object.keys(componentOverrides).length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Custom marks: {Object.entries(componentOverrides).map(([component, o]) => {
                        const entry = componentOverrideEntries.find((e) => e.cbseComponent === component);
                        return `${entry?.examTypeName ?? component} (${o.totalMarks ?? entry?.totalMarks}/${o.passingMarks ?? entry?.passingMarks}, ${o.durationMinutes ?? entry?.durationMinutes}min)`;
                      }).join(", ")}
                    </div>
                  )}
                </div>

                {!checkingClassSubjects && classesMissingSubjects.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>
                      No subjects mapped for {classesMissingSubjects.length} class{classesMissingSubjects.length !== 1 ? "es" : ""}
                    </AlertTitle>
                    <AlertDescription className="text-xs">
                      {classesMissingSubjects.map((c) => c.name).join(", ")} — no subjects are assigned to{" "}
                      {classesMissingSubjects.length !== 1 ? "these classes" : "this class"} yet, so{" "}
                      {classesMissingSubjects.length !== 1 ? "they" : "it"} will get 0 exams. Map subjects first
                      (Classes settings), or unselect {classesMissingSubjects.length !== 1 ? "them" : "it"} in Step 1.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  {sortedSelectedTerms.map((term, idx) => {
                    const tp = termPatterns.find((p) => p.termId === term.id);
                    if (!tp) return null;
                    const ptNumbers = ptNumbersFor(term.id);
                    const isDefault = tp.ptCount === 1 && tp.aggregation === "SUM";
                    return (
                      <div key={term.id} className="rounded-md border bg-muted/20 p-3 text-sm space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{`Term ${idx + 1}: ${term.name}`}</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {ptNumbers.map((n) => `PT${n}`).join("+") || "—"}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {isDefault
                            ? "Default — 1 PT, saved as-is"
                            : `${aggregationLabel(tp.aggregation, tp.ptCount, tp.bestOfCount)} → PT(${perMarks}) column`}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Alert>
                  <Settings2 className="h-4 w-4" />
                  <AlertTitle>What happens on Apply</AlertTitle>
                  <AlertDescription className="text-xs">
                    One PT pattern is saved per term. Any missing exam types (Periodic Test, MA, Portfolio,
                    Half Yearly/Annual) are created automatically — no separate setup needed. Exam rows are
                    generated per class per subject, and per-term AssessmentRules are upserted. Re-running with
                    different marks won&apos;t update exams already created for the same class/subject/type —
                    only new combinations are affected.
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between gap-2 border-t px-6 py-3 sm:justify-between">
            {autoGenStep > 1 ? (
              <Button variant="outline" onClick={() => setAutoGenStep((s) => (s - 1) as 1 | 2)} disabled={autoGenLoading}>
                <ArrowLeft className="h-4 w-4 mr-1" /> Back
              </Button>
            ) : (
              <Button variant="outline" onClick={closeAutoGen} disabled={autoGenLoading}>
                Cancel
              </Button>
            )}

            {autoGenStep < 3 ? (
              <Button
                onClick={() => setAutoGenStep((s) => (s + 1) as 2 | 3)}
                disabled={autoGenStep === 1 ? !canProceedFromStep1() : !canProceedFromStep2()}
              >
                Next <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            ) : (
              <Button
                onClick={handleAutoGenerateExams}
                disabled={autoGenLoading || !canProceedFromStep2()}
              >
                {autoGenLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                Generate Exams
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={closeDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedExamForDelete?.resultsCount
                ? "Delete exam and its results"
                : "Delete exam"}
            </DialogTitle>
            <DialogDescription>
              {selectedExamForDelete?.resultsCount ? (
                <span className="space-y-2 block">
                  <span className="block">
                    <strong className="text-foreground">{selectedExamForDelete.title}</strong> has{" "}
                    <strong className="text-foreground">
                      {selectedExamForDelete.resultsCount} student result
                      {selectedExamForDelete.resultsCount !== 1 ? "s" : ""}
                    </strong>
                    . Deleting this exam will permanently remove all of them.
                  </span>
                  <span className="block text-amber-600 dark:text-amber-500 font-medium">
                    This cannot be undone. Consider using re-marking instead.
                  </span>
                </span>
              ) : (
                "Are you sure you want to delete this exam? This action cannot be undone."
              )}
            </DialogDescription>
          </DialogHeader>
          {selectedExamForDelete?.resultsCount ? (
            <div className="space-y-2 py-2">
              <Label htmlFor="delete-confirm">
                Type <span className="font-mono font-semibold">{selectedExamForDelete.title}</span> to confirm
              </Label>
              <Input
                id="delete-confirm"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder={selectedExamForDelete.title}
                autoComplete="off"
                autoFocus
              />
            </div>
          ) : null}
          <DialogFooter>
            <Button variant="outline" onClick={() => closeDeleteDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={
                !!selectedExamForDelete?.resultsCount &&
                deleteConfirmText.trim() !== selectedExamForDelete.title
              }
            >
              {selectedExamForDelete?.resultsCount
                ? `Delete exam + ${selectedExamForDelete.resultsCount} result${selectedExamForDelete.resultsCount !== 1 ? "s" : ""}`
                : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
        </TabsContent>
      </Tabs>
    </div>
  );
}
