export const dynamic = 'force-dynamic';

import { Suspense } from "react";
import { getBooks, getBookCategories } from "@/lib/actions/libraryActions";
import { BookList } from "@/components/admin/library/book-list";
import { BookListSkeleton } from "@/components/admin/library/book-list-skeleton";
import { Button } from "@/components/ui/button";
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
