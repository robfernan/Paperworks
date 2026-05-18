import * as React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  deleteDocument,
  duplicateDocument,
  listDocuments,
  migrateLegacyLocalStorage,
  type DocumentRecord,
  type ToolType,
} from "@/lib/documentStore";

type ToolFilter = "all" | ToolType;

const toolMeta: Record<ToolType, { label: string; route: string }> = {
  "business-card": { label: "Business Cards", route: "/tools/business-cards" },
  invoice: { label: "Invoices", route: "/tools/invoice" },
  pdf: { label: "PDF Projects", route: "/tools/pdf-pro" },
  resume: { label: "Resumes", route: "/tools/resume" },
};

const filters: ToolFilter[] = ["all", "business-card", "invoice", "pdf", "resume"];

const DocumentVault = () => {
  const [items, setItems] = React.useState<DocumentRecord[]>([]);
  const [filter, setFilter] = React.useState<ToolFilter>("all");
  const [isLoading, setIsLoading] = React.useState(true);
  const [status, setStatus] = React.useState<string>("");

  const load = React.useCallback(async () => {
    setIsLoading(true);
    const selected = filter === "all" ? undefined : filter;
    const docs = await listDocuments(selected);
    setItems(docs);
    setIsLoading(false);
  }, [filter]);

  React.useEffect(() => {
    void (async () => {
      const result = await migrateLegacyLocalStorage();
      if (result.migrated > 0) {
        setStatus(`Migrated ${result.migrated} legacy local documents.`);
      }
      await load();
    })();
  }, [load]);

  const onDelete = async (id: string) => {
    await deleteDocument(id);
    await load();
  };

  const onDuplicate = async (id: string) => {
    await duplicateDocument(id);
    await load();
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 sm:px-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold">Document Vault</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Offline-first library for all Paperworks documents.
          </p>
          {status ? <p className="text-sm text-primary mt-2">{status}</p> : null}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm" variant="outline">
            <Link to="/tools/business-cards">New Card</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/tools/invoice">New Invoice</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/tools/resume">New Resume</Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to="/tools/pdf-pro">New PDF Project</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {filters.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${
              filter === f ? "bg-primary text-primary-foreground border-primary" : "hover:bg-muted/60"
            }`}
          >
            {f === "all" ? "All" : toolMeta[f].label}
          </button>
        ))}
      </div>

      {isLoading ? <div className="text-sm text-muted-foreground">Loading documents...</div> : null}

      {!isLoading && items.length === 0 ? (
        <div className="border rounded-lg p-6 text-sm text-muted-foreground">
          No documents yet for this filter.
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((doc) => (
          <article key={doc.id} className="border rounded-lg p-4 bg-background/50">
            <div className="text-xs text-muted-foreground mb-2">{toolMeta[doc.toolType].label}</div>
            <h3 className="font-semibold truncate">{doc.title || "Untitled"}</h3>
            <p className="text-xs text-muted-foreground mt-1">
              Updated {new Date(doc.updatedAt).toLocaleString()}
            </p>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button asChild size="sm">
                <Link to={`${toolMeta[doc.toolType].route}?doc=${doc.id}`}>Open Tool</Link>
              </Button>
              <Button size="sm" variant="secondary" onClick={() => onDuplicate(doc.id)}>
                Duplicate
              </Button>
              <Button size="sm" variant="destructive" onClick={() => onDelete(doc.id)}>
                Delete
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const json = JSON.stringify(doc, null, 2);
                  const blob = new Blob([json], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${doc.title || doc.id}.json`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export
              </Button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};

export default DocumentVault;
