"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowLeft, ArrowRight,
  Settings2, Trash2, Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import toast from "react-hot-toast";

import { applyPTPatternForCurrentSchool } from "@/lib/actions/ptPatternActions";
import type { PTGroupDefinition } from "@/lib/actions/ptPatternActions";

type AggregationMode = "SUM" | "AVERAGE" | "BEST_OF" | "USE_LAST" | "CUSTOM_GROUPS";

interface ClassOption {
  id: string;
  name: string;
}

interface TermOption {
  id: string;
  name: string;
  startDate: Date | string;
  academicYear: { name: string };
}

interface PTPatternWizardProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classes: ClassOption[];
  terms: TermOption[];
  cbseLevels?: ReadonlyArray<{ value: string; label: string }>;
}

interface TermPatternState {
  termId: string;
  ptCount: 1 | 2 | 3 | 4;
  aggregation: AggregationMode;
  bestOfCount: number;
  groups: PTGroupDefinition[];
}

const DEFAULT_CBSE_LEVELS = [
  { value: "CBSE_PRIMARY", label: "Primary (Class 1–8)" },
  { value: "CBSE_SECONDARY", label: "Secondary (Class 9–10)" },
  { value: "CBSE_SENIOR", label: "Senior Secondary (Class 11–12)" },
];

const DEFAULT_GROUPS: PTGroupDefinition[] = [
  { ptNumbers: [1, 2], op: "AVERAGE", weight: 0.5 },
  { ptNumbers: [3, 4], op: "AVERAGE", weight: 0.5 },
];

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
      groups: DEFAULT_GROUPS,
    };
  }
  return {
    termId,
    ptCount: 1,
    aggregation: "SUM",
    bestOfCount: 1,
    groups: DEFAULT_GROUPS,
  };
}

function termTimestamp(t: TermOption): number {
  const d = typeof t.startDate === "string" ? new Date(t.startDate) : t.startDate;
  return d.getTime();
}

export function PTPatternWizard({
  open,
  onOpenChange,
  classes,
  terms,
  cbseLevels = DEFAULT_CBSE_LEVELS,
}: PTPatternWizardProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // Step 1 — Schedule scope
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);
  const [scopeClassIds, setScopeClassIds] = useState<string[]>([]);
  const [cbseLevel, setCbseLevel] = useState<string>("CBSE_PRIMARY");

  // Shared (across all terms in the year)
  const [perMarks, setPerMarks] = useState<number>(10);
  const [passingMarks, setPassingMarks] = useState<number>(3.3);
  const [patternName, setPatternName] = useState<string>("Standard PT Pattern");

  // Step 2 — per-term PT pattern
  const [termPatterns, setTermPatterns] = useState<TermPatternState[]>([]);

  const [applying, setApplying] = useState(false);

  // Sort selected terms chronologically — drives ptStartNumber computation.
  const sortedSelectedTerms = useMemo(() => {
    const map = new Map(terms.map((t) => [t.id, t]));
    return selectedTermIds
      .map((id) => map.get(id))
      .filter((t): t is TermOption => Boolean(t))
      .sort((a, b) => termTimestamp(a) - termTimestamp(b));
  }, [selectedTermIds, terms]);

  // Keep termPatterns aligned with selectedTermIds: add defaults for newly
  // selected terms, drop entries for removed terms, preserve user edits.
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

  // ptStartNumber per term is computed from the running total of prior ptCount
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
    patchTermPattern(termId, {
      ptCount: n,
      // collapse to SUM when only 1 PT is possible
      aggregation: n === 1 ? "SUM" : termPatterns.find((p) => p.termId === termId)?.aggregation ?? "BEST_OF",
      bestOfCount: Math.min(termPatterns.find((p) => p.termId === termId)?.bestOfCount ?? 1, Math.max(1, n - 1)),
    });
  }

  function availableAggregationsFor(ptCount: number): AggregationMode[] {
    if (ptCount === 1) return ["SUM"];
    return ["AVERAGE", "BEST_OF", "USE_LAST", "CUSTOM_GROUPS"];
  }

  function aggregationLabel(a: AggregationMode, ptCount: number, bestOfCount: number): string {
    switch (a) {
      case "SUM": return `Sum (PT1${ptCount > 1 ? `…PT${ptCount}` : ""})`;
      case "AVERAGE": return `Average of all ${ptCount} PTs`;
      case "BEST_OF": return `Best ${bestOfCount} of ${ptCount}`;
      case "USE_LAST": return `Only the last PT`;
      case "CUSTOM_GROUPS": return `Custom groups`;
    }
  }

  function groupsValid(g: PTGroupDefinition[], ptCount: number): boolean {
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
      selectedTermIds.length > 0 &&
      scopeClassIds.length > 0 &&
      perMarks > 0 &&
      passingMarks >= 0 &&
      passingMarks <= perMarks
    );
  }

  function canProceedFromStep2() {
    if (termPatterns.length === 0) return false;
    for (const tp of termPatterns) {
      if (tp.aggregation === "BEST_OF" && (tp.bestOfCount < 1 || tp.bestOfCount > tp.ptCount)) return false;
      if (tp.aggregation === "CUSTOM_GROUPS" && !groupsValid(tp.groups, tp.ptCount)) return false;
    }
    return patternName.trim().length > 0;
  }

  function reset() {
    setStep(1);
    setSelectedTermIds([]);
    setScopeClassIds([]);
    setCbseLevel("CBSE_PRIMARY");
    setPerMarks(10);
    setPassingMarks(3.3);
    setPatternName("Standard PT Pattern");
    setTermPatterns([]);
  }

  function close() {
    onOpenChange(false);
    setTimeout(reset, 200);
  }

  function toggleClass(clsId: string) {
    setScopeClassIds((prev) =>
      prev.includes(clsId) ? prev.filter((id) => id !== clsId) : [...prev, clsId],
    );
  }

  function toggleTerm(termId: string) {
    setSelectedTermIds((prev) =>
      prev.includes(termId) ? prev.filter((id) => id !== termId) : [...prev, termId],
    );
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

  function addGroup(termId: string) {
    setTermPatterns((prev) =>
      prev.map((tp) => {
        if (tp.termId !== termId) return tp;
        if (tp.groups.length >= 4) return tp;
        return { ...tp, groups: [...tp.groups, { ptNumbers: [], op: "AVERAGE", weight: 0.25 }] };
      }),
    );
  }

  function removeGroup(termId: string, idx: number) {
    setTermPatterns((prev) =>
      prev.map((tp) =>
        tp.termId !== termId ? tp : { ...tp, groups: tp.groups.filter((_, i) => i !== idx) },
      ),
    );
  }

  async function handleApply() {
    if (!canProceedFromStep2()) {
      toast.error("Please complete each term's PT configuration");
      return;
    }
    setApplying(true);
    try {
      const failures: string[] = [];
      let successCount = 0;

      for (const tp of termPatterns) {
        const term = sortedSelectedTerms.find((t) => t.id === tp.termId);
        const startNumber = startNumberFor(tp.termId);
        const result = await applyPTPatternForCurrentSchool({
          name: patternName.trim(),
          classId: null,
          termId: tp.termId,
          cbseLevel,
          config: {
            ptCount: tp.ptCount,
            ptStartNumber: startNumber,
            perMarks,
            passingMarks,
            aggregation: tp.aggregation,
            bestOfCount: tp.aggregation === "BEST_OF" ? tp.bestOfCount : undefined,
            groups: tp.aggregation === "CUSTOM_GROUPS" ? tp.groups : undefined,
          },
          scopeClassIds,
        });
        if (result.success) {
          successCount++;
        } else {
          failures.push(`${term?.name ?? tp.termId}: ${result.error ?? "failed"}`);
        }
      }

      if (failures.length === 0) {
        toast.success(
          successCount === 1
            ? "PT pattern applied"
            : `PT pattern applied to ${successCount} terms`,
        );
        close();
      } else if (failures.length < termPatterns.length) {
        toast.error(`Partial success. Failed: ${failures.join("; ")}`);
      } else {
        toast.error(`All terms failed: ${failures.join("; ")}`);
      }
    } catch (err) {
      toast.error("Unexpected error applying PT pattern");
      console.error(err);
    } finally {
      setApplying(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <div className="p-6 pb-3 border-b">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Set PT Pattern
            </DialogTitle>
            <DialogDescription>
              Configure how each term's PTs combine into the PT column. Step {step} of 3.
            </DialogDescription>
          </DialogHeader>

          {/* Stepper indicator */}
          <div className="flex items-center gap-2 text-xs mt-3">
            {[1, 2, 3].map((n) => (
              <div key={n} className="flex-1 flex items-center gap-1">
                <div
                  className={`h-6 w-6 rounded-full flex items-center justify-center font-medium ${
                    step >= n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {step > n ? <CheckCircle2 className="h-3.5 w-3.5" /> : n}
                </div>
                {n < 3 && (
                  <div className={`flex-1 h-0.5 ${step > n ? "bg-primary" : "bg-muted"}`} />
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

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {/* STEP 1 — Schedule (terms + classes + CBSE level + shared marks) */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label>CBSE level</Label>
                <Select value={cbseLevel} onValueChange={setCbseLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {cbseLevels.map((l) => (
                      <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label>Terms ({selectedTermIds.length} selected)</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => setSelectedTermIds([])}>
                    Clear
                  </Button>
                </div>
                <div className="border rounded-md p-2 max-h-[140px] overflow-y-auto space-y-1">
                  {terms.map((t) => (
                    <label
                      key={t.id}
                      className="flex items-center gap-2 p-1 rounded hover:bg-muted/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={selectedTermIds.includes(t.id)}
                        onCheckedChange={() => toggleTerm(t.id)}
                      />
                      <span className="text-sm">
                        {t.name}
                        <span className="text-xs text-muted-foreground ml-1">({t.academicYear.name})</span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  PT numbering is computed in chronological order — Term 1 starts at PT1, Term 2 continues from the next number.
                </p>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label>Apply to classes ({scopeClassIds.length} selected)</Label>
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setScopeClassIds(classes.map((c) => c.id))}>All</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setScopeClassIds([])}>Clear</Button>
                  </div>
                </div>
                <div className="border rounded-md p-2 max-h-[140px] overflow-y-auto space-y-1">
                  {classes.map((c) => (
                    <label
                      key={c.id}
                      className="flex items-center gap-2 p-1 rounded hover:bg-muted/40 cursor-pointer"
                    >
                      <Checkbox
                        checked={scopeClassIds.includes(c.id)}
                        onCheckedChange={() => toggleClass(c.id)}
                      />
                      <span className="text-sm">{c.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label>Marks per PT (shared)</Label>
                  <Input
                    type="number"
                    min={1}
                    value={perMarks}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPerMarks(Number.isFinite(v) ? v : 0);
                    }}
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
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      setPassingMarks(Number.isFinite(v) ? v : 0);
                    }}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Pattern name (for your reference)</Label>
                <Input value={patternName} onChange={(e) => setPatternName(e.target.value)} />
              </div>
            </div>
          )}

          {/* STEP 2 — PT pattern per selected term */}
          {step === 2 && (
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
                  const startNum = startNumberFor(term.id);
                  const ptNumbers = Array.from({ length: tp.ptCount }, (_, i) => startNum + i);
                  const availAgg = availableAggregationsFor(tp.ptCount);
                  return (
                    <Card key={term.id} className="border-primary/30">
                      <CardHeader className="py-3 px-4">
                        <CardTitle className="text-sm flex items-center justify-between">
                          <span>
                            {idx === 0 ? "Term 1 — " : `Term ${idx + 1} — `}
                            {term.name}
                            <span className="text-xs text-muted-foreground ml-1">({term.academicYear.name})</span>
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
                          <CustomGroupsEditor
                            groups={tp.groups}
                            ptCount={tp.ptCount}
                            onAdd={() => addGroup(term.id)}
                            onRemove={(idx) => removeGroup(term.id, idx)}
                            onTogglePT={(gIdx, pt) => togglePTInGroup(term.id, gIdx, pt)}
                            onPatchGroup={(gIdx, patch) =>
                              setTermPatterns((prev) =>
                                prev.map((p) =>
                                  p.termId !== term.id
                                    ? p
                                    : {
                                        ...p,
                                        groups: p.groups.map((g, i) => (i === gIdx ? { ...g, ...patch } : g)),
                                      },
                                ),
                              )
                            }
                          />
                        )}
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          )}

          {/* STEP 3 — Review */}
          {step === 3 && (
            <div className="space-y-4">
              <div className="rounded-md border bg-muted/30 p-3 space-y-1">
                <div className="text-xs text-muted-foreground">Pattern</div>
                <div className="text-sm font-medium">{patternName}</div>
                <div className="text-xs text-muted-foreground">
                  {cbseLevels.find((l) => l.value === cbseLevel)?.label} · {perMarks} marks per PT · pass at {passingMarks}
                </div>
              </div>

              <div className="space-y-2">
                {sortedSelectedTerms.map((term, idx) => {
                  const tp = termPatterns.find((p) => p.termId === term.id);
                  if (!tp) return null;
                  const ptNumbers = ptNumbersFor(term.id);
                  return (
                    <div key={term.id} className="rounded-md border bg-muted/20 p-3 text-sm">
                      <span className="font-medium">{`Term ${idx + 1}: `}</span>
                      <span>{ptNumbers.map((n) => `PT${n}`).join("+") || "—"}</span>
                      <span className="text-muted-foreground"> → </span>
                      <span>{aggregationLabel(tp.aggregation, tp.ptCount, tp.bestOfCount)}</span>
                      <span className="text-muted-foreground"> → PT({perMarks}) column</span>
                    </div>
                  );
                })}
              </div>

              <Alert>
                <Settings2 className="h-4 w-4" />
                <AlertTitle>What happens on Apply</AlertTitle>
                <AlertDescription className="text-xs">
                  One PT pattern is saved per term. PT ExamTypes are created/reused sequentially across the year, exam rows are generated per class per subject, and per-term AssessmentRules are upserted.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {/* Sticky footer */}
        <DialogFooter className="flex justify-between gap-2 border-t px-6 py-3 sm:justify-between">
          {step > 1 ? (
            <Button variant="outline" onClick={() => setStep((s) => (s - 1) as 1 | 2)} disabled={applying}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          ) : (
            <Button variant="outline" onClick={close} disabled={applying}>Cancel</Button>
          )}

          {step < 3 ? (
            <Button
              onClick={() => setStep((s) => (s + 1) as 2 | 3)}
              disabled={step === 1 ? !canProceedFromStep1() : !canProceedFromStep2()}
            >
              Next <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleApply} disabled={!canProceedFromStep2() || applying}>
              {applying ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4 mr-1" />
              )}
              Apply
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Custom groups editor — used inside Step 2 per term
// ---------------------------------------------------------------------------

interface CustomGroupsEditorProps {
  groups: PTGroupDefinition[];
  ptCount: number;
  onAdd: () => void;
  onRemove: (idx: number) => void;
  onTogglePT: (groupIdx: number, pt: number) => void;
  onPatchGroup: (groupIdx: number, patch: Partial<PTGroupDefinition>) => void;
}

function CustomGroupsEditor({
  groups, ptCount, onAdd, onRemove, onTogglePT, onPatchGroup,
}: CustomGroupsEditorProps) {
  const weightSum = groups.reduce((s, g) => s + (Number.isFinite(g.weight) ? g.weight : 0), 0);
  const valid = Math.abs(weightSum - 1) < 0.001;
  return (
    <div className="space-y-2 border rounded-md p-2 bg-muted/30">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Groups</Label>
        <Button type="button" size="sm" variant="outline" onClick={onAdd} disabled={groups.length >= 4}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Add group
        </Button>
      </div>
      {groups.map((g, idx) => (
        <Card key={idx} className="border-dashed">
          <CardHeader className="py-1.5 px-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs">Group {idx + 1}</CardTitle>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(idx)}
                disabled={groups.length <= 1}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="py-1.5 px-2 space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {Array.from({ length: ptCount }, (_, i) => i + 1).map((pt) => (
                <label key={pt} className="flex items-center gap-1 text-xs">
                  <Checkbox
                    checked={g.ptNumbers.includes(pt)}
                    onCheckedChange={() => onTogglePT(idx, pt)}
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
                  onValueChange={(v) => onPatchGroup(idx, { op: v as PTGroupDefinition["op"] })}
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
                    onPatchGroup(idx, { weight: Number.isFinite(v) ? v : 0 });
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
                    onPatchGroup(idx, { count: Number.isFinite(v) ? v : 1 });
                  }}
                  className="h-7 text-xs"
                />
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Total weight:</span>
        <Badge variant={valid ? "default" : "destructive"}>{weightSum.toFixed(2)} / 1.00</Badge>
      </div>
      {!valid && (
        <p className="text-xs text-red-600">Weights must sum to 1.0 and every PT in this term must be in exactly one group.</p>
      )}
    </div>
  );
}
