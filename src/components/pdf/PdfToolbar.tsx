import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ToolMode } from "./types";
import {
  MousePointer,
  Type,
  CheckSquare,
  XSquare,
  PenTool,
  Bookmark,
  Calendar,
  Baseline,
  Minimize2,
  Download,
  Printer,
  Plus,
  X,
  FileCheck,
  Edit3,
} from "lucide-react";

interface PdfToolbarProps {
  activeTool: ToolMode;
  onSelectTool: (tool: ToolMode) => void;
  baselineAlignmentEnabled: boolean;
  onToggleBaseline: () => void;
  autoShrinkEnabled: boolean;
  onToggleAutoShrink: () => void;
  activeColor: string;
  onSelectColor: (color: string) => void;
  activeFontSize: number;
  onSelectFontSize: (size: number) => void;
  onOpenSignatureModal: (type: "signature" | "initial") => void;
  onFlattenAndDownload: () => void;
  onPrint: () => void;
  hasSignature: boolean;
  isProcessing: boolean;
  hasDocument: boolean;
}

export const PdfToolbar: React.FC<PdfToolbarProps> = ({
  activeTool,
  onSelectTool,
  baselineAlignmentEnabled,
  onToggleBaseline,
  autoShrinkEnabled,
  onToggleAutoShrink,
  activeColor,
  onSelectColor,
  activeFontSize,
  onSelectFontSize,
  onOpenSignatureModal,
  onFlattenAndDownload,
  onPrint,
  hasSignature,
  isProcessing,
  hasDocument,
}) => {
  const [mobileFabOpen, setMobileFabOpen] = useState(false);

  return (
    <>
      {/* Desktop Top Toolbar */}
      <div className="hidden md:flex items-center justify-between gap-2 p-2.5 bg-card/90 backdrop-blur-md border rounded-xl shadow-sm mb-4 flex-wrap">
        {/* Core Tools */}
        <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
          <Button
            type="button"
            variant={activeTool === "select" ? "default" : "ghost"}
            size="sm"
            onClick={() => onSelectTool("select")}
            className="h-8 px-2.5 gap-1.5 text-xs"
            title="Pan & Select (V)"
          >
            <MousePointer className="w-3.5 h-3.5" />
            Select
          </Button>

          <Button
            type="button"
            variant={activeTool === "text" ? "default" : "ghost"}
            size="sm"
            onClick={() => onSelectTool("text")}
            className="h-8 px-2.5 gap-1.5 text-xs font-medium"
            title="Type anywhere on form (T)"
          >
            <Type className="w-3.5 h-3.5 text-primary" />
            Type Text
          </Button>

          <Button
            type="button"
            variant={activeTool === "checkmark" ? "default" : "ghost"}
            size="sm"
            onClick={() => onSelectTool("checkmark")}
            className="h-8 px-2.5 gap-1 text-xs font-medium"
            title="Put a checkmark in box (C)"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            Check ✓
          </Button>

          <Button
            type="button"
            variant={activeTool === "crossmark" ? "default" : "ghost"}
            size="sm"
            onClick={() => onSelectTool("crossmark")}
            className="h-8 px-2.5 gap-1 text-xs font-medium"
            title="Put an X in box (X)"
          >
            <XSquare className="w-3.5 h-3.5 text-rose-600" />
            Put X ✕
          </Button>

          <div className="flex items-center">
            <Button
              type="button"
              variant={activeTool === "signature" ? "default" : "ghost"}
              size="sm"
              onClick={() => {
                onSelectTool("signature");
                if (!hasSignature) onOpenSignatureModal("signature");
              }}
              className="h-8 px-2.5 gap-1.5 text-xs font-medium"
              title="Sign Stamp (S)"
            >
              <PenTool className="w-3.5 h-3.5 text-primary" />
              Sign
            </Button>
            {hasSignature && (
              <button
                type="button"
                onClick={() => onOpenSignatureModal("signature")}
                className="p-1 hover:bg-muted text-muted-foreground hover:text-foreground rounded"
                title="Redraw signature"
              >
                <Edit3 className="w-3 h-3" />
              </button>
            )}
          </div>

          <Button
            type="button"
            variant={activeTool === "initial" ? "default" : "ghost"}
            size="sm"
            onClick={() => {
              onSelectTool("initial");
              onOpenSignatureModal("initial");
            }}
            className="h-8 px-2.5 gap-1.5 text-xs"
            title="Initials Stamp (I)"
          >
            <Bookmark className="w-3.5 h-3.5" />
            Initial
          </Button>

          <Button
            type="button"
            variant={activeTool === "date" ? "default" : "ghost"}
            size="sm"
            onClick={() => onSelectTool("date")}
            className="h-8 px-2.5 gap-1.5 text-xs"
            title="Date Stamp (D)"
          >
            <Calendar className="w-3.5 h-3.5" />
            Date
          </Button>
        </div>

        {/* Alignment & Format Controls */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant={baselineAlignmentEnabled ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleBaseline}
            className={`h-8 px-2 gap-1.5 text-xs ${
              baselineAlignmentEnabled ? "border-primary text-primary font-semibold" : ""
            }`}
            title="Align text baseline to document lines"
          >
            <Baseline className="w-3.5 h-3.5" />
            Baseline
          </Button>

          <Button
            type="button"
            variant={autoShrinkEnabled ? "secondary" : "outline"}
            size="sm"
            onClick={onToggleAutoShrink}
            className={`h-8 px-2 gap-1.5 text-xs ${
              autoShrinkEnabled ? "border-primary text-primary font-semibold" : ""
            }`}
            title="Auto-shrink long text to fit boxes"
          >
            <Minimize2 className="w-3.5 h-3.5" />
            Auto-Shrink
          </Button>

          {/* Color selector */}
          <div className="flex items-center gap-1 pl-1 pr-1 bg-muted/40 rounded border h-8">
            <button
              type="button"
              className={`w-4 h-4 rounded-full border ${
                activeColor === "#000000" ? "border-primary ring-1 ring-primary" : "border-transparent"
              }`}
              style={{ backgroundColor: "#000000" }}
              onClick={() => onSelectColor("#000000")}
              title="Black Ink"
            />
            <button
              type="button"
              className={`w-4 h-4 rounded-full border ${
                activeColor === "#1e3a8a" ? "border-primary ring-1 ring-primary" : "border-transparent"
              }`}
              style={{ backgroundColor: "#1e3a8a" }}
              onClick={() => onSelectColor("#1e3a8a")}
              title="Legal Navy Ink"
            />
          </div>

          {/* Font size */}
          <select
            value={activeFontSize}
            onChange={(e) => onSelectFontSize(Number(e.target.value))}
            className="h-8 px-2 text-xs bg-background border rounded outline-none cursor-pointer"
          >
            <option value={10}>10 pt</option>
            <option value={12}>12 pt</option>
            <option value={14}>14 pt</option>
            <option value={16}>16 pt</option>
          </select>
        </div>

        {/* Export / Print */}
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onPrint}
            disabled={!hasDocument || isProcessing}
            className="h-8 px-2.5 gap-1.5 text-xs"
            title="Print Document"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </Button>

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onFlattenAndDownload}
            disabled={!hasDocument || isProcessing}
            className="h-8 px-3 gap-1.5 text-xs font-semibold bg-primary hover:bg-primary/90"
          >
            <FileCheck className="w-3.5 h-3.5" />
            {isProcessing ? "Saving..." : "Flatten & Download"}
          </Button>
        </div>
      </div>

      {/* Mobile Top Bar (Compact) */}
      <div className="flex md:hidden items-center justify-between p-2 bg-card border rounded-lg shadow-sm mb-3">
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant={activeTool === "text" ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectTool("text")}
            className="h-8 px-2 text-xs gap-1"
          >
            <Type className="w-3.5 h-3.5" />
            Type
          </Button>
          <Button
            type="button"
            variant={activeTool === "checkmark" ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectTool("checkmark")}
            className="h-8 px-2 text-xs"
          >
            <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
            ✓
          </Button>
          <Button
            type="button"
            variant={activeTool === "crossmark" ? "default" : "outline"}
            size="sm"
            onClick={() => onSelectTool("crossmark")}
            className="h-8 px-2 text-xs"
          >
            <XSquare className="w-3.5 h-3.5 text-rose-600" />
            ✕
          </Button>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={onFlattenAndDownload}
            disabled={!hasDocument || isProcessing}
            className="h-8 px-2.5 text-xs font-medium"
          >
            <Download className="w-3.5 h-3.5 mr-1" />
            Flatten
          </Button>
        </div>
      </div>

      {/* Mobile Floating Action Button (FAB) */}
      <div className="md:hidden fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
        {mobileFabOpen && (
          <div className="flex flex-col items-end gap-2 mb-2 animate-in fade-in slide-in-from-bottom-4 duration-200">
            <Button
              type="button"
              size="sm"
              className="rounded-full shadow-lg h-10 px-4 gap-2 bg-card border text-foreground hover:bg-muted"
              onClick={() => {
                onSelectTool("signature");
                onOpenSignatureModal("signature");
                setMobileFabOpen(false);
              }}
            >
              <PenTool className="w-4 h-4 text-primary" />
              Sign Stamp
            </Button>

            <Button
              type="button"
              size="sm"
              className="rounded-full shadow-lg h-10 px-4 gap-2 bg-card border text-foreground hover:bg-muted"
              onClick={() => {
                onSelectTool("text");
                setMobileFabOpen(false);
              }}
            >
              <Type className="w-4 h-4 text-primary" />
              Type Text
            </Button>

            <Button
              type="button"
              size="sm"
              className="rounded-full shadow-lg h-10 px-4 gap-2 bg-card border text-foreground hover:bg-muted"
              onClick={() => {
                onSelectTool("checkmark");
                setMobileFabOpen(false);
              }}
            >
              <CheckSquare className="w-4 h-4 text-emerald-600" />
              Checkmark ✓
            </Button>

            <Button
              type="button"
              size="sm"
              className="rounded-full shadow-lg h-10 px-4 gap-2 bg-card border text-foreground hover:bg-muted"
              onClick={() => {
                onSelectTool("crossmark");
                setMobileFabOpen(false);
              }}
            >
              <XSquare className="w-4 h-4 text-rose-600" />
              Put an X ✕
            </Button>
          </div>
        )}

        <Button
          type="button"
          size="icon"
          onClick={() => setMobileFabOpen(!mobileFabOpen)}
          className="w-13 h-13 rounded-full shadow-2xl bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center p-3"
          title="Tools FAB"
        >
          {mobileFabOpen ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
        </Button>
      </div>
    </>
  );
};
