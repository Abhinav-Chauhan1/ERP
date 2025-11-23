import { getBookById } from "@/lib/actions/libraryActions";
import { BookForm } from "@/components/admin/library/book-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

export const metadata = {
  title: "Edit Book | Library Management",
  description: "Edit book details",
};

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBookPage({ params }: PageProps) {
  const { id } = await params;
  const book = await getBookById(id);

  if (!book) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/library/books">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Edit Book</h1>
          <p className="text-muted-foreground">
            Update book information
          </p>
        </div>
      </div>

      <BookForm book={book} />
    </div>
  );
}
