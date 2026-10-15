import * as React from "react";
import { History, Plus, RotateCcw, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { deleteDocumentSnapshot, type DocumentSnapshot } from "@/lib/documentStore";
import { toast } from "sonner";

interface SnapshotTimelineProps<T> {
  documentId?: string | null;
  snapshots: DocumentSnapshot<T>[];
  onRestore: (snapshot: DocumentSnapshot<T>) => void;
  onCreateSnapshot: (label?: string) => Promise<DocumentSnapshot<T> | null>;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
}

export function SnapshotTimeline<T>({
  documentId,
  snapshots,
  onRestore,
  onCreateSnapshot,
  onRefresh,
  disabled,
}: SnapshotTimelineProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [newLabel, setNewLabel] = React.useState("");
  const [isCreating, setIsCreating] = React.useState(false);

  const handleCreate = async () => {
    if (!documentId) return;
    setIsCreating(true);
    try {
      await onCreateSnapshot(newLabel.trim() || undefined);
      setNewLabel("");
      await onRefresh();
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, snapId: string) => {
    e.stopPropagation();
    await deleteDocumentSnapshot(snapId);
    toast.info("Snapshot removed");
    await onRefresh();
  };

  const handleRestore = (snap: DocumentSnapshot<T>) => {
    onRestore(snap);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !documentId}
          className="gap-2 h-8 text-xs font-medium border-border/80 hover:bg-accent/80"
          title="Autosave & Snapshot Timeline"
        >
          <History className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Timeline</span>
          {snapshots.length > 0 && (
            <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">
              {snapshots.length}
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <span>Document Snapshot Timeline</span>
          </DialogTitle>
          <DialogDescription>
            Revert to any previous revision or capture a named checkpoint in time.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-2 pt-2">
          <Input
            placeholder="Checkpoint label (e.g., 'Before reordering pages')"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void handleCreate()}
            className="text-xs h-9"
          />
          <Button
            size="sm"
            onClick={() => void handleCreate()}
            disabled={isCreating || !documentId}
            className="gap-1.5 h-9 shrink-0 text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Capture
          </Button>
        </div>

        <div className="mt-4 max-h-[340px] overflow-y-auto space-y-2 pr-1">
          {snapshots.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground border border-dashed rounded-lg">
              No snapshots recorded yet. Capture a checkpoint above or make edits to generate autosave states.
            </div>
          ) : (
            snapshots.map((snap, idx) => (
              <div
                key={snap.id}
                onClick={() => handleRestore(snap)}
                className="group flex items-center justify-between p-3 rounded-lg border bg-card/60 hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <div className="min-w-0 pr-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-xs truncate text-foreground">{snap.label}</span>
                    {idx === 0 && (
                      <Badge variant="outline" className="text-[9px] px-1 py-0 h-3.5 bg-primary/10 text-primary border-primary/20">
                        Latest
                      </Badge>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {new Date(snap.createdAt).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-primary hover:bg-primary/10"
                    title="Restore this revision"
                    onClick={() => handleRestore(snap)}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-7 w-7 text-destructive hover:bg-destructive/10"
                    title="Delete snapshot"
                    onClick={(e) => void handleDelete(e, snap.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
