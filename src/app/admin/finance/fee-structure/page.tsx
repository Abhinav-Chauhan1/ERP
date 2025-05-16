"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, PlusCircle, Search, Filter, Edit, Eye, Calendar,
  Trash2, DollarSign, CheckCircle, AlertCircle, Copy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  DialogTrigger,
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
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// Mock data for academic years
const academicYears = [
  { id: "1", name: "2023-2024", startDate: "2023-08-15", endDate: "2024-05-31", isActive: true },
  { id: "2", name: "2022-2023", startDate: "2022-08-16", endDate: "2023-06-01", isActive: false },
  { id: "3", name: "2024-2025", startDate: "2024-08-14", endDate: "2025-05-30", isActive: false },
];

// Mock data for fee structures
const feeStructures = [
  {
    id: "fs1",
    name: "Regular Fee Structure",
    academicYear: "2023-2024",
    description: "Standard fee structure for all classes",
    applicableClasses: "All Classes",
    validFrom: "2023-08-15",
    validTo: "2024-05-31",
    isActive: true,
    totalAmount: 25000,
    items: [
      { id: "fs1-1", name: "Tuition Fee", amount: 15000, frequency: "ANNUAL" },
      { id: "fs1-2", name: "Laboratory Fee", amount: 3000, frequency: "ANNUAL" },
      { id: "fs1-3", name: "Library Fee", amount: 2000, frequency: "ANNUAL" },
      { id: "fs1-4", name: "Sports Fee", amount: 2500, frequency: "ANNUAL" },
      { id: "fs1-5", name: "Development Fee", amount: 2500, frequency: "ANNUAL" },
    ]
  },
  {
    id: "fs2",
    name: "Special Program Fee Structure",
    academicYear: "2023-2024",
    description: "Fee structure for students in special programs",
    applicableClasses: "Grade 11, Grade 12",
    validFrom: "2023-08-15",
    validTo: "2024-05-31",
    isActive: true,
    totalAmount: 35000,
    items: [
      { id: "fs2-1", name: "Tuition Fee", amount: 20000, frequency: "ANNUAL" },
      { id: "fs2-2", name: "Laboratory Fee", amount: 5000, frequency: "ANNUAL" },
      { id: "fs2-3", name: "Library Fee", amount: 3000, frequency: "ANNUAL" },
      { id: "fs2-4", name: "Special Program Fee", amount: 5000, frequency: "ANNUAL" },
      { id: "fs2-5", name: "Development Fee", amount: 2000, frequency: "ANNUAL" },
    ]
  },
  {
    id: "fs3",
    name: "Scholarship Fee Structure",
    academicYear: "2023-2024",
    description: "Reduced fee structure for scholarship students",
    applicableClasses: "All Classes",
    validFrom: "2023-08-15",
    validTo: "2024-05-31",
    isActive: true,
    totalAmount: 15000,
    items: [
      { id: "fs3-1", name: "Tuition Fee", amount: 7500, frequency: "ANNUAL" },
      { id: "fs3-2", name: "Laboratory Fee", amount: 3000, frequency: "ANNUAL" },
      { id: "fs3-3", name: "Library Fee", amount: 2000, frequency: "ANNUAL" },
      { id: "fs3-4", name: "Sports Fee", amount: 1000, frequency: "ANNUAL" },
      { id: "fs3-5", name: "Development Fee", amount: 1500, frequency: "ANNUAL" },
    ]
  },
];

// Mock data for fee types
const feeTypes = [
  { id: "ft1", name: "Tuition Fee", description: "Basic education fee", amount: 15000, frequency: "ANNUAL" },
  { id: "ft2", name: "Laboratory Fee", description: "Access to lab equipment", amount: 3000, frequency: "ANNUAL" },
  { id: "ft3", name: "Library Fee", description: "Library services and books", amount: 2000, frequency: "ANNUAL" },
  { id: "ft4", name: "Sports Fee", description: "Sports facilities and equipment", amount: 2500, frequency: "ANNUAL" },
  { id: "ft5", name: "Development Fee", description: "School infrastructure development", amount: 2500, frequency: "ANNUAL" },
  { id: "ft6", name: "Special Program Fee", description: "Special academic programs", amount: 5000, frequency: "ANNUAL" },
  { id: "ft7", name: "Exam Fee", description: "Examination costs", amount: 1000, frequency: "SEMI_ANNUAL" },
  { id: "ft8", name: "Transport Fee", description: "School bus transportation", amount: 12000, frequency: "ANNUAL", isOptional: true },
  { id: "ft9", name: "Uniform Fee", description: "School uniform", amount: 3500, frequency: "ANNUAL", isOptional: true },
];

// Mock data for applicable classes
const classes = [
  { id: "c1", name: "Grade 1" },
  { id: "c2", name: "Grade 2" },
  { id: "c3", name: "Grade 3" },
  { id: "c4", name: "Grade 4" },
  { id: "c5", name: "Grade 5" },
  { id: "c6", name: "Grade 6" },
  { id: "c7", name: "Grade 7" },
  { id: "c8", name: "Grade 8" },
  { id: "c9", name: "Grade 9" },
  { id: "c10", name: "Grade 10" },
  { id: "c11", name: "Grade 11" },
  { id: "c12", name: "Grade 12" },
];

// Fee frequency options
const frequencyOptions = [
  { value: "ONE_TIME", label: "One Time" },
  { value: "MONTHLY", label: "Monthly" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "SEMI_ANNUAL", label: "Semi-Annual" },
  { value: "ANNUAL", label: "Annual" },
];

// Schema for fee structure creation
const feeStructureSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  academicYearId: z.string({
    required_error: "Please select an academic year",
  }),
  description: z.string().optional(),
  applicableClasses: z.array(z.string()).min(1, "At least one class must be selected"),
  validFrom: z.string({
    required_error: "Valid from date is required",
  }),
  validTo: z.string({
    required_error: "Valid to date is required",
  }),
  isActive: z.boolean().default(true),
  items: z.array(
    z.object({
      feeTypeId: z.string({
        required_error: "Fee type is required",
      }),
      amount: z.number({
        required_error: "Amount is required",
      }).min(0, "Amount must be positive"),
      frequency: z.string(),
    })
  ).min(1, "At least one fee item is required"),
});

// Schema for fee type creation
const feeTypeSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  description: z.string().optional(),
  amount: z.number({
    required_error: "Amount is required",
  }).min(0, "Amount must be positive"),
  frequency: z.string({
    required_error: "Frequency is required",
  }),
  isOptional: z.boolean().default(false),
});

export default function FeeStructurePage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("all");
  const [activeTabIndex, setActiveTabIndex] = useState("structures");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [createFeeTypeDialogOpen, setCreateFeeTypeDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedStructureId, setSelectedStructureId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  // Initialize form for fee structure
  const form = useForm<z.infer<typeof feeStructureSchema>>({
    resolver: zodResolver(feeStructureSchema),
    defaultValues: {
      name: "",
      description: "",
      applicableClasses: [],
      isActive: true,
      items: [],
    },
  });

  // Initialize form for fee type
  const feeTypeForm = useForm<z.infer<typeof feeTypeSchema>>({
    resolver: zodResolver(feeTypeSchema),
    defaultValues: {
      name: "",
      description: "",
      amount: 0,
      frequency: "ANNUAL",
      isOptional: false,
    },
  });

  // Filter fee structures based on search and academic year
  const filteredStructures = feeStructures.filter(structure => {
    const matchesSearch = 
      structure.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      structure.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesYear = 
      academicYearFilter === "all" || structure.academicYear === academicYears.find(y => y.id === academicYearFilter)?.name;
    
    return matchesSearch && matchesYear;
  });

  function handleCreateStructure() {
    // Add empty items array to form
    form.reset({
      name: "",
      description: "",
      applicableClasses: [],
      validFrom: new Date().toISOString().split('T')[0],
      validTo: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      isActive: true,
      items: [{ feeTypeId: "", amount: 0, frequency: "ANNUAL" }],
    });
    setCreateDialogOpen(true);
  }

  function handleCreateFeeType() {
    feeTypeForm.reset({
      name: "",
      description: "",
      amount: 0,
      frequency: "ANNUAL",
      isOptional: false,
    });
    setCreateFeeTypeDialogOpen(true);
  }

  function handleViewStructure(structureId: string) {
    setSelectedStructureId(structureId);
    setViewDialogOpen(true);
  }

  function addFeeItem() {
    const currentItems = form.getValues().items || [];
    form.setValue('items', [...currentItems, { feeTypeId: "", amount: 0, frequency: "ANNUAL" }]);
  }

  function removeFeeItem(index: number) {
    const currentItems = form.getValues().items;
    form.setValue('items', currentItems.filter((_, i) => i !== index));
  }

  function onSubmitFeeStructure(values: z.infer<typeof feeStructureSchema>) {
    console.log("Creating fee structure:", values);
    setCreateDialogOpen(false);
  }

  function onSubmitFeeType(values: z.infer<typeof feeTypeSchema>) {
    console.log("Creating fee type:", values);
    setCreateFeeTypeDialogOpen(false);
  }

  function handleCheckAllItems() {
    if (selectedItems.length === feeTypes.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(feeTypes.map(type => type.id));
    }
  }

  function handleItemChecked(itemId: string) {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  }

  const selectedStructure = feeStructures.find(structure => structure.id === selectedStructureId);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance">
            <Button variant="ghost" size="sm">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Back
            </Button>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Fee Structure Management</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={createFeeTypeDialogOpen} onOpenChange={setCreateFeeTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={handleCreateFeeType}>
                <PlusCircle className="mr-2 h-4 w-4" /> New Fee Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Fee Type</DialogTitle>
                <DialogDescription>
                  Add a new fee type to the system
                </DialogDescription>
              </DialogHeader>
              <Form {...feeTypeForm}>
                <form onSubmit={feeTypeForm.handleSubmit(onSubmitFeeType)} className="space-y-4">
                  <FormField
                    control={feeTypeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fee Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Tuition Fee" {...field} />
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
                          <Textarea 
                            placeholder="Brief description of the fee" 
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
                      control={feeTypeForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Default Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              placeholder="0.00" 
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {frequencyOptions.map(option => (
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
                  </div>
                  
                  <FormField
                    control={feeTypeForm.control}
                    name="isOptional"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Optional Fee</FormLabel>
                          <FormDescription>
                            Mark if this fee is optional for students
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateFeeTypeDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Fee Type</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateStructure}>
                <PlusCircle className="mr-2 h-4 w-4" /> New Fee Structure
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Create New Fee Structure</DialogTitle>
                <DialogDescription>
                  Define a new fee structure for students
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitFeeStructure)} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Structure Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Regular Fee Structure" {...field} />
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select academic year" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {academicYears.map(year => (
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
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of the fee structure" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="validFrom"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valid From</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
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
                          <FormLabel>Valid To</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="applicableClasses"
                    render={() => (
                      <FormItem>
                        <div className="mb-4">
                          <FormLabel>Applicable Classes</FormLabel>
                          <FormDescription>
                            Select which classes this fee structure applies to
                          </FormDescription>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                          {classes.map((item) => (
                            <FormField
                              key={item.id}
                              control={form.control}
                              name="applicableClasses"
                              render={({ field }) => {
                                return (
                                  <FormItem
                                    key={item.id}
                                    className="flex flex-row items-start space-x-2 space-y-0"
                                  >
                                    <FormControl>
                                      <Checkbox
                                        checked={field.value?.includes(item.id)}
                                        onCheckedChange={(checked) => {
                                          return checked
                                            ? field.onChange([...field.value, item.id])
                                            : field.onChange(
                                                field.value?.filter(
                                                  (value) => value !== item.id
                                                )
                                              )
                                        }}
                                      />
                                    </FormControl>
                                    <FormLabel className="text-sm font-normal">
                                      {item.name}
                                    </FormLabel>
                                  </FormItem>
                                )
                              }}
                            />
                          ))}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                          <FormDescription>
                            Make this fee structure active and applicable to students
                          </FormDescription>
                        </div>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                  
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <FormLabel className="text-base">Fee Items</FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addFeeItem}
                      >
                        <PlusCircle className="h-4 w-4 mr-1" />
                        Add Fee Item
                      </Button>
                    </div>
                    
                    <div className="rounded-md border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Fee Type</TableHead>
                            <TableHead>Amount</TableHead>
                            <TableHead>Frequency</TableHead>
                            <TableHead className="w-[100px]">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {form.getValues().items?.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.feeTypeId`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select fee type" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {feeTypes.map(type => (
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
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.amount`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormControl>
                                        <Input 
                                          type="number" 
                                          min={0} 
                                          placeholder="0.00" 
                                          {...field}
                                          onChange={e => field.onChange(parseFloat(e.target.value))}
                                        />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                              </TableCell>
                              <TableCell>
                                <FormField
                                  control={form.control}
                                  name={`items.${index}.frequency`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                          <SelectTrigger>
                                            <SelectValue placeholder="Select frequency" />
                                          </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                          {frequencyOptions.map(option => (
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
                              </TableCell>
                              <TableCell>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeFeeItem(index)}
                                >
                                  <Trash2 className="h-4 w-4 text-red-500" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                          
                          {!form.getValues().items?.length && (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-4 text-gray-500">
                                No fee items added. Click "Add Fee Item" to add one.
                              </TableCell>
                            </TableRow>
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                  
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Fee Structure</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="structures" onValueChange={setActiveTabIndex}>
        <TabsList>
          <TabsTrigger value="structures">Fee Structures</TabsTrigger>
          <TabsTrigger value="types">Fee Types</TabsTrigger>
        </TabsList>
        
        <TabsContent value="structures">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="md:w-1/2">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search fee structures..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2 md:w-1/2">
              <Select
                value={academicYearFilter}
                onValueChange={setAcademicYearFilter}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by academic year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Academic Years</SelectItem>
                  {academicYears.map((year) => (
                    <SelectItem key={year.id} value={year.id}>
                      {year.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Fee Structures</CardTitle>
              <CardDescription>
                Manage different fee structures for your institution
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Academic Year</TableHead>
                      <TableHead>Applicable For</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStructures.map((structure) => (
                      <TableRow key={structure.id}>
                        <TableCell className="font-medium">{structure.name}</TableCell>
                        <TableCell>{structure.academicYear}</TableCell>
                        <TableCell>{structure.applicableClasses}</TableCell>
                        <TableCell>
                          ${structure.totalAmount.toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {structure.isActive ? (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">
                              Inactive
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewStructure(structure.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Copy className="h-4 w-4 mr-1" />
                            Clone
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="types">
          <div className="flex justify-between items-center mb-4">
            <div className="relative w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search fee types..."
                className="pl-9"
              />
            </div>
            <div className="space-x-2">
              <Button variant="outline">
                <Trash2 className="h-4 w-4 mr-1" />
                {selectedItems.length ? `Delete (${selectedItems.length})` : "Delete"}
              </Button>
            </div>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Fee Types</CardTitle>
              <CardDescription>
                Manage fee types that can be included in fee structures
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[40px]">
                        <Checkbox 
                          checked={selectedItems.length === feeTypes.length && feeTypes.length > 0}
                          onCheckedChange={handleCheckAllItems}
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Default Amount</TableHead>
                      <TableHead>Frequency</TableHead>
                      <TableHead>Optional</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feeTypes.map((type) => (
                      <TableRow key={type.id}>
                        <TableCell>
                          <Checkbox 
                            checked={selectedItems.includes(type.id)}
                            onCheckedChange={() => handleItemChecked(type.id)}
                          />
                        </TableCell>
                        <TableCell className="font-medium">{type.name}</TableCell>
                        <TableCell>{type.description || "—"}</TableCell>
                        <TableCell>${type.amount.toLocaleString()}</TableCell>
                        <TableCell>
                          {frequencyOptions.find(f => f.value === type.frequency)?.label || type.frequency}
                        </TableCell>
                        <TableCell>
                          {type.isOptional ? (
                            <Badge className="bg-amber-100 text-amber-800">Optional</Badge>
                          ) : (
                            <Badge className="bg-blue-100 text-blue-800">Required</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Fee Structure Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Fee Structure Details</DialogTitle>
            <DialogDescription>
              {selectedStructure?.name} - {selectedStructure?.academicYear}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStructure && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-blue-700 font-medium text-sm mb-1">Total Amount</div>
                  <div className="text-2xl font-bold">${selectedStructure.totalAmount.toLocaleString()}</div>
                </div>
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-green-700 font-medium text-sm mb-1">Status</div>
                  <div className="flex items-center">
                    {selectedStructure.isActive ? (
                      <>
                        <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                        <span className="text-xl font-bold text-green-800">Active</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
                        <span className="text-xl font-bold text-red-800">Inactive</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="border rounded-lg p-4">
                <h3 className="font-medium mb-2">Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Academic Year</p>
                    <p className="font-medium">{selectedStructure.academicYear}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Applicable Classes</p>
                    <p className="font-medium">{selectedStructure.applicableClasses}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valid From</p>
                    <p className="font-medium">{new Date(selectedStructure.validFrom).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Valid To</p>
                    <p className="font-medium">{new Date(selectedStructure.validTo).toLocaleDateString()}</p>
                  </div>
                  {selectedStructure.description && (
                    <div className="md:col-span-2">
                      <p className="text-sm text-gray-500">Description</p>
                      <p className="font-medium">{selectedStructure.description}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="border rounded-lg">
                <div className="bg-gray-50 p-4 border-b">
                  <h3 className="font-medium">Fee Items</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Fee Type</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Frequency</th>
                        <th className="py-3 px-4 text-left font-medium text-gray-500">Category</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedStructure.items.map((item) => (
                        <tr key={item.id} className="border-b">
                          <td className="py-3 px-4 align-middle font-medium">{item.name}</td>
                          <td className="py-3 px-4 align-middle">${item.amount.toLocaleString()}</td>
                          <td className="py-3 px-4 align-middle">
                            {frequencyOptions.find(f => f.value === item.frequency)?.label || item.frequency}
                          </td>
                          <td className="py-3 px-4 align-middle">
                            {feeTypes.find(t => t.name === item.name)?.isOptional ? (
                              <Badge className="bg-amber-100 text-amber-800">Optional</Badge>
                            ) : (
                              <Badge className="bg-blue-100 text-blue-800">Required</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50 font-medium">
                        <td className="py-3 px-4 align-middle">Total</td>
                        <td className="py-3 px-4 align-middle">${selectedStructure.totalAmount.toLocaleString()}</td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Eye className="h-4 w-4 mr-2" />
              Preview for Student
            </Button>
            <Button>
              <Edit className="h-4 w-4 mr-2" />
              Edit Structure
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
