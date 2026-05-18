export type ToolType = "business-card" | "invoice" | "pdf" | "resume";

export interface DocumentRecord<TPayload = unknown> {
  id: string;
  toolType: ToolType;
  title: string;
  payload: TPayload;
  createdAt: string;
  updatedAt: string;
}

interface CreateInput<TPayload> {
  toolType: ToolType;
  title: string;
  payload: TPayload;
}

interface UpdateInput<TPayload> {
  title?: string;
  payload?: TPayload;
}

type LegacyMigrationReport = {
  migrated: number;
  skipped: number;
};

const DB_NAME = "paperworks-db";
const DB_VERSION = 1;
const STORE_NAME = "documents";
const FALLBACK_KEY = "paperworks:documents:v1";

const hasIndexedDb = typeof window !== "undefined" && "indexedDB" in window;

function generateId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "id" });
        store.createIndex("toolType", "toolType", { unique: false });
        store.createIndex("updatedAt", "updatedAt", { unique: false });
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

function readFallbackStore(): DocumentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(FALLBACK_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DocumentRecord[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeFallbackStore(records: DocumentRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(FALLBACK_KEY, JSON.stringify(records));
}

async function listFallback(toolType?: ToolType): Promise<DocumentRecord[]> {
  const items = readFallbackStore();
  const filtered = toolType ? items.filter((d) => d.toolType === toolType) : items;
  return filtered.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

async function getFallback<TPayload>(id: string): Promise<DocumentRecord<TPayload> | null> {
  const items = readFallbackStore();
  const found = items.find((d) => d.id === id);
  return (found as DocumentRecord<TPayload> | undefined) ?? null;
}

async function createFallback<TPayload>(input: CreateInput<TPayload>): Promise<DocumentRecord<TPayload>> {
  const now = new Date().toISOString();
  const record: DocumentRecord<TPayload> = {
    id: generateId(),
    toolType: input.toolType,
    title: input.title,
    payload: input.payload,
    createdAt: now,
    updatedAt: now,
  };

  const items = readFallbackStore();
  items.push(record as DocumentRecord);
  writeFallbackStore(items);
  return record;
}

async function updateFallback<TPayload>(id: string, input: UpdateInput<TPayload>): Promise<DocumentRecord<TPayload> | null> {
  const items = readFallbackStore();
  const index = items.findIndex((d) => d.id === id);
  if (index === -1) return null;

  const current = items[index] as DocumentRecord<TPayload>;
  const next: DocumentRecord<TPayload> = {
    ...current,
    title: input.title ?? current.title,
    payload: input.payload ?? current.payload,
    updatedAt: new Date().toISOString(),
  };

  items[index] = next as DocumentRecord;
  writeFallbackStore(items);
  return next;
}

async function deleteFallback(id: string): Promise<boolean> {
  const items = readFallbackStore();
  const next = items.filter((d) => d.id !== id);
  if (next.length === items.length) return false;
  writeFallbackStore(next);
  return true;
}

export async function listDocuments<TPayload = unknown>(toolType?: ToolType): Promise<DocumentRecord<TPayload>[]> {
  if (!hasIndexedDb) {
    return listFallback(toolType) as Promise<DocumentRecord<TPayload>[]>;
  }

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);

    const request = toolType
      ? store.index("toolType").getAll(toolType)
      : store.getAll();

    const items = (await idbRequest(request)) as DocumentRecord<TPayload>[];
    db.close();
    return items.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return listFallback(toolType) as Promise<DocumentRecord<TPayload>[]>;
  }
}

export async function getDocument<TPayload = unknown>(id: string): Promise<DocumentRecord<TPayload> | null> {
  if (!hasIndexedDb) {
    return getFallback<TPayload>(id);
  }

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    const item = (await idbRequest(store.get(id))) as DocumentRecord<TPayload> | undefined;
    db.close();
    return item ?? null;
  } catch {
    return getFallback<TPayload>(id);
  }
}

export async function createDocument<TPayload>(input: CreateInput<TPayload>): Promise<DocumentRecord<TPayload>> {
  if (!hasIndexedDb) {
    return createFallback(input);
  }

  const now = new Date().toISOString();
  const record: DocumentRecord<TPayload> = {
    id: generateId(),
    toolType: input.toolType,
    title: input.title,
    payload: input.payload,
    createdAt: now,
    updatedAt: now,
  };

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
    return createFallback(input);
  }
}

export async function updateDocument<TPayload>(id: string, input: UpdateInput<TPayload>): Promise<DocumentRecord<TPayload> | null> {
  if (!hasIndexedDb) {
    return updateFallback(id, input);
  }

  try {
    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const current = (await idbRequest(store.get(id))) as DocumentRecord<TPayload> | undefined;

    if (!current) {
      db.close();
      return null;
    }

    const next: DocumentRecord<TPayload> = {
      ...current,
      title: input.title ?? current.title,
      payload: input.payload ?? current.payload,
      updatedAt: new Date().toISOString(),
    };

    store.put(next as DocumentRecord);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    db.close();
    return next;
  } catch {
    return updateFallback(id, input);
  }
}

export async function deleteDocument(id: string): Promise<boolean> {
  if (!hasIndexedDb) {
    return deleteFallback(id);
  }

  try {
    const existing = await getDocument(id);
    if (!existing) return false;

    const db = await openDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.objectStore(STORE_NAME).delete(id);

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error);
    });

    db.close();
    return true;
  } catch {
    return deleteFallback(id);
  }
}

export async function duplicateDocument<TPayload = unknown>(id: string): Promise<DocumentRecord<TPayload> | null> {
  const source = await getDocument<TPayload>(id);
  if (!source) return null;

  return createDocument<TPayload>({
    toolType: source.toolType,
    title: `${source.title} (copy)`,
    payload: source.payload,
  });
}

export async function migrateLegacyLocalStorage(): Promise<LegacyMigrationReport> {
  if (typeof window === "undefined") {
    return { migrated: 0, skipped: 0 };
  }

  const migrationFlag = "paperworks:legacy-migrated:v1";
  if (localStorage.getItem(migrationFlag) === "1") {
    return { migrated: 0, skipped: 0 };
  }

  const entries: Array<{ key: string; toolType: ToolType; title: string }> = [
    { key: "paperworks:business-card", toolType: "business-card", title: "Migrated Business Card" },
    { key: "paperworks:invoice", toolType: "invoice", title: "Migrated Invoice" },
    { key: "paperworks:resume", toolType: "resume", title: "Migrated Resume" },
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

  localStorage.setItem(migrationFlag, "1");
  return { migrated, skipped };
}
