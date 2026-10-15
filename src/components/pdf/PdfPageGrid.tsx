import * as React from "react";
import { RotateCw, RotateCcw, Trash2, Copy, Move, GripVertical, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface PdfPageGridProps {
  pageOrder: number[];
  rotations: Record<number, number>;
  selectedPageIndex: number | null;
  onSelectPage: (index: number) => void;
  onReorder: (newOrder: number[]) => void;
  onRotate: (index: number, delta: number) => void;
  onDeletePage: (index: number) => void;
  onDuplicatePage: (index: number) => void;
}

export const PdfPageGrid: React.FC<PdfPageGridProps> = ({
  pageOrder,
  rotations,
  selectedPageIndex,
  onSelectPage,
  onReorder,
  onRotate,
  onDeletePage,
  onDuplicatePage,
}) => {
  const [draggedIndex, setDraggedIndex] = React.useState<number | null>(null);
  const [dropTargetIndex, setDropTargetIndex] = React.useState<number | null>(null);

  // Touch drag state
  const touchStartPos = React.useRef<{ x: number; y: number } | null>(null);
  const activeTouchIndex = React.useRef<number | null>(null);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.setData("text/plain", index.toString());
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dropTargetIndex !== index) {
      setDropTargetIndex(index);
    }
  };

  const handleDrop = (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === targetIndex) {
      setDraggedIndex(null);
      setDropTargetIndex(null);
      return;
    }

    const nextOrder = [...pageOrder];
    const [moved] = nextOrder.splice(draggedIndex, 1);
    nextOrder.splice(targetIndex, 0, moved);

    onReorder(nextOrder);
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDropTargetIndex(null);
  };

  // Touch handlers for mobile
  const handleTouchStart = (index: number, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    activeTouchIndex.current = index;
  };

  const handleTouchEnd = () => {
    touchStartPos.current = null;
    activeTouchIndex.current = null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Document Pages ({pageOrder.length})
          </span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 bg-muted/50">
            Drag to reorder
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[520px] overflow-y-auto p-1 pr-2">
        {pageOrder.map((sourcePageIndex, i) => {
          const rotation = rotations[i] || 0;
          const isSelected = selectedPageIndex === i;
          const isDragging = draggedIndex === i;
          const isDropTarget = dropTargetIndex === i;

          return (
            <div
              key={`${sourcePageIndex}-${i}`}
              draggable
              onDragStart={(e) => handleDragStart(e, i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={(e) => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              onTouchStart={(e) => handleTouchStart(i, e)}
              onTouchEnd={handleTouchEnd}
              onClick={() => onSelectPage(i)}
              className={`group relative flex flex-col items-center justify-between p-3 rounded-xl border bg-card/80 transition-all select-none cursor-pointer ${
                isSelected
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5 shadow-sm"
                  : "hover:border-border/80 hover:bg-accent/40"
              } ${isDragging ? "opacity-30 scale-95 border-dashed border-primary" : ""} ${
                isDropTarget && !isDragging ? "border-primary border-2 scale-102 bg-primary/10" : ""
              }`}
            >
              {/* Header Badge & Drag Handle */}
              <div className="w-full flex items-center justify-between mb-2">
                <span className="text-[11px] font-semibold text-foreground flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Page {i + 1}
                </span>
                <span className="text-[10px] text-muted-foreground">#{sourcePageIndex + 1}</span>
              </div>

              {/* Page Thumbnail Canvas Preview Placeholder */}
              <div
                className="w-full aspect-[3/4] bg-background border rounded-lg flex flex-col items-center justify-center p-2 shadow-inner relative overflow-hidden transition-transform duration-300"
                style={{
                  transform: `rotate(${rotation}deg)`,
                }}
              >
                {/* Simulated lines on page */}
                <div className="w-full space-y-1.5 opacity-30">
                  <div className="h-1.5 bg-foreground rounded w-3/4 mx-auto" />
                  <div className="h-1 bg-foreground rounded w-full" />
                  <div className="h-1 bg-foreground rounded w-5/6" />
                  <div className="h-1 bg-foreground rounded w-4/5" />
                  <div className="h-1 bg-foreground rounded w-2/3" />
                </div>

                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xl font-bold opacity-15">{i + 1}</span>
                </div>
              </div>

              {/* Rotation indicator */}
              {rotation > 0 && (
                <div className="mt-1 text-[10px] font-mono text-primary font-medium">
                  {rotation}°
                </div>
              )}

              {/* Quick Action Floating Bar */}
              <div className="w-full flex items-center justify-between mt-2 pt-1 border-t border-border/50 gap-1">
                <div className="flex items-center gap-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Rotate 90° Clockwise"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotate(i, 90);
                    }}
                  >
                    <RotateCw className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Rotate 90° Counter-Clockwise"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRotate(i, 270);
                    }}
                  >
                    <RotateCcw className="w-3 h-3" />
                  </Button>
                </div>

                <div className="flex items-center gap-0.5">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-foreground"
                    title="Duplicate Page"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDuplicatePage(i);
                    }}
                  >
                    <Copy className="w-3 h-3" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    title="Delete Page"
                    disabled={pageOrder.length <= 1}
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePage(i);
                    }}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
