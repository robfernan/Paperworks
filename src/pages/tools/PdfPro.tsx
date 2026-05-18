import * as React from "react";
import { PDFDocument, rgb } from "pdf-lib";

const PdfPro = () => {
  const [fileName, setFileName] = React.useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = React.useState<Uint8Array | null>(null);
  const [pageOrder, setPageOrder] = React.useState<number[]>([]);
  const [rotations, setRotations] = React.useState<Record<number, number>>({});
  const [signatureDataUrl, setSignatureDataUrl] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawing = React.useRef(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    setPdfBytes(bytes);
    setFileName(file.name);
    const pdfDoc = await PDFDocument.load(bytes);
    const pages = pdfDoc.getPageCount();
    setPageOrder(Array.from({ length: pages }, (_, i) => i));
    setRotations({});
  };

  const triggerFile = () => {
    fileInputRef.current?.click();
  };

  const movePage = (fromIndex: number, toIndex: number) => {
    setPageOrder((prev) => {
      const arr = [...prev];
      const [item] = arr.splice(fromIndex, 1);
      arr.splice(toIndex, 0, item);
      return arr;
    });
  };

  const rotatePage = (index: number, delta = 90) => {
    setRotations((r) => ({ ...r, [index]: ((r[index] || 0) + delta) % 360 }));
  };

  const clearSignature = () => setSignatureDataUrl(null);

  const savePdf = async () => {
    if (!pdfBytes) return;
    const srcDoc = await PDFDocument.load(pdfBytes);
    const newDoc = await PDFDocument.create();

    // copy pages in user order
    const copiedPages = await newDoc.copyPages(srcDoc, pageOrder);
    copiedPages.forEach((p, i) => {
      const rotation = rotations[i] || 0;
      if (rotation) p.setRotation((rotation / 180) * Math.PI);
      newDoc.addPage(p);
    });

    // add signature image on first page if present
    if (signatureDataUrl) {
      const sigBytes = await (await fetch(signatureDataUrl)).arrayBuffer();
      const sigImage = await newDoc.embedPng(sigBytes);
      const pages = newDoc.getPages();
      const p = pages[0];
      p.drawImage(sigImage, {
        x: p.getWidth() - 160,
        y: 40,
        width: 120,
        height: 40,
      });
    }

    const out = await newDoc.save();
    const blob = new Blob([out], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName ? fileName.replace(/\.pdf$/i, "-edited.pdf") : "edited.pdf";
    a.click();
    URL.revokeObjectURL(url);
  };

  // signature drawing handlers
  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";

    const onPointerDown: EventListener = (ev) => {
      const e = ev as PointerEvent;
      drawing.current = true;
      ctx.beginPath();
      ctx.moveTo(e.offsetX, e.offsetY);
    };
    const onPointerMove: EventListener = (ev) => {
      const e = ev as PointerEvent;
      if (!drawing.current) return;
      ctx.lineTo(e.offsetX, e.offsetY);
      ctx.stroke();
    };
    const onPointerUp: EventListener = () => {
      drawing.current = false;
      setSignatureDataUrl(canvas.toDataURL("image/png"));
    };

    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">PDF Pro — Offline Editor</h2>
      <p className="text-muted-foreground mb-6">Load a PDF from your device, reorder pages, rotate, add a signature, and save the edited PDF — all offline in your browser.</p>

      <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files?.[0] ?? null)} />
      <div className="flex gap-4 mb-6">
        <button onClick={triggerFile} className="btn">Load PDF</button>
        <button onClick={savePdf} className="btn" disabled={!pdfBytes}>Save Edited PDF</button>
        <button onClick={() => { if (canvasRef.current) canvasRef.current.getContext("2d")?.clearRect(0,0,canvasRef.current.width, canvasRef.current.height); clearSignature(); }} className="btn">Clear Signature</button>
      </div>

      {pageOrder.length > 0 && (
        <div className="space-y-4">
          {pageOrder.map((pageIndex, i) => (
            <div key={pageIndex} className="p-4 border rounded flex items-center justify-between">
              <div>
                <div className="font-medium">Page {i + 1} (src #{pageIndex + 1})</div>
                <div className="text-sm text-muted-foreground">Rotation: {rotations[i] ?? 0}°</div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => movePage(i, Math.max(0, i - 1))} className="btn">↑</button>
                <button onClick={() => movePage(i, Math.min(pageOrder.length - 1, i + 1))} className="btn">↓</button>
                <button onClick={() => rotatePage(i, 90)} className="btn">⟳</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8">
        <h3 className="font-medium mb-2">Add Signature (draw below)</h3>
        <canvas ref={canvasRef} width={600} height={120} className="border" />
        <div className="mt-2 text-sm text-muted-foreground">Signature will be embedded on the first page when saving.</div>
      </div>
    </div>
  );
};

export default PdfPro;
