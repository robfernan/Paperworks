import * as React from "react";
import { PDFDocument } from "pdf-lib";
import { useSearchParams } from "react-router-dom";
import {
  FileStack,
  Upload,
  Download,
  Plus,
  Undo2,
  Redo2,
  Save,
  Trash2,
  Copy,
  PenTool,
  Loader2,
  FileCheck2,
  Layers,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  getDocument,
  listDocuments,
  updateDocument,
  type DocumentRecord,
} from "@/lib/documentStore";
import {
  bridgeSaveBinary,
  bridgeReadBinary,
} from "@/lib/platformBridge";
import { base64ToUint8, uint8ToBase64 } from "@/lib/binary";
import { useDocumentHistory } from "@/hooks/useDocumentHistory";
import { SnapshotTimeline } from "@/components/SnapshotTimeline";
import { PdfPageGrid } from "@/components/pdf/PdfPageGrid";
import { PdfToolsDialog } from "@/components/pdf/PdfToolsDialog";
import { PdfAnnotationToolbar } from "@/components/pdf/PdfAnnotationToolbar";
import {
  processPdfAsync,
  inspectPdfMetadata,
  type StampOptions,
  type DigitalSignaturePlaceholder,
  type PdfMetadata,
  type PdfAnnotation,
  type AnnotationType,
} from "@/lib/pdfEngine";
import { toast } from "sonner";

export interface PdfProjectPayload {
  fileName: string;
  storageRef?: string;
  pdfBase64?: string; // legacy fallback
  pageOrder: number[];
  rotations: Record<number, number>;
  signatureDataUrl: string | null;
  stamp?: StampOptions | null;
  digitalSignature?: DigitalSignaturePlaceholder | null;
  annotations?: PdfAnnotation[];
  metadata?: Partial<PdfMetadata> | null;
}

const emptyProjectPayload: PdfProjectPayload = {
  fileName: "",
  pageOrder: [],
  rotations: {},
  signatureDataUrl: null,
  stamp: null,
  digitalSignature: null,
  annotations: [],
  metadata: null,
};

const PdfPro = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = React.useState<DocumentRecord<PdfProjectPayload>[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [projectTitle, setProjectTitle] = React.useState("Untitled PDF Project");
  const [isLoadingDocs, setIsLoadingDocs] = React.useState(true);

  // Raw PDF bytes in memory
  const [pdfBytes, setPdfBytes] = React.useState<Uint8Array | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const prevUrlRef = React.useRef<string | null>(null);

  // Processing state
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processProgress, setProcessProgress] = React.useState(0);
  const [selectedPageIndex, setSelectedPageIndex] = React.useState<number | null>(0);

  // Active annotation tool
  const [activeTool, setActiveTool] = React.useState<AnnotationType | "select">("select");
  const [currentColor, setCurrentColor] = React.useState<NonNullable<PdfAnnotation["color"]>>("blue");

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawing = React.useRef(false);

  // Undo/Redo & Snapshot Timeline state management
  const {
    state: projectState,
    setState: setProjectState,
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
  } = useDocumentHistory<PdfProjectPayload>({
    documentId: selectedId,
    initialState: emptyProjectPayload,
    onAutosave: async (state) => {
      if (selectedId && pdfBytes) {
        await saveProjectDirect(selectedId, projectTitle, state, false);
      }
    },
  });

  const loadProjects = React.useCallback(async () => {
    setIsLoadingDocs(true);
    const docs = await listDocuments<PdfProjectPayload>("pdf");
    setDocuments(docs);

    const requestedId = searchParams.get("doc");
    if (requestedId) {
      const target = docs.find((d) => d.id === requestedId);
      if (target) {
        setSelectedId(target.id);
        setProjectTitle(target.title);
        resetState({
          ...emptyProjectPayload,
          ...target.payload,
          annotations: target.payload.annotations || [],
        });

        // Hydrate PDF bytes from native storage engine or legacy base64
        let bytes: Uint8Array | null = null;
        if (target.payload.storageRef) {
          bytes = await bridgeReadBinary(target.payload.storageRef);
        } else if (target.payload.pdfBase64) {
          bytes = base64ToUint8(target.payload.pdfBase64);
        }

        if (bytes) {
          setPdfBytes(bytes);
        }
      }
    }
    setIsLoadingDocs(false);
  }, [searchParams, resetState]);

  React.useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  // Load a new PDF file from user
  const handleFile = async (file: File | null) => {
    if (!file) return;
    setIsProcessing(true);
    setProcessProgress(20);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setPdfBytes(bytes);

      const metadata = await inspectPdfMetadata(bytes);
      const pagesCount = metadata.pageCount;
      const initialOrder = Array.from({ length: pagesCount }, (_, i) => i);

      const initialPayload: PdfProjectPayload = {
        fileName: file.name,
        pageOrder: initialOrder,
        rotations: {},
        signatureDataUrl: null,
        stamp: null,
        digitalSignature: null,
        annotations: [],
        metadata: {
          title: metadata.title || file.name.replace(/\.pdf$/i, ""),
          author: metadata.author,
          pageCount: metadata.pageCount,
          dimensions: metadata.dimensions,
        },
      };

      setProjectState(initialPayload);
      if (!selectedId) {
        setProjectTitle(file.name.replace(/\.pdf$/i, "") || "Untitled PDF Project");
      }
      setSelectedPageIndex(0);
      toast.success(`Loaded "${file.name}" with ${pagesCount} pages`);
    } catch (err) {
      toast.error("Failed to parse PDF document");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setProcessProgress(0);
    }
  };

  // Asynchronously generate transformed PDF preview
  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const generatePreview = async () => {
      if (!pdfBytes || projectState.pageOrder.length === 0) {
        if (prevUrlRef.current) {
          URL.revokeObjectURL(prevUrlRef.current);
          prevUrlRef.current = null;
        }
        setPdfUrl(null);
        return;
      }

      setIsProcessing(true);
      try {
        const out = await processPdfAsync({
          pdfBytes,
          pageOrder: projectState.pageOrder,
          rotations: projectState.rotations,
          signatureDataUrl: projectState.signatureDataUrl,
          stamp: projectState.stamp,
          digitalSignature: projectState.digitalSignature,
          annotations: projectState.annotations,
          metadata: projectState.metadata,
          onProgress: (p) => {
            if (!cancelled) setProcessProgress(p);
          },
        });

        if (cancelled) return;

        const blob = new Blob([out.buffer as ArrayBuffer], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        if (prevUrlRef.current) {
          URL.revokeObjectURL(prevUrlRef.current);
        }
        prevUrlRef.current = url;
        setPdfUrl(url);
      } catch (err) {
        console.warn("PDF preview update failed", err);
      } finally {
        if (!cancelled) {
          setIsProcessing(false);
          setProcessProgress(0);
        }
      }
    };

    timer = setTimeout(() => {
      void generatePreview();
    }, 280);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [
    pdfBytes,
    projectState.pageOrder,
    projectState.rotations,
    projectState.signatureDataUrl,
    projectState.stamp,
    projectState.digitalSignature,
    projectState.annotations,
    projectState.metadata,
  ]);

  // Page reordering, rotation, deletion, duplication
  const handlePageReorder = (newOrder: number[]) => {
    setProjectState((prev) => ({ ...prev, pageOrder: newOrder }));
  };

  const handlePageRotate = (pageIndex: number, delta: number) => {
    setProjectState((prev) => ({
      ...prev,
      rotations: {
        ...prev.rotations,
        [pageIndex]: ((prev.rotations[pageIndex] || 0) + delta) % 360,
      },
    }));
  };

  const handlePageDelete = (pageIndex: number) => {
    if (projectState.pageOrder.length <= 1) {
      toast.error("Cannot delete the last remaining page");
      return;
    }
    setProjectState((prev) => {
      const nextOrder = prev.pageOrder.filter((_, idx) => idx !== pageIndex);
      const nextRotations = { ...prev.rotations };
      delete nextRotations[pageIndex];
      return { ...prev, pageOrder: nextOrder, rotations: nextRotations };
    });
    toast.info(`Deleted page ${pageIndex + 1}`);
  };

  const handlePageDuplicate = (pageIndex: number) => {
    setProjectState((prev) => {
      const targetSource = prev.pageOrder[pageIndex];
      const nextOrder = [...prev.pageOrder];
      nextOrder.splice(pageIndex + 1, 0, targetSource);
      return { ...prev, pageOrder: nextOrder };
    });
    toast.success(`Duplicated page ${pageIndex + 1}`);
  };

  // Add Annotation to active page
  const handleAddAnnotation = (annot: Omit<PdfAnnotation, "id">) => {
    const newAnnot: PdfAnnotation = {
      ...annot,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };

    setProjectState((prev) => ({
      ...prev,
      annotations: [...(prev.annotations || []), newAnnot],
    }));
  };

  const handleRemoveAnnotation = (id: string) => {
    setProjectState((prev) => ({
      ...prev,
      annotations: (prev.annotations || []).filter((a) => a.id !== id),
    }));
    toast.info("Annotation removed");
  };

  // Handle click on canvas or quick tool action
  const handleCanvasToolClick = (tool: AnnotationType) => {
    const targetPage = selectedPageIndex ?? 0;
    if (tool === "checkmark") {
      handleAddAnnotation({
        type: "checkmark",
        pageIndex: targetPage,
        xPercent: 82,
        yPercent: 88,
        widthPercent: 8,
        heightPercent: 6,
        color: "green",
      });
      toast.success(`Checkmark placed on Page ${targetPage + 1}`);
    } else if (tool === "rectangle") {
      handleAddAnnotation({
        type: "rectangle",
        pageIndex: targetPage,
        xPercent: 15,
        yPercent: 65,
        widthPercent: 70,
        heightPercent: 12,
        color: currentColor,
        strokeWidth: 2,
      });
      toast.success(`Rectangle placed on Page ${targetPage + 1}`);
    } else if (tool === "circle") {
      handleAddAnnotation({
        type: "circle",
        pageIndex: targetPage,
        xPercent: 35,
        yPercent: 55,
        widthPercent: 30,
        heightPercent: 18,
        color: currentColor,
        strokeWidth: 2,
      });
      toast.success(`Circle placed on Page ${targetPage + 1}`);
    } else if (tool === "text") {
      const text = window.prompt("Enter text note annotation:", "REVIEWED & VERIFIED");
      if (text) {
        handleAddAnnotation({
          type: "text",
          pageIndex: targetPage,
          xPercent: 20,
          yPercent: 75,
          widthPercent: 40,
          heightPercent: 5,
          text,
          color: currentColor,
        });
        toast.success(`Text note added to Page ${targetPage + 1}`);
      }
    }
  };

  // Hand-drawn Signature canvas handlers
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#1e293b";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const onPointerDown: EventListener = (ev) => {
      const e = ev as PointerEvent;
      drawing.current = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };
    const onPointerMove: EventListener = (ev) => {
      const e = ev as PointerEvent;
      if (!drawing.current) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };
    const onPointerUp: EventListener = () => {
      if (!drawing.current) return;
      drawing.current = false;
      const dataUrl = canvas.toDataURL("image/png");
      setProjectState((prev) => ({ ...prev, signatureDataUrl: dataUrl }));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, [setProjectState]);

  const clearSignature = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setProjectState((prev) => ({ ...prev, signatureDataUrl: null }));
  };

  // Direct Save helper with native binary offload
  const saveProjectDirect = async (
    id: string | null,
    title: string,
    state: PdfProjectPayload,
    showToast = true
  ) => {
    if (!pdfBytes) return;

    // Offload large PDF bytes to native disk (Wails) or IndexedDB blob store
    const blobRef = await bridgeSaveBinary(`pdf-${Date.now()}-${state.fileName || "doc.pdf"}`, pdfBytes);

    const payload: PdfProjectPayload = {
      ...state,
      storageRef: blobRef,
      pdfBase64: undefined,
    };

    if (id) {
      await updateDocument<PdfProjectPayload>(id, {
        title,
        payload,
      });
      if (showToast) toast.success("Project saved");
    } else {
      const created = await createDocument<PdfProjectPayload>({
        toolType: "pdf",
        title,
        payload,
      });
      setSelectedId(created.id);
      setSearchParams({ doc: created.id }, { replace: true });
      if (showToast) toast.success("New PDF project created");
    }

    await loadProjects();
  };

  const handleExportPdf = async () => {
    if (!pdfBytes) return;
    setIsProcessing(true);

    try {
      const finalBytes = await processPdfAsync({
        pdfBytes,
        pageOrder: projectState.pageOrder,
        rotations: projectState.rotations,
        signatureDataUrl: projectState.signatureDataUrl,
        stamp: projectState.stamp,
        digitalSignature: projectState.digitalSignature,
        annotations: projectState.annotations,
        metadata: projectState.metadata,
        onProgress: setProcessProgress,
      });

      const blob = new Blob([finalBytes.buffer as ArrayBuffer], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = projectState.fileName
        ? projectState.fileName.replace(/\.pdf$/i, "-edited.pdf")
        : "document-edited.pdf";
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Exported edited PDF successfully");
    } catch (err) {
      toast.error("Failed to export PDF");
      console.error(err);
    } finally {
      setIsProcessing(false);
      setProcessProgress(0);
    }
  };

  const handleNewProject = () => {
    setSelectedId(null);
    setSearchParams({}, { replace: true });
    setProjectTitle("Untitled PDF Project");
    setPdfBytes(null);
    clearSignature();
    resetState(emptyProjectPayload);
  };

  const openProject = async (doc: DocumentRecord<PdfProjectPayload>) => {
    setSelectedId(doc.id);
    setSearchParams({ doc: doc.id }, { replace: true });
    setProjectTitle(doc.title);
    resetState({
      ...emptyProjectPayload,
      ...doc.payload,
      annotations: doc.payload.annotations || [],
    });

    let bytes: Uint8Array | null = null;
    if (doc.payload.storageRef) {
      bytes = await bridgeReadBinary(doc.payload.storageRef);
    } else if (doc.payload.pdfBase64) {
      bytes = base64ToUint8(doc.payload.pdfBase64);
    }

    if (bytes) {
      setPdfBytes(bytes);
    }
    setSelectedPageIndex(0);
    toast.info(`Opened "${doc.title}"`);
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Top Header & Breadcrumb */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">PDF Pro Studio</h1>
            <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-semibold">
              v2.0 Commercial Suite
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Offline-first PDF assembly, interactive annotations (checkmarks, shapes, notes), multi-signature stamps, and native binary engine.
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

          {/* Security, Stamps & Metadata Dialog */}
          <PdfToolsDialog
            stamp={projectState.stamp ?? null}
            onStampChange={(stamp) => setProjectState((p) => ({ ...p, stamp }))}
            digitalSignature={projectState.digitalSignature ?? null}
            onDigitalSignatureChange={(digitalSignature) => setProjectState((p) => ({ ...p, digitalSignature }))}
            metadata={projectState.metadata ?? null}
            onMetadataChange={(metadata) => setProjectState((p) => ({ ...p, metadata }))}
            pageCount={projectState.pageOrder.length}
          />

          {/* Save & Export */}
          <Button
            size="sm"
            onClick={() => void saveProjectDirect(selectedId, projectTitle, projectState, true)}
            disabled={!pdfBytes}
            className="gap-1.5 h-8 text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5" />
            Save Project
          </Button>

          <Button
            size="sm"
            variant="default"
            onClick={() => void handleExportPdf()}
            disabled={!pdfBytes || isProcessing}
            className="gap-1.5 h-8 text-xs font-semibold bg-primary hover:bg-primary/90"
          >
            {isProcessing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Processing Progress Bar */}
      {isProcessing && processProgress > 0 && (
        <div className="mb-4">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
              Processing multi-page document...
            </span>
            <span>{processProgress}%</span>
          </div>
          <Progress value={processProgress} className="h-1.5" />
        </div>
      )}

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        {/* Left Sidebar: Projects Library */}
        <aside className="border rounded-xl p-4 bg-card/60 backdrop-blur-sm flex flex-col h-[780px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Layers className="w-4 h-4 text-primary" />
              <span>Saved Projects</span>
            </div>
            <Button size="sm" variant="outline" onClick={handleNewProject} className="h-7 text-xs px-2 gap-1">
              <Plus className="w-3 h-3" />
              New
            </Button>
          </div>

          <div className="mb-3">
            <Input
              value={projectTitle}
              onChange={(e) => setProjectTitle(e.target.value)}
              placeholder="Project title"
              className="text-xs h-8"
            />
          </div>

          {/* Project List */}
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoadingDocs ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg p-4">
                No saved PDF projects. Load a PDF to begin.
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => void openProject(doc)}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedId === doc.id
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "hover:bg-accent/50 border-border/70"
                  }`}
                >
                  <div className="font-medium text-xs truncate text-foreground">{doc.title || "Untitled"}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    {doc.payload?.pageOrder && (
                      <span className="font-mono">{doc.payload.pageOrder.length} pages</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Project Action Footer */}
          {selectedId && (
            <div className="pt-3 border-t flex items-center justify-between gap-2 mt-auto">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] flex-1"
                onClick={async () => {
                  await duplicateDocument(selectedId);
                  await loadProjects();
                  toast.success("Project duplicated");
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
                  handleNewProject();
                  await loadProjects();
                  toast.info("Project deleted");
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </aside>

        {/* Right Editor Pane */}
        <div className="space-y-5">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />

          {/* Action Header: Load / Sample */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl border bg-card/60">
            <div className="flex flex-wrap items-center gap-2">
              <Button onClick={() => fileInputRef.current?.click()} size="sm" className="h-8 text-xs gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                Upload PDF
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="h-8 text-xs gap-1.5"
                onClick={async () => {
                  const doc = await PDFDocument.create();
                  const p1 = doc.addPage([595, 842]);
                  p1.drawText("PAPERWORKS COMMERCIAL ENGINE - PAGE 1", { x: 50, y: 780, size: 14 });
                  p1.drawText("Offline-first multi-page PDF processing with native binary storage.", { x: 50, y: 750, size: 10 });

                  const p2 = doc.addPage([595, 842]);
                  p2.drawText("TECHNICAL SPECIFICATION - PAGE 2", { x: 50, y: 780, size: 14 });
                  p2.drawText("Interactive annotations, shapes, checkmarks, and signature library.", { x: 50, y: 750, size: 10 });

                  const p3 = doc.addPage([595, 842]);
                  p3.drawText("TERMS & AUDIT SEAL - PAGE 3", { x: 50, y: 780, size: 14 });
                  p3.drawText("Autosave snapshot timeline and deep-state undo/redo history.", { x: 50, y: 750, size: 10 });

                  const bytes = await doc.save();
                  await handleFile(new File([bytes.buffer as ArrayBuffer], "sample-commercial-doc.pdf", { type: "application/pdf" }));
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                Load Sample Multi-Page PDF
              </Button>
            </div>

            {projectState.fileName && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground truncate max-w-[200px]">
                  {projectState.fileName}
                </span>
                <Badge variant="secondary" className="text-[10px] font-mono">
                  {projectState.pageOrder.length} Pages
                </Badge>
              </div>
            )}
          </div>

          {/* Interactive Annotation Suite Toolbar */}
          {projectState.pageOrder.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Interactive Annotations & Shapes (Target: Page {(selectedPageIndex ?? 0) + 1})
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] gap-1"
                    onClick={() => handleCanvasToolClick("checkmark")}
                  >
                    + Checkmark
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] gap-1"
                    onClick={() => handleCanvasToolClick("rectangle")}
                  >
                    + Box
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] gap-1"
                    onClick={() => handleCanvasToolClick("circle")}
                  >
                    + Circle
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-6 text-[10px] gap-1"
                    onClick={() => handleCanvasToolClick("text")}
                  >
                    + Note
                  </Button>
                </div>
              </div>

              <PdfAnnotationToolbar
                activeTool={activeTool}
                onSelectTool={setActiveTool}
                currentColor={currentColor}
                onSelectColor={setCurrentColor}
                activePageIndex={selectedPageIndex ?? 0}
                annotations={projectState.annotations || []}
                onAddAnnotation={handleAddAnnotation}
                onRemoveAnnotation={handleRemoveAnnotation}
              />
            </div>
          )}

          {/* Page Reorder & Rotation Grid */}
          {projectState.pageOrder.length > 0 ? (
            <div className="border rounded-xl p-4 bg-card/40">
              <PdfPageGrid
                pageOrder={projectState.pageOrder}
                rotations={projectState.rotations}
                selectedPageIndex={selectedPageIndex}
                onSelectPage={setSelectedPageIndex}
                onReorder={handlePageReorder}
                onRotate={handlePageRotate}
                onDeletePage={handlePageDelete}
                onDuplicatePage={handlePageDuplicate}
              />
            </div>
          ) : (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed rounded-xl p-12 text-center flex flex-col items-center justify-center cursor-pointer hover:border-primary/60 transition-colors bg-muted/10 hover:bg-muted/20"
            >
              <FileStack className="w-10 h-10 text-muted-foreground mb-3 opacity-60" />
              <h3 className="font-semibold text-sm">No PDF Document Loaded</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                Click here or drag-and-drop a PDF file to begin rearranging pages, rotating, stamping, and signing.
              </p>
              <Button size="sm" variant="outline" className="mt-4 text-xs h-8">
                Select File
              </Button>
            </div>
          )}

          {/* Interactive Hand-Drawn Signature Pad */}
          <div className="border rounded-xl p-4 bg-card/40">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 font-medium text-xs">
                <PenTool className="w-4 h-4 text-primary" />
                <span>Primary Document Signature Stamp</span>
              </div>
              <Button size="sm" variant="ghost" onClick={clearSignature} className="h-7 text-xs">
                Clear Signature
              </Button>
            </div>
            <p className="text-[11px] text-muted-foreground mb-3">
              Draw on the pad below or use the "Signatures" button above to insert multiple saved signature stamps on any page.
            </p>
            <div className="border rounded-lg bg-background overflow-hidden inline-block shadow-inner">
              <canvas ref={canvasRef} width={640} height={120} className="w-full max-w-[640px] cursor-crosshair touch-none" />
            </div>
          </div>

          {/* Live PDF Preview */}
          {pdfUrl && (
            <div className="border rounded-xl p-4 bg-card/40">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-xs flex items-center gap-1.5">
                  <FileCheck2 className="w-4 h-4 text-emerald-500" />
                  Real-time Compiled Preview (Page {(selectedPageIndex ?? 0) + 1} Selected)
                </span>
                <span className="text-[10px] text-muted-foreground">Synchronized with applied operations & annotations</span>
              </div>
              <div className="border rounded-lg overflow-hidden bg-background shadow-sm">
                <iframe title="Compiled PDF Preview" src={pdfUrl} className="w-full h-[640px]" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PdfPro;
