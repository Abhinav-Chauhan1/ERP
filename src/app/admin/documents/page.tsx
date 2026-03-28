export const dynamic = "force-dynamic";

import { getDocumentsPageData } from "@/lib/actions/documentActions";
import { AdminDocumentsClient } from "./documents-client";

export default async function DocumentsPage() {
  const data = await getDocumentsPageData();

  return (
    <AdminDocumentsClient
      initialDocuments={data.success ? data.documents : []}
      initialDocumentTypes={data.success ? data.documentTypes : []}
      initialRecentDocs={data.success ? data.recentDocs : []}
      initialTotal={data.success ? data.total : 0}
      initialPage={1}
      pageSize={data.success ? (data as any).limit ?? 20 : 20}
    />
  );
}
