import React, { useEffect, useRef, useState } from "react";
import SignaturePad from "signature_pad";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eraser, Check, PenLine } from "lucide-react";

interface SignatureModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (dataUrl: string, type: "signature" | "initial") => void;
  initialType?: "signature" | "initial";
}

export const SignatureModal: React.FC<SignatureModalProps> = ({
  open,
  onOpenChange,
  onSave,
  initialType = "signature",
}) => {
  const [activeTab, setActiveTab] = useState<"signature" | "initial">(initialType);
  const [inkColor, setInkColor] = useState<string>("#1e3a8a"); // Classic legal blue
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const padRef = useRef<SignaturePad | null>(null);

  useEffect(() => {
    setActiveTab(initialType);
  }, [initialType]);

  useEffect(() => {
    if (!open) return;

    const timer = setTimeout(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(ratio, ratio);

      if (padRef.current) {
        padRef.current.off();
      }

      padRef.current = new SignaturePad(canvas, {
        penColor: inkColor,
        minWidth: 1.5,
        maxWidth: 3.5,
        velocityFilterWeight: 0.7,
      });
    }, 120);

    return () => {
      clearTimeout(timer);
      padRef.current?.off();
    };
  }, [open, activeTab, inkColor]);

  useEffect(() => {
    if (padRef.current) {
      padRef.current.penColor = inkColor;
    }
  }, [inkColor]);

  const handleClear = () => {
    padRef.current?.clear();
  };

  const handleSave = () => {
    if (!padRef.current || padRef.current.isEmpty()) {
      return;
    }
    const dataUrl = padRef.current.toDataURL("image/png");
    onSave(dataUrl, activeTab);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PenLine className="w-5 h-5 text-primary" />
            Digital Signature & Initial Pad
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <Tabs
            value={activeTab}
            onValueChange={(val) => {
              setActiveTab(val as "signature" | "initial");
              padRef.current?.clear();
            }}
          >
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="signature">Full Signature</TabsTrigger>
              <TabsTrigger value="initial">Initials</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
            <span>Draw with finger, stylus, or mouse</span>
            <div className="flex items-center gap-2">
              <span>Ink:</span>
              <button
                type="button"
                className={`w-5 h-5 rounded-full border-2 ${
                  inkColor === "#1e3a8a" ? "border-primary scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: "#1e3a8a" }}
                onClick={() => setInkColor("#1e3a8a")}
                title="Legal Navy"
              />
              <button
                type="button"
                className={`w-5 h-5 rounded-full border-2 ${
                  inkColor === "#0f172a" ? "border-primary scale-110" : "border-transparent"
                }`}
                style={{ backgroundColor: "#0f172a" }}
                onClick={() => setInkColor("#0f172a")}
                title="Formal Black"
              />
            </div>
          </div>

          <div className="relative border-2 border-dashed border-muted-foreground/30 rounded-lg bg-card/60 overflow-hidden shadow-inner">
            <canvas
              ref={canvasRef}
              className="w-full h-[180px] touch-none cursor-crosshair block"
            />
            <div className="absolute bottom-4 left-6 right-6 border-b border-muted-foreground/20 pointer-events-none flex items-center justify-between">
              <span className="text-[10px] text-muted-foreground/60 uppercase tracking-wider">
                {activeTab === "signature" ? "Signature Baseline" : "Initials Baseline"}
              </span>
              <span className="text-xs text-muted-foreground/40 font-serif">✕</span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex sm:justify-between items-center gap-2 pt-3">
          <Button variant="outline" size="sm" onClick={handleClear} className="gap-1.5">
            <Eraser className="w-4 h-4" />
            Clear
          </Button>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} className="gap-1.5">
              <Check className="w-4 h-4" />
              Place Stamp
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
