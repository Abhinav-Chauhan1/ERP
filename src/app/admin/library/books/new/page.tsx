export const dynamic = 'force-dynamic';

import { BookForm } from "@/components/admin/library/book-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Add New Book | Library Management",
  description: "Add a new book to the library",
};

export default function NewBookPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin/library/books">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Add New Book</h1>
          <p className="text-muted-foreground">
            Add a new book to your library collection
          </p>
        </div>
      </div>

      <BookForm />
    </div>
  );
}
