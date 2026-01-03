"use client";

import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Download, Search, Filter, Grid3x3, List, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DocumentGrid } from "@/components/parent/documents/document-grid";
import {
  getDocuments,
  downloadDocument,
  getDocumentCategories
} from "@/lib/actions/parent-document-actions";
import { toast } from "react-hot-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

// Lazy load preview modal
const DocumentPreviewModal = dynamic(
  () => import("@/components/parent/documents/document-preview-modal").then(mod => ({ default: mod.DocumentPreviewModal })),
  { loading: () => <div className="flex items-center justify-center p-4"><Loader2 className="h-6 w-6 animate-spin" /></div> }
);

interface Child {
  id: string;
  name: string;
  class: string;
  section: string;
  isPrimary: boolean;
}

interface DocumentsPageClientProps {
  children: Child[];
  selectedChildId: string;
}

export function DocumentsPageClient({
  children,
  selectedChildId
}: DocumentsPageClientProps) {
  const router = useRouter();
  const [documents, setDocuments] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  // Preview modal
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const selectedChild = children.find(c => c.id === selectedChildId) || children[0];

  const loadCategories = useCallback(async () => {
    const result = await getDocumentCategories();
    if (result.success) {
      setCategories(result.data);
    }
  }, []);

  const loadDocuments = useCallback(async () => {
    setLoading(true);
    try {
      const filters: any = {
        childId: selectedChildId,
      };

      if (selectedCategory && selectedCategory !== "all") {
        filters.category = selectedCategory;
      }

      if (startDate) {
        filters.startDate = new Date(startDate);
      }

      if (endDate) {
        filters.endDate = new Date(endDate);
      }

      if (searchTerm) {
        filters.searchTerm = searchTerm;
      }

      const result = await getDocuments(filters);
      if (result.success) {
        setDocuments(result.data);
      } else {
        toast.error(result.message || "Failed to load documents");
      }
    } catch (error) {
      toast.error("Failed to load documents");
    } finally {
      setLoading(false);
    }
  }, [selectedChildId, selectedCategory, startDate, endDate, searchTerm]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);



  const handleSearch = () => {
    loadDocuments();
  };

  const handleChildChange = (childId: string) => {
    router.push(`/parent/documents?childId=${childId}`);
  };

  const handlePreview = (documentId: string) => {
    setPreviewDocumentId(documentId);
    setIsPreviewOpen(true);
  };

  const handleDownload = async (documentId: string) => {
    try {
      const result = await downloadDocument(documentId);
      if (result.success && result.url) {
        // Create a temporary link and trigger download
        const link = document.createElement('a');
        link.href = result.url;
        link.download = result.fileName || 'document';
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("Download started");
      } else {
        toast.error(result.message || "Failed to download document");
      }
    } catch (error) {
      toast.error("Failed to download document");
    }
  };

  const handleBulkDownload = () => {
    toast("Bulk download feature coming soon");
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="h-full p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Documents</h1>
          <p className="text-gray-600 mt-1">
            View and download documents for {selectedChild.name}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {/* Child Selector */}
          {children.length > 1 && (
            <Select value={selectedChildId} onValueChange={handleChildChange}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select child" />
              </SelectTrigger>
              <SelectContent>
                {children.map((child) => (
                  <SelectItem key={child.id} value={child.id}>
                    {child.name} - {child.class}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* View Mode Toggle */}
          <div className="flex gap-1 border rounded-lg p-1">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
            >
              <Grid3x3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="space-y-2">
              <Label>Search</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Search documents..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button onClick={handleSearch} size="icon">
                  <Search className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Category Filter */}
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="All categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Start Date */}
            <div className="space-y-2">
              <Label>From Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label>To Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <Button variant="outline" size="sm" onClick={handleClearFilters}>
              Clear Filters
            </Button>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkDownload}
                disabled={documents.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Download All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Documents Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              {documents.length} {documents.length === 1 ? 'document' : 'documents'} found
            </p>
          </div>

          <DocumentGrid
            documents={documents}
            onPreview={handlePreview}
            onDownload={handleDownload}
            viewMode={viewMode}
          />
        </>
      )}

      {/* Preview Modal */}
      <DocumentPreviewModal
        documentId={previewDocumentId}
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewDocumentId(null);
        }}
        onDownload={handleDownload}
      />
    </div>
  );
}
