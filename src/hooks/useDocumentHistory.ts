import * as React from "react";
import {
  saveDocumentSnapshot,
  listDocumentSnapshots,
  type DocumentSnapshot,
} from "@/lib/documentStore";
import { toast } from "sonner";

export interface UseDocumentHistoryOptions<T> {
  documentId?: string | null;
  initialState: T;
  maxHistory?: number;
  autosaveInterval?: number;
  onAutosave?: (currentState: T) => Promise<void> | void;
}

export interface UseDocumentHistoryReturn<T> {
  state: T;
  setState: (updater: T | ((prev: T) => T), recordHistory?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDirty: boolean;
  setIsDirty: (dirty: boolean) => void;
  lastSavedAt: Date | null;
  snapshots: DocumentSnapshot<T>[];
  loadSnapshots: () => Promise<void>;
  createSnapshot: (label?: string) => Promise<DocumentSnapshot<T> | null>;
  restoreSnapshot: (snapshot: DocumentSnapshot<T>) => void;
  resetState: (newState: T) => void;
}

export function useDocumentHistory<T>({
  documentId,
  initialState,
  maxHistory = 50,
  autosaveInterval = 3000,
  onAutosave,
}: UseDocumentHistoryOptions<T>): UseDocumentHistoryReturn<T> {
  const [state, setInternalState] = React.useState<T>(initialState);
  const [past, setPast] = React.useState<T[]>([]);
  const [future, setFuture] = React.useState<T[]>([]);
  const [isDirty, setIsDirty] = React.useState(false);
  const [lastSavedAt, setLastSavedAt] = React.useState<Date | null>(null);
  const [snapshots, setSnapshots] = React.useState<DocumentSnapshot<T>[]>([]);

  const stateRef = React.useRef(state);
  stateRef.current = state;

  const onAutosaveRef = React.useRef(onAutosave);
  onAutosaveRef.current = onAutosave;

  // Reset history when opening a new document
  const resetState = React.useCallback((newState: T) => {
    setInternalState(newState);
    setPast([]);
    setFuture([]);
    setIsDirty(false);
  }, []);

  const setState = React.useCallback(
    (updater: T | ((prev: T) => T), recordHistory = true) => {
      setInternalState((prev) => {
        const next = typeof updater === "function" ? (updater as (p: T) => T)(prev) : updater;
        if (recordHistory) {
          setPast((p) => [...p.slice(-maxHistory), prev]);
          setFuture([]);
          setIsDirty(true);
        }
        return next;
      });
    },
    [maxHistory]
  );

  const undo = React.useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p;
      const previous = p[p.length - 1];
      const newPast = p.slice(0, p.length - 1);
      setFuture((f) => [stateRef.current, ...f]);
      setInternalState(previous);
      setIsDirty(true);
      return newPast;
    });
  }, []);

  const redo = React.useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f;
      const next = f[0];
      const newFuture = f.slice(1);
      setPast((p) => [...p, stateRef.current]);
      setInternalState(next);
      setIsDirty(true);
      return newFuture;
    });
  }, []);

  // Keyboard shortcut listener (Ctrl+Z / Cmd+Z, Ctrl+Y / Cmd+Shift+Z)
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an active input/textarea where native undo takes precedence
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
        if (e.shiftKey) {
          // Redo
          if (!isInput) {
            e.preventDefault();
            redo();
          }
        } else {
          // Undo
          if (!isInput) {
            e.preventDefault();
            undo();
          }
        }
      } else if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "y") {
        if (!isInput) {
          e.preventDefault();
          redo();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo]);

  // Autosave timer
  React.useEffect(() => {
    if (!isDirty || !onAutosaveRef.current) return;

    const timer = setTimeout(async () => {
      try {
        if (onAutosaveRef.current) {
          await onAutosaveRef.current(stateRef.current);
          setIsDirty(false);
          setLastSavedAt(new Date());
        }
      } catch (err) {
        console.error("Autosave error", err);
      }
    }, autosaveInterval);

    return () => clearTimeout(timer);
  }, [isDirty, state, autosaveInterval]);

  // Load snapshots for document
  const loadSnapshots = React.useCallback(async () => {
    if (!documentId) {
      setSnapshots([]);
      return;
    }
    const list = await listDocumentSnapshots<T>(documentId);
    setSnapshots(list);
  }, [documentId]);

  React.useEffect(() => {
    void loadSnapshots();
  }, [loadSnapshots]);

  // Create explicit snapshot
  const createSnapshot = React.useCallback(
    async (label?: string): Promise<DocumentSnapshot<T> | null> => {
      if (!documentId) return null;
      const autoLabel = label || `Snapshot ${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
      const snap = await saveDocumentSnapshot<T>({
        documentId,
        label: autoLabel,
        payload: stateRef.current,
      });
      setSnapshots((prev) => [snap, ...prev]);
      toast.success(`Snapshot created: ${autoLabel}`);
      return snap;
    },
    [documentId]
  );

  // Restore snapshot
  const restoreSnapshot = React.useCallback((snapshot: DocumentSnapshot<T>) => {
    setPast((p) => [...p, stateRef.current]);
    setFuture([]);
    setInternalState(snapshot.payload);
    setIsDirty(true);
    toast.info(`Restored snapshot from ${new Date(snapshot.createdAt).toLocaleTimeString()}`);
  }, []);

  return {
    state,
    setState,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    isDirty,
    setIsDirty,
    lastSavedAt,
    snapshots,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
    resetState,
  };
}
