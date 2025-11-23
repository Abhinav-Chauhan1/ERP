export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { getBooks, getBookCategories } from "@/lib/actions/libraryActions";
import { BookList } from "@/components/admin/library/book-list";
import { BookListSkeleton } from "@/components/admin/library/book-list-skeleton";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Books</h1>
          <p className="text-muted-foreground">
            Manage your library book collection
          </p>
        </div>
        <Link href="/admin/library/books/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Book
          </Button>
        </Link>
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

  return <BookList data={booksData} categories={categories} />;
}
