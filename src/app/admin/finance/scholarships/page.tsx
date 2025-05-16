"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ChevronLeft, PlusCircle, Search, Filter,
  BadgeDollarSign, User, CheckCircle, XCircle, 
  Edit, Eye, Download, Trash2, BarChart4, 
  UserCheck, ArrowUp, Calendar, Clock, DollarSign,
  Printer
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
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Chart } from "@/components/dashboard/chart";
import { Progress } from "@/components/ui/progress";

// Mock data for scholarship programs
const scholarshipPrograms = [
  {
    id: "sp1",
    name: "Academic Excellence Scholarship",
    description: "For students with outstanding academic achievements",
    amount: 10000,
    percentage: null,
    duration: "Full Academic Year",
    criteria: "Minimum GPA of 3.75",
    fundedBy: "School Trust",
    recipientCount: 15,
    createdAt: "2023-06-15",
  },
  {
    id: "sp2",
    name: "Sports Merit Scholarship",
    description: "For students with exceptional sports achievements",
    amount: 8000,
    percentage: null,
    duration: "Full Academic Year",
    criteria: "National or state-level sports achievement",
    fundedBy: "Sports Department",
    recipientCount: 8,
    createdAt: "2023-06-20",
  },
  {
    id: "sp3",
    name: "Need-Based Financial Aid",
    description: "For students from economically disadvantaged backgrounds",
    amount: null,
    percentage: 50,
    duration: "Full Academic Year",
    criteria: "Family income below threshold",
    fundedBy: "Alumni Association",
    recipientCount: 25,
    createdAt: "2023-06-10",
  },
  {
    id: "sp4",
    name: "Arts and Culture Scholarship",
    description: "For students excelling in arts, music, or cultural activities",
    amount: 5000,
    percentage: null,
    duration: "Full Academic Year",
    criteria: "Exceptional achievement in arts or cultural activities",
    fundedBy: "Cultural Foundation",
    recipientCount: 6,
    createdAt: "2023-07-05",
  },
];

// Mock data for scholarship recipients
const scholarshipRecipients = [
  {
    id: "sr1",
    scholarshipId: "sp1",
    scholarshipName: "Academic Excellence Scholarship",
    studentId: "student1",
    studentName: "Emily Johnson",
    grade: "Grade 10-A",
    awardDate: "2023-08-01",
    endDate: "2024-05-31",
    amount: 10000,
    status: "ACTIVE",
    academicPerformance: 95.2,
  },
  {
    id: "sr2",
    scholarshipId: "sp2",
    scholarshipName: "Sports Merit Scholarship",
    studentId: "student2",
    studentName: "Michael Brown",
    grade: "Grade 11-B",
    awardDate: "2023-08-01",
    endDate: "2024-05-31",
    amount: 8000,
    status: "ACTIVE",
    academicPerformance: 85.5,
  },
  {
    id: "sr3",
    scholarshipId: "sp3",
    scholarshipName: "Need-Based Financial Aid",
    studentId: "student3",
    studentName: "Sophia Martinez",
    grade: "Grade 9-C",
    awardDate: "2023-08-01",
    endDate: "2024-05-31",
    amount: 12500,
    status: "ACTIVE",
    academicPerformance: 78.3,
  },
  {
    id: "sr4",
    scholarshipId: "sp4",
    scholarshipName: "Arts and Culture Scholarship",
    studentId: "student4",
    studentName: "David Wilson",
    grade: "Grade 11-A",
    awardDate: "2023-08-01",
    endDate: "2024-05-31",
    amount: 5000,
    status: "ACTIVE",
    academicPerformance: 88.7,
  },
  {
    id: "sr5",
    scholarshipId: "sp1",
    scholarshipName: "Academic Excellence Scholarship",
    studentId: "student5",
    studentName: "Emma Davis",
    grade: "Grade 12-B",
    awardDate: "2023-08-01",
    endDate: "2024-05-31",
    amount: 10000,
    status: "ACTIVE",
    academicPerformance: 97.8,
  },
];

// Mock data for students
const students = [
  { id: "student1", name: "Emily Johnson", grade: "Grade 10-A", averageGrade: 95.2, admissionId: "ADM20210001" },
  { id: "student2", name: "Michael Brown", grade: "Grade 11-B", averageGrade: 85.5, admissionId: "ADM20200015" },
  { id: "student3", name: "Sophia Martinez", grade: "Grade 9-C", averageGrade: 78.3, admissionId: "ADM20220008" },
  { id: "student4", name: "David Wilson", grade: "Grade 11-A", averageGrade: 88.7, admissionId: "ADM20200022" },
  { id: "student5", name: "Emma Davis", grade: "Grade 12-B", averageGrade: 97.8, admissionId: "ADM20190017" },
  { id: "student6", name: "James Taylor", grade: "Grade 10-B", averageGrade: 82.1, admissionId: "ADM20210033" },
  { id: "student7", name: "Olivia Harris", grade: "Grade 9-A", averageGrade: 91.5, admissionId: "ADM20220012" },
  { id: "student8", name: "William Anderson", grade: "Grade 12-A", averageGrade: 89.3, admissionId: "ADM20190005" },
];

// Academic years for the form
const academicYears = [
  { id: "1", name: "2023-2024" },
  { id: "2", name: "2022-2023" },
  { id: "3", name: "2024-2025" },
];

// Program statistics
const programStatistics = [
  { year: '2019', scholarships: 42 },
  { year: '2020', scholarships: 48 },
  { year: '2021', scholarships: 52 },
  { year: '2022', scholarships: 58 },
  { year: '2023', scholarships: 65 },
];

// Distribution by type
const scholarshipDistribution = [
  { type: 'Academic Excellence', count: 15 },
  { type: 'Sports Merit', count: 8 },
  { type: 'Need-Based', count: 25 },
  { type: 'Arts & Culture', count: 6 },
  { type: 'Leadership', count: 4 },
  { type: 'Alumni', count: 7 },
];

// Schema for scholarship program form
const scholarshipProgramSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  amountType: z.enum(["FIXED", "PERCENTAGE"]),
  amount: z.number().optional(),
  percentage: z.number().min(1).max(100).optional(),
  duration: z.string().min(3, "Duration must be specified"),
  criteria: z.string().min(5, "Criteria must be specified"),
  fundedBy: z.string().min(3, "Funding source must be specified"),
  academicYearId: z.string({
    required_error: "Please select an academic year",
  }),
});

// Schema for scholarship recipient form
const scholarshipRecipientSchema = z.object({
  scholarshipId: z.string({
    required_error: "Please select a scholarship program",
  }),
  studentId: z.string({
    required_error: "Please select a student",
  }),
  awardDate: z.string({
    required_error: "Award date is required",
  }),
  endDate: z.string({
    required_error: "End date is required",
  }),
  amount: z.number({
    required_error: "Amount is required",
  }).min(0, "Amount must be positive"),
  remarks: z.string().optional(),
});

export default function ScholarshipsPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createProgramDialog, setCreateProgramDialog] = useState(false);
  const [viewProgramDialog, setViewProgramDialog] = useState(false);
  const [addRecipientDialog, setAddRecipientDialog] = useState(false);
  const [viewRecipientDialog, setViewRecipientDialog] = useState(false);
  const [selectedProgram, setSelectedProgram] = useState<any>(null);
  const [selectedRecipient, setSelectedRecipient] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("programs");

  // Initialize form for scholarship program
  const programForm = useForm<z.infer<typeof scholarshipProgramSchema>>({
    resolver: zodResolver(scholarshipProgramSchema),
    defaultValues: {
      amountType: "FIXED",
      amount: 0,
    },
  });

  // Initialize form for scholarship recipient
  const recipientForm = useForm<z.infer<typeof scholarshipRecipientSchema>>({
    resolver: zodResolver(scholarshipRecipientSchema),
    defaultValues: {
      awardDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear() + 1, 4, 31).toISOString().split('T')[0], // Next year May 31
      amount: 0,
    },
  });

  // Filter scholarship programs based on search
  const filteredPrograms = scholarshipPrograms.filter(program => 
    program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    program.fundedBy.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Filter scholarship recipients based on search and status
  const filteredRecipients = scholarshipRecipients.filter(recipient => {
    const matchesSearch = 
      recipient.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipient.scholarshipName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || recipient.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  function handleCreateProgram() {
    programForm.reset({
      name: "",
      description: "",
      amountType: "FIXED",
      amount: 0,
      percentage: undefined,
      duration: "",
      criteria: "",
      fundedBy: "",
    });
    setCreateProgramDialog(true);
  }

  function handleViewProgram(programId: string) {
    const program = scholarshipPrograms.find(p => p.id === programId);
    if (program) {
      setSelectedProgram(program);
      setViewProgramDialog(true);
    }
  }

  function handleAddRecipient(programId?: string) {
    recipientForm.reset({
      scholarshipId: programId || "",
      studentId: "",
      awardDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().getFullYear() + 1, 4, 31).toISOString().split('T')[0],
      amount: 0,
      remarks: "",
    });
    setAddRecipientDialog(true);
  }

  function handleViewRecipient(recipientId: string) {
    const recipient = scholarshipRecipients.find(r => r.id === recipientId);
    if (recipient) {
      setSelectedRecipient(recipient);
      setViewRecipientDialog(true);
    }
  }

  function onSubmitProgram(values: z.infer<typeof scholarshipProgramSchema>) {
    console.log("Scholarship program created:", values);
    setCreateProgramDialog(false);
  }

  function onSubmitRecipient(values: z.infer<typeof scholarshipRecipientSchema>) {
    console.log("Scholarship recipient added:", values);
    setAddRecipientDialog(false);
  }

  function getScholarshipAmount(program: any) {
    if (program.amount !== null) {
      return `$${program.amount.toLocaleString()}`;
    } else if (program.percentage !== null) {
      return `${program.percentage}% of fees`;
    }
    return "Varies";
  }

  function onAmountTypeChange(value: "FIXED" | "PERCENTAGE") {
    programForm.setValue("amountType", value);
    if (value === "FIXED") {
      programForm.setValue("percentage", undefined);
    } else {
      programForm.setValue("amount", undefined);
    }
  }

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
          <h1 className="text-2xl font-bold tracking-tight">Scholarship Management</h1>
        </div>
        <div className="flex gap-2">
          <Dialog open={addRecipientDialog} onOpenChange={setAddRecipientDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={() => handleAddRecipient()}>
                <UserCheck className="mr-2 h-4 w-4" /> Award Scholarship
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Award Scholarship</DialogTitle>
                <DialogDescription>
                  Assign a scholarship to a student
                </DialogDescription>
              </DialogHeader>
              <Form {...recipientForm}>
                <form onSubmit={recipientForm.handleSubmit(onSubmitRecipient)} className="space-y-4">
                  <FormField
                    control={recipientForm.control}
                    name="scholarshipId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scholarship Program</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select scholarship program" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {scholarshipPrograms.map(program => (
                              <SelectItem key={program.id} value={program.id}>
                                {program.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={recipientForm.control}
                    name="studentId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select student" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {students.map(student => (
                              <SelectItem key={student.id} value={student.id}>
                                {student.name} ({student.grade})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={recipientForm.control}
                      name="awardDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Award Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={recipientForm.control}
                      name="endDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Date</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={recipientForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scholarship Amount</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0} 
                            step="0.01"
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
                    control={recipientForm.control}
                    name="remarks"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Remarks (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Additional notes about this scholarship award" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setAddRecipientDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Award Scholarship</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={createProgramDialog} onOpenChange={setCreateProgramDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleCreateProgram}>
                <PlusCircle className="mr-2 h-4 w-4" /> Create Program
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-xl">
              <DialogHeader>
                <DialogTitle>Create Scholarship Program</DialogTitle>
                <DialogDescription>
                  Define a new scholarship program for students
                </DialogDescription>
              </DialogHeader>
              <Form {...programForm}>
                <form onSubmit={programForm.handleSubmit(onSubmitProgram)} className="space-y-4">
                  <FormField
                    control={programForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Program Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Academic Excellence Scholarship" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={programForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed description of the scholarship program" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={programForm.control}
                    name="amountType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scholarship Type</FormLabel>
                        <Select onValueChange={(value: "FIXED" | "PERCENTAGE") => onAmountTypeChange(value)} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="FIXED">Fixed Amount</SelectItem>
                            <SelectItem value="PERCENTAGE">Percentage of Fees</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {programForm.watch("amountType") === "FIXED" ? (
                    <FormField
                      control={programForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Scholarship Amount</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={0} 
                              step="0.01"
                              placeholder="0.00" 
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              value={field.value === undefined ? "" : field.value}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={programForm.control}
                      name="percentage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Percentage of Fees</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              min={1} 
                              max={100}
                              placeholder="e.g., 50" 
                              {...field}
                              onChange={e => field.onChange(parseFloat(e.target.value))}
                              value={field.value === undefined ? "" : field.value}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter a percentage between 1 and 100
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={programForm.control}
                      name="duration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Full Academic Year" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={programForm.control}
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
                    control={programForm.control}
                    name="criteria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Eligibility Criteria</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Specify the criteria students must meet to qualify" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={programForm.control}
                    name="fundedBy"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Funded By</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., School Trust, Alumni Association" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCreateProgramDialog(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Create Program</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Total Scholarships</CardTitle>
            <CardDescription>Currently active</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{scholarshipRecipients.length}</div>
                <div className="text-sm text-gray-500 flex items-center">
                  <ArrowUp className="h-3 w-3 text-green-500 mr-1" />
                  <span className="text-green-500 mr-1">12%</span>
                  <span>vs last year</span>
                </div>
              </div>
              <div className="p-2 bg-blue-50 rounded-md text-blue-700">
                <BadgeDollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Amount Awarded</CardTitle>
            <CardDescription>Current academic year</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">$45,500</div>
                <div className="text-sm text-gray-500">Total scholarship funds</div>
              </div>
              <div className="p-2 bg-green-50 rounded-md text-green-700">
                <DollarSign className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Programs</CardTitle>
            <CardDescription>Active scholarship types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold">{scholarshipPrograms.length}</div>
                <div className="text-sm text-gray-500">Different programs</div>
              </div>
              <div className="p-2 bg-purple-50 rounded-md text-purple-700">
                <BarChart4 className="h-6 w-6" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="programs" onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="programs">Programs</TabsTrigger>
          <TabsTrigger value="recipients">Recipients</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="programs">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Scholarship Programs</CardTitle>
                  <CardDescription>
                    Manage all scholarship programs
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search programs..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Name</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Funded By</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Recipients</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPrograms.length > 0 ? filteredPrograms.map((program) => (
                      <tr key={program.id} className="border-b">
                        <td className="py-3 px-4 align-middle">
                          <div className="font-medium">{program.name}</div>
                          <div className="text-xs text-gray-500">{program.criteria}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {getScholarshipAmount(program)}
                        </td>
                        <td className="py-3 px-4 align-middle">{program.fundedBy}</td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className="bg-blue-100 text-blue-800">
                            {program.recipientCount} students
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewProgram(program.id)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleAddRecipient(program.id)}
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Award
                          </Button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-gray-500">
                          No scholarship programs found matching your search criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="recipients">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <CardTitle>Scholarship Recipients</CardTitle>
                  <CardDescription>
                    Students awarded scholarships
                  </CardDescription>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 md:w-64">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                    <Input
                      type="search"
                      placeholder="Search recipients..."
                      className="pl-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="ACTIVE">Active</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                      <SelectItem value="REVOKED">Revoked</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Student</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Scholarship</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Amount</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Period</th>
                      <th className="py-3 px-4 text-left font-medium text-gray-500">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-gray-500">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRecipients.length > 0 ? filteredRecipients.map((recipient) => (
                      <tr key={recipient.id} className="border-b">
                        <td className="py-3 px-4 align-middle">
                          <div className="font-medium">{recipient.studentName}</div>
                          <div className="text-xs text-gray-500">{recipient.grade}</div>
                        </td>
                        <td className="py-3 px-4 align-middle">{recipient.scholarshipName}</td>
                        <td className="py-3 px-4 align-middle font-medium">
                          ${recipient.amount.toLocaleString()}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-gray-500" />
                            <span className="text-xs">{new Date(recipient.awardDate).toLocaleDateString()} - {new Date(recipient.endDate).toLocaleDateString()}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className="bg-green-100 text-green-800">
                            {recipient.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleViewRecipient(recipient.id)}
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
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={6} className="py-6 text-center text-gray-500">
                          No scholarship recipients found matching your criteria
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="analytics">
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Scholarship Growth</CardTitle>
                <CardDescription>
                  Total scholarships awarded by year
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Chart
                  title=""
                  data={programStatistics}
                  type="bar"
                  xKey="year"
                  yKey="scholarships"
                  categories={["scholarships"]}
                  colors={["#3b82f6"]}
                />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Scholarship Distribution</CardTitle>
                <CardDescription>
                  Distribution by scholarship type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Chart
                  title=""
                  data={scholarshipDistribution}
                  type="pie"
                  xKey="type"
                  yKey="count"
                  colors={["#3b82f6", "#10b981", "#f59e0b", "#ec4899", "#6366f1", "#8b5cf6"]}
                />
              </CardContent>
            </Card>
          </div>
          
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Scholarship Budget Allocation</CardTitle>
              <CardDescription>
                Annual budget allocation for scholarship programs
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Academic Excellence</span>
                    <span className="text-sm font-medium">$150,000 (33.3%)</span>
                  </div>
                  <Progress value={33.3} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Need-Based Financial Aid</span>
                    <span className="text-sm font-medium">$180,000 (40.0%)</span>
                  </div>
                  <Progress value={40} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Sports Merit</span>
                    <span className="text-sm font-medium">$64,000 (14.2%)</span>
                  </div>
                  <Progress value={14.2} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Arts & Cultural</span>
                    <span className="text-sm font-medium">$30,000 (6.7%)</span>
                  </div>
                  <Progress value={6.7} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Other Scholarships</span>
                    <span className="text-sm font-medium">$26,000 (5.8%)</span>
                  </div>
                  <Progress value={5.8} className="h-2" />
                </div>
                
                <div className="pt-4 border-t">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Total Scholarship Budget</span>
                    <span>$450,000</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* View Program Dialog */}
      <Dialog open={viewProgramDialog} onOpenChange={setViewProgramDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Scholarship Program Details</DialogTitle>
            <DialogDescription>
              Full information about this scholarship program
            </DialogDescription>
          </DialogHeader>
          
          {selectedProgram && (
            <div className="space-y-4">
              <div className="flex flex-col space-y-1">
                <h3 className="text-lg font-semibold">{selectedProgram.name}</h3>
                <Badge className="bg-blue-100 text-blue-800 w-fit">
                  {selectedProgram.recipientCount} Recipients
                </Badge>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-700 font-medium mb-1">Amount</div>
                  <div className="text-2xl font-bold text-green-800">
                    {getScholarshipAmount(selectedProgram)}
                  </div>
                </div>
                <div className="flex-1 bg-blue-50 p-4 rounded-lg">
                  <div className="text-sm text-blue-700 font-medium mb-1">Duration</div>
                  <div className="text-lg font-bold text-blue-800">{selectedProgram.duration}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b py-4">
                <div>
                  <p className="text-sm text-gray-500">Funded By</p>
                  <p className="font-medium">{selectedProgram.fundedBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Created</p>
                  <p className="font-medium">{new Date(selectedProgram.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Description</p>
                <p>{selectedProgram.description}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Eligibility Criteria</p>
                <p>{selectedProgram.criteria}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium mb-2">Current Recipients</p>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-2 px-3 text-left font-medium text-gray-500">Student</th>
                        <th className="py-2 px-3 text-left font-medium text-gray-500">Grade</th>
                        <th className="py-2 px-3 text-left font-medium text-gray-500">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scholarshipRecipients
                        .filter(r => r.scholarshipId === selectedProgram.id)
                        .slice(0, 3)
                        .map(recipient => (
                          <tr key={recipient.id} className="border-b">
                            <td className="py-2 px-3 align-middle font-medium">{recipient.studentName}</td>
                            <td className="py-2 px-3 align-middle">{recipient.grade}</td>
                            <td className="py-2 px-3 align-middle">${recipient.amount.toLocaleString()}</td>
                          </tr>
                        ))}
                      {scholarshipRecipients.filter(r => r.scholarshipId === selectedProgram.id).length > 3 && (
                        <tr>
                          <td colSpan={3} className="py-2 px-3 text-center text-xs text-gray-500">
                            And {scholarshipRecipients.filter(r => r.scholarshipId === selectedProgram.id).length - 3} more recipients
                          </td>
                        </tr>
                      )}
                      {scholarshipRecipients.filter(r => r.scholarshipId === selectedProgram.id).length === 0 && (
                        <tr>
                          <td colSpan={3} className="py-3 text-center text-gray-500">
                            No recipients yet
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewProgramDialog(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setViewProgramDialog(false);
              selectedProgram && handleAddRecipient(selectedProgram.id);
            }}>
              <UserCheck className="h-4 w-4 mr-2" />
              Award
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Recipient Dialog */}
      <Dialog open={viewRecipientDialog} onOpenChange={setViewRecipientDialog}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Scholarship Recipient Details</DialogTitle>
            <DialogDescription>
              Complete information about this scholarship award
            </DialogDescription>
          </DialogHeader>
          
          {selectedRecipient && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{selectedRecipient.studentName}</h3>
                  <p className="text-sm text-gray-500">{selectedRecipient.grade}</p>
                </div>
                <Badge className="bg-green-100 text-green-800">
                  {selectedRecipient.status}
                </Badge>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3">
                <div className="flex-1 bg-purple-50 p-4 rounded-lg">
                  <div className="text-sm text-purple-700 font-medium mb-1">Scholarship</div>
                  <div className="text-lg font-bold text-purple-800">{selectedRecipient.scholarshipName}</div>
                </div>
                <div className="flex-1 bg-green-50 p-4 rounded-lg">
                  <div className="text-sm text-green-700 font-medium mb-1">Amount</div>
                  <div className="text-2xl font-bold text-green-800">${selectedRecipient.amount.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-b py-4">
                <div>
                  <p className="text-sm text-gray-500">Award Date</p>
                  <p className="font-medium">{new Date(selectedRecipient.awardDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">End Date</p>
                  <p className="font-medium">{new Date(selectedRecipient.endDate).toLocaleDateString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Academic Performance</p>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={selectedRecipient.academicPerformance} 
                      className="h-2 flex-1" 
                      style={{
                        "--progress-foreground": 
                          selectedRecipient.academicPerformance > 90 ? "rgb(34, 197, 94)" :
                          selectedRecipient.academicPerformance > 75 ? "rgb(59, 130, 246)" :
                          "rgb(245, 158, 11)"
                      } as React.CSSProperties}
                    />
                    <span className="font-medium">{selectedRecipient.academicPerformance}%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Student ID</p>
                  <p className="font-medium">
                    {students.find(s => s.id === selectedRecipient.studentId)?.admissionId || "N/A"}
                  </p>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500 mb-1">Payment Schedule</p>
                <div className="rounded-md border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 border-b">
                        <th className="py-2 px-3 text-left font-medium text-gray-500">Payment Date</th>
                        <th className="py-2 px-3 text-left font-medium text-gray-500">Amount</th>
                        <th className="py-2 px-3 text-left font-medium text-gray-500">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-2 px-3 align-middle">Aug 1, 2023</td>
                        <td className="py-2 px-3 align-middle">${(selectedRecipient.amount / 2).toLocaleString()}</td>
                        <td className="py-2 px-3 align-middle">
                          <Badge className="bg-green-100 text-green-800">Paid</Badge>
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 align-middle">Jan 15, 2024</td>
                        <td className="py-2 px-3 align-middle">${(selectedRecipient.amount / 2).toLocaleString()}</td>
                        <td className="py-2 px-3 align-middle">
                          <Badge className="bg-amber-100 text-amber-800">Scheduled</Badge>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewRecipientDialog(false)}>
              Close
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
