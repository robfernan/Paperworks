import React, { useEffect, useRef, useState, useCallback } from "react";
import * as pdfjsLib from "pdfjs-dist";
import * as pdfjsWorker from "pdfjs-dist/build/pdf.worker.mjs";
import { Annotation, ToolMode } from "./types";
import { X, Move, ZoomIn, ZoomOut } from "lucide-react";

// Configure in-memory worker handler directly so PDF.js never requests an external file
if (typeof window !== "undefined") {
  (window as any).pdfjsWorker = pdfjsWorker;
}

interface PdfViewerCanvasProps {
  pdfBytes: Uint8Array | null;
  currentPage: number;
  totalNumberedPages: number;
  onPageChange: (newPage: number) => void;
  scale: number;
  onScaleChange: (scale: number) => void;
  annotations: Annotation[];
  onAddAnnotation: (ann: Omit<Annotation, "id">) => string;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation: (id: string) => void;
  activeTool: ToolMode;
  onSelectTool?: (tool: ToolMode) => void;
  autoShrinkEnabled: boolean;
  baselineAlignmentEnabled: boolean;
  activeColor: string;
  activeFontSize: number;
  signatureDataUrl: string | null;
  initialDataUrl: string | null;
  onRequestSignatureModal: (type: "signature" | "initial") => void;
}

export const PdfViewerCanvas: React.FC<PdfViewerCanvasProps> = ({
  pdfBytes,
  currentPage,
  totalNumberedPages,
  onPageChange,
  scale,
  onScaleChange,
  annotations,
  onAddAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  activeTool,
  onSelectTool,
  autoShrinkEnabled,
  baselineAlignmentEnabled,
  activeColor,
  activeFontSize,
  signatureDataUrl,
  initialDataUrl,
  onRequestSignatureModal,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

  const [selectedAnnId, setSelectedAnnId] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState<{ width: number; height: number }>({ width: 612, height: 792 });
  const [pdfDoc, setPdfDoc] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [, setRenderLoading] = useState(false);

  // Touch pinch-to-zoom & pan refs
  const touchStartDist = useRef<number | null>(null);
  const initialScale = useRef<number>(scale);
  const isDraggingAnn = useRef<string | null>(null);
  const dragOffset = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Load PDF Document with PDF.js
  useEffect(() => {
    let active = true;
    if (!pdfBytes) {
      setPdfDoc(null);
      return;
    }

    const loadDoc = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument({ data: pdfBytes.slice() });
        const doc = await loadingTask.promise;
        if (!active) return;
        setPdfDoc(doc);
      } catch (err) {
        console.error("Error loading PDF via pdfjs-dist:", err);
      }
    };

    void loadDoc();
    return () => {
      active = false;
    };
  }, [pdfBytes]);

  const renderTaskRef = useRef<any>(null);

  // Render Page onto Canvas
  const renderPage = useCallback(async () => {
    if (!pdfDoc || !canvasRef.current) return;

    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch {
        // ignore cancellation
      }
      renderTaskRef.current = null;
    }

    try {
      setRenderLoading(true);
      const page = await pdfDoc.getPage(currentPage);
      const viewport = page.getViewport({ scale });

      setPageSize({ width: viewport.width, height: viewport.height });

      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;

      // Fill background white so canvas is never transparent
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const transform = dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined;
      const renderTask = page.render({
        canvasContext: ctx,
        transform,
        viewport,
      });

      renderTaskRef.current = renderTask;
      await renderTask.promise;
    } catch (err: any) {
      if (err?.name !== "RenderingCancelledException") {
        console.warn("Render page cancelled or failed:", err);
      }
    } finally {
      renderTaskRef.current = null;
      setRenderLoading(false);
    }
  }, [pdfDoc, currentPage, scale]);

  useEffect(() => {
    void renderPage();
  }, [renderPage]);

  // Keyboard Shortcuts (T: Text, C: Check, X: Cross, S: Sign, I: Initial, D: Date, V: Select, Backspace/Delete)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      if (e.key === "t" || e.key === "T") {
        onSelectTool?.("text");
      } else if (e.key === "c" || e.key === "C") {
        onSelectTool?.("checkmark");
      } else if (e.key === "x" || e.key === "X") {
        onSelectTool?.("crossmark");
      } else if (e.key === "s" || e.key === "S") {
        onSelectTool?.("signature");
        if (!signatureDataUrl) onRequestSignatureModal("signature");
      } else if (e.key === "i" || e.key === "I") {
        onSelectTool?.("initial");
        if (!initialDataUrl) onRequestSignatureModal("initial");
      } else if (e.key === "d" || e.key === "D") {
        onSelectTool?.("date");
      } else if (e.key === "v" || e.key === "V" || e.key === "Escape") {
        onSelectTool?.("select");
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedAnnId) {
        onDeleteAnnotation(selectedAnnId);
        setSelectedAnnId(null);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedAnnId, onSelectTool, signatureDataUrl, initialDataUrl, onDeleteAnnotation, onRequestSignatureModal]);

  // Touch events for Mobile Pinch-to-Zoom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist.current = Math.hypot(dx, dy);
        initialScale.current = scale;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && touchStartDist.current !== null) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDist = Math.hypot(dx, dy);
        const factor = currentDist / touchStartDist.current;
        const newScale = Math.min(Math.max(initialScale.current * factor, 0.4), 3.0);
        onScaleChange(parseFloat(newScale.toFixed(2)));
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        touchStartDist.current = null;
      }
    };

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [scale, onScaleChange]);

  // Handle click on canvas to place annotations instantly
  const handlePageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDraggingAnn.current) return;
    if (!overlayRef.current) return;

    const rect = overlayRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const xPercent = Math.min(Math.max((clickX / rect.width) * 100, 0), 96);
    const yPercent = Math.min(Math.max((clickY / rect.height) * 100, 0), 96);

    if (activeTool === "text") {
      const newId = onAddAnnotation({
        page: currentPage,
        type: "text",
        x: xPercent,
        y: yPercent,
        value: "",
        fontSize: activeFontSize,
        color: activeColor,
        autoShrink: autoShrinkEnabled,
        alignBaseline: baselineAlignmentEnabled,
      });
      setSelectedAnnId(newId);
    } else if (activeTool === "checkmark") {
      const newId = onAddAnnotation({
        page: currentPage,
        type: "checkmark",
        x: xPercent,
        y: yPercent,
        value: "✓",
        color: activeColor,
      });
      setSelectedAnnId(newId);
    } else if (activeTool === "crossmark") {
      const newId = onAddAnnotation({
        page: currentPage,
        type: "crossmark",
        x: xPercent,
        y: yPercent,
        value: "✕",
        color: activeColor,
      });
      setSelectedAnnId(newId);
    } else if (activeTool === "date") {
      const today = new Date().toLocaleDateString("en-US", {
        month: "2-digit",
        day: "2-digit",
        year: "numeric",
      });
      const newId = onAddAnnotation({
        page: currentPage,
        type: "date",
        x: xPercent,
        y: yPercent,
        value: today,
        fontSize: activeFontSize,
        color: activeColor,
        alignBaseline: baselineAlignmentEnabled,
      });
      setSelectedAnnId(newId);
    } else if (activeTool === "signature") {
      if (!signatureDataUrl) {
        onRequestSignatureModal("signature");
      } else {
        const newId = onAddAnnotation({
          page: currentPage,
          type: "signature",
          x: xPercent,
          y: yPercent,
          value: signatureDataUrl,
        });
        setSelectedAnnId(newId);
      }
    } else if (activeTool === "initial") {
      if (!initialDataUrl) {
        onRequestSignatureModal("initial");
      } else {
        const newId = onAddAnnotation({
          page: currentPage,
          type: "initial",
          x: xPercent,
          y: yPercent,
          value: initialDataUrl,
        });
        setSelectedAnnId(newId);
      }
    }
  };

  // Dragging annotations across page
  const handleAnnMouseDown = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSelectedAnnId(id);
    isDraggingAnn.current = id;

    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    const ann = annotations.find((a) => a.id === id);
    if (!ann) return;

    const currentX = (ann.x / 100) * rect.width;
    const currentY = (ann.y / 100) * rect.height;

    dragOffset.current = {
      x: e.clientX - rect.left - currentX,
      y: e.clientY - rect.top - currentY,
    };

    const onMouseMove = (moveEv: MouseEvent) => {
      const newX = moveEv.clientX - rect.left - dragOffset.current.x;
      const newY = moveEv.clientY - rect.top - dragOffset.current.y;

      const pX = Math.min(Math.max((newX / rect.width) * 100, 0), 96);
      const pY = Math.min(Math.max((newY / rect.height) * 100, 0), 96);

      onUpdateAnnotation(id, { x: pX, y: pY });
    };

    const onMouseUp = () => {
      isDraggingAnn.current = null;
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  };

  const pageAnnotations = annotations.filter((a) => a.page === currentPage);

  return (
    <div
      ref={containerRef}
      className="relative flex-1 flex flex-col items-center justify-start overflow-auto p-3 sm:p-6 bg-muted/20 min-h-[500px]"
      onClick={() => setSelectedAnnId(null)}
    >
      {/* Zoom / Page Floating Navigator */}
      <div className="sticky top-2 z-20 flex items-center gap-2 bg-background/90 backdrop-blur-md px-3 py-1.5 rounded-full border shadow-sm text-xs mb-3">
        <button
          type="button"
          disabled={currentPage <= 1}
          onClick={(e) => {
            e.stopPropagation();
            onPageChange(Math.max(1, currentPage - 1));
          }}
          className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-40"
        >
          Prev
        </button>
        <span className="font-medium text-foreground">
          Page {currentPage} of {totalNumberedPages || 1}
        </span>
        <button
          type="button"
          disabled={currentPage >= totalNumberedPages}
          onClick={(e) => {
            e.stopPropagation();
            onPageChange(Math.min(totalNumberedPages, currentPage + 1));
          }}
          className="px-2 py-0.5 rounded hover:bg-muted disabled:opacity-40"
        >
          Next
        </button>
        <div className="w-[1px] h-3.5 bg-border mx-1" />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onScaleChange(Math.max(0.4, scale - 0.15));
          }}
          className="p-1 rounded hover:bg-muted"
          title="Zoom Out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>
        <span className="text-[11px] font-mono w-10 text-center">{Math.round(scale * 100)}%</span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onScaleChange(Math.min(2.5, scale + 0.15));
          }}
          className="p-1 rounded hover:bg-muted"
          title="Zoom In"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* PDF Canvas with Annotation Overlay Container */}
      <div
        className="relative bg-white shadow-xl rounded border transition-shadow"
        style={{
          width: pageSize.width,
          height: pageSize.height,
        }}
      >
        <canvas ref={canvasRef} className="block select-none" />

        {/* Interactive Overlay */}
        <div
          ref={overlayRef}
          className={`absolute inset-0 z-10 ${
            activeTool !== "select" ? "cursor-crosshair" : "cursor-default"
          }`}
          onClick={handlePageClick}
        >
          {pageAnnotations.map((ann) => {
            const isSelected = selectedAnnId === ann.id;
            return (
              <AnnotationItem
                key={ann.id}
                ann={ann}
                isSelected={isSelected}
                scale={scale}
                onSelect={(e) => {
                  e.stopPropagation();
                  setSelectedAnnId(ann.id);
                }}
                onMouseDown={(e) => handleAnnMouseDown(e, ann.id)}
                onUpdate={(updates) => onUpdateAnnotation(ann.id, updates)}
                onDelete={() => onDeleteAnnotation(ann.id)}
                baselineGuide={ann.alignBaseline || baselineAlignmentEnabled}
                autoShrink={ann.autoShrink !== false && autoShrinkEnabled}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Render Individual Annotation with Auto-Shrink and Baseline Alignment
interface AnnotationItemProps {
  ann: Annotation;
  isSelected: boolean;
  scale: number;
  onSelect: (e: React.MouseEvent) => void;
  onMouseDown: (e: React.MouseEvent) => void;
  onUpdate: (updates: Partial<Annotation>) => void;
  onDelete: () => void;
  baselineGuide: boolean;
  autoShrink: boolean;
}

const AnnotationItem: React.FC<AnnotationItemProps> = ({
  ann,
  isSelected,
  scale,
  onSelect,
  onMouseDown,
  onUpdate,
  onDelete,
  baselineGuide,
  autoShrink,
}) => {
  const textRef = useRef<HTMLInputElement | null>(null);
  const [computedFontSize, setComputedFontSize] = useState<number>(ann.fontSize || 12);

  // Auto-focus when newly placed or selected
  useEffect(() => {
    if (isSelected && (ann.type === "text" || ann.type === "date") && textRef.current) {
      textRef.current.focus();
    }
  }, [isSelected, ann.type]);

  // Dynamic Auto-Shrink Font Calculation
  useEffect(() => {
    if (ann.type !== "text" && ann.type !== "date") return;
    if (!autoShrink || !textRef.current) {
      setComputedFontSize(ann.fontSize || 12);
      return;
    }

    const baseSize = ann.fontSize || 12;
    const len = (ann.value || "").length;
    if (len > 24) {
      const shrinkRatio = Math.max(0.6, 24 / len);
      const newSize = Math.max(8, Math.round(baseSize * shrinkRatio));
      setComputedFontSize(newSize);
    } else {
      setComputedFontSize(baseSize);
    }
  }, [ann.value, ann.fontSize, autoShrink, ann.type]);

  return (
    <div
      onClick={onSelect}
      style={{
        left: `${ann.x}%`,
        top: `${ann.y}%`,
        position: "absolute",
        transform: "translate(-0%, -50%)",
      }}
      className={`group select-none flex items-center ${
        isSelected ? "ring-2 ring-primary ring-offset-1 z-30" : "hover:ring-1 hover:ring-primary/40 z-20"
      }`}
    >
      {/* Baseline Alignment Guide Indicator */}
      {baselineGuide && isSelected && (
        <div
          className="absolute -bottom-1 left-[-16px] right-[-16px] border-b-2 border-dashed border-red-500/80 pointer-events-none flex items-center justify-between"
          style={{ transform: "translateY(50%)" }}
        >
          <span className="text-[8px] bg-red-600 text-white font-mono px-1 rounded-sm uppercase tracking-tighter">
            Baseline
          </span>
        </div>
      )}

      {/* Drag handle */}
      {isSelected && (
        <div
          onMouseDown={onMouseDown}
          className="cursor-move p-1 bg-primary text-primary-foreground rounded-l-sm flex items-center justify-center"
          title="Drag to reposition"
        >
          <Move className="w-3 h-3" />
        </div>
      )}

      {/* Annotation Content */}
      {ann.type === "text" || ann.type === "date" ? (
        <input
          ref={textRef}
          type="text"
          value={ann.value}
          placeholder="Click and type..."
          onChange={(e) => onUpdate({ value: e.target.value })}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Escape") {
              textRef.current?.blur();
            }
          }}
          style={{
            fontSize: `${computedFontSize * scale}px`,
            color: ann.color || "#000000",
            lineHeight: 1.1,
            minWidth: "48px",
            width: `${Math.max(50, Math.min(500, (ann.value.length || 6) * (computedFontSize * scale * 0.65)))}px`,
          }}
          className="bg-transparent border border-transparent hover:border-primary/40 focus:border-primary focus:bg-white/95 rounded px-1.5 py-0.5 outline-none font-sans font-medium transition-colors"
        />
      ) : ann.type === "checkmark" ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            // Toggle checkmark to crossmark or back
            onUpdate({ value: ann.value === "✓" ? "✕" : "✓", type: ann.value === "✓" ? "crossmark" : "checkmark" });
          }}
          style={{
            fontSize: `${22 * scale}px`,
            color: ann.color || "#15803d",
            lineHeight: 1,
          }}
          className="font-bold px-1 select-none text-emerald-700 cursor-pointer hover:scale-110 transition-transform"
          title="Click to toggle ✓ / ✕"
        >
          ✓
        </div>
      ) : ann.type === "crossmark" ? (
        <div
          onClick={(e) => {
            e.stopPropagation();
            onUpdate({ value: ann.value === "✕" ? "✓" : "✕", type: ann.value === "✕" ? "checkmark" : "crossmark" });
          }}
          style={{
            fontSize: `${20 * scale}px`,
            color: ann.color || "#b91c1c",
            lineHeight: 1,
          }}
          className="font-bold px-1 select-none text-red-700 cursor-pointer hover:scale-110 transition-transform"
          title="Click to toggle ✕ / ✓"
        >
          ✕
        </div>
      ) : ann.type === "signature" || ann.type === "initial" ? (
        <div className="bg-white/40 p-1 border border-primary/20 rounded">
          <img
            src={ann.value}
            alt={ann.type}
            style={{
              height: `${(ann.type === "initial" ? 36 : 48) * scale}px`,
              pointerEvents: "none",
            }}
            className="block object-contain"
          />
        </div>
      ) : null}

      {/* Delete Button */}
      {isSelected && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 bg-destructive text-destructive-foreground rounded-r-sm hover:bg-destructive/90 flex items-center justify-center"
          title="Delete annotation"
        >
          <X className="w-3 h-3" />
        </button>
      )}
    </div>
  );
};
