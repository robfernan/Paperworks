/**
 * Paperworks Chrome Extension - Content Script
 * Intercepts PDF views in the browser and injects a Form Simplicity editor banner.
 */

(function initPaperworksContentScript() {
  const currentUrl = window.location.href;
  const isExtensionPage = currentUrl.startsWith(chrome.runtime.getURL(""));
  if (isExtensionPage) return;

  const isPdfUrl = /\.pdf(\?.*)?$/i.test(currentUrl) || currentUrl.startsWith("file://") && currentUrl.toLowerCase().endsWith(".pdf");
  const isPdfContentType = document.contentType === "application/pdf";
  const hasPdfEmbed = Boolean(document.querySelector('embed[type="application/pdf"], object[type="application/pdf"]'));

  if (!isPdfUrl && !isPdfContentType && !hasPdfEmbed) {
    return;
  }

  // Prevent duplicate banner insertion
  if (document.getElementById("paperworks-quick-bar")) return;

  // Create UI banner
  const banner = document.createElement("div");
  banner.id = "paperworks-quick-bar";
  banner.style.cssText = `
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 2147483647;
    background: #0f172a;
    color: #f8fafc;
    border: 1px solid #3b82f6;
    border-radius: 8px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 12px;
    box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 13px;
    transition: opacity 0.2s ease, transform 0.2s ease;
  `;

  banner.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <span style="display: inline-flex; align-items: center; justify-content: center; width: 22px; height: 22px; background: #2563eb; color: #fff; border-radius: 4px; font-weight: bold; font-size: 11px;">P</span>
      <span style="font-weight: 600; color: #ffffff;">Paperworks</span>
      <span style="color: #94a3b8; font-size: 12px;">Form Simplicity Editor</span>
    </div>
    <div style="display: flex; align-items: center; gap: 6px; margin-left: 6px;">
      <button id="pw-open-btn" style="
        background: #2563eb;
        color: #ffffff;
        border: none;
        padding: 5px 12px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 4px;
      ">
        Open & Fill
      </button>
      <button id="pw-close-btn" style="
        background: transparent;
        color: #94a3b8;
        border: none;
        padding: 4px 6px;
        border-radius: 4px;
        font-size: 14px;
        cursor: pointer;
        line-height: 1;
      " title="Dismiss">✕</button>
    </div>
  `;

  document.body.appendChild(banner);

  const openBtn = banner.querySelector("#pw-open-btn");
  const closeBtn = banner.querySelector("#pw-close-btn");

  const openInEditor = () => {
    chrome.runtime.sendMessage({ type: "OPEN_PDF", url: currentUrl });
  };

  openBtn?.addEventListener("click", openInEditor);
  closeBtn?.addEventListener("click", () => {
    banner.style.opacity = "0";
    banner.style.transform = "translateY(-10px)";
    setTimeout(() => banner.remove(), 200);
  });

  // Keyboard shortcut Alt + P
  window.addEventListener("keydown", (e) => {
    if (e.altKey && (e.key === "p" || e.key === "P")) {
      openInEditor();
    }
  });
})();
