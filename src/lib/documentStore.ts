import {
  bridgeGetItem,
  bridgeRemoveItem,
  bridgeSetItem,
  bridgeSaveBinary,
  bridgeReadBinary,
  bridgeDeleteBinary,
  detectRuntime,
} from "@/lib/platformBridge";

export type ToolType = "business-card" | "invoice" | "pdf" | "resume";

export interface DocumentSnapshot<TPayload = unknown> {
  id: string;
  documentId: string;
  label: string;
  createdAt: string;
  payload: TPayload;
}

export interface DocumentRecord<TPayload = unknown> {
  id: string;
  toolType: ToolType;
  title: string;
  payload: TPayload;
  createdAt: string;
  updatedAt: string;
  version?: number;
  tags?: string[];
  isFavorite?: boolean;
}

export interface CreateInput<TPayload> {
  toolType: ToolType;
  title: string;
  payload: TPayload;
  tags?: string[];
  isFavorite?: boolean;
}

export interface UpdateInput<TPayload> {
  title?: string;
  payload?: TPayload;
  tags?: string[];
  isFavorite?: boolean;
  createSnapshot?: boolean;
  snapshotLabel?: string;
}

export type LegacyMigrationReport = {
  migrated: number;
  skipped: number;
};

/* =========================================================================
   Reusable Item/Service Catalog & Digital Signature Types
   ========================================================================= */

export interface CatalogItem {
  id: string;
  sku: string;
  name: string;
  description: string;
  defaultPrice: number;
  category: string;
  taxExempt?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedSignature {
  id: string;
  name: string;
  dataUrl: string;
  type: "draw" | "type" | "upload";
  createdAt: string;
}

const DB_NAME = "paperworks-db";
const DB_VERSION = 3;
const STORE_NAME = "documents";
const SNAPSHOTS_STORE = "document_snapshots";
const CATALOG_STORE = "catalog_items";
const SIGNATURES_STORE = "saved_signatures";

const FALLBACK_KEY = "paperworks:documents:v2";
const SNAPSHOTS_FALLBACK_KEY = "paperworks:snapshots:v2";
const CATALOG_FALLBACK_KEY = "paperworks:catalog:v1";
const SIGNATURES_FALLBACK_KEY = "paperworks:signatures:v1";

const hasIndexedDb = () =>
  typeof window !== "undefined" && typeof indexedDB !== "undefined" && Boolean(window.indexedDB);

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!hasIndexedDb()) {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("toolType", "toolType", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(SNAPSHOTS_STORE)) {
        const snapStore = db.createObjectStore(SNAPSHOTS_STORE, { keyPath: "id" });
        snapStore.createIndex("documentId", "documentId", { unique: false });
        snapStore.createIndex("createdAt", "createdAt", { unique: false });
      }
      if (!db.objectStoreNames.contains(CATALOG_STORE)) {
        const catStore = db.createObjectStore(CATALOG_STORE, { keyPath: "id" });
        catStore.createIndex("sku", "sku", { unique: false });
        catStore.createIndex("category", "category", { unique: false });
      }
      if (!db.objectStoreNames.contains(SIGNATURES_STORE)) {
        db.createObjectStore(SIGNATURES_STORE, { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function idbRequest<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/* =========================================================================
   Fallback Local/Bridge Store (when IndexedDB is not used/available)
   ========================================================================= */

async function readFallbackStore(): Promise<DocumentRecord[]> {
  try {
    const raw = await bridgeGetItem(FALLBACK_KEY);
    if (!raw) {
      const v1 = await bridgeGetItem("paperworks:documents:v1");
      if (v1) {
        const parsedV1 = JSON.parse(v1) as DocumentRecord[];
        if (Array.isArray(parsedV1)) return parsedV1;
      }
      return [];
    }
    const parsed = JSON.parse(raw) as DocumentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFallbackStore(records: DocumentRecord[]) {
  if (records.length === 0) {
    await bridgeRemoveItem(FALLBACK_KEY);
    return;
  }
  await bridgeSetItem(FALLBACK_KEY, JSON.stringify(records));
}

async function readFallbackSnapshots(): Promise<DocumentSnapshot[]> {
  try {
    const raw = await bridgeGetItem(SNAPSHOTS_FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DocumentSnapshot[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFallbackSnapshots(snapshots: DocumentSnapshot[]) {
  if (snapshots.length === 0) {
    await bridgeRemoveItem(SNAPSHOTS_FALLBACK_KEY);
    return;
  }
  await bridgeSetItem(SNAPSHOTS_FALLBACK_KEY, JSON.stringify(snapshots));
}

/* =========================================================================
   Primary Document CRUD Layer
   ========================================================================= */

export async function listDocuments<TPayload = unknown>(toolType?: ToolType): Promise<DocumentRecord<TPayload>[]> {
  if (!hasIndexedDb()) {
    const items = await readFallbackStore();
    const filtered = toolType ? items.filter((d) => d.toolType === toolType) : items;
    return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) as DocumentRecord<TPayload>[];
  }

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = toolType ? store.index("toolType").getAll(toolType) : store.getAll();
    const items = (await idbRequest(request)) as DocumentRecord<TPayload>[];
    db.close();
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    const items = await readFallbackStore();
    const filtered = toolType ? items.filter((d) => d.toolType === toolType) : items;
    return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) as DocumentRecord<TPayload>[];
  }
}

export async function getDocument<TPayload = unknown>(id: string): Promise<DocumentRecord<TPayload> | null> {
  if (!hasIndexedDb()) {
    const items = await readFallbackStore();
    const found = items.find((d) => d.id === id);
    return (found as DocumentRecord<TPayload> | undefined) ?? null;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const item = (await idbRequest(store.get(id))) as DocumentRecord<TPayload> | undefined;
    db.close();
    return item ?? null;
  } catch {
    const items = await readFallbackStore();
    const found = items.find((d) => d.id === id);
    return (found as DocumentRecord<TPayload> | undefined) ?? null;
  }
}

export async function createDocument<TPayload>(input: CreateInput<TPayload>): Promise<DocumentRecord<TPayload>> {
  const now = new Date().toISOString();
  const record: DocumentRecord<TPayload> = {
    id: generateId(),
    toolType: input.toolType,
    title: input.title.trim() || "Untitled Document",
    payload: input.payload,
    createdAt: now,
    updatedAt: now,
    version: 1,
    tags: input.tags ?? [],
    isFavorite: input.isFavorite ?? false,
  };

  if (!hasIndexedDb()) {
    const items = await readFallbackStore();
    items.push(record as DocumentRecord);
    await writeFallbackStore(items);
    return record;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(record as DocumentRecord);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    db.close();
    return record;
  } catch {
    const items = await readFallbackStore();
    items.push(record as DocumentRecord);
    await writeFallbackStore(items);
    return record;
  }
}

export async function updateDocument<TPayload>(
  id: string,
  input: UpdateInput<TPayload>
): Promise<DocumentRecord<TPayload> | null> {
  const current = await getDocument<TPayload>(id);
  if (!current) return null;

  if (input.createSnapshot) {
    await saveDocumentSnapshot({
      documentId: id,
      label: input.snapshotLabel || `Snapshot v${current.version || 1}`,
      payload: current.payload,
    });
  }

  const nextVersion = (current.version || 1) + 1;
  const now = new Date().toISOString();

  const next: DocumentRecord<TPayload> = {
    ...current,
    title: input.title !== undefined ? (input.title.trim() || current.title) : current.title,
    payload: input.payload !== undefined ? input.payload : current.payload,
    tags: input.tags !== undefined ? input.tags : current.tags,
    isFavorite: input.isFavorite !== undefined ? input.isFavorite : current.isFavorite,
    version: nextVersion,
    updatedAt: now,
  };

  if (!hasIndexedDb()) {
    const items = await readFallbackStore();
    const idx = items.findIndex((d) => d.id === id);
    if (idx !== -1) {
      items[idx] = next as DocumentRecord;
      await writeFallbackStore(items);
    }
    return next;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).put(next as DocumentRecord);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    db.close();
    return next;
  } catch {
    const items = await readFallbackStore();
    const idx = items.findIndex((d) => d.id === id);
    if (idx !== -1) {
      items[idx] = next as DocumentRecord;
      await writeFallbackStore(items);
    }
    return next;
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  const existing = await getDocument(id);
  if (!existing) return false;

  if (existing.toolType === "pdf" && typeof existing.payload === "object" && existing.payload !== null) {
    const p = existing.payload as { storageRef?: string };
    if (p.storageRef) {
      await bridgeDeleteBinary(p.storageRef);
    }
  }

  if (!hasIndexedDb()) {
    const items = await readFallbackStore();
    const next = items.filter((d) => d.id !== id);
    if (next.length === items.length) return false;
    await writeFallbackStore(next);
    return true;
  }

  try {
    const db = await openDb();
    const tx = db.transaction([STORE_NAME, SNAPSHOTS_STORE], "readwrite");
    tx.objectStore(STORE_NAME).delete(id);

    const snapStore = tx.objectStore(SNAPSHOTS_STORE);
    const snapIndex = snapStore.index("documentId");
    const snapReq = snapIndex.getAllKeys(id);

    snapReq.onsuccess = () => {
      const keys = snapReq.result;
      keys.forEach((k) => snapStore.delete(k));
    };

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
    return true;
  } catch {
    const items = await readFallbackStore();
    const next = items.filter((d) => d.id !== id);
    await writeFallbackStore(next);
    return true;
  }
}

export async function duplicateDocument<TPayload = unknown>(id: string): Promise<DocumentRecord<TPayload> | null> {
  const source = await getDocument<TPayload>(id);
  if (!source) return null;

  return createDocument<TPayload>({
    toolType: source.toolType,
    title: `${source.title} (Copy)`,
    payload: JSON.parse(JSON.stringify(source.payload)) as TPayload,
    tags: source.tags ? [...source.tags] : [],
    isFavorite: false,
  });
}

/* =========================================================================
   Document Snapshot Timeline
   ========================================================================= */

export async function saveDocumentSnapshot<TPayload>(input: {
  documentId: string;
  label: string;
  payload: TPayload;
}): Promise<DocumentSnapshot<TPayload>> {
  const snapshot: DocumentSnapshot<TPayload> = {
    id: generateId(),
    documentId: input.documentId,
    label: input.label,
    createdAt: new Date().toISOString(),
    payload: JSON.parse(JSON.stringify(input.payload)) as TPayload,
  };

  if (!hasIndexedDb()) {
    const snaps = await readFallbackSnapshots();
    snaps.push(snapshot as DocumentSnapshot);
    if (snaps.length > 50) snaps.splice(0, snaps.length - 50);
    await writeFallbackSnapshots(snaps);
    return snapshot;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(SNAPSHOTS_STORE, "readwrite");
    tx.objectStore(SNAPSHOTS_STORE).put(snapshot as DocumentSnapshot);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return snapshot;
  } catch {
    const snaps = await readFallbackSnapshots();
    snaps.push(snapshot as DocumentSnapshot);
    await writeFallbackSnapshots(snaps);
    return snapshot;
  }
}

export async function listDocumentSnapshots<TPayload = unknown>(
  documentId: string
): Promise<DocumentSnapshot<TPayload>[]> {
  if (!hasIndexedDb()) {
    const snaps = await readFallbackSnapshots();
    return snaps
      .filter((s) => s.documentId === documentId)
      .reverse() as DocumentSnapshot<TPayload>[];
  }

  try {
    const db = await openDb();
    const tx = db.transaction(SNAPSHOTS_STORE, "readonly");
    const store = tx.objectStore(SNAPSHOTS_STORE);
    const index = store.index("documentId");
    const req = index.getAll(documentId);
    const snaps = (await idbRequest(req)) as DocumentSnapshot<TPayload>[];
    db.close();
    return snaps.reverse();
  } catch {
    const snaps = await readFallbackSnapshots();
    return snaps
      .filter((s) => s.documentId === documentId)
      .reverse() as DocumentSnapshot<TPayload>[];
  }
}

export async function deleteDocumentSnapshot(snapshotId: string): Promise<boolean> {
  if (!hasIndexedDb()) {
    const snaps = await readFallbackSnapshots();
    const next = snaps.filter((s) => s.id !== snapshotId);
    if (next.length === snaps.length) return false;
    await writeFallbackSnapshots(next);
    return true;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(SNAPSHOTS_STORE, "readwrite");
    tx.objectStore(SNAPSHOTS_STORE).delete(snapshotId);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    return false;
  }
}

/* =========================================================================
   Reusable Item / Service Catalog System
   ========================================================================= */

export const DEFAULT_CATALOG_ITEMS: Array<Omit<CatalogItem, "id" | "createdAt" | "updatedAt">> = [
  {
    sku: "SR-ARCH-01",
    name: "Principal Systems Architecture",
    description: "Cloud systems design, scalability review, and distributed architecture consultation.",
    defaultPrice: 225,
    category: "Engineering",
  },
  {
    sku: "DEV-SPRINT-02",
    name: "Full-Stack Development Sprint",
    description: "Dedicated two-week sprint engineering production-grade features and automated test coverage.",
    defaultPrice: 4800,
    category: "Development",
  },
  {
    sku: "UX-DESIGN-03",
    name: "UI/UX & Design System Audit",
    description: "Comprehensive interface heuristic review, component tokens, and accessibility verification.",
    defaultPrice: 1950,
    category: "Design",
  },
  {
    sku: "SEC-AUDIT-04",
    name: "Application Security & Hardening",
    description: "Penetration testing, dependency vulnerability analysis, and zero-trust configuration.",
    defaultPrice: 3200,
    category: "Security",
  },
  {
    sku: "RET-SUPPORT-05",
    name: "Monthly SLA & Infrastructure Retainer",
    description: "Ongoing 24/7 incident monitoring, patch deployment, and database backup guarantees.",
    defaultPrice: 1500,
    category: "Maintenance",
  },
];

async function readFallbackCatalog(): Promise<CatalogItem[]> {
  try {
    const raw = await bridgeGetItem(CATALOG_FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CatalogItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFallbackCatalog(items: CatalogItem[]): Promise<void> {
  await bridgeSetItem(CATALOG_FALLBACK_KEY, JSON.stringify(items));
}

export async function listCatalogItems(): Promise<CatalogItem[]> {
  let items: CatalogItem[] = [];

  if (!hasIndexedDb()) {
    items = await readFallbackCatalog();
  } else {
    try {
      const db = await openDb();
      const tx = db.transaction(CATALOG_STORE, "readonly");
      items = (await idbRequest(tx.objectStore(CATALOG_STORE).getAll())) as CatalogItem[];
      db.close();
    } catch {
      items = await readFallbackCatalog();
    }
  }

  // Seed default catalog if empty
  if (items.length === 0) {
    items = await seedDefaultCatalogItems();
  }

  return items.sort((a, b) => a.name.localeCompare(b.name));
}

export async function createCatalogItem(
  input: Omit<CatalogItem, "id" | "createdAt" | "updatedAt">
): Promise<CatalogItem> {
  const now = new Date().toISOString();
  const item: CatalogItem = {
    ...input,
    id: generateId(),
    sku: input.sku.trim() || `SKU-${Math.floor(1000 + Math.random() * 9000)}`,
    name: input.name.trim() || "Untitled Service",
    createdAt: now,
    updatedAt: now,
  };

  if (!hasIndexedDb()) {
    const list = await readFallbackCatalog();
    list.push(item);
    await writeFallbackCatalog(list);
    return item;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(CATALOG_STORE, "readwrite");
    tx.objectStore(CATALOG_STORE).put(item);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return item;
  } catch {
    const list = await readFallbackCatalog();
    list.push(item);
    await writeFallbackCatalog(list);
    return item;
  }
}

export async function updateCatalogItem(
  id: string,
  input: Partial<Omit<CatalogItem, "id" | "createdAt">>
): Promise<CatalogItem | null> {
  const items = await listCatalogItems();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const updated: CatalogItem = {
    ...items[index],
    ...input,
    updatedAt: new Date().toISOString(),
  };

  if (!hasIndexedDb()) {
    items[index] = updated;
    await writeFallbackCatalog(items);
    return updated;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(CATALOG_STORE, "readwrite");
    tx.objectStore(CATALOG_STORE).put(updated);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return updated;
  } catch {
    items[index] = updated;
    await writeFallbackCatalog(items);
    return updated;
  }
}

export async function deleteCatalogItem(id: string): Promise<boolean> {
  if (!hasIndexedDb()) {
    const list = await readFallbackCatalog();
    const next = list.filter((i) => i.id !== id);
    await writeFallbackCatalog(next);
    return true;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(CATALOG_STORE, "readwrite");
    tx.objectStore(CATALOG_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    const list = await readFallbackCatalog();
    const next = list.filter((i) => i.id !== id);
    await writeFallbackCatalog(next);
    return true;
  }
}

export async function seedDefaultCatalogItems(): Promise<CatalogItem[]> {
  const seeded: CatalogItem[] = [];
  const now = new Date().toISOString();

  for (const def of DEFAULT_CATALOG_ITEMS) {
    seeded.push({
      ...def,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    });
  }

  if (!hasIndexedDb()) {
    await writeFallbackCatalog(seeded);
    return seeded;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(CATALOG_STORE, "readwrite");
    const store = tx.objectStore(CATALOG_STORE);
    for (const item of seeded) {
      store.put(item);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return seeded;
  } catch {
    await writeFallbackCatalog(seeded);
    return seeded;
  }
}

/* =========================================================================
   Digital Signature Library (Saved Signatures)
   ========================================================================= */

async function readFallbackSignatures(): Promise<SavedSignature[]> {
  try {
    const raw = await bridgeGetItem(SIGNATURES_FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedSignature[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeFallbackSignatures(signatures: SavedSignature[]): Promise<void> {
  await bridgeSetItem(SIGNATURES_FALLBACK_KEY, JSON.stringify(signatures));
}

export async function listSavedSignatures(): Promise<SavedSignature[]> {
  if (!hasIndexedDb()) {
    return readFallbackSignatures();
  }

  try {
    const db = await openDb();
    const tx = db.transaction(SIGNATURES_STORE, "readonly");
    const list = (await idbRequest(tx.objectStore(SIGNATURES_STORE).getAll())) as SavedSignature[];
    db.close();
    return list;
  } catch {
    return readFallbackSignatures();
  }
}

export async function createSavedSignature(
  name: string,
  dataUrl: string,
  type: "draw" | "type" | "upload" = "draw"
): Promise<SavedSignature> {
  const item: SavedSignature = {
    id: generateId(),
    name: name.trim() || `Signature ${new Date().toLocaleDateString()}`,
    dataUrl,
    type,
    createdAt: new Date().toISOString(),
  };

  if (!hasIndexedDb()) {
    const list = await readFallbackSignatures();
    list.push(item);
    await writeFallbackSignatures(list);
    return item;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(SIGNATURES_STORE, "readwrite");
    tx.objectStore(SIGNATURES_STORE).put(item);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return item;
  } catch {
    const list = await readFallbackSignatures();
    list.push(item);
    await writeFallbackSignatures(list);
    return item;
  }
}

export async function deleteSavedSignature(id: string): Promise<boolean> {
  if (!hasIndexedDb()) {
    const list = await readFallbackSignatures();
    const next = list.filter((s) => s.id !== id);
    await writeFallbackSignatures(next);
    return true;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(SIGNATURES_STORE, "readwrite");
    tx.objectStore(SIGNATURES_STORE).delete(id);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return true;
  } catch {
    const list = await readFallbackSignatures();
    const next = list.filter((s) => s.id !== id);
    await writeFallbackSignatures(next);
    return true;
  }
}

/* =========================================================================
   Legacy Storage Migration
   ========================================================================= */

export async function migrateLegacyLocalStorage(): Promise<LegacyMigrationReport> {
  if (typeof window === "undefined") {
    return { migrated: 0, skipped: 0 };
  }

  const migrationFlag = "paperworks:legacy-migrated:v2";
  if (localStorage.getItem(migrationFlag) === "1") {
    return { migrated: 0, skipped: 0 };
  }

  const entries: Array<{ key: string; toolType: ToolType; title: string }> = [
    { key: "paperworks:business-card", toolType: "business-card", title: "Migrated Business Card" },
    { key: "paperworks:invoice", toolType: "invoice", title: "Migrated Invoice" },
    { key: "paperworks:resume", toolType: "resume", title: "Migrated Resume" },
    { key: "paperworks:pdf", toolType: "pdf", title: "Migrated PDF Project" },
  ];

  let migrated = 0;
  let skipped = 0;

  for (const entry of entries) {
    const raw = localStorage.getItem(entry.key);
    if (!raw) continue;

    try {
      const payload = JSON.parse(raw) as unknown;
      const existing = await listDocuments(entry.toolType);
      if (existing.length === 0) {
        await createDocument({
          toolType: entry.toolType,
          title: entry.title,
          payload,
        });
        migrated += 1;
      } else {
        skipped += 1;
      }
    } catch {
      skipped += 1;
    }
  }

  const v1List = localStorage.getItem("paperworks:documents:v1");
  if (v1List) {
    try {
      const parsed = JSON.parse(v1List) as DocumentRecord[];
      if (Array.isArray(parsed)) {
        for (const item of parsed) {
          const exists = await getDocument(item.id);
          if (!exists) {
            await createDocument({
              toolType: item.toolType,
              title: item.title,
              payload: item.payload,
            });
            migrated += 1;
          }
        }
      }
    } catch {
      // ignore
    }
  }

  localStorage.setItem(migrationFlag, "1");
  return { migrated, skipped };
}
