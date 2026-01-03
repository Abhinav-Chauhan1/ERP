"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { toggleCoScholasticActivityStatus } from "@/lib/actions/coScholasticActions";
import { Power, Loader2 } from "lucide-react";

interface ToggleCoScholasticActivityButtonProps {
  activityId: string;
  isActive: boolean;
}

export function ToggleCoScholasticActivityButton({
  activityId,
  isActive,
}: ToggleCoScholasticActivityButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleToggle = async () => {
    setLoading(true);

    try {
      const result = await toggleCoScholasticActivityStatus(activityId);

      if (result.success) {
        toast({
          title: "Success",
          description: `Activity ${isActive ? "deactivated" : "activated"} successfully`,
        });
        router.refresh();
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to toggle activity status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleToggle}
      disabled={loading}
      title={isActive ? "Deactivate activity" : "Activate activity"}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <Power className={`h-3.5 w-3.5 ${isActive ? "text-green-600" : "text-gray-400"}`} />
      )}
    </Button>
  );
}
