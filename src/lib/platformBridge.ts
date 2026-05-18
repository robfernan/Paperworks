type RuntimeTarget = "web" | "capacitor-android" | "wails";

type WailsStoreApi = {
  GetStorageItem?: (key: string) => Promise<string | null> | string | null;
  SetStorageItem?: (key: string, value: string) => Promise<void> | void;
  RemoveStorageItem?: (key: string) => Promise<void> | void;
};

declare global {
  interface Window {
    Capacitor?: {
      getPlatform?: () => string;
    };
    go?: {
      main?: {
        App?: WailsStoreApi;
      };
    };
    runtime?: unknown;
  }
}

const hasWindow = typeof window !== "undefined";

export function detectRuntime(): RuntimeTarget {
  if (!hasWindow) return "web";

  const isWails = Boolean(window.go?.main?.App && window.runtime);
  if (isWails) return "wails";

  const platform = window.Capacitor?.getPlatform?.();
  if (platform === "android") return "capacitor-android";

  return "web";
}

export function isNativeRuntime(): boolean {
  return detectRuntime() !== "web";
}

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

async function getFromCapacitor(key: string): Promise<string | null> {
  const { Preferences } = await import("@capacitor/preferences");
  const result = await Preferences.get({ key });
  return result.value;
}

async function setToCapacitor(key: string, value: string): Promise<void> {
  const { Preferences } = await import("@capacitor/preferences");
  await Preferences.set({ key, value });
}

async function removeFromCapacitor(key: string): Promise<void> {
  const { Preferences } = await import("@capacitor/preferences");
  await Preferences.remove({ key });
}

export async function bridgeGetItem(key: string): Promise<string | null> {
  const runtime = detectRuntime();

  if (runtime === "wails") {
    const value = await getFromWails(key);
    if (value !== null) return value;
  }

  if (runtime === "capacitor-android") {
    try {
      return await getFromCapacitor(key);
    } catch {
      return hasWindow ? localStorage.getItem(key) : null;
    }
  }

  return hasWindow ? localStorage.getItem(key) : null;
}

export async function bridgeSetItem(key: string, value: string): Promise<void> {
  const runtime = detectRuntime();

  if (runtime === "wails") {
    try {
      await setToWails(key, value);
      return;
    } catch {
      if (hasWindow) localStorage.setItem(key, value);
      return;
    }
  }

  if (runtime === "capacitor-android") {
    try {
      await setToCapacitor(key, value);
      return;
    } catch {
      if (hasWindow) localStorage.setItem(key, value);
      return;
    }
  }

  if (hasWindow) localStorage.setItem(key, value);
}

export async function bridgeRemoveItem(key: string): Promise<void> {
  const runtime = detectRuntime();

  if (runtime === "wails") {
    try {
      await removeFromWails(key);
      return;
    } catch {
      if (hasWindow) localStorage.removeItem(key);
      return;
    }
  }

  if (runtime === "capacitor-android") {
    try {
      await removeFromCapacitor(key);
      return;
    } catch {
      if (hasWindow) localStorage.removeItem(key);
      return;
    }
  }

  if (hasWindow) localStorage.removeItem(key);
}
