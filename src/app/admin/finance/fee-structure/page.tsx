"use client";


import { useState, useEffect } from "react";
import Link from "next/link";
import {
  ChevronLeft, PlusCircle, Search, Edit, Eye,
  Trash2, DollarSign, CheckCircle, AlertCircle, Loader2, Copy, TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";

// Import server actions
import {
  getFeeStructures,
  createFeeStructure,
  updateFeeStructure,
  deleteFeeStructure,
  duplicateFeeStructure,
  getFeeTypes,
  createFeeType,
  updateFeeType,
  deleteFeeType,
  getFeeStructureStats,
} from "@/lib/actions/feeStructureActions";
import { getAcademicYears } from "@/lib/actions/academicyearsActions";
import { getClasses } from "@/lib/actions/classesActions";

// Import validation schemas
import {
  feeStructureSchema,
  FeeStructureFormValues,
  feeTypeSchema,
  FeeTypeFormValues,
} from "@/lib/schemaValidation/feeStructureSchemaValidation";

// Import custom components
import { MultiClassSelector } from "@/components/fees/multi-class-selector";
import { FeeTypeClassAmountConfig } from "@/components/fees/fee-type-class-amount-config";

// Fee frequency options
const frequencyOptions = [
  { value: "ONE_TIME", label: "One Time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "SEMI_ANNUAL", label: "Semi-Annual" },
  { value: "ANNUAL", label: "Annual" },
];

export default function FeeStructurePage() {
  // State management
  const [feeStructures, setFeeStructures] = useState<any[]>([]);
  const [academicYears, setAcademicYears] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [feeTypes, setFeeTypes] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [classFilter, setClassFilter] = useState("all");
  const [templateFilter, setTemplateFilter] = useState<"all" | "templates" | "regular">("all");
  const [activeTabIndex, setActiveTabIndex] = useState("structures");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [createFeeTypeDialogOpen, setCreateFeeTypeDialogOpen] = useState(false);
  const [editFeeTypeDialogOpen, setEditFeeTypeDialogOpen] = useState(false);
  const [deleteFeeTypeDialogOpen, setDeleteFeeTypeDialogOpen] = useState(false);
  const [viewFeeTypeDialogOpen, setViewFeeTypeDialogOpen] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [selectedFeeTypeId, setSelectedFeeTypeId] = useState<string | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<any>(null);
  const [selectedFeeType, setSelectedFeeType] = useState<any>(null);

  // Initialize forms
  const form = useForm<FeeStructureFormValues>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      name: "",
      academicYearId: "",
      classIds: [],
      applicableClasses: "",
      description: "",
      validFrom: new Date(),
      validTo: undefined,
      isActive: true,
      isTemplate: false,
      items: [],
    },
  });

  const feeTypeForm = useForm<FeeTypeFormValues>({
    resolver: zodResolver(feeTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      amount: 0,
      frequency: "ANNUAL",
      isOptional: false,
      classAmounts: [],
    },
  });

  // Fetch all data on component mount
  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    setLoading(true);
    try {
      const [structuresResult, yearsResult, classesResult, typesResult, statsResult] = await Promise.all([
        getFeeStructures(),
        getAcademicYears(),
        getClasses(),
        getFeeTypes(true), // Include class amounts
        getFeeStructureStats(),
      ]);

      if (structuresResult.success) setFeeStructures(structuresResult.data || []);
      if (yearsResult.success) setAcademicYears(yearsResult.data || []);
      if (classesResult.success) setClasses(classesResult.data || []);
      if (typesResult.success) setFeeTypes(typesResult.data || []);
      if (statsResult.success) setStats(statsResult.data);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }

  // Filter fee structures
  const filteredStructures = feeStructures.filter((structure) => {
    // Search filter - include class names in search
    const classNames = structure.classes?.map((c: any) => c.class?.name).join(" ") || "";
    const matchesSearch =
      structure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      classNames.toLowerCase().includes(searchTerm.toLowerCase());

    // Academic year filter
    const matchesYear =
      academicYearFilter === "all" ||
      structure.academicYearId === academicYearFilter;

    // Class filter
    const matchesClass =
      classFilter === "all" ||
      structure.classes?.some((c: any) => c.classId === classFilter);

    // Template filter
    const matchesTemplate =
      templateFilter === "all" ||
      (templateFilter === "templates" && structure.isTemplate) ||
      (templateFilter === "regular" && !structure.isTemplate);

    return matchesSearch && matchesYear && matchesClass && matchesTemplate;
  });

  // Handle create fee structure
  function handleCreateStructure() {
    form.reset({
      name: "",
      academicYearId: "",
      classIds: [],
      applicableClasses: "",
      description: "",
      validFrom: new Date(),
      validTo: undefined,
      isActive: true,
      isTemplate: false,
      items: [],
    });
    setSelectedStructureId(null);
    setCreateDialogOpen(true);
  }

  // Handle edit fee structure
  function handleEditStructure(structure: any) {
    setSelectedStructureId(structure.id);
    form.reset({
      name: structure.name,
      academicYearId: structure.academicYearId,
      classIds: structure.classes?.map((c: any) => c.classId) || [],
      applicableClasses: structure.applicableClasses || "",
      description: structure.description || "",
      validFrom: new Date(structure.validFrom),
      validTo: structure.validTo ? new Date(structure.validTo) : undefined,
      isActive: structure.isActive,
      isTemplate: structure.isTemplate || false,
      items: structure.items.map((item: any) => ({
        feeTypeId: item.feeTypeId,
        amount: item.amount,
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
      })),
    });
    setEditDialogOpen(true);
  }

  // Handle delete fee structure
  function handleDeleteStructure(id: string) {
    setSelectedStructureId(id);
    setDeleteDialogOpen(true);
  }

  // Handle view fee structure
  function handleViewStructure(structure: any) {
    setSelectedStructure(structure);
    setViewDialogOpen(true);
  }

  // Submit fee structure form
  async function onSubmitStructure(values: FeeStructureFormValues) {
    try {
      let result;
      if (selectedStructureId) {
        result = await updateFeeStructure(selectedStructureId, values);
      } else {
        result = await createFeeStructure(values);
      }

      if (result.success) {
        toast.success(
          `Fee structure ${selectedStructureId ? "updated" : "created"} successfully`
        );
        setCreateDialogOpen(false);
        setEditDialogOpen(false);
        form.reset();
        setSelectedStructureId(null);
        fetchAllData();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting fee structure:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Confirm delete fee structure
  async function confirmDeleteStructure() {
    if (!selectedStructureId) return;

    try {
      const result = await deleteFeeStructure(selectedStructureId);

      if (result.success) {
        toast.success("Fee structure deleted successfully");
        setDeleteDialogOpen(false);
        setSelectedStructureId(null);
        fetchAllData();
      } else {
        toast.error(result.error || "Failed to delete fee structure");
      }
    } catch (error) {
      console.error("Error deleting fee structure:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Handle create fee type
  function handleCreateFeeType() {
    feeTypeForm.reset({
      name: "",
      description: "",
      amount: 0,
      frequency: "ANNUAL",
      isOptional: false,
      classAmounts: [],
    });
    setSelectedFeeTypeId(null);
    setCreateFeeTypeDialogOpen(true);
  }

  // Handle edit fee type
  function handleEditFeeType(feeType: any) {
    setSelectedFeeTypeId(feeType.id);
    feeTypeForm.reset({
      name: feeType.name,
      description: feeType.description || "",
      amount: feeType.amount,
      frequency: feeType.frequency,
      isOptional: feeType.isOptional,
      classAmounts: feeType.classAmounts?.map((ca: any) => ({
        classId: ca.classId,
        amount: ca.amount,
      })) || [],
    });
    setEditFeeTypeDialogOpen(true);
  }

  // Handle delete fee type
  function handleDeleteFeeType(id: string) {
    setSelectedFeeTypeId(id);
    setDeleteFeeTypeDialogOpen(true);
  }

  // Handle view fee type
  function handleViewFeeType(feeType: any) {
    setSelectedFeeType(feeType);
    setViewFeeTypeDialogOpen(true);
  }

  // Submit fee type form
  async function onSubmitFeeType(values: FeeTypeFormValues) {
    try {
      let result;
      if (selectedFeeTypeId) {
        result = await updateFeeType(selectedFeeTypeId, values);
      } else {
        result = await createFeeType(values);
      }

      if (result.success) {
        toast.success(
          `Fee type ${selectedFeeTypeId ? "updated" : "created"} successfully`
        );
        setCreateFeeTypeDialogOpen(false);
        setEditFeeTypeDialogOpen(false);
        feeTypeForm.reset();
        setSelectedFeeTypeId(null);
        fetchAllData();
      } else {
        toast.error(result.error || "An error occurred");
      }
    } catch (error) {
      console.error("Error submitting fee type:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Confirm delete fee type
  async function confirmDeleteFeeType() {
    if (!selectedFeeTypeId) return;

    try {
      const result = await deleteFeeType(selectedFeeTypeId);

      if (result.success) {
        toast.success("Fee type deleted successfully");
        setDeleteFeeTypeDialogOpen(false);
        setSelectedFeeTypeId(null);
        fetchAllData();
      } else {
        toast.error(result.error || "Failed to delete fee type");
      }
    } catch (error) {
      console.error("Error deleting fee type:", error);
      toast.error("An unexpected error occurred");
    }
  }

  // Handle duplicate fee structure from view dialog
  async function handleDuplicateFromView() {
    if (!selectedStructure) return;

    try {
      const result = await duplicateFeeStructure(selectedStructure.id, {
        name: `${selectedStructure.name} (Copy)`,
      });

      if (result.success) {
        toast.success("Fee structure duplicated successfully");
        setViewDialogOpen(false);
        setSelectedStructure(null);
        fetchAllData();
      } else {
        toast.error(result.error || "Failed to duplicate fee structure");
      }
    } catch (error) {
      console.error("Error duplicating fee structure:", error);
      toast.error("An unexpected error occurred");
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back to Finance
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Fee Structure Management</h1>
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Structures</p>
                <p className="text-2xl font-bold">{stats.totalStructures}</p>
              </div>
              <DollarSign className="h-8 w-8 text-primary" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Structures</p>
                <p className="text-2xl font-bold">{stats.activeStructures}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Fee Types</p>
                <p className="text-2xl font-bold">{stats.totalFeeTypes}</p>
              </div>
              <DollarSign className="h-8 w-8 text-purple-500" />
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTabIndex} onValueChange={setActiveTabIndex}>
        <TabsList>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="types">Fee Types</TabsTrigger>
        </TabsList>

        {/* Fee Structures Tab */}
        <TabsContent value="structures" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Fee Structures</CardTitle>
                  <CardDescription>
                    Manage fee structures for different academic years and classes
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Link href="/admin/finance/analytics">
                    <Button variant="outline">
                      <TrendingUp className="mr-2 h-4 w-4" />
                      View Analytics
                    </Button>
                  </Link>
                  <Link href="/admin/finance/bulk-operations">
                    <Button variant="outline">
                      Bulk Operations
                    </Button>
                  </Link>
                  <Button onClick={handleCreateStructure}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Fee Structure
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex flex-col md:flex-row gap-4 mb-6">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search fee structures or classes..."
                    className="pl-9"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <Select value={academicYearFilter} onValueChange={setAcademicYearFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Academic Year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {academicYears.map((year) => (
                      <SelectItem key={year.id} value={year.id}>
                        {year.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={classFilter} onValueChange={setClassFilter}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by Class" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Classes</SelectItem>
                    {classes.map((cls) => (
                      <SelectItem key={cls.id} value={cls.id}>
                        {cls.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={templateFilter} onValueChange={(value: any) => setTemplateFilter(value)}>
                  <SelectTrigger className="w-full md:w-[200px]">
                    <SelectValue placeholder="Filter by Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="regular">Regular Structures</SelectItem>
                    <SelectItem value="templates">Templates Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fee Structures List */}
              {filteredStructures.length === 0 ? (
                <div className="text-center py-10">
                  <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No fee structures found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    {searchTerm || academicYearFilter !== "all" || classFilter !== "all" || templateFilter !== "all"
                      ? "Try adjusting your filters"
                      : "Create your first fee structure to get started"}
                  </p>
                  <Button onClick={handleCreateStructure}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Fee Structure
                  </Button>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredStructures.map((structure) => (
                    <Card key={structure.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-base">{structure.name}</CardTitle>
                            <CardDescription className="text-xs mt-1">
                              {structure.academicYear?.name}
                            </CardDescription>
                          </div>
                          <Badge
                            variant={structure.isActive ? "default" : "secondary"}
                            className="ml-2"
                          >
                            {structure.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <div className="space-y-2 text-sm">
                          {/* Display class badges */}
                          {structure.classes && structure.classes.length > 0 && (
                            <div>
                              <span className="text-muted-foreground text-xs">Classes:</span>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {structure.classes.slice(0, 3).map((classAssoc: any) => (
                                  <Badge key={classAssoc.id} variant="secondary" className="text-xs">
                                    {classAssoc.class?.name || "Unknown"}
                                  </Badge>
                                ))}
                                {structure.classes.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{structure.classes.length - 3} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}
                          {(!structure.classes || structure.classes.length === 0) && structure.applicableClasses && (
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Classes:</span>
                              <span className="font-medium text-xs">{structure.applicableClasses}</span>
                            </div>
                          )}
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Fee Items:</span>
                            <span className="font-medium">{structure.items?.length || 0}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Total Amount:</span>
                            <span className="font-medium">
                              ₹
                              {structure.items
                                ?.reduce((sum: number, item: any) => sum + item.amount, 0)
                                .toLocaleString()}
                            </span>
                          </div>
                          {structure.isTemplate && (
                            <div className="pt-2">
                              <Badge variant="outline" className="text-xs">
                                Template
                              </Badge>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <div className="flex border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 rounded-none"
                          onClick={() => handleViewStructure(structure)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 rounded-none border-l"
                          onClick={() => handleEditStructure(structure)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="flex-1 rounded-none border-l text-red-500 hover:text-red-600"
                          onClick={() => handleDeleteStructure(structure.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Fee Types Tab */}
        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle>Fee Types</CardTitle>
                  <CardDescription>
                    Manage different types of fees that can be included in fee structures
                  </CardDescription>
                </div>
                <Button onClick={handleCreateFeeType}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Create Fee Type
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {feeTypes.length === 0 ? (
                <div className="text-center py-10">
                  <DollarSign className="h-10 w-10 text-gray-300 mx-auto mb-3" />
                  <h3 className="text-lg font-medium mb-1">No fee types found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create fee types to use in your fee structures
                  </p>
                  <Button onClick={handleCreateFeeType}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Create Fee Type
                  </Button>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Default Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Optional</TableHead>
                      <TableHead>Class-Specific Amounts</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeTypes.map((feeType) => (
                      <TableRow key={feeType.id}>
                        <TableCell className="font-medium">{feeType.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {feeType.description || "—"}
                        </TableCell>
                        <TableCell className="font-semibold">₹{feeType.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {frequencyOptions.find((f) => f.value === feeType.frequency)?.label}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {feeType.isOptional ? (
                            <Badge variant="secondary">Optional</Badge>
                          ) : (
                            <Badge>Required</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {feeType.classAmounts && feeType.classAmounts.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                {feeType.classAmounts.length} {feeType.classAmounts.length === 1 ? 'class' : 'classes'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                (custom amounts)
                              </span>
                            </div>
                          ) : (
                            <span className="text-sm text-muted-foreground">Default only</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewFeeType(feeType)}
                              title="View details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditFeeType(feeType)}
                              title="Edit fee type"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-500 hover:text-red-600"
                              onClick={() => handleDeleteFeeType(feeType.id)}
                              title="Delete fee type"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create/Edit Fee Structure Dialog */}
      <Dialog open={createDialogOpen || editDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateDialogOpen(false);
          setEditDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStructureId ? "Edit Fee Structure" : "Create Fee Structure"}
            </DialogTitle>
            <DialogDescription>
              {selectedStructureId
                ? "Update the fee structure details"
                : "Create a new fee structure for an academic year"}
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitStructure)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Structure Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Grade 10 Annual Fees" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="academicYearId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Year</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select academic year" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {academicYears.map((year) => (
                          <SelectItem key={year.id} value={year.id}>
                            {year.name}
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
                name="classIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Applicable Classes</FormLabel>
                    <FormControl>
                      <MultiClassSelector
                        selectedClassIds={field.value}
                        onChange={field.onChange}
                        classes={classes}
                        academicYearId={form.watch("academicYearId")}
                        disabled={!form.watch("academicYearId")}
                        error={form.formState.errors.classIds?.message}
                      />
                    </FormControl>
                    <FormDescription className="text-xs">
                      Select one or more classes for this fee structure
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Brief description of this fee structure"
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="validFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid From</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(new Date(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="validTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Valid To (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          {...field}
                          value={field.value ? new Date(field.value).toISOString().split('T')[0] : ''}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Active Status</FormLabel>
                      <FormDescription className="text-xs">
                        Enable this fee structure for use
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isTemplate"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Template</FormLabel>
                      <FormDescription className="text-xs">
                        Mark as template to reuse for future fee structures
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Fee Items Section */}
              <FormField
                control={form.control}
                name="items"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Items</FormLabel>
                    <FormDescription className="text-xs mb-2">
                      Add fee types to this structure. At least one fee item is required.
                    </FormDescription>
                    <FormControl>
                      <div className="space-y-3">
                        {field.value.map((item, index) => (
                          <div key={index} className="flex gap-2 items-start p-3 border rounded-lg">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <Select
                                value={item.feeTypeId}
                                onValueChange={(value) => {
                                  const newItems = [...field.value];
                                  newItems[index].feeTypeId = value;
                                  // Auto-fill amount from fee type
                                  const feeType = feeTypes.find(ft => ft.id === value);
                                  if (feeType) {
                                    newItems[index].amount = feeType.amount;
                                  }
                                  field.onChange(newItems);
                                }}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select fee type" />
                                </SelectTrigger>
                                <SelectContent>
                                  {feeTypes.map((feeType) => (
                                    <SelectItem key={feeType.id} value={feeType.id}>
                                      {feeType.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <Input
                                type="number"
                                placeholder="Amount"
                                value={item.amount}
                                onChange={(e) => {
                                  const newItems = [...field.value];
                                  newItems[index].amount = parseFloat(e.target.value) || 0;
                                  field.onChange(newItems);
                                }}
                              />
                              <Input
                                type="date"
                                placeholder="Due Date"
                                value={item.dueDate ? new Date(item.dueDate).toISOString().split('T')[0] : ''}
                                onChange={(e) => {
                                  const newItems = [...field.value];
                                  newItems[index].dueDate = e.target.value ? new Date(e.target.value) : undefined;
                                  field.onChange(newItems);
                                }}
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                const newItems = field.value.filter((_, i) => i !== index);
                                field.onChange(newItems);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            field.onChange([
                              ...field.value,
                              { feeTypeId: "", amount: 0, dueDate: undefined }
                            ]);
                          }}
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Fee Item
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setCreateDialogOpen(false);
                  setEditDialogOpen(false);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedStructureId ? "Update" : "Create"} Fee Structure
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Fee Type Dialog */}
      <Dialog open={createFeeTypeDialogOpen || editFeeTypeDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setCreateFeeTypeDialogOpen(false);
          setEditFeeTypeDialogOpen(false);
        }
      }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedFeeTypeId ? "Edit Fee Type" : "Create Fee Type"}
            </DialogTitle>
            <DialogDescription>
              {selectedFeeTypeId
                ? "Update the fee type details and configure class-specific amounts"
                : "Create a new fee type to use in fee structures. You can set different amounts for specific classes."}
            </DialogDescription>
          </DialogHeader>
          <Form {...feeTypeForm}>
            <form onSubmit={feeTypeForm.handleSubmit(onSubmitFeeType)} className="space-y-4">
              <FormField
                control={feeTypeForm.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fee Type Name</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Tuition Fee" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feeTypeForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Fee type description" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feeTypeForm.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Default Amount</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feeTypeForm.control}
                name="frequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Frequency</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {frequencyOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={feeTypeForm.control}
                name="isOptional"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div>
                      <FormLabel>Optional Fee</FormLabel>
                      <FormDescription className="text-xs">
                        Mark as optional if not mandatory
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              {/* Class-Specific Amounts Configuration */}
              <FormField
                control={feeTypeForm.control}
                name="classAmounts"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <FeeTypeClassAmountConfig
                        feeTypeId={selectedFeeTypeId || undefined}
                        defaultAmount={feeTypeForm.watch("amount") || 0}
                        classAmounts={field.value || []}
                        onChange={field.onChange}
                        classes={classes.map((cls) => ({ id: cls.id, name: cls.name }))}
                        error={feeTypeForm.formState.errors.classAmounts?.message}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => {
                  setCreateFeeTypeDialogOpen(false);
                  setEditFeeTypeDialogOpen(false);
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedFeeTypeId ? "Update" : "Create"} Fee Type
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Fee Structure Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Structure</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fee structure? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteStructure}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Fee Type Dialog */}
      <Dialog open={deleteFeeTypeDialogOpen} onOpenChange={setDeleteFeeTypeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Fee Type</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this fee type? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteFeeTypeDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDeleteFeeType}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Fee Structure Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Fee Structure Details</DialogTitle>
          </DialogHeader>
          {selectedStructure && (
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">{selectedStructure.name}</h3>
                <p className="text-sm text-muted-foreground">{selectedStructure.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Academic Year:</span>
                  <p className="font-medium">{selectedStructure.academicYear?.name}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <p>
                    <Badge variant={selectedStructure.isActive ? "default" : "secondary"}>
                      {selectedStructure.isActive ? "Active" : "Inactive"}
                    </Badge>
                    {selectedStructure.isTemplate && (
                      <Badge variant="outline" className="ml-2">
                        Template
                      </Badge>
                    )}
                  </p>
                </div>
                <div className="col-span-2">
                  <span className="text-muted-foreground">Applicable Classes:</span>
                  {selectedStructure.classes && selectedStructure.classes.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedStructure.classes.map((classAssoc: any) => (
                        <Badge key={classAssoc.id} variant="secondary">
                          {classAssoc.class?.name || "Unknown"}
                        </Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="font-medium">{selectedStructure.applicableClasses || "All"}</p>
                  )}
                </div>
                <div>
                  <span className="text-muted-foreground">Total Amount:</span>
                  <p className="font-medium">
                    ₹{selectedStructure.items
                      ?.reduce((sum: number, item: any) => sum + item.amount, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
              {selectedStructure.items && selectedStructure.items.length > 0 && (
                <div>
                  <h4 className="font-semibold mb-2">Fee Items</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fee Type</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Due Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedStructure.items.map((item: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{item.feeType?.name || "—"}</TableCell>
                          <TableCell>₹{item.amount.toLocaleString()}</TableCell>
                          <TableCell>
                            {item.dueDate ? new Date(item.dueDate).toLocaleDateString() : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </div>
          )}
          <DialogFooter className="flex justify-between sm:justify-between">
            <Button 
              variant="outline" 
              onClick={handleDuplicateFromView}
              className="mr-auto"
            >
              <Copy className="mr-2 h-4 w-4" />
              Duplicate
            </Button>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Fee Type Dialog */}
      <Dialog open={viewFeeTypeDialogOpen} onOpenChange={setViewFeeTypeDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Fee Type Details</DialogTitle>
            <DialogDescription>
              View fee type information and class-specific amounts
            </DialogDescription>
          </DialogHeader>
          {selectedFeeType && (
            <div className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{selectedFeeType.name}</h3>
                  {selectedFeeType.description && (
                    <p className="text-sm text-muted-foreground">{selectedFeeType.description}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Default Amount</span>
                    <p className="text-lg font-bold text-primary">
                      ₹{selectedFeeType.amount.toLocaleString()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Frequency</span>
                    <p className="font-medium">
                      {frequencyOptions.find((f) => f.value === selectedFeeType.frequency)?.label}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Type</span>
                    <p>
                      {selectedFeeType.isOptional ? (
                        <Badge variant="secondary">Optional</Badge>
                      ) : (
                        <Badge>Required</Badge>
                      )}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-muted-foreground">Custom Amounts</span>
                    <p className="font-medium">
                      {selectedFeeType.classAmounts?.length || 0} {selectedFeeType.classAmounts?.length === 1 ? 'class' : 'classes'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Class-Specific Amounts */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold">Class-Specific Amounts</h4>
                  {(!selectedFeeType.classAmounts || selectedFeeType.classAmounts.length === 0) && (
                    <Badge variant="outline" className="text-xs">
                      Using default amount for all classes
                    </Badge>
                  )}
                </div>
                
                {selectedFeeType.classAmounts && selectedFeeType.classAmounts.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="font-semibold">Class</TableHead>
                          <TableHead className="font-semibold">Custom Amount</TableHead>
                          <TableHead className="font-semibold">Difference from Default</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedFeeType.classAmounts.map((classAmount: any) => {
                          const difference = classAmount.amount - selectedFeeType.amount;
                          const percentDiff = ((difference / selectedFeeType.amount) * 100).toFixed(1);
                          
                          return (
                            <TableRow key={classAmount.id}>
                              <TableCell className="font-medium">
                                {classAmount.class?.name || classes.find(c => c.id === classAmount.classId)?.name || "Unknown"}
                              </TableCell>
                              <TableCell className="font-semibold text-primary">
                                ₹{classAmount.amount.toLocaleString()}
                              </TableCell>
                              <TableCell>
                                {difference === 0 ? (
                                  <span className="text-sm text-muted-foreground">Same as default</span>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <span className={`font-medium ${difference > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                      {difference > 0 ? '+' : ''}₹{difference.toLocaleString()}
                                    </span>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-xs ${difference > 0 ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}
                                    >
                                      {difference > 0 ? '+' : ''}{percentDiff}%
                                    </Badge>
                                  </div>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 border rounded-lg bg-muted/20">
                    <DollarSign className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">
                      No class-specific amounts configured
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      All classes will use the default amount of ₹{selectedFeeType.amount.toLocaleString()}
                    </p>
                  </div>
                )}
              </div>

              {/* Usage Information */}
              <div className="pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  <strong>Note:</strong> When this fee type is used in a fee structure, the system will automatically 
                  apply class-specific amounts if configured, otherwise it will use the default amount.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setViewFeeTypeDialogOpen(false);
                if (selectedFeeType) {
                  handleEditFeeType(selectedFeeType);
                }
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button onClick={() => setViewFeeTypeDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

