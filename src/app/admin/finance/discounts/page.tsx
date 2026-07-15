import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ClassDiscountSelector } from "@/components/admin/finance/class-discount-selector";

export default function ClassDiscountsPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <Link href="/admin/finance">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Finance
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Class Discounts</h1>
          <p className="text-sm text-muted-foreground">
            Set Normal Fee, Books Fee, and Transport Fee discounts for an entire class at once.
          </p>
        </div>
      </div>

      <ClassDiscountSelector />
    </div>
  );
}
