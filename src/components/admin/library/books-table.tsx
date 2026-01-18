"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Eye, Trash2 } from "lucide-react";
import { ResponsiveTable } from "@/components/shared/responsive-table";
import { OptimizedImage } from "@/components/shared/optimized-image";
import type { Book } from "@prisma/client";

interface BookWithCounts extends Book {
    _count: {
        issues: number;
        reservations: number;
    };
}

interface BooksTableProps {
    books: BookWithCounts[];
    onDelete: (id: string) => void;
    emptyMessage?: string;
}

export function BooksTable({ books, onDelete, emptyMessage }: BooksTableProps) {
    const columns = [
        {
            key: "cover",
            label: "Cover",
            className: "w-[80px]",
            render: (book: BookWithCounts) => (
                book.coverImage ? (
                    <OptimizedImage
                        src={book.coverImage}
                        alt={book.title}
                        width={48}
                        height={64}
                        className="h-16 w-12 rounded object-cover"
                        qualityPreset="medium"
                    />
                ) : (
                    <div className="flex h-16 w-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        No Image
                    </div>
                )
            ),
            mobileRender: (book: BookWithCounts) => (
                book.coverImage ? (
                    <OptimizedImage
                        src={book.coverImage}
                        alt={book.title}
                        width={40}
                        height={53}
                        className="h-14 w-10 rounded object-cover"
                        qualityPreset="medium"
                    />
                ) : (
                    <div className="flex h-14 w-10 shrink-0 items-center justify-center rounded bg-muted text-[10px] text-muted-foreground text-center leading-none p-1">
                        No Image
                    </div>
                )
            ),
        },
        {
            key: "info",
            label: "Book Info",
            isHeader: true,
            render: (book: BookWithCounts) => (
                <div>
                    <div className="font-medium text-base">{book.title}</div>
                    <div className="text-sm text-muted-foreground">{book.author}</div>
                    <div className="font-mono text-xs text-muted-foreground mt-1">{book.isbn}</div>
                </div>
            ),
            mobileRender: (book: BookWithCounts) => (
                <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{book.title}</div>
                    <div className="text-xs text-muted-foreground truncate">{book.author}</div>
                    <div className="flex flex-wrap gap-2 mt-1">
                        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">{book.category}</Badge>
                    </div>
                </div>
            ),
        },
        {
            key: "category",
            label: "Category",
            mobilePriority: "low" as const,
            render: (book: BookWithCounts) => (
                <Badge variant="secondary">{book.category}</Badge>
            ),
        },
        {
            key: "availability",
            label: "Availability",
            render: (book: BookWithCounts) => (
                <div className="flex flex-col gap-1 text-sm text-center">
                    <Badge
                        variant={book.available > 0 ? "default" : "destructive"}
                        className="w-16 justify-center mx-auto"
                    >
                        {book.available} / {book.quantity}
                    </Badge>
                    <span className="text-xs text-muted-foreground">Available</span>
                </div>
            ),
            mobileRender: (book: BookWithCounts) => (
                <div className="flex items-center gap-2">
                    <Badge
                        variant={book.available > 0 ? "default" : "destructive"}
                        className="h-5 text-[10px] px-1.5"
                    >
                        {book.available} / {book.quantity} Avail
                    </Badge>
                </div>
            ),
        },
        {
            key: "stats",
            label: "Stats",
            mobilePriority: "low" as const,
            render: (book: BookWithCounts) => (
                <div className="text-center text-sm">
                    <div>{book._count.issues} Issued</div>
                </div>
            ),
        },
        {
            key: "actions",
            label: "Actions",
            className: "text-right",
            isAction: true,
            render: (book: BookWithCounts) => (
                <div className="flex justify-end gap-2">
                    <Link href={`/admin/library/books/${book.id}`}>
                        <Button variant="ghost" size="icon">
                            <Eye className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Link href={`/admin/library/books/${book.id}/edit`}>
                        <Button variant="ghost" size="icon">
                            <Edit className="h-4 w-4" />
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onDelete(book.id)}
                    >
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ),
            mobileRender: (book: BookWithCounts) => (
                <div className="flex gap-2 mt-2">
                    <Link href={`/admin/library/books/${book.id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                            View
                        </Button>
                    </Link>
                    <Link href={`/admin/library/books/${book.id}/edit`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full h-8 text-xs">
                            Edit
                        </Button>
                    </Link>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-8 text-xs text-red-600 border-red-200"
                        onClick={() => onDelete(book.id)}
                    >
                        Delete
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <ResponsiveTable
            data={books}
            columns={columns}
            keyExtractor={(book) => book.id}
            emptyState={
                <div className="py-6 text-center text-muted-foreground">
                    {emptyMessage || "No books found"}
                </div>
            }
        />
    );
}
