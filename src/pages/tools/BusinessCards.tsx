import * as React from "react";
import { jsPDF } from "jspdf";
import { useSearchParams } from "react-router-dom";
import {
  CreditCard,
  Plus,
  Trash2,
  Copy,
  Download,
  Save,
  Undo2,
  Redo2,
  Image as ImageIcon,
  Palette,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  listDocuments,
  type DocumentRecord,
  updateDocument,
} from "@/lib/documentStore";
import { useDocumentHistory } from "@/hooks/useDocumentHistory";
import { SnapshotTimeline } from "@/components/SnapshotTimeline";
import { toast } from "sonner";

export type CardTheme = "default" | "bonestock" | "eggshell";
export type TextLayout = "left" | "center" | "right";

export type BusinessCardPayload = {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  tagline: string;
  logo: string | null;
  theme: CardTheme;
  textLayout: TextLayout;
};

const emptyCard: BusinessCardPayload = {
  name: "",
  title: "",
  company: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  tagline: "",
  logo: null,
  theme: "default",
  textLayout: "left",
};

const themeClass: Record<CardTheme, string> = {
  default: "bg-card text-card-foreground border-border",
  bonestock: "bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-900 dark:text-zinc-100 dark:border-zinc-800",
  eggshell: "bg-amber-50 text-amber-950 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900/50",
};

const BusinessCards = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = React.useState<DocumentRecord<BusinessCardPayload>[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("Untitled Business Card");
  const [side, setSide] = React.useState<"front" | "back">("front");
  const [isLoading, setIsLoading] = React.useState(true);

  // Undo/Redo & Snapshot Timeline state management
  const {
    state: form,
    setState: setForm,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    snapshots,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
    resetState,
  } = useDocumentHistory<BusinessCardPayload>({
    documentId: selectedId,
    initialState: emptyCard,
    onAutosave: async (state) => {
      if (selectedId) {
        await updateDocument<BusinessCardPayload>(selectedId, {
          title,
          payload: state,
        });
      }
    },
  });

  const loadDocuments = React.useCallback(async () => {
    setIsLoading(true);
    const docs = await listDocuments<BusinessCardPayload>("business-card");
    setDocuments(docs);

    const requestedId = searchParams.get("doc");
    if (requestedId) {
      const selected = docs.find((d) => d.id === requestedId);
      if (selected) {
        setSelectedId(selected.id);
        setTitle(selected.title);
        resetState(selected.payload);
      }
    } else if (docs.length > 0 && !selectedId) {
      setSelectedId(docs[0].id);
      setTitle(docs[0].title);
      resetState(docs[0].payload);
    }
    setIsLoading(false);
  }, [searchParams, selectedId, resetState]);

  React.useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const handleSave = async () => {
    if (selectedId) {
      await updateDocument<BusinessCardPayload>(selectedId, { title, payload: form });
      toast.success("Business card saved");
    } else {
      const created = await createDocument<BusinessCardPayload>({
        toolType: "business-card",
        title: title || "New Business Card",
        payload: form,
      });
      setSelectedId(created.id);
      setSearchParams({ doc: created.id }, { replace: true });
      toast.success("New business card created");
    }
    await loadDocuments();
  };

  const handleNew = () => {
    setSelectedId(null);
    setSearchParams({}, { replace: true });
    setTitle("Untitled Business Card");
    resetState(emptyCard);
  };

  const onLogo = (file: File | null) => {
    if (!file) {
      setForm((prev) => ({ ...prev, logo: null }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logo: String(reader.result) }));
      toast.info("Card logo updated");
    };
    reader.readAsDataURL(file);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "in", format: [2, 3.5] });

    if (form.logo) {
      try {
        doc.addImage(form.logo, "PNG", 0.25, 0.45, 0.7, 0.7);
      } catch {
        // export should still work if logo is not parseable
      }
    }

    const x = form.textLayout === "left" ? 1.15 : form.textLayout === "center" ? 1.75 : 3.25;
    const align = form.textLayout;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(form.name || "Your Name", x, 0.55, { align });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.text(form.title || "Job Title", x, 0.76, { align });
    doc.text(form.company || "Company", x, 0.95, { align });
    doc.setFontSize(8.5);
    doc.text(form.phone || "Phone", x, 1.18, { align });
    doc.text(form.email || "Email", x, 1.33, { align });

    // Back page
    doc.addPage([2, 3.5], "landscape");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text(form.company || "Company", 1.75, 0.58, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(form.tagline || "Tagline", 1.75, 0.82, { align: "center" });
    doc.text(form.website || "Website", 1.75, 1.05, { align: "center" });
    doc.text(form.address || "Address", 1.75, 1.25, { align: "center" });

    doc.save(`${title || "business-card"}.pdf`);
    toast.success("Business card PDF downloaded (Front & Back)");
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Business Card Studio</h1>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold">
              Commercial
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Design executive double-sided business cards with curated papers, alignment controls, and 3.5" × 2" PDF print layout.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center rounded-lg border bg-background/80 p-0.5 shadow-sm">
            <Button
              size="icon"
              variant="ghost"
              disabled={!canUndo}
              onClick={undo}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Undo (Ctrl+Z / ⌘Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={!canRedo}
              onClick={redo}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Redo (Ctrl+Y / ⌘⇧Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Timeline Snapshot Dialog */}
          <SnapshotTimeline
            documentId={selectedId}
            snapshots={snapshots}
            onRestore={restoreSnapshot}
            onCreateSnapshot={createSnapshot}
            onRefresh={loadSnapshots}
            disabled={!selectedId}
          />

          <Button size="sm" onClick={handleSave} className="gap-1.5 h-8 text-xs font-semibold">
            <Save className="w-3.5 h-3.5" />
            Save Card
          </Button>

          <Button size="sm" variant="outline" onClick={exportPdf} className="gap-1.5 h-8 text-xs font-semibold">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Left Sidebar: Cards */}
        <aside className="border rounded-xl p-4 bg-card/60 backdrop-blur-sm flex flex-col h-[700px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <CreditCard className="w-4 h-4 text-amber-500" />
              <span>Saved Cards</span>
            </div>
            <Button size="sm" variant="outline" onClick={handleNew} className="h-7 text-xs px-2 gap-1">
              <Plus className="w-3 h-3" />
              New
            </Button>
          </div>

          <div className="mb-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Card title"
              className="text-xs h-8"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg p-4">
                No business cards yet. Create your first card!
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedId(doc.id);
                    setTitle(doc.title);
                    resetState(doc.payload);
                    setSearchParams({ doc: doc.id }, { replace: true });
                  }}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedId === doc.id
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "hover:bg-accent/50 border-border/70"
                  }`}
                >
                  <div className="font-medium text-xs truncate text-foreground">{doc.title || "Untitled"}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    <span>{doc.payload.name || "Draft"}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedId && (
            <div className="pt-3 border-t flex items-center justify-between gap-2 mt-auto">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] flex-1"
                onClick={async () => {
                  await duplicateDocument(selectedId);
                  await loadDocuments();
                  toast.success("Card duplicated");
                }}
              >
                <Copy className="w-3 h-3 mr-1" />
                Duplicate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-[11px] flex-1"
                onClick={async () => {
                  await deleteDocument(selectedId);
                  handleNew();
                  await loadDocuments();
                  toast.info("Card deleted");
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </aside>

        {/* Workspace: Form & Live Card Display */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
          <section className="border rounded-xl p-5 bg-card/60 space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Full Name</label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Alex Mercer"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Job Title</label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Principal Architect"
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Company / Brand</label>
                <Input
                  value={form.company}
                  onChange={(e) => setForm((p) => ({ ...p, company: e.target.value }))}
                  placeholder="Apex Labs"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Phone</label>
                <Input
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  placeholder="+1 (555) 019-2834"
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Email</label>
                <Input
                  value={form.email}
                  onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                  placeholder="alex@apexlabs.dev"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Website</label>
                <Input
                  value={form.website}
                  onChange={(e) => setForm((p) => ({ ...p, website: e.target.value }))}
                  placeholder="https://apexlabs.dev"
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Address / Location</label>
              <textarea
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Financial District, Suite 400, San Francisco"
                className="w-full text-xs rounded-md border px-3 py-2 bg-background min-h-[48px]"
                rows={2}
              />
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Brand Tagline (Back of card)</label>
              <Input
                value={form.tagline}
                onChange={(e) => setForm((p) => ({ ...p, tagline: e.target.value }))}
                placeholder="Autonomous Engineering & Document Architecture"
                className="text-xs h-8"
              />
            </div>

            {/* Paper Theme & Alignment */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs font-medium mb-1.5 block">Paper Material</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["default", "bonestock", "eggshell"] as const).map((t) => (
                    <Button
                      key={t}
                      type="button"
                      size="sm"
                      variant={form.theme === t ? "default" : "outline"}
                      className="text-xs h-7 capitalize"
                      onClick={() => setForm((p) => ({ ...p, theme: t }))}
                    >
                      {t}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-medium mb-1.5 block">Text Alignment</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["left", "center", "right"] as const).map((al) => (
                    <Button
                      key={al}
                      type="button"
                      size="sm"
                      variant={form.textLayout === al ? "default" : "outline"}
                      className="text-xs h-7 capitalize"
                      onClick={() => setForm((p) => ({ ...p, textLayout: al }))}
                    >
                      {al === "left" ? <AlignLeft className="w-3.5 h-3.5" /> : al === "center" ? <AlignCenter className="w-3.5 h-3.5" /> : <AlignRight className="w-3.5 h-3.5" />}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            {/* Logo */}
            <div>
              <label className="text-xs font-medium mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                Insignia / Brand Logo
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onLogo(e.target.files?.[0] ?? null)}
                className="text-xs block w-full file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
              />
            </div>
          </section>

          {/* Interactive Card Preview */}
          <section className="flex flex-col items-center justify-center p-6 border rounded-xl bg-card/40">
            <div className="flex gap-2 mb-6">
              <Button
                size="sm"
                variant={side === "front" ? "default" : "outline"}
                onClick={() => setSide("front")}
                className="text-xs h-7 px-4 font-semibold"
              >
                Front Side
              </Button>
              <Button
                size="sm"
                variant={side === "back" ? "default" : "outline"}
                onClick={() => setSide("back")}
                className="text-xs h-7 px-4 font-semibold"
              >
                Back Side
              </Button>
            </div>

            {/* 3.5" x 2" Ratio Physical Simulation Box */}
            <div
              className={`w-full max-w-[380px] aspect-[1.75/1] rounded-xl border shadow-xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                themeClass[form.theme]
              } ${
                form.textLayout === "center"
                  ? "text-center items-center"
                  : form.textLayout === "right"
                  ? "text-right items-end"
                  : "text-left items-start"
              }`}
            >
              {side === "front" ? (
                <>
                  <div className="w-full flex items-center gap-4">
                    {form.logo ? (
                      <img src={form.logo} alt="Logo" className="w-14 h-14 rounded object-cover shadow-sm border" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                        {form.company ? form.company.slice(0, 2).toUpperCase() : "PW"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="font-bold text-lg leading-tight tracking-tight">{form.name || "Alex Mercer"}</div>
                      <div className="text-xs text-muted-foreground font-medium mt-0.5">{form.title || "Principal Systems Architect"}</div>
                      <div className="text-xs font-semibold text-primary mt-1">{form.company || "Apex Labs Inc."}</div>
                    </div>
                  </div>

                  <div className="w-full text-[11px] text-muted-foreground space-y-0.5 pt-2 border-t border-border/40">
                    <div>{form.phone || "+1 (555) 019-2834"}</div>
                    <div>{form.email || "alex@apexlabs.dev"}</div>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-2">
                  {form.logo && <img src={form.logo} alt="Logo" className="max-h-10 object-contain mb-1" />}
                  <div className="font-bold text-base tracking-tight">{form.company || "Apex Labs Inc."}</div>
                  <div className="text-xs text-muted-foreground max-w-[280px]">{form.tagline || "Engineering Autonomous Systems"}</div>
                  <div className="text-[11px] font-mono text-primary pt-1">{form.website || "https://apexlabs.dev"}</div>
                  <div className="text-[10px] text-muted-foreground">{form.address || "San Francisco, CA"}</div>
                </div>
              )}
            </div>

            <div className="text-[11px] text-muted-foreground mt-4 text-center">
              Print Dimensions: Standard US 3.5" × 2.0" Business Card (Landscape)
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BusinessCards;
