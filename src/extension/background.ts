/**
 * Paperworks Chrome Extension - Background Service Worker (Manifest V3)
 */

const CONTEXT_MENU_ID = "open-in-paperworks";

// Initialize Extension
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log("[Paperworks SW] Installed/Updated:", details.reason);

  // Initialize default settings if not already set
  const settings = await chrome.storage.local.get(["autoIntercept", "enableContextMenu"]);
  if (settings.autoIntercept === undefined) {
    await chrome.storage.local.set({ autoIntercept: true });
  }
  if (settings.enableContextMenu === undefined) {
    await chrome.storage.local.set({ enableContextMenu: true });
  }

  // Set up context menu
  await setupContextMenu();
});

// Setup Context Menus
async function setupContextMenu() {
  try {
    chrome.contextMenus.remove(CONTEXT_MENU_ID, () => {
      // Ignore error if menu item did not exist
      if (chrome.runtime.lastError) {
        // no-op
      }
      chrome.contextMenus.create({
        id: CONTEXT_MENU_ID,
        title: "Open and Fill in Paperworks",
        contexts: ["link", "page", "image", "selection"],
      });
    });
  } catch (err) {
    console.error("[Paperworks SW] Error setting up context menu:", err);
  }
}

// Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === CONTEXT_MENU_ID) {
    const targetUrl = info.linkUrl || info.srcUrl || info.pageUrl || tab?.url;
    if (!targetUrl) return;

    const editorUrl = chrome.runtime.getURL(
      `index.html?file=${encodeURIComponent(targetUrl)}`
    );

    await chrome.tabs.create({ url: editorUrl, index: tab?.index ? tab.index + 1 : undefined });

    // Show temporary feedback badge
    await flashBadge("OPEN", "#2563eb");
  }
});

// Flash badge for user feedback (Rule 9)
async function flashBadge(text: string, color: string) {
  try {
    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
    setTimeout(async () => {
      try {
        await chrome.action.setBadgeText({ text: "" });
      } catch {
        // SW may have suspended, safe to ignore
      }
    }, 2500);
  } catch (e) {
    console.warn("[Paperworks SW] Badge update failed:", e);
  }
}

// Handle Direct Tab Navigation to PDF files
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (!changeInfo.url) return;

  const url = changeInfo.url;
  // Ignore internal extension URLs or non-http/file URLs
  if (url.startsWith(chrome.runtime.getURL(""))) return;
  if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("file://")) return;

  const isPdfUrl = /\.pdf(\?.*)?$/i.test(url) || url.includes("application/pdf");
  if (!isPdfUrl) return;

  const { autoIntercept } = await chrome.storage.local.get("autoIntercept");
  if (autoIntercept === false) return;

  const editorUrl = chrome.runtime.getURL(`index.html?file=${encodeURIComponent(url)}`);

  // Redirect current tab to Paperworks Editor
  try {
    await chrome.tabs.update(tabId, { url: editorUrl });
    await flashBadge("PDF", "#10b981");
  } catch (err) {
    console.error("[Paperworks SW] Failed to redirect tab to editor:", err);
  }
});

// Message Handling
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "OPEN_PDF") {
    (async () => {
      try {
        const editorUrl = chrome.runtime.getURL(
          `index.html?file=${encodeURIComponent(message.url)}`
        );
        await chrome.tabs.create({ url: editorUrl });
        sendResponse({ success: true });
      } catch (err: unknown) {
        sendResponse({ success: false, error: (err as Error).message });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (message.type === "FETCH_PDF_BUFFER") {
    // Service Worker has <all_urls> host permissions to bypass CORS
    (async () => {
      try {
        const response = await fetch(message.url, { credentials: "omit" });
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const buffer = await response.arrayBuffer();
        
        // Convert arrayBuffer to base64 for message passing
        let binary = "";
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        const chunkSize = 0x8000;
        for (let i = 0; i < len; i += chunkSize) {
          binary += String.fromCharCode.apply(
            null,
            bytes.subarray(i, Math.min(i + chunkSize, len)) as unknown as number[]
          );
        }
        const base64 = btoa(binary);

        sendResponse({ success: true, base64, contentType: response.headers.get("content-type") });
      } catch (err: unknown) {
        console.error("[Paperworks SW] Failed to fetch PDF:", err);
        sendResponse({ success: false, error: (err as Error).message });
      }
    })();
    return true; // Keep channel open for async response
  }

  if (message.type === "OPEN_PENDING_TAB") {
    (async () => {
      const editorUrl = chrome.runtime.getURL("index.html?openPending=true");
      await chrome.tabs.create({ url: editorUrl });
      sendResponse({ success: true });
    })();
    return true;
  }
});
