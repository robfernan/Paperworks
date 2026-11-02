/**
 * Paperworks Extension Popup Script
 */

document.addEventListener("DOMContentLoaded", async () => {
  const dropzone = document.getElementById("dropzone") as HTMLElement;
  const fileInput = document.getElementById("file-input") as HTMLInputElement;
  const openEditorBtn = document.getElementById("open-editor-btn") as HTMLButtonElement;
  const openVaultBtn = document.getElementById("open-vault-btn") as HTMLButtonElement;
  const interceptToggle = document.getElementById("intercept-toggle") as HTMLInputElement;

  // Load user settings
  if (chrome?.storage?.local) {
    const { autoIntercept } = await chrome.storage.local.get("autoIntercept");
    if (autoIntercept !== undefined) {
      interceptToggle.checked = Boolean(autoIntercept);
    }
  }

  // Toggle Auto-intercept
  interceptToggle.addEventListener("change", async () => {
    if (chrome?.storage?.local) {
      await chrome.storage.local.set({ autoIntercept: interceptToggle.checked });
    }
  });

  // Open Main Editor
  openEditorBtn.addEventListener("click", async () => {
    if (chrome?.tabs) {
      await chrome.tabs.create({ url: chrome.runtime.getURL("index.html?tool=pdf") });
      window.close();
    } else {
      window.open("/tools/pdf-pro", "_blank");
    }
  });

  // Open Vault
  openVaultBtn.addEventListener("click", async () => {
    if (chrome?.tabs) {
      await chrome.tabs.create({ url: chrome.runtime.getURL("index.html?route=vault") });
      window.close();
    } else {
      window.open("/vault", "_blank");
    }
  });

  // Dropzone file handling
  dropzone.addEventListener("click", () => {
    fileInput.click();
  });

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    if (file) {
      await processSelectedFile(file);
    }
  });

  dropzone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropzone.classList.add("dragover");
  });

  dropzone.addEventListener("dragleave", () => {
    dropzone.classList.remove("dragover");
  });

  dropzone.addEventListener("drop", async (e) => {
    e.preventDefault();
    dropzone.classList.remove("dragover");
    const file = e.dataTransfer?.files?.[0];
    if (file && (file.type === "application/pdf" || file.name.endsWith(".pdf"))) {
      await processSelectedFile(file);
    }
  });

  async function processSelectedFile(file: File) {
    dropzone.innerHTML = `<div class="dropzone-title">Loading ${file.name}...</div>`;

    const buffer = await file.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    const len = bytes.byteLength;
    const chunkSize = 0x8000;
    for (let i = 0; i < len; i += chunkSize) {
      binary += String.fromCharCode.apply(
        null,
        bytes.subarray(i, Math.min(i + chunkSize, len)) as unknown as number[]
      );
    }
    const base64 = btoa(binary);

    if (chrome?.storage?.local) {
      // Store pending file for the editor tab
      await chrome.storage.local.set({
        pendingPdf: {
          name: file.name,
          base64: base64,
          timestamp: Date.now(),
        },
      });

      // Launch editor tab
      await chrome.tabs.create({
        url: chrome.runtime.getURL("index.html?openPending=true"),
      });
      window.close();
    } else {
      // Fallback for regular web preview
      window.open(`/tools/pdf-pro?file=${encodeURIComponent(file.name)}`, "_blank");
    }
  }
});
