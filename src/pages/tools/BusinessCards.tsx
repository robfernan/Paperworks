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
  Grid,
  Layers,
  Type,
  Sliders,
  CheckSquare,
  Square,
  Sparkles,
  Maximize2,
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

export type CardTheme = "default" | "bonestock" | "eggshell" | "obsidian" | "platinum";
export type TextLayout = "left" | "center" | "right" | "split";
export type CardTypography = "sans" | "serif" | "mono";
export type CardTracking = "normal" | "wide" | "widest";
export type CardAccentBar = "none" | "left" | "top" | "bottom";

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
  // Professional InDesign controls
  typography?: CardTypography;
  tracking?: CardTracking;
  nameFontSize?: number;
  accentBar?: CardAccentBar;
  accentColor?: string;
  offsetX?: number;
  offsetY?: number;
  includeBleed?: boolean;
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
  typography: "sans",
  tracking: "normal",
  nameFontSize: 16,
  accentBar: "none",
  accentColor: "#d97706",
  offsetX: 0,
  offsetY: 0,
  includeBleed: false,
};

const themeConfig: Record<CardTheme, { container: string; label: string; textClass: string; bg: string }> = {
  default: {
    container: "bg-card text-card-foreground border-border",
    label: "Studio White",
    textClass: "text-foreground",
    bg: "#ffffff",
  },
  bonestock: {
    container: "bg-[#faf8f5] text-stone-900 border-stone-300 dark:bg-stone-900 dark:text-stone-100 dark:border-stone-800",
    label: "Bone Stock",
    textClass: "text-stone-900 dark:text-stone-100",
    bg: "#faf8f5",
  },
  eggshell: {
    container: "bg-[#fdfbf2] text-amber-950 border-amber-200 dark:bg-amber-950/40 dark:text-amber-100 dark:border-amber-900/50",
    label: "Eggshell Linen",
    textClass: "text-amber-950 dark:text-amber-100",
    bg: "#fdfbf2",
  },
  obsidian: {
    container: "bg-[#111113] text-zinc-100 border-zinc-800 shadow-2xl",
    label: "Obsidian Luxury",
    textClass: "text-zinc-100",
    bg: "#111113",
  },
  platinum: {
    container: "bg-[#f1f3f5] text-slate-900 border-slate-300 dark:bg-slate-900 dark:text-slate-100 dark:border-slate-800",
    label: "Brushed Platinum",
    textClass: "text-slate-900 dark:text-slate-100",
    bg: "#f1f3f5",
  },
};

const typographyConfig: Record<CardTypography, { fontClass: string; label: string; pdfFont: string }> = {
  sans: { fontClass: "font-sans", label: "Modern Sans (Inter)", pdfFont: "helvetica" },
  serif: { fontClass: "font-serif", label: "Editorial Serif (Georgia)", pdfFont: "times" },
  mono: { fontClass: "font-mono", label: "Technical Mono (Courier)", pdfFont: "courier" },
};

const trackingConfig: Record<CardTracking, string> = {
  normal: "tracking-normal",
  wide: "tracking-wider",
  widest: "tracking-widest",
};

const accentPresets = [
  { label: "Amber Gold", hex: "#d97706" },
  { label: "Royal Indigo", hex: "#4f46e5" },
  { label: "Forest Emerald", hex: "#059669" },
  { label: "Crimson Red", hex: "#dc2626" },
  { label: "Platinum Slate", hex: "#64748b" },
];

const BusinessCards = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = React.useState<DocumentRecord<BusinessCardPayload>[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("Untitled Business Card");
  const [side, setSide] = React.useState<"front" | "back">("front");
  const [isLoading, setIsLoading] = React.useState(true);

  // Guide toggles for InDesign preview
  const [showBleedGuide, setShowBleedGuide] = React.useState(false);
  const [showSafeGuide, setShowSafeGuide] = React.useState(false);
  const [showGridOverlay, setShowGridOverlay] = React.useState(false);
  const [snapGrid, setSnapGrid] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<"content" | "design" | "layout">("content");

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

  const nudgeCoordinate = (axis: "x" | "y", delta: number) => {
    const step = snapGrid ? (delta > 0 ? 0.05 : -0.05) : delta;
    if (axis === "x") {
      setForm((p) => {
        const next = Math.round(((p.offsetX || 0) + step) * 100) / 100;
        return { ...p, offsetX: Math.max(-0.5, Math.min(0.5, next)) };
      });
    } else {
      setForm((p) => {
        const next = Math.round(((p.offsetY || 0) + step) * 100) / 100;
        return { ...p, offsetY: Math.max(-0.3, Math.min(0.3, next)) };
      });
    }
  };

  const exportPdf = () => {
    const withBleed = Boolean(form.includeBleed);
    // Standard US card: 3.5" x 2.0"
    // With 1/8" bleed: 3.75" x 2.25"
    const width = withBleed ? 3.75 : 3.5;
    const height = withBleed ? 2.25 : 2.0;
    const bleedOffset = withBleed ? 0.125 : 0;

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "in",
      format: [height, width],
    });

    const typo = typographyConfig[form.typography || "sans"];
    const pdfFont = typo.pdfFont;
    const nameSize = form.nameFontSize || 15;
    const offX = (form.offsetX || 0) + bleedOffset;
    const offY = (form.offsetY || 0) + bleedOffset;

    // Draw background color if non-default
    if (form.theme === "obsidian") {
      doc.setFillColor(17, 17, 19);
      doc.rect(0, 0, width, height, "F");
    } else if (form.theme === "bonestock") {
      doc.setFillColor(250, 248, 245);
      doc.rect(0, 0, width, height, "F");
    } else if (form.theme === "eggshell") {
      doc.setFillColor(253, 251, 242);
      doc.rect(0, 0, width, height, "F");
    } else if (form.theme === "platinum") {
      doc.setFillColor(241, 243, 245);
      doc.rect(0, 0, width, height, "F");
    }

    // Draw Accent Bar if configured
    if (form.accentBar && form.accentBar !== "none") {
      const hex = (form.accentColor || "#d97706").replace("#", "");
      const r = parseInt(hex.substring(0, 2), 16) || 217;
      const g = parseInt(hex.substring(2, 4), 16) || 119;
      const b = parseInt(hex.substring(4, 6), 16) || 6;
      doc.setFillColor(r, g, b);

      if (form.accentBar === "left") {
        doc.rect(0, 0, bleedOffset + 0.1, height, "F");
      } else if (form.accentBar === "top") {
        doc.rect(0, 0, width, bleedOffset + 0.1, "F");
      } else if (form.accentBar === "bottom") {
        doc.rect(0, height - (bleedOffset + 0.1), width, bleedOffset + 0.1, "F");
      }
    }

    // Draw crop marks if bleed enabled
    if (withBleed) {
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.005);
      // Top-Left crop
      doc.line(0, 0.125, 0.08, 0.125);
      doc.line(0.125, 0, 0.125, 0.08);
      // Top-Right crop
      doc.line(3.75, 0.125, 3.67, 0.125);
      doc.line(3.625, 0, 3.625, 0.08);
      // Bottom-Left crop
      doc.line(0, 2.125, 0.08, 2.125);
      doc.line(0.125, 2.25, 0.125, 2.17);
      // Bottom-Right crop
      doc.line(3.75, 2.125, 3.67, 2.125);
      doc.line(3.625, 2.25, 3.625, 2.17);
    }

    // Logo / Insignia
    if (form.logo) {
      try {
        doc.addImage(form.logo, "PNG", 0.25 + offX, 0.45 + offY, 0.7, 0.7);
      } catch {
        // Safe fallback
      }
    }

    const textX =
      form.textLayout === "left"
        ? 1.15 + offX
        : form.textLayout === "center"
        ? 1.75 + offX
        : form.textLayout === "right"
        ? 3.25 + offX
        : 1.15 + offX;
    const align = form.textLayout === "split" ? "left" : form.textLayout;

    // Text color based on theme
    if (form.theme === "obsidian") {
      doc.setTextColor(245, 245, 245);
    } else {
      doc.setTextColor(25, 25, 28);
    }

    doc.setFont(pdfFont, "bold");
    doc.setFontSize(nameSize);
    doc.text(form.name || "Your Name", textX, 0.55 + offY, { align });

    doc.setFont(pdfFont, "normal");
    doc.setFontSize(9.5);
    doc.text(form.title || "Job Title", textX, 0.76 + offY, { align });
    doc.text(form.company || "Company", textX, 0.95 + offY, { align });

    doc.setFontSize(8.5);
    doc.text(form.phone || "Phone", textX, 1.18 + offY, { align });
    doc.text(form.email || "Email", textX, 1.33 + offY, { align });

    // Back page
    doc.addPage([height, width], "landscape");

    if (form.theme === "obsidian") {
      doc.setFillColor(17, 17, 19);
      doc.rect(0, 0, width, height, "F");
      doc.setTextColor(245, 245, 245);
    } else if (form.theme === "bonestock") {
      doc.setFillColor(250, 248, 245);
      doc.rect(0, 0, width, height, "F");
      doc.setTextColor(25, 25, 28);
    } else if (form.theme === "eggshell") {
      doc.setFillColor(253, 251, 242);
      doc.rect(0, 0, width, height, "F");
      doc.setTextColor(25, 25, 28);
    } else if (form.theme === "platinum") {
      doc.setFillColor(241, 243, 245);
      doc.rect(0, 0, width, height, "F");
      doc.setTextColor(25, 25, 28);
    } else {
      doc.setTextColor(25, 25, 28);
    }

    if (withBleed) {
      doc.setDrawColor(120, 120, 120);
      doc.setLineWidth(0.005);
      doc.line(0, 0.125, 0.08, 0.125);
      doc.line(0.125, 0, 0.125, 0.08);
      doc.line(3.75, 0.125, 3.67, 0.125);
      doc.line(3.625, 0, 3.625, 0.08);
      doc.line(0, 2.125, 0.08, 2.125);
      doc.line(0.125, 2.25, 0.125, 2.17);
      doc.line(3.75, 2.125, 3.67, 2.125);
      doc.line(3.625, 2.25, 3.625, 2.17);
    }

    const backCenterX = 1.75 + bleedOffset;
    doc.setFont(pdfFont, "bold");
    doc.setFontSize(14);
    doc.text(form.company || "Company", backCenterX, 0.58 + bleedOffset, { align: "center" });

    doc.setFont(pdfFont, "normal");
    doc.setFontSize(9);
    doc.text(form.tagline || "Tagline", backCenterX, 0.82 + bleedOffset, { align: "center" });
    doc.text(form.website || "Website", backCenterX, 1.05 + bleedOffset, { align: "center" });
    doc.text(form.address || "Address", backCenterX, 1.25 + bleedOffset, { align: "center" });

    doc.save(`${title || "business-card"}${withBleed ? "-with-bleed" : ""}.pdf`);
    toast.success(
      `Business card PDF downloaded (${withBleed ? '3.75" × 2.25" with 1/8" Bleed & Crop Marks' : 'Standard 3.5" × 2.0"'})`
    );
  };

  const theme = themeConfig[form.theme] || themeConfig.default;
  const typo = typographyConfig[form.typography || "sans"];
  const tracking = trackingConfig[form.tracking || "normal"];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Business Card Studio Pro</h1>
            <Badge variant="outline" className="text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20 font-semibold">
              InDesign Grade
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Professional prepress layout: 1/8" print bleed guides, safe margin tracking, coordinate nudges, and multi-layer luxury styling.
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
            Export PDF {form.includeBleed ? "(With Bleed)" : ""}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Left Sidebar: Cards */}
        <aside className="border rounded-xl p-4 bg-card/60 backdrop-blur-sm flex flex-col h-[750px]">
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

        {/* Workspace: Studio Tabs & InDesign Canvas Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
          {/* Controls Column with Tab Navigation */}
          <section className="border rounded-xl p-5 bg-card/60 space-y-4 max-h-[750px] overflow-y-auto">
            {/* Mode Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-muted/40 rounded-lg border">
              <Button
                type="button"
                size="sm"
                variant={activeTab === "content" ? "default" : "ghost"}
                className="flex-1 text-xs h-7"
                onClick={() => setActiveTab("content")}
              >
                Content
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === "design" ? "default" : "ghost"}
                className="flex-1 text-xs h-7"
                onClick={() => setActiveTab("design")}
              >
                Typography & Style
              </Button>
              <Button
                type="button"
                size="sm"
                variant={activeTab === "layout" ? "default" : "ghost"}
                className="flex-1 text-xs h-7"
                onClick={() => setActiveTab("layout")}
              >
                Bleed & Coordinates
              </Button>
            </div>

            {/* Content Tab */}
            {activeTab === "content" && (
              <div className="space-y-3.5">
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

                {/* Logo Upload */}
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
              </div>
            )}

            {/* Typography & Style Tab */}
            {activeTab === "design" && (
              <div className="space-y-4">
                {/* Paper Material Themes */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Paper Material & Finish</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                    {(["default", "bonestock", "eggshell", "obsidian", "platinum"] as const).map((t) => (
                      <Button
                        key={t}
                        type="button"
                        size="sm"
                        variant={form.theme === t ? "default" : "outline"}
                        className="text-xs h-8 justify-start gap-1.5 px-2"
                        onClick={() => setForm((p) => ({ ...p, theme: t }))}
                      >
                        <span className="w-2.5 h-2.5 rounded-full border flex-shrink-0" style={{ backgroundColor: themeConfig[t].bg }} />
                        <span className="truncate">{themeConfig[t].label}</span>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Typography Hierarchy */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Typography Family</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(["sans", "serif", "mono"] as const).map((ty) => (
                      <Button
                        key={ty}
                        type="button"
                        size="sm"
                        variant={(form.typography || "sans") === ty ? "default" : "outline"}
                        className={`text-xs h-7 ${typographyConfig[ty].fontClass}`}
                        onClick={() => setForm((p) => ({ ...p, typography: ty }))}
                      >
                        {typographyConfig[ty].label.split(" ")[0]}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Font Scaling & Letter Tracking */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1.5 block">Name Font Scale</label>
                    <div className="flex items-center gap-1.5">
                      {[14, 16, 18, 20].map((size) => (
                        <Button
                          key={size}
                          type="button"
                          size="sm"
                          variant={(form.nameFontSize || 16) === size ? "default" : "outline"}
                          className="h-7 text-xs flex-1 px-1"
                          onClick={() => setForm((p) => ({ ...p, nameFontSize: size }))}
                        >
                          {size}pt
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium mb-1.5 block">Letter Tracking</label>
                    <div className="flex items-center gap-1.5">
                      {(["normal", "wide", "widest"] as const).map((tr) => (
                        <Button
                          key={tr}
                          type="button"
                          size="sm"
                          variant={(form.tracking || "normal") === tr ? "default" : "outline"}
                          className="h-7 text-xs flex-1 px-1 capitalize"
                          onClick={() => setForm((p) => ({ ...p, tracking: tr }))}
                        >
                          {tr}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Multi-Layer Accent Edge Bar */}
                <div className="pt-2 border-t">
                  <label className="text-xs font-medium mb-1.5 block flex items-center justify-between">
                    <span>Edge Accent Stripe</span>
                    <span className="text-[10px] text-muted-foreground uppercase">{form.accentBar || "none"}</span>
                  </label>
                  <div className="grid grid-cols-4 gap-1.5 mb-2.5">
                    {(["none", "left", "top", "bottom"] as const).map((bar) => (
                      <Button
                        key={bar}
                        type="button"
                        size="sm"
                        variant={(form.accentBar || "none") === bar ? "default" : "outline"}
                        className="text-xs h-7 capitalize"
                        onClick={() => setForm((p) => ({ ...p, accentBar: bar }))}
                      >
                        {bar}
                      </Button>
                    ))}
                  </div>

                  {form.accentBar && form.accentBar !== "none" && (
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-muted-foreground">Color:</span>
                      <div className="flex items-center gap-1.5">
                        {accentPresets.map((pr) => (
                          <button
                            key={pr.hex}
                            type="button"
                            onClick={() => setForm((p) => ({ ...p, accentColor: pr.hex }))}
                            className={`w-5 h-5 rounded-full border transition-all ${
                              form.accentColor === pr.hex ? "ring-2 ring-primary ring-offset-1 scale-110" : "opacity-80 hover:opacity-100"
                            }`}
                            style={{ backgroundColor: pr.hex }}
                            title={pr.label}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Bleed & Coordinates Tab */}
            {activeTab === "layout" && (
              <div className="space-y-4">
                {/* Print Bleed & Safe Margin Prepress Settings */}
                <div className="p-3 border rounded-lg bg-muted/20 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-amber-500" />
                      Prepress 1/8" Print Bleed Export
                    </span>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, includeBleed: !p.includeBleed }))}
                      className="text-xs flex items-center gap-1 text-primary hover:underline"
                    >
                      {form.includeBleed ? <CheckSquare className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
                      <span>{form.includeBleed ? "Enabled (3.75\" × 2.25\")" : "Standard (3.5\" × 2.0\")"}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-normal">
                    Adds industry standard 0.125" (1/8") print bleed on all 4 edges with corner crop trim lines for commercial printing.
                  </p>
                </div>

                {/* Text Layout Alignment */}
                <div>
                  <label className="text-xs font-medium mb-1.5 block">Layout Alignment</label>
                  <div className="grid grid-cols-4 gap-1.5">
                    {(["left", "center", "right", "split"] as const).map((al) => (
                      <Button
                        key={al}
                        type="button"
                        size="sm"
                        variant={form.textLayout === al ? "default" : "outline"}
                        className="text-xs h-7 capitalize"
                        onClick={() => setForm((p) => ({ ...p, textLayout: al }))}
                      >
                        {al === "left" ? (
                          <AlignLeft className="w-3.5 h-3.5" />
                        ) : al === "center" ? (
                          <AlignCenter className="w-3.5 h-3.5" />
                        ) : al === "right" ? (
                          <AlignRight className="w-3.5 h-3.5" />
                        ) : (
                          "Split"
                        )}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Coordinate Nudge Controls */}
                <div className="p-3 border rounded-lg bg-card/40 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-500" />
                      Granular Coordinates
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setSnapGrid(!snapGrid)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                          snapGrid ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"
                        }`}
                      >
                        Snap 0.05"
                      </button>
                      <button
                        type="button"
                        onClick={() => setForm((p) => ({ ...p, offsetX: 0, offsetY: 0 }))}
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">X Offset</span>
                        <span className="font-mono">{form.offsetX || 0}"</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2 flex-1" onClick={() => nudgeCoordinate("x", -0.05)}>
                          -0.05"
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2 flex-1" onClick={() => nudgeCoordinate("x", 0.05)}>
                          +0.05"
                        </Button>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="text-muted-foreground">Y Offset</span>
                        <span className="font-mono">{form.offsetY || 0}"</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2 flex-1" onClick={() => nudgeCoordinate("y", -0.05)}>
                          -0.05"
                        </Button>
                        <Button size="sm" variant="outline" className="h-6 text-xs px-2 flex-1" onClick={() => nudgeCoordinate("y", 0.05)}>
                          +0.05"
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>

          {/* Interactive Card Canvas Simulation with Prepress Guides */}
          <section className="flex flex-col items-center justify-center p-6 border rounded-xl bg-card/40 relative">
            {/* Guide & Side Toggle Bar */}
            <div className="flex flex-wrap items-center justify-between w-full gap-2 mb-4 pb-3 border-b border-border/40">
              <div className="flex gap-1.5">
                <Button
                  size="sm"
                  variant={side === "front" ? "default" : "outline"}
                  onClick={() => setSide("front")}
                  className="text-xs h-7 px-3 font-semibold"
                >
                  Front Side
                </Button>
                <Button
                  size="sm"
                  variant={side === "back" ? "default" : "outline"}
                  onClick={() => setSide("back")}
                  className="text-xs h-7 px-3 font-semibold"
                >
                  Back Side
                </Button>
              </div>

              {/* Prepress Guide Toggles */}
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={showGridOverlay ? "secondary" : "ghost"}
                  onClick={() => setShowGridOverlay(!showGridOverlay)}
                  className="h-7 text-[11px] px-2 gap-1 text-muted-foreground hover:text-foreground"
                  title="Toggle 1/8-inch layout grid"
                >
                  <Grid className="w-3 h-3" />
                  Grid
                </Button>
                <Button
                  size="sm"
                  variant={showSafeGuide ? "secondary" : "ghost"}
                  onClick={() => setShowSafeGuide(!showSafeGuide)}
                  className="h-7 text-[11px] px-2 gap-1 text-cyan-600 dark:text-cyan-400"
                  title="Toggle 0.125-inch safe margin guide"
                >
                  Safe Zone
                </Button>
                <Button
                  size="sm"
                  variant={showBleedGuide ? "secondary" : "ghost"}
                  onClick={() => setShowBleedGuide(!showBleedGuide)}
                  className="h-7 text-[11px] px-2 gap-1 text-rose-600 dark:text-rose-400"
                  title="Toggle 0.125-inch print bleed perimeter"
                >
                  Bleed
                </Button>
              </div>
            </div>

            {/* Bleed Container Simulator Box */}
            <div
              className={`p-3 rounded-2xl transition-all duration-200 relative ${
                showBleedGuide ? "border-2 border-dashed border-rose-500/60 bg-rose-500/5" : "p-0"
              }`}
            >
              {showBleedGuide && (
                <div className="absolute top-1 left-2 text-[9px] font-mono text-rose-500 font-semibold tracking-wider uppercase">
                  1/8" Print Bleed Boundary (3.75" × 2.25")
                </div>
              )}

              {/* 3.5" x 2" Physical Simulation Box */}
              <div
                style={{
                  transform: `translate(${(form.offsetX || 0) * 20}px, ${(form.offsetY || 0) * 20}px)`,
                }}
                className={`w-[360px] sm:w-[400px] aspect-[1.75/1] rounded-xl border shadow-xl p-6 flex flex-col justify-between transition-all duration-300 relative overflow-hidden ${
                  theme.container
                } ${typo.fontClass} ${
                  form.textLayout === "center"
                    ? "text-center items-center"
                    : form.textLayout === "right"
                    ? "text-right items-end"
                    : "text-left items-start"
                }`}
              >
                {/* Accent Bar Overlay */}
                {form.accentBar && form.accentBar !== "none" && (
                  <div
                    style={{ backgroundColor: form.accentColor || "#d97706" }}
                    className={`absolute z-10 ${
                      form.accentBar === "left"
                        ? "top-0 left-0 w-2 h-full"
                        : form.accentBar === "top"
                        ? "top-0 left-0 w-full h-2"
                        : "bottom-0 left-0 w-full h-2"
                    }`}
                  />
                )}

                {/* Safe Margin Guide Overlay */}
                {showSafeGuide && (
                  <div className="absolute inset-3 border border-dashed border-cyan-500/70 pointer-events-none rounded z-20 flex items-start justify-end p-1">
                    <span className="text-[8px] font-mono text-cyan-600 dark:text-cyan-400 bg-background/80 px-1 rounded">
                      Safe 0.125"
                    </span>
                  </div>
                )}

                {/* Grid Overlay */}
                {showGridOverlay && (
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20 z-10"
                    style={{
                      backgroundImage: `radial-gradient(circle, currentColor 1px, transparent 1px)`,
                      backgroundSize: "16px 16px",
                    }}
                  />
                )}

                {side === "front" ? (
                  <>
                    <div className="w-full flex items-center gap-4 relative z-10">
                      {form.logo ? (
                        <img src={form.logo} alt="Logo" className="w-14 h-14 rounded object-cover shadow-sm border" />
                      ) : (
                        <div className="w-12 h-12 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-lg border border-primary/20">
                          {form.company ? form.company.slice(0, 2).toUpperCase() : "PW"}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div
                          style={{ fontSize: `${(form.nameFontSize || 16) / 16}rem` }}
                          className={`font-bold leading-tight ${tracking} truncate`}
                        >
                          {form.name || "Alex Mercer"}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium mt-0.5">{form.title || "Principal Systems Architect"}</div>
                        <div className="text-xs font-semibold text-primary mt-1">{form.company || "Apex Labs Inc."}</div>
                      </div>
                    </div>

                    <div className="w-full text-[11px] text-muted-foreground space-y-0.5 pt-2 border-t border-border/40 relative z-10">
                      <div>{form.phone || "+1 (555) 019-2834"}</div>
                      <div>{form.email || "alex@apexlabs.dev"}</div>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-center space-y-2 relative z-10">
                    {form.logo && <img src={form.logo} alt="Logo" className="max-h-10 object-contain mb-1" />}
                    <div className={`font-bold text-base ${tracking}`}>{form.company || "Apex Labs Inc."}</div>
                    <div className="text-xs text-muted-foreground max-w-[280px]">{form.tagline || "Engineering Autonomous Systems"}</div>
                    <div className="text-[11px] font-mono text-primary pt-1">{form.website || "https://apexlabs.dev"}</div>
                    <div className="text-[10px] text-muted-foreground">{form.address || "San Francisco, CA"}</div>
                  </div>
                )}
              </div>
            </div>

            <div className="text-[11px] text-muted-foreground mt-4 text-center flex items-center gap-3">
              <span>Trim: 3.5" × 2.0"</span>
              <span>•</span>
              <span>Bleed: 3.75" × 2.25"</span>
              <span>•</span>
              <span>Safe Area: 3.25" × 1.75"</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BusinessCards;
