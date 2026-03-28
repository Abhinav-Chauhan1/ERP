"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Search, Filter, FileText, FolderOpen, File, Upload, Download, Clock, User as UserIcon, Image as ImageIcon, FileIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentsTable } from "@/components/admin/documents-table";
import toast from "react-hot-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useSession } from "next-auth/react";
import { documentSchema, documentTypeSchema, type DocumentData, type DocumentTypeData, type DocumentFilterData } from "@/lib/schemaValidation/documentSchemaValidation";
import { getDocumentsPageData, getDocuments, createDocument, deleteDocument, createDocumentType } from "@/lib/actions/documentActions";
import { Spinner } from "@/components/ui/spinner";
import { uploadHandler } from "@/lib/services/upload-handler";

const formatDate = (date: Date | string) => {
  if (!date) return "";
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};
const formatFileSize = (bytes?: number) => {
  if (!bytes) return "Unknown size";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / 1048576).toFixed(1) + " MB";
};
const getFileIcon = (fileType?: string, size = 16) => {
  if (!fileType) return <FileIcon size={size} />;
  if (fileType.startsWith("image/")) return <ImageIcon size={size} />;
  if (fileType === "application/pdf") return <FileText size={size} />;
  return <File size={size} />;
};

interface Props {
  initialDocuments: any[];
  initialDocumentTypes: any[];
  initialRecentDocs: any[];
  initialTotal: number;
  initialPage: number;
  pageSize: number;
}

export function AdminDocumentsClient({ initialDocuments, initialDocumentTypes, initialRecentDocs, initialTotal, initialPage, pageSize }: Props) {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const [isPending, startTransition] = useTransition();

  const [documents, setDocuments] = useState<any[]>(initialDocuments);
  const [documentTypes, setDocumentTypes] = useState<any[]>(initialDocumentTypes);
  const [recentDocs, setRecentDocs] = useState<any[]>(initialRecentDocs);
  const [total, setTotal] = useState(initialTotal);
  const [page, setPage] = useState(initialPage);

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [typeDialogOpen, setTypeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const documentForm = useForm<DocumentData>({
    resolver: zodResolver(documentSchema),
    defaultValues: { title: "", isPublic: false, userId: userId || "" },
  });
  const typeForm = useForm<DocumentTypeData>({
    resolver: zodResolver(documentTypeSchema),
    defaultValues: { name: "" },
  });

  const buildFilter = (pg = page): DocumentFilterData & { page: number; limit: number } => {
    const f: any = { page: pg, limit: pageSize };
    if (searchTerm) f.searchTerm = searchTerm;
    if (typeFilter && typeFilter !== "ALL") f.documentTypeId = typeFilter;
    if (activeTab === "public") f.isPublic = true;
    if (activeTab === "private") f.isPublic = false;
    return f;
  };

  const refresh = (pg?: number) => {
    startTransition(async () => {
      const res = await getDocumentsPageData(buildFilter(pg ?? page));
      if (res.success) {
        setDocuments(res.documents);
        setDocumentTypes(res.documentTypes);
        setRecentDocs(res.recentDocs);
        setTotal(res.total);
        if (pg !== undefined) setPage(pg);
      } else {
        toast.error(res.error || "Failed to load documents");
      }
    });
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    startTransition(async () => {
      const f: any = { page: 1, limit: pageSize };
      if (searchTerm) f.searchTerm = searchTerm;
      if (typeFilter && typeFilter !== "ALL") f.documentTypeId = typeFilter;
      if (tab === "public") f.isPublic = true;
      if (tab === "private") f.isPublic = false;
      const res = await getDocumentsPageData(f);
      if (res.success) { setDocuments(res.documents); setDocumentTypes(res.documentTypes); setRecentDocs(res.recentDocs); setTotal(res.total); setPage(1); }
    });
  };

  const handleCreateDocument = async (data: DocumentData) => {
    const result = await createDocument({ ...data, userId: userId || data.userId });
    if (result.success) {
      toast.success("Document uploaded successfully");
      setUploadDialogOpen(false);
      documentForm.reset({ title: "", isPublic: false, userId: userId || "" });
      refresh(1);
    } else {
      toast.error(result.error || "Failed to upload document");
    }
  };

  const handleCreateDocumentType = async (data: DocumentTypeData) => {
    const result = await createDocumentType(data);
    if (result.success) {
      toast.success("Document type created");
      setTypeDialogOpen(false);
      typeForm.reset();
      refresh();
    } else {
      toast.error(result.error || "Failed to create document type");
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm("Are you sure you want to delete this document?")) return;
    const result = await deleteDocument(id);
    if (result.success) { toast.success("Document deleted"); refresh(); }
    else toast.error(result.error || "Failed to delete document");
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadProgress(10);
    try {
      const interval = setInterval(() => {
        setUploadProgress(p => { const n = p + 5; if (n >= 90) { clearInterval(interval); return 90; } return n; });
      }, 300);
      const result = await uploadHandler.uploadFile(file, { folder: "documents", customMetadata: { uploadType: "admin-document" } });
      clearInterval(interval);
      setUploadProgress(100);
      if (!result.success || !result.url) throw new Error(result.error || "Upload failed");
      documentForm.setValue("fileName", file.name);
      documentForm.setValue("fileUrl", result.url);
      documentForm.setValue("fileType", file.type);
      documentForm.setValue("fileSize", file.size);
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to upload file");
    } finally {
      setUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const totalPages = Math.ceil(total / pageSize);
  const publicCount = documents.filter(d => d.isPublic).length;
  const privateCount = documents.filter(d => !d.isPublic).length;

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Document Management</h1>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <Dialog open={typeDialogOpen} onOpenChange={setTypeDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto"><FolderOpen className="mr-2 h-4 w-4" />Add Document Type</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Create Document Type</DialogTitle><DialogDescription>Add a new document type to organize your documents.</DialogDescription></DialogHeader>
              <Form {...typeForm}>
                <form onSubmit={typeForm.handleSubmit(handleCreateDocumentType)} className="space-y-4">
                  <FormField control={typeForm.control} name="name" render={({ field }) => (
                    <FormItem><FormLabel>Type Name</FormLabel><FormControl><Input placeholder="e.g. Contract, Form, Certificate" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={typeForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description (Optional)</FormLabel><FormControl><Textarea placeholder="Brief description" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <DialogFooter><Button type="submit">Create Document Type</Button></DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto" onClick={() => { documentForm.reset({ title: "", isPublic: false, userId: userId || "" }); setUploadProgress(0); setUploadDialogOpen(true); }}>
                <PlusCircle className="mr-2 h-4 w-4" />Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader><DialogTitle>Upload Document</DialogTitle><DialogDescription>Upload a new document to the system.</DialogDescription></DialogHeader>
              <Form {...documentForm}>
                <form onSubmit={documentForm.handleSubmit(handleCreateDocument)} className="space-y-4">
                  <div className={`border-dashed border-2 border-gray-300 rounded-lg p-8 text-center ${uploading ? "bg-accent" : ""}`}>
                    <Input type="file" className="hidden" id="file-upload" onChange={handleFileChange} disabled={uploading} />
                    <label htmlFor="file-upload" className={`cursor-pointer flex flex-col items-center ${uploading ? "opacity-50" : ""}`}>
                      {uploading ? (<><Spinner className="h-8 w-8 text-primary mb-2" /><span className="text-sm font-medium">Uploading... {uploadProgress}%</span></>) : (<><Upload className="h-8 w-8 text-muted-foreground mb-2" /><span className="text-sm font-medium">Click to select file or drag and drop</span><span className="text-xs text-muted-foreground mt-1">PDF, Word, Excel, Images up to 10MB</span></>)}
                    </label>
                    {uploadProgress > 0 && (<div className="w-full mt-4"><div className="w-full bg-muted rounded-full h-2"><div className="bg-primary h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} /></div></div>)}
                  </div>
                  {documentForm.watch("fileName") && (
                    <div className="flex items-center p-2 bg-primary/10 rounded text-sm">
                      <FileText className="h-4 w-4 text-primary mr-2" />
                      <span className="text-primary">{documentForm.watch("fileName")}</span>
                      <span className="ml-2 text-primary">({formatFileSize(documentForm.watch("fileSize"))})</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField control={documentForm.control} name="title" render={({ field }) => (
                      <FormItem><FormLabel>Document Title*</FormLabel><FormControl><Input placeholder="Enter document title" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={documentForm.control} name="documentTypeId" render={({ field }) => (
                      <FormItem><FormLabel>Document Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ""}>
                          <FormControl><SelectTrigger><SelectValue placeholder="Select document type" /></SelectTrigger></FormControl>
                          <SelectContent>{documentTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                        </Select><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={documentForm.control} name="description" render={({ field }) => (
                    <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea placeholder="Enter document description" className="min-h-20" {...field} value={field.value || ""} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <FormField control={documentForm.control} name="tags" render={({ field }) => (
                    <FormItem><FormLabel>Tags</FormLabel><FormControl><Input placeholder="Comma-separated tags" {...field} value={field.value || ""} /></FormControl><FormDescription>Tags help in searching and filtering documents.</FormDescription><FormMessage /></FormItem>
                  )} />
                  <FormField control={documentForm.control} name="isPublic" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                      <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                      <div className="space-y-1 leading-none"><FormLabel>Public Document</FormLabel><FormDescription>Make this document accessible to all users.</FormDescription></div>
                    </FormItem>
                  )} />
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setUploadDialogOpen(false)} disabled={uploading}>Cancel</Button>
                    <Button type="submit" disabled={uploading || !documentForm.watch("fileUrl")}>{uploading ? "Uploading..." : "Upload Document"}</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-lg">All Documents</CardTitle><CardDescription>Total documents in system</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold">{total}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Document Types</CardTitle><CardDescription>Classification categories</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold">{documentTypes.length}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Public Documents</CardTitle><CardDescription>Accessible to all users</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold">{publicCount}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-lg">Private Documents</CardTitle><CardDescription>Restricted access</CardDescription></CardHeader><CardContent><div className="text-3xl font-bold">{privateCount}</div></CardContent></Card>
      </div>

      {/* Recent + Types */}
      <div className="grid gap-4 mt-4 md:grid-cols-3">
        <Card className="md:col-span-2 overflow-hidden">
          <CardHeader><CardTitle className="text-lg">Recent Documents</CardTitle><CardDescription>Latest uploads to the system</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentDocs.length > 0 ? recentDocs.map(doc => (
                <div key={doc.id} className="flex items-start gap-3 pb-4 border-b last:border-0 last:pb-0">
                  <div className="p-2 bg-primary/10 rounded-full h-fit text-primary">{getFileIcon(doc.fileType, 16)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{doc.title}</p>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><UserIcon className="h-3 w-3" />{doc.user.firstName} {doc.user.lastName}</span>
                      <span className="mx-2">•</span>
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{formatDate(doc.createdAt)}</span>
                      {doc.documentType && (<><span className="mx-2">•</span><span className="flex items-center gap-1"><FolderOpen className="h-3 w-3" />{doc.documentType.name}</span></>)}
                    </div>
                  </div>
                  <Link href={doc.fileUrl} target="_blank"><Button variant="ghost" size="sm"><Download className="h-4 w-4" /></Button></Link>
                </div>
              )) : (
                <div className="text-center py-8"><FileText className="h-10 w-10 text-gray-300 mx-auto mb-2" /><p className="text-muted-foreground">No recent documents found</p></div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t"><Button variant="outline" size="sm" className="ml-auto" onClick={() => setUploadDialogOpen(true)}><Upload className="mr-2 h-4 w-4" />Upload Document</Button></CardFooter>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Document Types</CardTitle><CardDescription>Categories for organization</CardDescription></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {documentTypes.length > 0 ? documentTypes.map(type => (
                <div key={type.id} className="flex justify-between items-center p-2 rounded hover:bg-accent/50">
                  <div><p className="font-medium text-sm">{type.name}</p><p className="text-xs text-muted-foreground">{type._count.documents} documents</p></div>
                  <Button variant="ghost" size="sm" onClick={() => { setTypeFilter(type.id); refresh(1); }}><Filter className="h-4 w-4" /></Button>
                </div>
              )) : (
                <div className="text-center py-8"><FolderOpen className="h-10 w-10 text-gray-300 mx-auto mb-2" /><p className="text-muted-foreground">No document types found</p></div>
              )}
            </div>
          </CardContent>
          <CardFooter className="border-t"><Button variant="outline" size="sm" className="ml-auto" onClick={() => setTypeDialogOpen(true)}><PlusCircle className="mr-2 h-4 w-4" />Add Type</Button></CardFooter>
        </Card>
      </div>

      {/* Documents table */}
      <Card className="mt-4">
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div><CardTitle className="text-xl">All Documents</CardTitle><CardDescription>Browse, search and manage all documents</CardDescription></div>
            <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search documents..." className="pl-9" value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)} onKeyDown={e => e.key === "Enter" && refresh(1)} />
              </div>
              <Select value={typeFilter || "ALL"} onValueChange={v => { setTypeFilter(v === "ALL" ? "" : v); refresh(1); }}>
                <SelectTrigger className="w-full sm:w-[180px]"><SelectValue placeholder="Document Type" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">All Types</SelectItem>
                  {documentTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <Button variant="outline" size="icon" onClick={() => refresh(1)} disabled={isPending} className="shrink-0"><Filter className="h-4 w-4" /></Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" onValueChange={handleTabChange}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Documents</TabsTrigger>
              <TabsTrigger value="public">Public</TabsTrigger>
              <TabsTrigger value="private">Private</TabsTrigger>
            </TabsList>
            {["all", "public", "private"].map(tab => (
              <TabsContent key={tab} value={tab}>
                {isPending ? (
                  <div className="flex justify-center py-8"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
                ) : (
                  <DocumentsTable documents={documents} onDelete={handleDeleteDocument} emptyMessage="No documents found" />
                )}
              </TabsContent>
            ))}
          </Tabs>

          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">Page {page} of {totalPages} ({total} total)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1 || isPending} onClick={() => refresh(page - 1)}>Previous</Button>
                <Button variant="outline" size="sm" disabled={page >= totalPages || isPending} onClick={() => refresh(page + 1)}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
