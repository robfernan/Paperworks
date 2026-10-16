import * as React from "react";
import {
  CheckSquare,
  Square,
  Circle,
  Type,
  PenTool,
  Trash2,
  Plus,
  MousePointer,
  Sparkles,
  Layers,
  Palette,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  listSavedSignatures,
  createSavedSignature,
  deleteSavedSignature,
  type SavedSignature,
} from "@/lib/documentStore";
import type { PdfAnnotation, AnnotationType } from "@/lib/pdfEngine";
import { toast } from "sonner";

interface PdfAnnotationToolbarProps {
  activeTool: AnnotationType | "select";
  onSelectTool: (tool: AnnotationType | "select") => void;
  currentColor: NonNullable<PdfAnnotation["color"]>;
  onSelectColor: (color: NonNullable<PdfAnnotation["color"]>) => void;
  activePageIndex: number;
  annotations: PdfAnnotation[];
  onAddAnnotation: (annot: Omit<PdfAnnotation, "id">) => void;
  onRemoveAnnotation: (id: string) => void;
}

export const PdfAnnotationToolbar: React.FC<PdfAnnotationToolbarProps> = ({
  activeTool,
  onSelectTool,
  currentColor,
  onSelectColor,
  activePageIndex,
  annotations,
  onAddAnnotation,
  onRemoveAnnotation,
}) => {
  const [sigLibraryOpen, setSigLibraryOpen] = React.useState(false);
  const [savedSignatures, setSavedSignatures] = React.useState<SavedSignature[]>([]);
  const [sigName, setSigName] = React.useState("");

  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const isDrawing = React.useRef(false);

  const loadSignatures = React.useCallback(async () => {
    const list = await listSavedSignatures();
    setSavedSignatures(list);
  }, []);

  React.useEffect(() => {
    if (sigLibraryOpen) {
      void loadSignatures();
    }
  }, [sigLibraryOpen, loadSignatures]);

  // Setup drawing pad inside signature dialog
  React.useEffect(() => {
    if (!sigLibraryOpen) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0f172a";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const onDown = (e: MouseEvent | TouchEvent) => {
      isDrawing.current = true;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      ctx.beginPath();
      ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!isDrawing.current) return;
      const rect = canvas.getBoundingClientRect();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
      ctx.lineTo(clientX - rect.left, clientY - rect.top);
      ctx.stroke();
    };

    const onUp = () => {
      isDrawing.current = false;
    };

    canvas.addEventListener("mousedown", onDown);
    canvas.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    canvas.addEventListener("touchstart", onDown);
    canvas.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);

    return () => {
      canvas.removeEventListener("mousedown", onDown);
      canvas.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      canvas.removeEventListener("touchstart", onDown);
      canvas.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [sigLibraryOpen]);

  const handleSaveSignature = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL("image/png");

    await createSavedSignature(sigName.trim() || `Signature ${savedSignatures.length + 1}`, dataUrl);
    toast.success("Signature saved to library");
    setSigName("");
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
    await loadSignatures();
  };

  const handleInsertSignature = (sig: SavedSignature) => {
    onAddAnnotation({
      type: "signature",
      pageIndex: activePageIndex,
      xPercent: 65,
      yPercent: 8,
      widthPercent: 25,
      heightPercent: 8,
      signatureDataUrl: sig.dataUrl,
    });
    setSigLibraryOpen(false);
    toast.success(`Inserted "${sig.name}" on Page ${activePageIndex + 1}`);
  };

  const handleDeleteSignature = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await deleteSavedSignature(id);
    toast.info("Signature removed");
    await loadSignatures();
  };

  const pageAnnotations = annotations.filter((a) => a.pageIndex === activePageIndex);

  return (
    <div className="space-y-3">
      {/* Primary Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl border bg-card/60">
        <div className="flex flex-wrap items-center gap-1">
          <Button
            size="sm"
            variant={activeTool === "select" ? "default" : "outline"}
            className="h-8 text-xs gap-1.5"
            onClick={() => onSelectTool("select")}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Pointer</span>
          </Button>

          <Button
            size="sm"
            variant={activeTool === "checkmark" ? "default" : "outline"}
            className="h-8 text-xs gap-1.5"
            onClick={() => onSelectTool("checkmark")}
            title="Stamp verification checkmark badge"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-500" />
            <span>Checkmark</span>
          </Button>

          <Button
            size="sm"
            variant={activeTool === "rectangle" ? "default" : "outline"}
            className="h-8 text-xs gap-1.5"
            onClick={() => onSelectTool("rectangle")}
            title="Draw rectangle annotation"
          >
            <Square className="w-3.5 h-3.5 text-blue-500" />
            <span>Rectangle</span>
          </Button>

          <Button
            size="sm"
            variant={activeTool === "circle" ? "default" : "outline"}
            className="h-8 text-xs gap-1.5"
            onClick={() => onSelectTool("circle")}
            title="Draw circle / ellipse annotation"
          >
            <Circle className="w-3.5 h-3.5 text-amber-500" />
            <span>Circle</span>
          </Button>

          <Button
            size="sm"
            variant={activeTool === "text" ? "default" : "outline"}
            className="h-8 text-xs gap-1.5"
            onClick={() => onSelectTool("text")}
            title="Insert text note annotation"
          >
            <Type className="w-3.5 h-3.5 text-purple-500" />
            <span>Text Note</span>
          </Button>

          {/* Signature Library Dialog */}
          <Dialog open={sigLibraryOpen} onOpenChange={setSigLibraryOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="h-8 text-xs gap-1.5 border-border/80">
                <PenTool className="w-3.5 h-3.5 text-indigo-500" />
                <span>Signatures ({savedSignatures.length})</span>
              </Button>
            </DialogTrigger>

            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <PenTool className="w-5 h-5 text-primary" />
                  <span>Digital Signature Library</span>
                </DialogTitle>
                <DialogDescription>
                  Draw and store reusable signature stamps to place across any page.
                </DialogDescription>
              </DialogHeader>

              {/* Pad */}
              <div className="space-y-3 pt-2">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold">Draw New Signature Pad</label>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 text-[10px]"
                      onClick={() => {
                        const canvas = canvasRef.current;
                        const ctx = canvas?.getContext("2d");
                        ctx?.clearRect(0, 0, canvas?.width || 0, canvas?.height || 0);
                      }}
                    >
                      Clear
                    </Button>
                  </div>
                  <div className="border rounded-lg bg-background overflow-hidden shadow-inner">
                    <canvas
                      ref={canvasRef}
                      width={440}
                      height={120}
                      className="w-full cursor-crosshair touch-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Signature Name (e.g., 'Executive Full', 'Initials')"
                    value={sigName}
                    onChange={(e) => setSigName(e.target.value)}
                    className="text-xs h-8"
                  />
                  <Button size="sm" onClick={handleSaveSignature} className="h-8 text-xs shrink-0">
                    Save
                  </Button>
                </div>

                {/* Stored Signatures */}
                <div className="pt-2 border-t">
                  <label className="text-xs font-semibold block mb-2">Saved Signatures (Click to Stamp)</label>
                  <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
                    {savedSignatures.length === 0 ? (
                      <div className="text-center py-6 text-xs text-muted-foreground border border-dashed rounded-lg">
                        No saved signatures. Draw above and click Save.
                      </div>
                    ) : (
                      savedSignatures.map((sig) => (
                        <div
                          key={sig.id}
                          onClick={() => handleInsertSignature(sig)}
                          className="group flex items-center justify-between p-2.5 rounded-lg border bg-card/60 hover:bg-primary/5 hover:border-primary/40 cursor-pointer transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <img
                              src={sig.dataUrl}
                              alt={sig.name}
                              className="h-8 max-w-[120px] object-contain bg-white dark:bg-slate-900 border rounded px-1"
                            />
                            <span className="font-semibold text-xs text-foreground">{sig.name}</span>
                          </div>

                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                            onClick={(e) => handleDeleteSignature(e, sig.id)}
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Color Palette */}
        <div className="flex items-center gap-1.5">
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          {(["blue", "green", "red", "amber", "slate", "black"] as const).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onSelectColor(c)}
              className={`w-5 h-5 rounded-full border transition-all ${
                currentColor === c ? "scale-115 ring-2 ring-primary ring-offset-1" : "opacity-80 hover:opacity-100"
              } ${
                c === "blue"
                  ? "bg-blue-600 border-blue-700"
                  : c === "green"
                  ? "bg-emerald-600 border-emerald-700"
                  : c === "red"
                  ? "bg-rose-600 border-rose-700"
                  : c === "amber"
                  ? "bg-amber-600 border-amber-700"
                  : c === "slate"
                  ? "bg-slate-600 border-slate-700"
                  : "bg-slate-900 border-black"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Active Page Annotations Inspector */}
      {pageAnnotations.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 p-2 rounded-lg border bg-muted/20 text-xs">
          <span className="text-[11px] font-semibold text-muted-foreground mr-1">
            Page {activePageIndex + 1} Annotations:
          </span>
          {pageAnnotations.map((annot) => (
            <div
              key={annot.id}
              className="flex items-center gap-1.5 px-2 py-0.5 rounded border bg-background text-[11px]"
            >
              <span className="capitalize font-medium">{annot.type}</span>
              <button
                type="button"
                onClick={() => onRemoveAnnotation(annot.id)}
                className="text-muted-foreground hover:text-destructive"
                title="Remove annotation"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
