export const dynamic = 'force-dynamic';

import Link from "next/link";
import { Metadata } from "next";
import { Suspense } from "react";
import { getMyChildren } from "@/lib/actions/parent-children-actions";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users } from "lucide-react";
import { ChildOverviewCard } from "@/components/parent/child-overview-card";
import { ChildListEmpty } from "@/components/parent/child-list-empty";
import { ChildOverviewSkeleton } from "@/components/parent/child-overview-skeleton";

export const metadata: Metadata = {
  title: "My Children | Parent Portal",
  description: "View information about your children",
};

export default async function ParentChildrenOverviewPage() {
  const { children } = await getMyChildren();
  
  return (
    <div className="container max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4 mb-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">My Children</h1>
              <p className="text-muted-foreground">
                {children.length} {children.length === 1 ? 'child' : 'children'} registered
              </p>
            </div>
          </div>
        </div>
        <Button variant="outline" asChild>
          <Link href="/parent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      {/* Children List */}
      {children.length > 0 ? (
        <div className="grid gap-6">
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
