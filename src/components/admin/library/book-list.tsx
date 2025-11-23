"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteBook } from "@/lib/actions/libraryActions";
import { OptimizedImage } from "@/components/shared/optimized-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Edit,
  Eye,
  Search,
  Trash2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";
import type { Book } from "@prisma/client";

interface BookListProps {
  data: {
    books: (Book & {
      _count: {
        issues: number;
        reservations: number;
      };
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  categories: string[];
}

export function BookList({ data, categories }: BookListProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || ""
  );
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bookToDelete, setBookToDelete] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchTerm) params.set("search", searchTerm);
    if (selectedCategory) params.set("category", selectedCategory);
    params.set("page", "1");
    router.push(`/admin/library/books?${params.toString()}`);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("");
    router.push("/admin/library/books");
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push(`/admin/library/books?${params.toString()}`);
  };

  const handleDelete = async () => {
    if (!bookToDelete) return;

    setIsDeleting(true);
    try {
      const result = await deleteBook(bookToDelete);
      if (result.success) {
        toast.success("Book deleted successfully");
        router.refresh();
      } else {
        toast.error(result.error || "Failed to delete book");
      }
    } catch (error) {
      console.error("Error deleting book:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setIsDeleting(false);
      setDeleteDialogOpen(false);
      setBookToDelete(null);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by title, author, or ISBN..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full md:w-[200px]">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category} value={category}>
                    {category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleSearch}>Search</Button>
            {(searchTerm || selectedCategory) && (
              <Button variant="outline" onClick={handleClearFilters}>
                Clear
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cover</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>ISBN</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-center">Quantity</TableHead>
                  <TableHead className="text-center">Available</TableHead>
                  <TableHead className="text-center">Issued</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.books.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center">
                      No books found
                    </TableCell>
                  </TableRow>
                ) : (
                  data.books.map((book) => (
                    <TableRow key={book.id}>
                      <TableCell>
                        {book.coverImage ? (
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
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell className="font-mono text-sm">
                        {book.isbn}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{book.category}</Badge>
                      </TableCell>
                      <TableCell className="text-center">{book.quantity}</TableCell>
                      <TableCell className="text-center">
                        <Badge
                          variant={book.available > 0 ? "default" : "destructive"}
                        >
                          {book.available}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {book._count.issues}
                      </TableCell>
                      <TableCell className="text-right">
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
                            onClick={() => {
                              setBookToDelete(book.id);
                              setDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(data.page - 1) * data.limit + 1} to{" "}
            {Math.min(data.page * data.limit, data.total)} of {data.total} books
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page - 1)}
              disabled={data.page === 1}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(data.page + 1)}
              disabled={data.page === data.totalPages}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the book
              from the library.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
