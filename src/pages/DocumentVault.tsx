import * as React from "react";
import { Link } from "react-router-dom";
import {
  FolderOpen,
  Search,
  Plus,
  Trash2,
  Copy,
  Download,
  FileStack,
  Receipt,
  FileText,
  CreditCard,
  ArrowRight,
  Filter,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  deleteDocument,
  duplicateDocument,
  listDocuments,
  migrateLegacyLocalStorage,
  type DocumentRecord,
  type ToolType,
} from "@/lib/documentStore";
import { toast } from "sonner";

type ToolFilter = "all" | ToolType;

const toolMeta: Record<
  ToolType,
  { label: string; route: string; icon: React.ComponentType<{ className?: string }>; color: string }
> = {
  "business-card": { label: "Business Cards", route: "/tools/business-cards", icon: CreditCard, color: "text-amber-500" },
  invoice: { label: "Invoices", route: "/tools/invoice", icon: Receipt, color: "text-blue-500" },
  pdf: { label: "PDF Projects", route: "/tools/pdf-pro", icon: FileStack, color: "text-emerald-500" },
  resume: { label: "Resumes", route: "/tools/resume", icon: FileText, color: "text-indigo-500" },
};

const filters: ToolFilter[] = ["all", "pdf", "invoice", "resume", "business-card"];

const DocumentVault = () => {
  const [items, setItems] = React.useState<DocumentRecord[]>([]);
  const [filter, setFilter] = React.useState<ToolFilter>("all");
  const [searchQuery, setSearchQuery] = React.useState("");
  const [sortBy, setSortBy] = React.useState<"updated-desc" | "updated-asc" | "title-asc">("updated-desc");
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
        setStatus(`Successfully migrated ${result.migrated} local documents into the database.`);
      }
      await load();
    })();
  }, [load]);

  const onDelete = async (id: string, title: string) => {
    await deleteDocument(id);
    toast.info(`Deleted "${title || "document"}"`);
    await load();
  };

  const onDuplicate = async (id: string) => {
    await duplicateDocument(id);
    toast.success("Document duplicated");
    await load();
  };

  const onExportJson = (doc: DocumentRecord) => {
    const json = JSON.stringify(doc, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${doc.title || doc.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.info("Document exported as JSON");
  };

  const filteredItems = React.useMemo(() => {
    let list = items;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (doc) =>
          doc.title.toLowerCase().includes(q) ||
          doc.toolType.toLowerCase().includes(q) ||
          (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(q)))
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === "updated-asc") return a.updatedAt.localeCompare(b.updatedAt);
      if (sortBy === "title-asc") return a.title.localeCompare(b.title);
      return b.updatedAt.localeCompare(a.updatedAt);
    });
  }, [items, searchQuery, sortBy]);

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Document Vault</h1>
            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-semibold">
              Offline-First
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Encrypted, zero-telemetry local storage for all Paperworks invoices, resumes, cards, and PDF assemblies.
          </p>
          {status && <p className="text-xs text-primary font-medium mt-1">{status}</p>}
        </div>

        {/* Quick Create Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            <Link to="/tools/pdf-pro">
              <Plus className="w-3.5 h-3.5 text-emerald-500" />
              New PDF
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            <Link to="/tools/invoice">
              <Plus className="w-3.5 h-3.5 text-blue-500" />
              New Invoice
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            <Link to="/tools/resume">
              <Plus className="w-3.5 h-3.5 text-indigo-500" />
              New Resume
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline" className="h-8 text-xs gap-1.5">
            <Link to="/tools/business-cards">
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              New Card
            </Link>
          </Button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex flex-wrap items-center gap-1.5">
          {filters.map((f) => {
            const count =
              f === "all" ? items.length : items.filter((d) => d.toolType === f).length;
            return (
              <Button
                key={f}
                size="sm"
                variant={filter === f ? "default" : "outline"}
                onClick={() => setFilter(f)}
                className="text-xs h-8 gap-1.5"
              >
                <span>{f === "all" ? "All Documents" : toolMeta[f].label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                    filter === f ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              </Button>
            );
          })}
        </div>

        {/* Search & Sort Controls */}
        <div className="flex items-center gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Filter by title..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="text-xs h-8 pl-8"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="text-xs h-8 rounded-md border bg-background px-2 text-foreground"
          >
            <option value="updated-desc">Latest First</option>
            <option value="updated-asc">Oldest First</option>
            <option value="title-asc">Alphabetical</option>
          </select>
        </div>
      </div>

      {/* Grid of Documents */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
          <Skeleton className="h-40 w-full rounded-xl" />
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="border border-dashed rounded-xl p-12 text-center bg-card/30">
          <FolderOpen className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-60" />
          <h3 className="font-semibold text-sm">No Documents Found</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No documents matching "${searchQuery}". Try clearing your search.`
              : "Your vault is currently empty for this category. Create a new document above to start building your library."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((doc) => {
            const meta = toolMeta[doc.toolType];
            const Icon = meta.icon;

            return (
              <article
                key={doc.id}
                className="group border rounded-xl p-4 bg-card/70 hover:bg-card/90 transition-all hover:shadow-md hover:border-primary/40 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase">
                      <Icon className={`w-3.5 h-3.5 ${meta.color}`} />
                      {meta.label}
                    </span>
                    {doc.version && doc.version > 1 && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-4">
                        v{doc.version}
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-semibold text-sm truncate text-foreground group-hover:text-primary transition-colors">
                    {doc.title || "Untitled Document"}
                  </h3>

                  <p className="text-[11px] text-muted-foreground mt-1">
                    Updated {new Date(doc.updatedAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="flex items-center justify-between gap-1 pt-4 mt-3 border-t border-border/50">
                  <Button asChild size="sm" className="h-7 text-xs px-2.5 gap-1">
                    <Link to={`${meta.route}?doc=${doc.id}`}>
                      <span>Open</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Button>

                  <div className="flex items-center gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => void onDuplicate(doc.id)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Duplicate"
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => onExportJson(doc)}
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                      title="Export JSON"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => void onDelete(doc.id, doc.title)}
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentVault;
