import Link from "next/link";
import { Metadata } from "next";
import { getMyChildren } from "@/lib/actions/parent-children-actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { ChildOverviewCard } from "@/components/parent/child-overview-card";
import { ChildListEmpty } from "@/components/parent/child-list-empty";

export const metadata: Metadata = {
  title: "My Children | Parent Portal",
  description: "View information about your children",
};

export default async function ParentChildrenOverviewPage() {
  const { children } = await getMyChildren();
  
  return (
    <div className="container p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Children</h1>
          <p className="text-gray-500">View all children associated with your account</p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/parent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      {children.length > 0 ? (
        <div className="space-y-6">
          {children.map(child => (
            <ChildOverviewCard key={child.id} child={child} />
          ))}
        </div>
      ) : (
        <ChildListEmpty />
      )}
    </div>
  );
}
