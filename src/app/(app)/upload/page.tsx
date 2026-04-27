import { Upload } from "lucide-react";

import { EmptyState } from "@/components/ui/EmptyState";

export default function UploadPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Upload</h1>
        <p className="text-sm text-muted-foreground">
          Drop bank statements (CSV) and marketplace settlement reports here.
        </p>
      </div>

      <EmptyState
        icon={Upload}
        title="Upload coming next"
        description="The drag-and-drop CSV upload UI ships in Layer 2. For now, this page exists so the navigation works end-to-end."
      />
    </div>
  );
}
