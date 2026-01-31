export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { getBooks, getBookCategories } from "@/lib/actions/libraryActions";
import { BookList } from "@/components/admin/library/book-list";
import { BookListSkeleton } from "@/components/admin/library/book-list-skeleton";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Books | Library Management",
  description: "Manage library books",
};

interface PageProps {
  searchParams: Promise<{
    page?: string;
    search?: string;
    category?: string;
  }>;
}

export default async function BooksPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Number(params.page) || 1;
  const search = params.search || "";
  const category = params.category || "";

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <Link href="/admin/library">
            <Button variant="ghost" size="sm" className="pl-0 hover:bg-transparent">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Library
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Books</h1>
            <p className="text-muted-foreground mt-1">
              Manage library inventory and book details
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <Button asChild className="w-full sm:w-auto">
            <Link href="/admin/library/books/new">
              <Plus className="mr-2 h-4 w-4" />
              Add Book
            </Link>
          </Button>
        </div>
      </div>

      <Suspense fallback={<BookListSkeleton />}>
        <BookListContent page={page} search={search} category={category} />
      </Suspense>
    </div>
  );
}

async function BookListContent({
  page,
  search,
  category,
}: {
  page: number;
  search: string;
  category: string;
}) {
  const [booksData, categories] = await Promise.all([
    getBooks({ page, search, category }),
    getBookCategories(),
  ]);

  // Handle error case
  if (!booksData.success) {
    return <div>Error loading books: {booksData.error}</div>;
  }

  return <BookList data={booksData as any} categories={categories} />;
}
