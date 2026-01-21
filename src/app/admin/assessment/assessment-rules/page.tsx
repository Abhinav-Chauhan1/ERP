"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
    ArrowLeft, PlusCircle, Edit, Trash2,
    MoreVertical, ClipboardList, Settings,
    AlertCircle, Loader2, Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

import { assessmentRuleSchema, AssessmentRuleFormValues, AssessmentRuleUpdateFormValues } from "@/lib/schemaValidation/assessmentRulesSchemaValidation";
import { getAssessmentRules, createAssessmentRule, updateAssessmentRule, deleteAssessmentRule } from "@/lib/actions/assessmentRulesActions";
import { getClasses } from "@/lib/actions/classesActions";
import { getExamTypes } from "@/lib/actions/examTypesActions";

export default function AssessmentRulesPage() {
    const [rules, setRules] = useState<any[]>([]);
    const [classes, setClasses] = useState<any[]>([]);
    const [examTypes, setExamTypes] = useState<any[]>([]);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRule, setEditingRule] = useState<any>(null);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ruleToDelete, setRuleToDelete] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const form = useForm<AssessmentRuleFormValues>({
        resolver: zodResolver(assessmentRuleSchema),
        defaultValues: {
            name: "",
            classId: null,
            subjectId: null,
            ruleType: "BEST_OF",
            examTypes: [],
            count: 2,
            weight: 1.0,
        },
    });

    useEffect(() => {
        fetchData();
    }, []);

    async function fetchData() {
        setLoading(true);
        try {
            const [rulesRes, classesRes, examTypesRes] = await Promise.all([
                getAssessmentRules(),
                getClasses(),
                getExamTypes(),
            ]);

            if (rulesRes.success) setRules(rulesRes.data || []);
            if (classesRes.success) setClasses(classesRes.data || []);
            if (examTypesRes.success) setExamTypes(examTypesRes.data || []);

            if (!rulesRes.success) setError(rulesRes.error || "Failed to fetch rules");
        } catch (err) {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    }

    async function onSubmit(values: AssessmentRuleFormValues) {
        try {
            let result;
            if (editingRule) {
                result = await updateAssessmentRule({ ...values, id: editingRule.id } as AssessmentRuleUpdateFormValues);
            } else {
                result = await createAssessmentRule(values);
            }

            if (result.success) {
                toast.success(`Rule ${editingRule ? "updated" : "created"} successfully`);
                setDialogOpen(false);
                setEditingRule(null);
                form.reset();
                fetchData();
            } else {
                toast.error(result.error || "An error occurred");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        }
    }

    function handleCreateRule() {
        form.reset({
            name: "",
            classId: null,
            subjectId: null,
            ruleType: "BEST_OF",
            examTypes: [],
            count: 2,
            weight: 1.0,
        });
        setEditingRule(null);
        setDialogOpen(true);
    }

    function handleEditRule(rule: any) {
        form.reset({
            name: rule.name,
            classId: rule.classId,
            subjectId: rule.subjectId,
            ruleType: rule.ruleType,
            examTypes: rule.examTypes,
            count: rule.count,
            weight: rule.weight,
        });
        setEditingRule(rule);
        setDialogOpen(true);
    }

    async function confirmDeleteRule() {
        if (!ruleToDelete) return;
        try {
            const result = await deleteAssessmentRule(ruleToDelete);
            if (result.success) {
                toast.success("Rule deleted successfully");
                setDeleteDialogOpen(false);
                setRuleToDelete(null);
                fetchData();
            } else {
                toast.error(result.error || "Failed to delete rule");
            }
        } catch (err) {
            toast.error("An unexpected error occurred");
        }
    }

    return (
        <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                    <Link href="/admin/assessment">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-1" /> Back
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight">Assessment Rules</h1>
                </div>
                <Button onClick={handleCreateRule} className="w-full sm:w-auto">
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Rule
                </Button>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
                <Info className="h-4 w-4 text-blue-600" />
                <AlertTitle className="text-blue-800">About Assessment Rules</AlertTitle>
                <AlertDescription className="text-blue-700">
                    Rules define how exam marks are aggregated for report cards. For example, "Best of 2 Periodical Tests" or "30% Weightage for Term 1".
                </AlertDescription>
            </Alert>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="flex justify-center items-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            ) : (
                <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                    {rules.length === 0 ? (
                        <div className="col-span-3 text-center py-12 text-muted-foreground">
                            <Settings className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                            <h3 className="text-lg font-medium mb-1">No rules found</h3>
                            <p className="text-sm mb-4">Create your first assessment rule to get started</p>
                            <Button onClick={handleCreateRule}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Rule
                            </Button>
                        </div>
                    ) : (
                        rules.map((rule) => (
                            <Card key={rule.id}>
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <CardTitle className="text-lg">{rule.name}</CardTitle>
                                            <CardDescription className="mt-1">
                                                {rule.class?.name || "All Classes"}
                                            </CardDescription>
                                        </div>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                                    <MoreVertical className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => handleEditRule(rule)}>
                                                    <Edit className="h-4 w-4 mr-2" /> Edit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem
                                                    className="text-red-600"
                                                    onClick={() => { setRuleToDelete(rule.id); setDeleteDialogOpen(true); }}
                                                >
                                                    <Trash2 className="h-4 w-4 mr-2" /> Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Type:</span>
                                            <Badge variant="outline" className="bg-primary/5">{rule.ruleType}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Exams:</span>
                                            <span className="font-medium text-xs">{rule.examTypes.length} types selected</span>
                                        </div>
                                        {rule.ruleType === "BEST_OF" && (
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-muted-foreground">Take Best:</span>
                                                <span className="font-semibold">{rule.count}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-muted-foreground">Weight:</span>
                                            <span className="font-semibold">{rule.weight * 100}%</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>{editingRule ? "Edit Rule" : "Create Assessment Rule"}</DialogTitle>
                        <DialogDescription>
                            Define the aggregation logic for exam marks.
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Rule Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Best of 2 Periodic Tests" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="classId"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Class (Optional)</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value || "all"}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="All Classes" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="all">All Classes</SelectItem>
                                                    {classes.map((cls) => (
                                                        <SelectItem key={cls.id} value={cls.id}>{cls.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="ruleType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Aggregation Type</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="BEST_OF">Best of X</SelectItem>
                                                    <SelectItem value="AVERAGE">Average</SelectItem>
                                                    <SelectItem value="WEIGHTED_AVERAGE">Weighted Average</SelectItem>
                                                    <SelectItem value="SUM">Sum</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="examTypes"
                                render={() => (
                                    <FormItem>
                                        <FormLabel>Apply to Exam Types</FormLabel>
                                        <div className="grid grid-cols-2 gap-2 border rounded-md p-3 max-h-[150px] overflow-y-auto">
                                            {examTypes.map((type) => (
                                                <FormField
                                                    key={type.id}
                                                    control={form.control}
                                                    name="examTypes"
                                                    render={({ field }) => {
                                                        return (
                                                            <FormItem
                                                                key={type.id}
                                                                className="flex flex-row items-start space-x-3 space-y-0"
                                                            >
                                                                <FormControl>
                                                                    <Checkbox
                                                                        checked={field.value?.includes(type.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            return checked
                                                                                ? field.onChange([...field.value, type.id])
                                                                                : field.onChange(
                                                                                    field.value?.filter(
                                                                                        (value) => value !== type.id
                                                                                    )
                                                                                )
                                                                        }}
                                                                    />
                                                                </FormControl>
                                                                <FormLabel className="text-sm font-normal">
                                                                    {type.name}
                                                                </FormLabel>
                                                            </FormItem>
                                                        )
                                                    }}
                                                />
                                            ))}
                                        </div>
                                        <FormDescription>Select the exam types whose marks will be aggregated together.</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {form.watch("ruleType") === "BEST_OF" && (
                                <FormField
                                    control={form.control}
                                    name="count"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Count (X)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} value={field.value || ""} />
                                            </FormControl>
                                            <FormDescription>Number of top results to consider (e.g., 2 for Best of 2).</FormDescription>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            )}

                            <FormField
                                control={form.control}
                                name="weight"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Final Weightage (0.0 - 1.0)</FormLabel>
                                        <FormControl>
                                            <Input type="number" step="0.1" {...field} value={field.value || ""} />
                                        </FormControl>
                                        <FormDescription>Relative weight of this group in overall calculation (e.g., 0.3 for 30%).</FormDescription>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <DialogFooter>
                                <Button type="submit" className="w-full">
                                    {editingRule ? "Update Rule" : "Create Rule"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
            </Dialog>

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Assessment Rule</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this rule? This will affect how report cards are calculated for the linked classes.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                        <Button variant="destructive" onClick={confirmDeleteRule}>Delete</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
