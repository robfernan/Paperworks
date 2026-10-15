import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  createDocument,
  getDocument,
  updateDocument,
  deleteDocument,
  duplicateDocument,
  listDocuments,
  saveDocumentSnapshot,
  listDocumentSnapshots,
  type ToolType,
} from "../lib/documentStore";

// Mock localStorage for Node test environment
const memoryStorage: Record<string, string> = {};

beforeEach(() => {
  for (const key of Object.keys(memoryStorage)) {
    delete memoryStorage[key];
  }

  // Provide mock window and localStorage
  vi.stubGlobal("window", {
    localStorage: {
      getItem: (k: string) => memoryStorage[k] ?? null,
      setItem: (k: string, v: string) => {
        memoryStorage[k] = v;
      },
      removeItem: (k: string) => {
        delete memoryStorage[k];
      },
      clear: () => {
        for (const k of Object.keys(memoryStorage)) delete memoryStorage[k];
      },
    },
  });

  vi.stubGlobal("localStorage", window.localStorage);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("DocumentStore Adapter Layer", () => {
  it("should create a new document with generated ID, timestamps, and v1 version", async () => {
    const doc = await createDocument({
      toolType: "invoice",
      title: "Invoice #1001",
      payload: { amount: 500, client: "Acme Corp" },
    });

    expect(doc).toBeDefined();
    expect(doc.id).toBeTruthy();
    expect(doc.toolType).toBe("invoice");
    expect(doc.title).toBe("Invoice #1001");
    expect(doc.payload).toEqual({ amount: 500, client: "Acme Corp" });
    expect(doc.version).toBe(1);
    expect(doc.createdAt).toBeTruthy();
    expect(doc.updatedAt).toBeTruthy();
  });

  it("should retrieve a document by its ID", async () => {
    const created = await createDocument({
      toolType: "resume",
      title: "Senior Architect CV",
      payload: { name: "Alex Mercer" },
    });

    const retrieved = await getDocument(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
    expect(retrieved?.title).toBe("Senior Architect CV");
  });

  it("should update a document and increment its revision version", async () => {
    const created = await createDocument({
      toolType: "business-card",
      title: "Draft Card",
      payload: { theme: "default" },
    });

    const updated = await updateDocument(created.id, {
      title: "Final Executive Card",
      payload: { theme: "bonestock" },
    });

    expect(updated).not.toBeNull();
    expect(updated?.title).toBe("Final Executive Card");
    expect(updated?.payload).toEqual({ theme: "bonestock" });
    expect(updated?.version).toBe(2);

    const check = await getDocument(created.id);
    expect(check?.title).toBe("Final Executive Card");
    expect(check?.version).toBe(2);
  });

  it("should duplicate a document with an isolated copy", async () => {
    const created = await createDocument({
      toolType: "pdf",
      title: "Contract Document",
      payload: { pages: [0, 1, 2] },
    });

    const copy = await duplicateDocument(created.id);
    expect(copy).not.toBeNull();
    expect(copy?.id).not.toBe(created.id);
    expect(copy?.title).toBe("Contract Document (Copy)");
    expect(copy?.payload).toEqual({ pages: [0, 1, 2] });
  });

  it("should delete a document and confirm deletion", async () => {
    const created = await createDocument({
      toolType: "invoice",
      title: "Temporary Invoice",
      payload: {},
    });

    const deleted = await deleteDocument(created.id);
    expect(deleted).toBe(true);

    const check = await getDocument(created.id);
    expect(check).toBeNull();
  });

  it("should filter documents by toolType correctly", async () => {
    await createDocument({ toolType: "invoice", title: "Inv 1", payload: {} });
    await createDocument({ toolType: "invoice", title: "Inv 2", payload: {} });
    await createDocument({ toolType: "resume", title: "Res 1", payload: {} });
    await createDocument({ toolType: "business-card", title: "Card 1", payload: {} });

    const invoices = await listDocuments("invoice");
    expect(invoices.length).toBe(2);
    expect(invoices.every((d) => d.toolType === "invoice")).toBe(true);

    const resumes = await listDocuments("resume");
    expect(resumes.length).toBe(1);

    const all = await listDocuments();
    expect(all.length).toBe(4);
  });

  it("should support recording and listing snapshot checkpoints for a document", async () => {
    const doc = await createDocument({
      toolType: "invoice",
      title: "Invoice Checkpoints",
      payload: { total: 100 },
    });

    const snap1 = await saveDocumentSnapshot({
      documentId: doc.id,
      label: "Initial draft",
      payload: { total: 100 },
    });

    const snap2 = await saveDocumentSnapshot({
      documentId: doc.id,
      label: "Applied discount",
      payload: { total: 80 },
    });

    const snapshots = await listDocumentSnapshots(doc.id);
    expect(snapshots.length).toBe(2);
    expect(snapshots[0].id).toBe(snap2.id); // sorted desc
    expect(snapshots[1].id).toBe(snap1.id);
  });
});
