import Link from "next/link";
import { cn } from "@/lib/utils";
import AssignmentsPage from "../assignments/page";
import CoScholasticPage from "../co-scholastic/page";

interface PageProps {
  searchParams: Promise<{ tab?: string }>;
}

const tabs = [
  { value: "assignments", label: "Assignments" },
  { value: "co-scholastic", label: "Co-Scholastic" },
];

export default async function ActivitiesPage({ searchParams }: PageProps) {
  const { tab } = await searchParams;
  const activeTab = tab === "co-scholastic" ? "co-scholastic" : "assignments";

  return (
    <div className="flex flex-col gap-2">
      {/* Tab navigation bar */}
      <div className="flex gap-1 border-b">
        {tabs.map((t) => (
          <Link
            key={t.value}
            href={`/admin/assessment/activities?tab=${t.value}`}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              activeTab === t.value
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* Tab content — render existing pages directly (each has its own header + back button) */}
      <div className="mt-2">
        {activeTab === "assignments" && <AssignmentsPage />}
        {activeTab === "co-scholastic" && <CoScholasticPage />}
      </div>
    </div>
  );
}
