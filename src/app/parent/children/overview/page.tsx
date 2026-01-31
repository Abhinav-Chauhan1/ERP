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
  
  // Transform children to ensure firstName and lastName are strings
  const transformedChildren = children.map(child => ({
    ...child,
    user: {
      ...child.user,
      firstName: child.user.firstName || '',
      lastName: child.user.lastName || '',
      email: child.user.email || '',
    }
  }));
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold tracking-tight">My Children</h1>
          <p className="text-muted-foreground">
            {children.length} {children.length === 1 ? 'child' : 'children'} registered
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/parent">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Link>
        </Button>
      </div>
      
      {/* Children List */}
      {transformedChildren.length > 0 ? (
        <div className="grid gap-6">
          {transformedChildren.map(child => (
            <ChildOverviewCard key={child.id} child={child} />
          ))}
        </div>
      ) : (
        <ChildListEmpty />
      )}
    </div>
  );
}
