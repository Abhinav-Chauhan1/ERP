"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
    FileText,
    Upload,
    Download,
    Trash2,
    Loader2,
    FolderOpen,
    File,
    ImageIcon,
    Film,
} from "lucide-react";
import toast from "react-hot-toast";
import {
    getSubjectResources,
    saveSubjectResource,
    deleteSubjectResource,
} from "@/lib/actions/subjectResourceActions";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ResourceDoc {
    id: string;
    title: string;
    description: string | null;
    filename: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    order: number;
    createdAt: Date;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function FileIcon({ type, className }: { type: string; className?: string }) {
    if (type.startsWith("image/")) return <ImageIcon className={className} />;
    if (type.startsWith("video/")) return <Film className={className} />;
    return <FileText className={className} />;
}

function fileTypeBadge(mimeType: string, filename: string) {
    const ext = filename.split(".").pop()?.toUpperCase() ?? "";
    if (mimeType.includes("pdf")) return "PDF";
    if (mimeType.includes("word") || ext === "DOC" || ext === "DOCX") return "Word";
    if (mimeType.includes("presentation") || ext === "PPT" || ext === "PPTX") return "Presentation";
    if (mimeType.includes("sheet") || ext === "XLS" || ext === "XLSX") return "Spreadsheet";
    if (mimeType.startsWith("image/")) return "Image";
    if (mimeType.startsWith("video/")) return "Video";
    return ext || "File";
}

// ─── Upload Dialog ────────────────────────────────────────────────────────────

function UploadDialog({
    subjectId,
    onUploaded,
}: {
    subjectId: string;
    onUploaded: () => void;
}) {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const reset = () => {
        setTitle("");
        setDescription("");
        setFile(null);
        if (fileRef.current) fileRef.current.value = "";
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file || !title.trim()) {
            toast.error("Title and file are required");
            return;
        }

        setUploading(true);
        try {
            // 1. Get CSRF token
            const csrfRes = await fetch("/api/csrf-token");
            const { token: csrfToken } = await csrfRes.json();

            // 2. Upload to R2
            const formData = new FormData();
            formData.append("file", file);
            formData.append("csrf_token", csrfToken);
            formData.append("folder", "subject-resources");
            formData.append(
                "category",
                file.type.startsWith("image/") ? "image" : "document"
            );

            const uploadRes = await fetch("/api/r2/upload", {
                method: "POST",
                body: formData,
            });
            const uploadResult = await uploadRes.json();

            if (!uploadRes.ok || !uploadResult.success) {
                throw new Error(uploadResult.error ?? "Upload failed");
            }

            // 3. Save metadata to DB
            const saveResult = await saveSubjectResource({
                subjectId,
                title: title.trim(),
                description: description.trim() || undefined,
                filename: file.name,
                fileUrl: uploadResult.data.url,
                fileType: file.type,
                fileSize: file.size,
            });

            if (!saveResult.success) throw new Error(saveResult.error);

            toast.success("Resource uploaded");
            setOpen(false);
            reset();
            onUploaded();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message ?? "Upload failed");
        } finally {
            setUploading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild>
                <Button size="sm">
                    <Upload className="mr-2 h-4 w-4" /> Upload Resource
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle>Upload Teaching Resource</DialogTitle>
                    <DialogDescription>
                        Add a file for students and other teachers to reference.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-2">
                    <div className="grid gap-1.5">
                        <Label htmlFor="res-title">Title *</Label>
                        <Input
                            id="res-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g. Chapter 3 Notes"
                            required
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="res-desc">Description</Label>
                        <Textarea
                            id="res-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Brief description (optional)"
                            rows={2}
                        />
                    </div>
                    <div className="grid gap-1.5">
                        <Label htmlFor="res-file">File *</Label>
                        <div
                            className="border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                            onClick={() => fileRef.current?.click()}
                        >
                            <input
                                ref={fileRef}
                                id="res-file"
                                type="file"
                                className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                                required
                            />
                            {file ? (
                                <div className="flex items-center justify-center gap-2 text-sm">
                                    <FileText className="h-5 w-5 text-primary" />
                                    <div>
                                        <p className="font-medium">{file.name}</p>
                                        <p className="text-muted-foreground">{formatBytes(file.size)}</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-muted-foreground">
                                    <FileText className="h-8 w-8 mx-auto mb-2 opacity-40" />
                                    <p className="text-sm">Click to select a file</p>
                                    <p className="text-xs mt-1">PDF, Word, PowerPoint, images, etc.</p>
                                </div>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={uploading}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={uploading || !file || !title.trim()}>
                            {uploading ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Uploading…</>
                            ) : (
                                "Upload"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SubjectResourcesTab({ subjectId }: { subjectId: string }) {
    const [resources, setResources] = useState<ResourceDoc[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        const res = await getSubjectResources(subjectId);
        if (res.success && res.data) setResources(res.data as ResourceDoc[]);
        setLoading(false);
    }, [subjectId]);

    useEffect(() => { load(); }, [load]);

    const handleDelete = async (id: string) => {
        const res = await deleteSubjectResource(id);
        if (res.success) {
            toast.success("Resource deleted");
            setResources((prev) => prev.filter((r) => r.id !== id));
        } else {
            toast.error(res.error ?? "Failed to delete");
        }
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <div>
                        <CardTitle>Teaching Resources</CardTitle>
                        <CardDescription>Files and materials for this subject</CardDescription>
                    </div>
                    <UploadDialog subjectId={subjectId} onUploaded={load} />
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-10">
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                ) : resources.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <FolderOpen className="h-12 w-12 text-muted-foreground/20 mb-3" />
                        <h3 className="font-medium text-muted-foreground">No resources yet</h3>
                        <p className="text-sm text-muted-foreground mt-1 max-w-xs">
                            Upload worksheets, presentations, notes, or any other teaching materials.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {resources.map((doc) => (
                            <div
                                key={doc.id}
                                className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/30 transition-colors group"
                            >
                                {/* Icon */}
                                <div className="p-2 bg-primary/10 rounded-md shrink-0">
                                    <FileIcon type={doc.fileType} className="h-5 w-5 text-primary" />
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{doc.title}</p>
                                    {doc.description && (
                                        <p className="text-sm text-muted-foreground truncate">
                                            {doc.description}
                                        </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-1">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                                            {fileTypeBadge(doc.fileType, doc.filename)}
                                        </Badge>
                                        <span className="text-xs text-muted-foreground">
                                            {formatBytes(doc.fileSize)}
                                        </span>
                                        <span className="text-xs text-muted-foreground">
                                            {format(new Date(doc.createdAt), "MMM d, yyyy")}
                                        </span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" download={doc.filename}>
                                        <Button variant="outline" size="sm" className="gap-1">
                                            <Download className="h-3.5 w-3.5" />
                                            Download
                                        </Button>
                                    </a>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Delete resource?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete "{doc.title}". This cannot be undone.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction
                                                    className="bg-destructive hover:bg-destructive/90"
                                                    onClick={() => handleDelete(doc.id)}
                                                >
                                                    Delete
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
