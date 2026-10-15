import { base64ToUint8, uint8ToBase64 } from "./binary";

export type RuntimeTarget = "web" | "capacitor-android" | "wails";

export interface NativeBinaryStorageApi {
  SaveBinaryFile?: (filename: string, base64Data: string) => Promise<string> | string;
  ReadBinaryFile?: (filename: string) => Promise<string> | string;
  DeleteBinaryFile?: (filename: string) => Promise<void> | void;
  ListBinaryFiles?: () => Promise<string[]> | string[];
}

export interface WailsAppApi extends NativeBinaryStorageApi {
  GetStorageItem?: (key: string) => Promise<string | null> | string | null;
  SetStorageItem?: (key: string, value: string) => Promise<void> | void;
  RemoveStorageItem?: (key: string) => Promise<void> | void;
}

declare global {
  interface Window {
    Capacitor?: {
      getPlatform?: () => string;
    };
    go?: {
      main?: {
        App?: WailsAppApi;
      };
    };
    runtime?: unknown;
  }
}

const hasWindow = () => typeof window !== "undefined";

export function detectRuntime(): RuntimeTarget {
  if (!hasWindow()) return "web";

  const isWails = Boolean(window.go?.main?.App && window.runtime);
  if (isWails) return "wails";

  const platform = window.Capacitor?.getPlatform?.();
  if (platform === "android") return "capacitor-android";

  return "web";
}

export function isNativeRuntime(): boolean {
  return detectRuntime() !== "web";
}

/* =========================================================================
   Wails Backend Bridge
   ========================================================================= */

async function getFromWails(key: string): Promise<string | null> {
  const api = window.go?.main?.App;
  if (!api?.GetStorageItem) return null;
  const value = await api.GetStorageItem(key);
  return value ?? null;
}

async function setToWails(key: string, value: string): Promise<void> {
  const api = window.go?.main?.App;
  if (!api?.SetStorageItem) return;
  await api.SetStorageItem(key, value);
}

async function removeFromWails(key: string): Promise<void> {
  const api = window.go?.main?.App;
  if (!api?.RemoveStorageItem) return;
  await api.RemoveStorageItem(key);
}

/* =========================================================================
   Capacitor Preferences Bridge
   ========================================================================= */

async function getFromCapacitor(key: string): Promise<string | null> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    const result = await Preferences.get({ key });
    return result.value;
  } catch {
    return hasWindow() ? localStorage.getItem(key) : null;
  }
}

async function setToCapacitor(key: string, value: string): Promise<void> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.set({ key, value });
  } catch {
    if (hasWindow()) localStorage.setItem(key, value);
  }
}

async function removeFromCapacitor(key: string): Promise<void> {
  try {
    const { Preferences } = await import("@capacitor/preferences");
    await Preferences.remove({ key });
  } catch {
    if (hasWindow()) localStorage.removeItem(key);
  }
}

/* =========================================================================
   Key-Value Bridge Abstraction
   ========================================================================= */

export async function bridgeGetItem(key: string): Promise<string | null> {
  const runtime = detectRuntime();

  if (runtime === "wails") {
    try {
      const val = await getFromWails(key);
      if (val !== null) return val;
    } catch {
      // Fallback below
    }
  }

  if (runtime === "capacitor-android") {
    return getFromCapacitor(key);
  }

  return hasWindow() ? localStorage.getItem(key) : null;
}

export async function bridgeSetItem(key: string, value: string): Promise<void> {
  const runtime = detectRuntime();

  if (runtime === "wails") {
    try {
      await setToWails(key, value);
      return;
    } catch {
      if (hasWindow()) localStorage.setItem(key, value);
      return;
    }
  }

  if (runtime === "capacitor-android") {
    await setToCapacitor(key, value);
    return;
  }

  if (hasWindow()) localStorage.setItem(key, value);
}

export async function bridgeRemoveItem(key: string): Promise<void> {
  const runtime = detectRuntime();

  if (runtime === "wails") {
    try {
      await removeFromWails(key);
      return;
    } catch {
      if (hasWindow()) localStorage.removeItem(key);
      return;
    }
  }

  if (runtime === "capacitor-android") {
    await removeFromCapacitor(key);
    return;
  }

  if (hasWindow()) localStorage.removeItem(key);
}

/* =========================================================================
   Native Binary Storage Engine (Offloads large PDF payloads from memory)
   ========================================================================= */

const BLOB_DB_NAME = "paperworks-binary-store";
const BLOB_STORE = "payloads";

function openBlobDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB not available"));
      return;
    }
    const request = indexedDB.open(BLOB_DB_NAME, 1);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(BLOB_STORE)) {
        db.createObjectStore(BLOB_STORE);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Offload binary payloads directly to native desktop storage or IndexedDB blob store
 */
export async function bridgeSaveBinary(filename: string, bytes: Uint8Array): Promise<string> {
  const runtime = detectRuntime();

  // Desktop native filesystem offload via Wails Go backend
  if (runtime === "wails" && window.go?.main?.App?.SaveBinaryFile) {
    try {
      const b64 = uint8ToBase64(bytes);
      const filePath = await window.go.main.App.SaveBinaryFile(filename, b64);
      return `wails://${filename}`;
    } catch (err) {
      console.warn("Wails SaveBinaryFile failed, falling back to blob store", err);
    }
  }

  // Mobile / Web: Offload to IndexedDB binary store to keep large PDFs out of JS heap & JSON strings
  try {
    const db = await openBlobDb();
    const tx = db.transaction(BLOB_STORE, "readwrite");
    // IDB can store ArrayBuffer / Blob directly without base64 overhead
    tx.objectStore(BLOB_STORE).put(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), filename);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
    return `idb://${filename}`;
  } catch (err) {
    // Ultimate fallback: in-memory / localStorage base64 cache
    if (hasWindow()) {
      try {
        localStorage.setItem(`paperworks:blob:${filename}`, uint8ToBase64(bytes));
        return `local://${filename}`;
      } catch {
        // storage quota exceeded
      }
    }
    return `inline:${filename}`;
  }
}

/**
 * Retrieve binary payload by storage reference
 */
export async function bridgeReadBinary(storageRef: string): Promise<Uint8Array | null> {
  if (!storageRef) return null;

  if (storageRef.startsWith("wails://")) {
    const filename = storageRef.replace("wails://", "");
    if (window.go?.main?.App?.ReadBinaryFile) {
      try {
        const b64 = await window.go.main.App.ReadBinaryFile(filename);
        if (b64) return base64ToUint8(b64);
      } catch (err) {
        console.warn("Failed reading from Wails native binary storage", err);
      }
    }
  }

  if (storageRef.startsWith("idb://")) {
    const filename = storageRef.replace("idb://", "");
    try {
      const db = await openBlobDb();
      const tx = db.transaction(BLOB_STORE, "readonly");
      const req = tx.objectStore(BLOB_STORE).get(filename);
      const buffer = await new Promise<ArrayBuffer | undefined>((resolve, reject) => {
        req.onsuccess = () => resolve(req.result as ArrayBuffer);
        req.onerror = () => reject(req.error);
      });
      db.close();
      if (buffer) return new Uint8Array(buffer);
    } catch (err) {
      console.warn("Failed reading binary from IndexedDB", err);
    }
  }

  if (storageRef.startsWith("local://")) {
    const filename = storageRef.replace("local://", "");
    const raw = localStorage.getItem(`paperworks:blob:${filename}`);
    if (raw) return base64ToUint8(raw);
  }

  // Direct base64 string fallback
  if (storageRef.length > 200 && !storageRef.includes("://")) {
    try {
      return base64ToUint8(storageRef);
    } catch {
      return null;
    }
  }

  return null;
}

/**
 * Delete binary payload by storage reference
 */
export async function bridgeDeleteBinary(storageRef: string): Promise<boolean> {
  if (!storageRef) return false;

  if (storageRef.startsWith("wails://")) {
    const filename = storageRef.replace("wails://", "");
    if (window.go?.main?.App?.DeleteBinaryFile) {
      try {
        await window.go.main.App.DeleteBinaryFile(filename);
        return true;
      } catch {
        return false;
      }
    }
  }

  if (storageRef.startsWith("idb://")) {
    const filename = storageRef.replace("idb://", "");
    try {
      const db = await openBlobDb();
      const tx = db.transaction(BLOB_STORE, "readwrite");
      tx.objectStore(BLOB_STORE).delete(filename);
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

  if (storageRef.startsWith("local://")) {
    const filename = storageRef.replace("local://", "");
    localStorage.removeItem(`paperworks:blob:${filename}`);
    return true;
  }

  return false;
}
