import { UsersRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export function ChildListEmpty() {
  return (
    <div className="text-center p-12 border rounded-lg bg-gray-50">
      <UsersRound className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-4 text-lg font-medium text-gray-900">No children found</h3>
      <p className="mt-2 text-gray-500">
        There are no children associated with your account yet.
      </p>
      <p className="mt-1 text-gray-500">
        Please contact the school administration to associate your child with your account.
      </p>
      <div className="mt-6">
        <Button asChild>
          <Link href="/parent">
            Return to Dashboard
          </Link>
        </Button>
      </div>
    </div>
  );
}
