"use client";

import { use } from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ReportCardDetailView } from "@/components/student/report-card-detail-view";
import { getReportCardDetails, getReportCardPresignedUrl } from "@/lib/actions/report-card-actions";
import type { ReportCardData } from "@/lib/services/report-card-data-aggregation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/lib/auth-context";
import toast from "react-hot-toast";

export default function StudentReportCardDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id: reportCardId } = use(params);
  const { user } = useAuth();
  const userId = user?.id;
  const [loading, setLoading] = useState(true);
  const [reportCard, setReportCard] = useState<ReportCardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  useEffect(() => {
    const fetchReportCard = async () => {
      try {
        if (!userId) {
          router.push("/login");
          return;
        }

        const result = await getReportCardDetails(reportCardId);

        if (result.success && result.data) {
          setReportCard(result.data);
        } else {
          setError(result.error || "Failed to load report card");
        }
      } catch (error) {
        console.error("Error fetching report card:", error);
        setError("Failed to load report card");
      } finally {
        setLoading(false);
      }
    };

    fetchReportCard();
  }, [reportCardId, userId, router]);

  const handleDownload = async () => {
    if (!reportCard?.pdfUrl) return;
    
    setDownloadingPdf(true);
    try {
      const result = await getReportCardPresignedUrl(reportCardId);
      if (result.success && result.data) {
        window.open(result.data, "_blank");
      } else {
        toast.error(result.error || "Failed to generate download link");
      }
    } catch (error) {
      console.error("Error downloading report card:", error);
      toast.error("Failed to download report card");
    } finally {
      setDownloadingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10" />
          <Skeleton className="h-8 w-64" />
        </div>
        <Skeleton className="h-64" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !reportCard) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium text-destructive">{error || "Report card not found"}</p>
          <p className="text-sm text-muted-foreground mt-2">
            The report card you're looking for may not exist or you don't have permission to view it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Button variant="ghost" onClick={() => router.back()}>
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back to Report Cards
      </Button>

      <ReportCardDetailView reportCard={reportCard} onDownload={handleDownload} />
    </div>
  );
}
