"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  PlusCircle, 
  Search, 
  Filter, 
  FileText, 
  FolderOpen, 
  File, 
  Upload, 
  Download, 
  Eye, 
  Edit, 
  Trash2, 
  Tag, 
  Clock, 
  User as UserIcon,
  Image,
  FileIcon
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import toast from "react-hot-toast";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { 
  documentSchema,
  documentTypeSchema,
  documentFilterSchema,
  type DocumentData,
  type DocumentTypeData,
  type DocumentFilterData
} from "@/lib/schemaValidation/documentSchemaValidation";

import {
  getDocuments,
  getDocumentTypes,
  createDocument,
  updateDocument,
  deleteDocument,
  createDocumentType,
  getRecentDocuments
} from "@/lib/actions/documentActions";

import { Spinner } from "@/components/ui/spinner";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { useAuth } from "@clerk/nextjs";

// Utility function to format dates
const formatDate = (date: Date | string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// Utility function to format file size
const formatFileSize = (bytes?: number) => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return bytes + " B";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  else return (bytes / 1048576).toFixed(1) + " MB";
};

// Get file icon based on MIME type
const getFileIcon = (fileType?: string, size = 16) => {
  if (!fileType) return <FileIcon size={size} />;
  
  if (fileType.startsWith('image/')) return <Image size={size} />;
  else if (fileType === 'application/pdf') return <FileText size={size} />;
  else if (fileType.includes('spreadsheet') || fileType.includes('excel')) return <FileText size={size} />;
  else if (fileType.includes('document') || fileType.includes('word')) return <FileText size={size} />;
  
  return <File size={size} />;
};

// For testing only - replace with real user authentication in production
const TEMP_USER_ID = "clqgwvnp30000s53p9g8a3qpp"; // Replace with an actual user ID from your database

export default function DocumentsPage() {
  const { userId } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [documentTypes, setDocumentTypes] = useState<any[]>([]);
  const [recentDocs, setRecentDocs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Initialize document form
  const documentForm = useForm<DocumentData>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      title: "",
      isPublic: false,
      userId: TEMP_USER_ID, // Use a real user ID from your database
    },
  });

  // Initialize document type form
  const typeForm = useForm<DocumentTypeData>({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: {
      name: "",
    },
  });

  // Load documents and document types on initial render
  useEffect(() => {
    fetchDocuments();
    fetchDocumentTypes();
    fetchRecentDocuments();
  }, []);

  // Fetch documents with the current filters
  const fetchDocuments = async () => {
    setIsLoading(true);
    
    const filter: DocumentFilterData = {};
    
    if (searchTerm) {
      filter.searchTerm = searchTerm;
    }
    
    if (typeFilter && typeFilter !== "ALL") {
      filter.documentTypeId = typeFilter;
    }
    
    // Special filters for tabs
    if (activeTab === "public") {
      filter.isPublic = true;
    } else if (activeTab === "private") {
      filter.isPublic = false;
    }
    
    const result = await getDocuments(filter);
    
    if (result.success && result.data) {
      setDocuments(result.data);
    } else {
      toast.error(result.error || "Failed to fetch documents");
    }
    
    setIsLoading(false);
  };

  // Fetch document types
  const fetchDocumentTypes = async () => {
    const result = await getDocumentTypes();
    
    if (result.success && result.data) {
      setDocumentTypes(result.data);
    } else {
      toast.error(result.error || "Failed to fetch document types");
    }
  };

  // Fetch recent documents
  const fetchRecentDocuments = async () => {
    const result = await getRecentDocuments(5);
    
    if (result.success && result.data) {
      setRecentDocs(result.data);
    } else {
      toast.error(result.error || "Failed to fetch recent documents");
    }
  };

  // Handle search
  const handleSearch = () => {
    fetchDocuments();
  };

  // Handle document creation
  const handleCreateDocument = async (data: DocumentData) => {
    const result = await createDocument(data);
    
    if (result.success && result.data) {
      toast.success("Document uploaded successfully");
      setUploadDialogOpen(false);
      documentForm.reset();
      fetchDocuments();
      fetchRecentDocuments();
    } else {
      toast.error(result.error || "Failed to upload document");
    }
  };

  // Handle document type creation
  const handleCreateDocumentType = async (data: DocumentTypeData) => {
    const result = await createDocumentType(data);
    
    if (result.success && result.data) {
      toast.success("Document type created successfully");
      setTypeDialogOpen(false);
      typeForm.reset();
      fetchDocumentTypes();
    } else {
      toast.error(result.error || "Failed to create document type");
    }
  };

  // Handle document deletion
  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    
    const result = await deleteDocument(id);
    
    if (result.success) {
      toast.success("Document deleted successfully");
      fetchDocuments();
      fetchRecentDocuments();
    } else {
      toast.error(result.error || "Failed to delete document");
    }
  };

  // Handle file selection and upload to Cloudinary
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    setUploadProgress(10); // Show initial progress
    
    try {
      // Create simulated progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          const newProgress = prev + 5;
          if (newProgress >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return newProgress;
        });
      }, 300);
      
      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file, "documents");
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Set form values with Cloudinary result
      documentForm.setValue("fileName", file.name);
      documentForm.setValue("fileUrl", uploadResult.secure_url);
      documentForm.setValue("fileType", file.type);
      documentForm.setValue("fileSize", uploadResult.bytes);
      
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error("Error uploading file:", error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
      // Reset progress after a short delay
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  // Reset form when dialog opens
  const handleOpenUploadDialog = () => {
    documentForm.reset({
      title: "",
      isPublic: false,
      userId: TEMP_USER_ID, // Use the same user ID
    });
    setUploadProgress(0);
    setUploadDialogOpen(true);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Document Management</h1>
        <div className="flex gap-2">
          <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <FolderOpen className="mr-2 h-4 w-4" /> Add Document Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Document Type</DialogTitle>
                <DialogDescription>
                  Add a new document type to organize your documents.
                </DialogDescription>
              </DialogHeader>
              <Form {...typeForm}>
                <form onSubmit={typeForm.handleSubmit(handleCreateDocumentType)} className="space-y-4">
                  <FormField
                    control={typeForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g. Contract, Form, Certificate" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={typeForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of this document type" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit">Create Document Type</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
          
          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleOpenUploadDialog}>
                <PlusCircle className="mr-2 h-4 w-4" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogDescription>
                  Upload a new document to the system.
                </DialogDescription>
              </DialogHeader>
              <Form {...documentForm}>
                <form onSubmit={documentForm.handleSubmit(handleCreateDocument)} className="space-y-4">
                  <div className={`border-dashed border-2 border-gray-300 rounded-lg p-8 text-center mb-4 ${
                    uploading ? 'bg-accent' : ''
                  }`}>
                    <Input 
                      type="file" 
                      className="hidden" 
                      id="file-upload" 
                      onChange={handleFileChange}
                      disabled={uploading}
                    />
                    <label 
                      htmlFor="file-upload" 
                      className={`cursor-pointer flex flex-col items-center ${uploading ? 'opacity-50' : ''}`}
                    >
                      {uploading ? (
                        <>
                          <Spinner className="h-8 w-8 text-primary mb-2" />
                          <span className="text-sm font-medium">Uploading... {uploadProgress}%</span>
                        </>
                      ) : (
                        <>
                          <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                          <span className="text-sm font-medium">Click to select file or drag and drop</span>
                          <span className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, Images up to 10MB</span>
                        </>
                      )}
                    </label>
                    
                    {uploadProgress > 0 && (
                      <div className="w-full mt-4">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-primary h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {documentForm.watch("fileName") && (
                    <div className="flex items-center p-2 bg-primary/10 rounded text-sm mb-4">
                      <FileText className="h-4 w-4 text-primary mr-2" />
                      <span className="text-primary">{documentForm.watch("fileName")}</span>
                      <span className="ml-2 text-primary">
                        ({formatFileSize(documentForm.watch("fileSize"))})
                      </span>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={documentForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Title*</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter document title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={documentForm.control}
                      name="documentTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Document Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select document type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {documentTypes.map((type) => (
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
                  </div>
                  
                  <FormField
                    control={documentForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Enter document description" 
                            className="min-h-20" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={documentForm.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Comma-separated tags (e.g. contract, legal, 2023)" 
                            {...field} 
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormDescription>
                          Tags help in searching and filtering documents.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={documentForm.control}
                    name="isPublic"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Public Document
                          </FormLabel>
                          <FormDescription>
                            Make this document accessible to all users.
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <DialogFooter>
                    <Button 
                      variant="outline" 
                      type="button"
                      onClick={() => setUploadDialogOpen(false)}
                      disabled={uploading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={uploading || !documentForm.watch("fileUrl")}
                    >
                      {uploading ? "Uploading..." : "Upload Document"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">All Documents</CardTitle>
            <CardDescription>Total documents in system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {documents.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Document Types</CardTitle>
            <CardDescription>Classification categories</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {documentTypes.length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Public Documents</CardTitle>
            <CardDescription>Accessible to all users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {documents.filter(doc => doc.isPublic).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Private Documents</CardTitle>
            <CardDescription>Restricted access</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {documents.filter(doc => !doc.isPublic).length}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 mt-4 md:grid-cols-3">
        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader>
            <CardTitle className="text-lg">Recent Documents</CardTitle>
            <CardDescription>Latest uploads to the system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocs.length > 0 ? (
                recentDocs.map((doc) => (
                  <div key={doc.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                    <div className="p-2 bg-primary/10 rounded-full h-fit text-primary">
                      {getFileIcon(doc.fileType, 16)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{doc.title}</p>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <UserIcon className="h-3 w-3" />
                          {doc.user.firstName} {doc.user.lastName}
                        </span>
                        <span className="mx-2">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(doc.createdAt)}
                        </span>
                        {doc.documentType && (
                          <>
                            <span className="mx-2">•</span>
                            <span className="flex items-center gap-1">
                              <FolderOpen className="h-3 w-3" />
                              {doc.documentType.name}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    <Link href={doc.fileUrl} target="_blank">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-muted-foreground">No recent documents found</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t">
            <Button variant="outline" size="sm" className="ml-auto" onClick={handleOpenUploadDialog}>
              <Upload className="mr-2 h-4 w-4" /> Upload Document
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Document Types</CardTitle>
            <CardDescription>Categories for organization</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documentTypes.length > 0 ? (
                documentTypes.map((type) => (
                  <div 
                    key={type.id} 
                    className="flex justify-between items-center p-2 rounded hover:bg-accent/50"
                  >
                    <div>
                      <p className="font-medium text-sm">{type.name}</p>
                      <p className="text-xs text-muted-foreground">{type._count.documents} documents</p>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setTypeFilter(type.id)}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <FolderOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                  <p className="text-muted-foreground">No document types found</p>
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t">
            <Button 
              variant="outline" 
              size="sm" 
              className="ml-auto"
              onClick={() => setTypeDialogOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" /> Add Type
            </Button>
          </CardFooter>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-xl">All Documents</CardTitle>
              <CardDescription>
                Browse, search and manage all documents
              </CardDescription>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search documents..."
                  className="pl-9"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />
              </div>
              <Select 
                value={typeFilter} 
                onValueChange={(value) => {
                  setTypeFilter(value);
                  fetchDocuments();
                }}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Document Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {documentTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={handleSearch}>
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={(value) => {
            setActiveTab(value);
            fetchDocuments();
          }}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="public">Public</TabsTrigger>
              <TabsTrigger value="private">Private</TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="flex justify-center py-8">
                <svg
                  className="animate-spin h-8 w-8 text-muted-foreground"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              </div>
            ) : documents.length > 0 ? (
              <div className="rounded-md border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-accent border-b">
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Document</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Type</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Uploaded By</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Date</th>
                      <th className="py-3 px-4 text-left font-medium text-muted-foreground">Status</th>
                      <th className="py-3 px-4 text-right font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((doc) => (
                      <tr key={doc.id} className="border-b">
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            {getFileIcon(doc.fileType, 20)}
                            <div>
                              <p className="font-medium">{doc.title}</p>
                              <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">
                          {doc.documentType ? (
                            <Badge variant="outline">{doc.documentType.name}</Badge>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 align-middle">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                              {doc.user.firstName.charAt(0)}{doc.user.lastName.charAt(0)}
                            </div>
                            <span>{doc.user.firstName} {doc.user.lastName}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 align-middle">{formatDate(doc.createdAt)}</td>
                        <td className="py-3 px-4 align-middle">
                          <Badge className={`${doc.isPublic ? 'bg-green-100 text-green-800' : 'bg-muted text-gray-800'}`}>
                            {doc.isPublic ? 'Public' : 'Private'}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 align-middle text-right">
                          <Link href={doc.fileUrl} target="_blank">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4 mr-1" /> View
                            </Button>
                          </Link>
                          <Link href={doc.fileUrl} download>
                            <Button variant="ghost" size="sm">
                              <Download className="h-4 w-4 mr-1" /> Download
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDeleteDocument(doc.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-10">
                <FileText className="h-10 w-10 mx-auto text-gray-300 mb-2" />
                <h3 className="text-lg font-medium mb-2">No documents found</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm || typeFilter
                    ? "Try adjusting your filters to find what you're looking for"
                    : "Get started by uploading your first document"
                  }
                </p>
                <Button onClick={handleOpenUploadDialog}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Upload Document
                </Button>
              </div>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
