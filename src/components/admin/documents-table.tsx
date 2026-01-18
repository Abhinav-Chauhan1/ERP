"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Download, Trash2, FileText, Image as ImageIcon, File } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";

interface DocumentData {
    id: string;
    title: string;
    fileName: string;
    fileUrl: string;
    fileType?: string | null;
    fileSize?: number | null;
    isPublic: boolean;
    createdAt: Date | string;
    documentType?: {
        id: string;
        name: string;
    } | null;
    user: {
        firstName: string;
        lastName: string;
    };
}

interface DocumentsTableProps {
    documents: DocumentData[];
    onDelete?: (id: string) => void;
    emptyMessage?: string;
}

const formatDate = (date: Date | string) => {
    if (!date) return "";
    return new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
};

const getFileIcon = (fileType?: string | null, size = 16) => {
    if (!fileType) return <File size={size} />;
    if (fileType.startsWith("image/")) return <ImageIcon size={size} />;
    if (fileType === "application/pdf") return <FileText size={size} />;
    return <File size={size} />;
};

export function DocumentsTable({ documents, onDelete, emptyMessage }: DocumentsTableProps) {
    const columns = [
        {
            key: "document",
            label: "Document",
            isHeader: true,
            render: (doc: DocumentData) => (
                <div className="flex items-center gap-2">
                    <div className="text-primary">{getFileIcon(doc.fileType, 20)}</div>
                    <div>
                        <p className="font-medium">{doc.title}</p>
                        <p className="text-xs text-muted-foreground">{doc.fileName}</p>
                    </div>
                </div>
            ),
            mobileRender: (doc: DocumentData) => (
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div className="text-primary shrink-0">{getFileIcon(doc.fileType, 16)}</div>
                        <div className="min-w-0">
                            <p className="font-medium text-sm truncate">{doc.title}</p>
                            <p className="text-xs text-muted-foreground truncate">{doc.fileName}</p>
                        </div>
                    </div>
                    <Badge className={`${doc.isPublic ? "bg-green-100 text-green-800" : "bg-muted text-gray-800"} text-xs shrink-0`}>
                        {doc.isPublic ? "Public" : "Private"}
                    </Badge>
                </div>
            ),
        },
        {
            key: "type",
            label: "Type",
            render: (doc: DocumentData) =>
                doc.documentType ? (
                    <Badge variant="outline">{doc.documentType.name}</Badge>
                ) : (
                    <span className="text-muted-foreground">—</span>
                ),
            mobileRender: (doc: DocumentData) =>
                doc.documentType ? (
                    <Badge variant="outline" className="text-xs">{doc.documentType.name}</Badge>
                ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                ),
        },
        {
            key: "uploadedBy",
            label: "Uploaded By",
            mobilePriority: "low" as const,
            render: (doc: DocumentData) => (
                <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-medium">
                        {doc.user.firstName.charAt(0)}
                        {doc.user.lastName.charAt(0)}
                    </div>
                    <span>
                        {doc.user.firstName} {doc.user.lastName}
                    </span>
                </div>
            ),
        },
        {
            key: "date",
            label: "Date",
            mobilePriority: "low" as const,
            render: (doc: DocumentData) => formatDate(doc.createdAt),
        },
        {
            key: "status",
            label: "Status",
            mobilePriority: "low" as const, // Already in mobile header
            render: (doc: DocumentData) => (
                <Badge className={`${doc.isPublic ? "bg-green-100 text-green-800" : "bg-muted text-gray-800"}`}>
                    {doc.isPublic ? "Public" : "Private"}
                </Badge>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (doc: DocumentData) => (
                <>
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
                    {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(doc.id)}>
                            <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                    )}
                </>
            ),
            mobileRender: (doc: DocumentData) => (
                <>
                    <Link href={doc.fileUrl} target="_blank">
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                            View
                        </Button>
                    </Link>
                    <Link href={doc.fileUrl} download>
                        <Button variant="outline" size="sm" className="h-7 text-xs">
                            Download
                        </Button>
                    </Link>
                    {onDelete && (
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-7 text-xs text-red-500 border-red-200"
                            onClick={() => onDelete(doc.id)}
                        >
                            Delete
                        </Button>
                    )}
                </>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={documents}
            columns={columns}
            keyExtractor={(doc) => doc.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No documents found"}
                </div>
            }
        />
    );
}
