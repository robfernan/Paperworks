import * as React from "react";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  listDocuments,
  type DocumentRecord,
  updateDocument,
} from "@/lib/documentStore";
import { base64ToUint8, uint8ToBase64 } from "@/lib/binary";
import {
  Annotation,
  DEFAULT_PARTIES,
  ToolMode,
  TransactionParties,
} from "@/components/pdf/types";
import { PdfViewerCanvas } from "@/components/pdf/PdfViewerCanvas";
import { PdfToolbar } from "@/components/pdf/PdfToolbar";
import { SignatureModal } from "@/components/pdf/SignatureModal";
import { generateSampleContractPdf } from "@/lib/sampleContract";
import {
  Upload,
  FileText,
  Save,
  PlusCircle,
  FolderOpen,
  Sparkles,
} from "lucide-react";

interface PdfProjectPayload {
  fileName: string;
  pdfBase64: string;
  annotations: Annotation[];
  parties: TransactionParties;
  signatureDataUrl: string | null;
  initialDataUrl: string | null;
}

const PdfPro = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Project state
  const [documents, setDocuments] = React.useState<DocumentRecord<PdfProjectPayload>[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [projectTitle, setProjectTitle] = React.useState("Untitled Contract Form");

  // PDF Data
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = React.useState<Uint8Array | null>(null);
  const [pageCount, setPageCount] = React.useState<number>(1);
  const [currentPage, setCurrentPage] = React.useState<number>(1);
  const [scale, setScale] = React.useState<number>(1.0);

  // Form Simplicity Tools & Controls
  const [activeTool, setActiveTool] = React.useState<ToolMode>("select");
  const [baselineAlignmentEnabled, setBaselineAlignmentEnabled] = React.useState(true);
  const [autoShrinkEnabled, setAutoShrinkEnabled] = React.useState(true);
  const [activeColor, setActiveColor] = React.useState("#000000");
  const [activeFontSize, setActiveFontSize] = React.useState(12);

  // Annotations & Parties
  const [annotations, setAnnotations] = React.useState<Annotation[]>([]);
  const [parties, setParties] = React.useState<TransactionParties>(DEFAULT_PARTIES);
  const [signatureDataUrl, setSignatureDataUrl] = React.useState<string | null>(null);
  const [initialDataUrl, setInitialDataUrl] = React.useState<string | null>(null);

  // Signature Modals & Processing
  const [signatureModalOpen, setSignatureModalOpen] = React.useState(false);
  const [signatureModalType, setSignatureModalType] = React.useState<"signature" | "initial">("signature");
  const [isProcessing, setIsProcessing] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Load Saved Projects from Vault
  const loadProjects = React.useCallback(async () => {
    const docs = await listDocuments<PdfProjectPayload>("pdf");
    setDocuments(docs);

    const requestedId = searchParams.get("doc");
    if (requestedId) {
      const target = docs.find((d) => d.id === requestedId);
      if (target) {
        setSelectedId(target.id);
        setProjectTitle(target.title);
        setFileName(target.payload.fileName);
        const bytes = base64ToUint8(target.payload.pdfBase64);
        setPdfBytes(bytes);
        setAnnotations(target.payload.annotations || []);
        if (target.payload.parties) setParties(target.payload.parties);
        setSignatureDataUrl(target.payload.signatureDataUrl ?? null);
        setInitialDataUrl(target.payload.initialDataUrl ?? null);

        try {
          const doc = await PDFDocument.load(bytes);
          setPageCount(doc.getPageCount());
        } catch {
          // ignore
        }
      }
    }
  }, [searchParams]);

  React.useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

  // Handle URL Interception (?file=... or ?openPending=true)
  React.useEffect(() => {
    const fileParam = searchParams.get("file");
    const openPending = searchParams.get("openPending");

    // 1. Handle Pending File from Extension Popup Dropzone
    if (openPending && typeof window !== "undefined" && window.chrome?.storage?.local) {
      void window.chrome.storage.local.get("pendingPdf").then((data) => {
        const item = data?.pendingPdf;
        if (item?.base64) {
          const bytes = base64ToUint8(item.base64);
          setPdfBytes(bytes);
          setFileName(item.name || "dropped_contract.pdf");
          setProjectTitle(item.name?.replace(/\.pdf$/i, "") || "Dropped Contract");
          void PDFDocument.load(bytes).then((doc) => {
            setPageCount(doc.getPageCount());
            setCurrentPage(1);
          });
          toast({
            title: "PDF Loaded",
            description: `Ready to fill and sign: ${item.name}`,
          });
          // Clear pending
          window.chrome.storage.local.remove("pendingPdf");
        }
      });
      return;
    }

    // 2. Handle Intercepted PDF URL
    if (fileParam) {
      const decodedUrl = decodeURIComponent(fileParam);
      setIsProcessing(true);
      toast({
        title: "Intercepted PDF",
        description: `Loading document from ${decodedUrl.slice(0, 50)}...`,
      });

      const fetchFile = async () => {
        try {
          let arrayBuffer: ArrayBuffer;

          // If running in Chrome Extension, use background worker for CORS bypass
          if (typeof window !== "undefined" && window.chrome?.runtime?.sendMessage) {
            const response = await new Promise<{ success: boolean; base64?: string; error?: string }>(
              (resolve) => {
                window.chrome.runtime.sendMessage(
                  { type: "FETCH_PDF_BUFFER", url: decodedUrl },
                  (res) => resolve(res)
                );
              }
            );

            if (response.success && response.base64) {
              const bytes = base64ToUint8(response.base64);
              arrayBuffer = bytes.buffer as ArrayBuffer;
            } else {
              // Fallback to fetch
              const res = await fetch(decodedUrl);
              arrayBuffer = await res.arrayBuffer();
            }
          } else {
            // Standard Web fetch
            const res = await fetch(decodedUrl);
            arrayBuffer = await res.arrayBuffer();
          }

          const bytes = new Uint8Array(arrayBuffer);
          setPdfBytes(bytes);

          const inferredName = decodedUrl.split("/").pop()?.split("?")[0] || "intercepted_document.pdf";
          setFileName(inferredName);
          setProjectTitle(inferredName.replace(/\.pdf$/i, "") || "Intercepted PDF");

          const doc = await PDFDocument.load(bytes);
          setPageCount(doc.getPageCount());
          setCurrentPage(1);

          toast({
            title: "Document Ready",
            description: `Loaded ${inferredName} (${doc.getPageCount()} pages).`,
          });
        } catch (err) {
          console.error("Failed to fetch intercepted PDF:", err);
          toast({
            title: "Fetch Failed",
            description: "Could not download remote PDF. Try loading a local file or sample.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      };

      void fetchFile();
    }
  }, [searchParams, toast]);

  // Load File Locally
  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      setIsProcessing(true);
      const arrayBuffer = await file.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      setPdfBytes(bytes);
      setFileName(file.name);
      setProjectTitle(file.name.replace(/\.pdf$/i, "") || "Untitled Form");

      const doc = await PDFDocument.load(bytes);
      setPageCount(doc.getPageCount());
      setCurrentPage(1);
      setAnnotations([]);

      toast({
        title: "Loaded Document",
        description: `${file.name} (${doc.getPageCount()} pages)`,
      });
    } catch (err) {
      console.error("Failed to load PDF:", err);
      toast({
        title: "Invalid PDF",
        description: "Could not read this PDF file. Please verify it is not password protected.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Load Pre-populated Form Simplicity Sample Contract
  const loadSampleContract = async () => {
    setIsProcessing(true);
    try {
      const bytes = await generateSampleContractPdf();
      setPdfBytes(bytes);
      setFileName("Residential_Lease_Purchase_Agreement.pdf");
      setProjectTitle("Residential Lease & Purchase Agreement");

      const loadedDoc = await PDFDocument.load(bytes);
      setPageCount(loadedDoc.getPageCount());
      setCurrentPage(1);
      setAnnotations([]);

      toast({
        title: "Template Loaded",
        description: "2-Page document template ready to type, checkmark, and sign.",
      });
    } catch (err) {
      console.error("Error loading template:", err);
      toast({
        title: "Template Error",
        description: "Could not generate contract template.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddAnnotation = (annData: Omit<Annotation, "id">) => {
    const newAnn: Annotation = {
      ...annData,
      id: `ann-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    };
    setAnnotations((prev) => [...prev, newAnn]);
    return newAnn.id;
  };

  const handleUpdateAnnotation = (id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) =>
      prev.map((a) => (a.id === id ? { ...a, ...updates } : a))
    );
  };

  const handleDeleteAnnotation = (id: string) => {
    setAnnotations((prev) => prev.filter((a) => a.id !== id));
  };

  // One-Click Flattening and Export via pdf-lib
  const handleFlattenAndDownload = async () => {
    if (!pdfBytes) return;

    try {
      setIsProcessing(true);
      toast({
        title: "Flattening Document",
        description: "Applying auto-shrink, baseline adjustments, and baking signatures...",
      });

      const pdfDoc = await PDFDocument.load(pdfBytes);
      const helvetica = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      // Bake annotations onto pages
      for (const ann of annotations) {
        const pageIndex = ann.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;

        const page = pages[pageIndex];
        const { width: pWidth, height: pHeight } = page.getSize();

        // Convert percentage to PDF points
        const xPt = (ann.x / 100) * pWidth;
        // In PDF coordinates, (0,0) is bottom-left
        const yPt = pHeight - (ann.y / 100) * pHeight;

        if (ann.type === "text" || ann.type === "date") {
          let fontSize = ann.fontSize || 12;
          // Apply auto-shrink formula if long text
          if (ann.autoShrink !== false && autoShrinkEnabled && ann.value.length > 25) {
            const shrinkRatio = Math.max(0.65, 25 / ann.value.length);
            fontSize = Math.max(8, Math.round(fontSize * shrinkRatio));
          }

          // Parse ink color
          const hex = (ann.color || "#000000").replace("#", "");
          const r = parseInt(hex.substring(0, 2), 16) / 255 || 0;
          const g = parseInt(hex.substring(2, 4), 16) / 255 || 0;
          const b = parseInt(hex.substring(4, 6), 16) / 255 || 0;

          // Align baseline nicely
          page.drawText(ann.value, {
            x: xPt,
            y: yPt - fontSize * 0.3,
            size: fontSize,
            font: helvetica,
            color: rgb(r, g, b),
          });
        } else if (ann.type === "checkmark") {
          // Clean vector checkmark (two lines)
          page.drawLine({
            start: { x: xPt, y: yPt - 2 },
            end: { x: xPt + 4, y: yPt - 6 },
            thickness: 2,
            color: rgb(0.08, 0.5, 0.24),
          });
          page.drawLine({
            start: { x: xPt + 4, y: yPt - 6 },
            end: { x: xPt + 12, y: yPt + 4 },
            thickness: 2,
            color: rgb(0.08, 0.5, 0.24),
          });
        } else if (ann.type === "crossmark") {
          // Clean vector crossmark / X (two crossing lines)
          page.drawLine({
            start: { x: xPt, y: yPt + 4 },
            end: { x: xPt + 10, y: yPt - 6 },
            thickness: 2,
            color: rgb(0.72, 0.11, 0.11),
          });
          page.drawLine({
            start: { x: xPt, y: yPt - 6 },
            end: { x: xPt + 10, y: yPt + 4 },
            thickness: 2,
            color: rgb(0.72, 0.11, 0.11),
          });
        } else if (ann.type === "signature" || ann.type === "initial") {
          if (ann.value.startsWith("data:image/")) {
            const imgBytes = await (await fetch(ann.value)).arrayBuffer();
            const embeddedPng = await pdfDoc.embedPng(imgBytes);

            const isInitial = ann.type === "initial";
            const imgW = isInitial ? 65 : 120;
            const imgH = isInitial ? 35 : 45;

            page.drawImage(embeddedPng, {
              x: xPt,
              y: yPt - imgH * 0.5,
              width: imgW,
              height: imgH,
            });
          }
        }
      }

      const flattenedBytes = await pdfDoc.save();
      const blob = new Blob([flattenedBytes as unknown as BlobPart], { type: "application/pdf" });
      const downloadUrl = URL.createObjectURL(blob);

      const downloadLink = document.createElement("a");
      downloadLink.href = downloadUrl;
      const outName = fileName
        ? fileName.replace(/\.pdf$/i, "-flattened.pdf")
        : "form-simplicity-flattened.pdf";
      downloadLink.download = outName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      downloadLink.remove();

      URL.revokeObjectURL(downloadUrl);

      toast({
        title: "Flattened & Downloaded",
        description: `Exported clean, non-editable PDF: ${outName}`,
      });
    } catch (err) {
      console.error("Flattening error:", err);
      toast({
        title: "Export Failed",
        description: "An error occurred while flattening the document.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Direct Print
  const handlePrint = async () => {
    if (!pdfBytes) return;

    try {
      setIsProcessing(true);
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const helvetica = await pdfDoc.embedStandardFont(StandardFonts.Helvetica);
      const pages = pdfDoc.getPages();

      for (const ann of annotations) {
        const pageIndex = ann.page - 1;
        if (pageIndex < 0 || pageIndex >= pages.length) continue;
        const page = pages[pageIndex];
        const { width: pWidth, height: pHeight } = page.getSize();
        const xPt = (ann.x / 100) * pWidth;
        const yPt = pHeight - (ann.y / 100) * pHeight;

        if (ann.type === "text" || ann.type === "date") {
          page.drawText(ann.value, {
            x: xPt,
            y: yPt - 4,
            size: ann.fontSize || 12,
            font: helvetica,
          });
        } else if (ann.type === "checkmark") {
          page.drawLine({
            start: { x: xPt, y: yPt - 2 },
            end: { x: xPt + 4, y: yPt - 6 },
            thickness: 2,
            color: rgb(0.08, 0.5, 0.24),
          });
          page.drawLine({
            start: { x: xPt + 4, y: yPt - 6 },
            end: { x: xPt + 12, y: yPt + 4 },
            thickness: 2,
            color: rgb(0.08, 0.5, 0.24),
          });
        } else if (ann.type === "crossmark") {
          page.drawLine({
            start: { x: xPt, y: yPt + 4 },
            end: { x: xPt + 10, y: yPt - 6 },
            thickness: 2,
            color: rgb(0.72, 0.11, 0.11),
          });
          page.drawLine({
            start: { x: xPt, y: yPt - 6 },
            end: { x: xPt + 10, y: yPt + 4 },
            thickness: 2,
            color: rgb(0.72, 0.11, 0.11),
          });
        } else if (ann.type === "signature" || ann.type === "initial") {
          if (ann.value.startsWith("data:image/")) {
            const imgBytes = await (await fetch(ann.value)).arrayBuffer();
            const embeddedPng = await pdfDoc.embedPng(imgBytes);
            const isInitial = ann.type === "initial";
            page.drawImage(embeddedPng, {
              x: xPt,
              y: yPt - (isInitial ? 35 : 45) * 0.5,
              width: isInitial ? 65 : 120,
              height: isInitial ? 35 : 45,
            });
          }
        }
      }

      const flattenedBytes = await pdfDoc.save();
      const blob = new Blob([flattenedBytes as unknown as BlobPart], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const printWindow = window.open(url);
      if (printWindow) {
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
      }
    } catch (e) {
      console.error("Print error:", e);
    } finally {
      setIsProcessing(false);
    }
  };

  // Save Project in DocumentStore
  const saveProject = async () => {
    if (!pdfBytes) return;

    const payload: PdfProjectPayload = {
      fileName: fileName || "contract.pdf",
      pdfBase64: uint8ToBase64(pdfBytes),
      annotations,
      parties,
      signatureDataUrl,
      initialDataUrl,
    };

    if (selectedId) {
      await updateDocument<PdfProjectPayload>(selectedId, {
        title: projectTitle,
        payload,
      });
      toast({ title: "Saved", description: "Project updated in your vault." });
    } else {
      const created = await createDocument<PdfProjectPayload>({
        toolType: "pdf",
        title: projectTitle,
        payload,
      });
      setSelectedId(created.id);
      setSearchParams({ doc: created.id }, { replace: true });
      toast({ title: "Created", description: "Project saved to your local vault." });
    }

    await loadProjects();
  };

  return (
    <div className="max-w-7xl mx-auto py-4 sm:py-8 px-3 sm:px-6">
      {/* Header & Quick Action Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Form Simplicity Editor</h1>
            <span className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              MV3 Interceptor
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
            Baseline text alignment, auto-shrink, signature stamps, and one-click flattening.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => void handleFile(e.target.files?.[0] ?? null)}
          />

          <Button size="sm" variant="outline" onClick={() => fileInputRef.current?.click()} className="gap-1.5 text-xs">
            <Upload className="w-3.5 h-3.5" />
            Upload PDF
          </Button>

          <Button size="sm" variant="secondary" onClick={() => void loadSampleContract()} className="gap-1.5 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            Load Document Template
          </Button>

          <Button
            size="sm"
            onClick={() => void saveProject()}
            disabled={!pdfBytes}
            className="gap-1.5 text-xs font-semibold"
          >
            <Save className="w-3.5 h-3.5" />
            Save Draft
          </Button>
        </div>
      </div>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Left Sidebar: Projects & Document Vault */}
        <aside className="hidden lg:block border rounded-xl p-4 bg-card/60 backdrop-blur-sm self-start space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" />
              Saved Contracts
            </h3>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs px-2 gap-1"
              onClick={() => {
                setSelectedId(null);
                setSearchParams({}, { replace: true });
                setProjectTitle("Untitled Contract Form");
                setFileName(null);
                setPdfBytes(null);
                setAnnotations([]);
              }}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              New
            </Button>
          </div>

          <input
            className="w-full rounded-md border bg-background px-3 py-1.5 text-xs"
            placeholder="Contract title..."
            value={projectTitle}
            onChange={(e) => setProjectTitle(e.target.value)}
          />

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {documents.length === 0 ? (
              <div className="text-xs text-muted-foreground py-4 text-center">
                No saved contracts yet. Save drafts to access anytime offline.
              </div>
            ) : null}

            {documents.map((doc) => (
              <div
                key={doc.id}
                onClick={() => {
                  setSelectedId(doc.id);
                  setSearchParams({ doc: doc.id }, { replace: true });
                  setProjectTitle(doc.title);
                  setFileName(doc.payload.fileName);
                  const bytes = base64ToUint8(doc.payload.pdfBase64);
                  setPdfBytes(bytes);
                  setAnnotations(doc.payload.annotations || []);
                  if (doc.payload.parties) setParties(doc.payload.parties);
                  setSignatureDataUrl(doc.payload.signatureDataUrl ?? null);
                  setInitialDataUrl(doc.payload.initialDataUrl ?? null);
                  void PDFDocument.load(bytes).then((d) => setPageCount(d.getPageCount()));
                }}
                className={`group p-2.5 rounded-lg border text-left cursor-pointer transition-colors ${
                  selectedId === doc.id
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : "hover:bg-muted/50"
                }`}
              >
                <div className="text-xs font-medium truncate">{doc.title || "Untitled Contract"}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {new Date(doc.updatedAt).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>

          {selectedId && (
            <div className="pt-2 border-t flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="w-1/2 text-[11px] h-7"
                onClick={async () => {
                  await duplicateDocument(selectedId);
                  await loadProjects();
                }}
              >
                Duplicate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                className="w-1/2 text-[11px] h-7"
                onClick={async () => {
                  await deleteDocument(selectedId);
                  setSelectedId(null);
                  await loadProjects();
                }}
              >
                Delete
              </Button>
            </div>
          )}
        </aside>

        {/* Center / Editor Canvas Workspace */}
        <div className="flex flex-col flex-1 min-w-0">
          {/* Top Form Simplicity Toolbar */}
          <PdfToolbar
            activeTool={activeTool}
            onSelectTool={setActiveTool}
            baselineAlignmentEnabled={baselineAlignmentEnabled}
            onToggleBaseline={() => setBaselineAlignmentEnabled(!baselineAlignmentEnabled)}
            autoShrinkEnabled={autoShrinkEnabled}
            onToggleAutoShrink={() => setAutoShrinkEnabled(!autoShrinkEnabled)}
            activeColor={activeColor}
            onSelectColor={setActiveColor}
            activeFontSize={activeFontSize}
            onSelectFontSize={setActiveFontSize}
            onOpenSignatureModal={(type) => {
              setSignatureModalType(type);
              setSignatureModalOpen(true);
            }}
            onFlattenAndDownload={() => void handleFlattenAndDownload()}
            onPrint={() => void handlePrint()}
            hasSignature={Boolean(signatureDataUrl)}
            isProcessing={isProcessing}
            hasDocument={Boolean(pdfBytes)}
          />

          {/* Canvas or Empty State */}
          {pdfBytes ? (
            <PdfViewerCanvas
              pdfBytes={pdfBytes}
              currentPage={currentPage}
              totalNumberedPages={pageCount}
              onPageChange={setCurrentPage}
              scale={scale}
              onScaleChange={setScale}
              annotations={annotations}
              onAddAnnotation={handleAddAnnotation}
              onUpdateAnnotation={handleUpdateAnnotation}
              onDeleteAnnotation={handleDeleteAnnotation}
              activeTool={activeTool}
              onSelectTool={setActiveTool}
              autoShrinkEnabled={autoShrinkEnabled}
              baselineAlignmentEnabled={baselineAlignmentEnabled}
              activeColor={activeColor}
              activeFontSize={activeFontSize}
              signatureDataUrl={signatureDataUrl}
              initialDataUrl={initialDataUrl}
              onRequestSignatureModal={(type) => {
                setSignatureModalType(type);
                setSignatureModalOpen(true);
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl bg-card/30 text-center min-h-[420px]">
              <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                <FileText className="w-7 h-7" />
              </div>
              <h3 className="text-base font-semibold mb-1">No Document Loaded</h3>
              <p className="text-xs text-muted-foreground max-w-sm mb-5">
                Load a PDF to start auto-shrinking text fields, placing baseline-aligned annotations, and drawing signatures.
              </p>
              <div className="flex gap-3">
                <Button size="sm" onClick={() => fileInputRef.current?.click()} className="gap-1.5">
                  <Upload className="w-4 h-4" />
                  Browse PDF
                </Button>
                <Button size="sm" variant="secondary" onClick={() => void loadSampleContract()} className="gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary" />
                  Try Document Template
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Digital Signature & Initial Pad Modal */}
      <SignatureModal
        open={signatureModalOpen}
        onOpenChange={setSignatureModalOpen}
        initialType={signatureModalType}
        onSave={(dataUrl, type) => {
          if (type === "signature") {
            setSignatureDataUrl(dataUrl);
            setActiveTool("signature");
            toast({
              title: "Signature Saved",
              description: "Click on the document to place your signature stamp.",
            });
          } else {
            setInitialDataUrl(dataUrl);
            setActiveTool("initial");
            toast({
              title: "Initials Saved",
              description: "Click on the document to place your initials stamp.",
            });
          }
        }}
      />
    </div>
  );
};

export default PdfPro;
