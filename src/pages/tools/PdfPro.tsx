import * as React from "react";
import { PDFDocument } from "pdf-lib";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  listDocuments,
  type DocumentRecord,
  updateDocument,
} from "@/lib/documentStore";
import { base64ToUint8, uint8ToBase64 } from "@/lib/binary";

type PdfProjectPayload = {
  fileName: string;
  pdfBase64: string;
  pageOrder: number[];
  rotations: Record<number, number>;
  signatureDataUrl: string | null;
};

const PdfPro = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = React.useState<DocumentRecord<PdfProjectPayload>[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [projectTitle, setProjectTitle] = React.useState("Untitled PDF Project");

  const [fileName, setFileName] = React.useState<string | null>(null);
  const [pdfBytes, setPdfBytes] = React.useState<Uint8Array | null>(null);
  const [pdfUrl, setPdfUrl] = React.useState<string | null>(null);
  const prevUrlRef = React.useRef<string | null>(null);
  const [pageOrder, setPageOrder] = React.useState<number[]>([]);
  const [rotations, setRotations] = React.useState<Record<number, number>>({});
  const [signatureDataUrl, setSignatureDataUrl] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const drawing = React.useRef(false);

  const loadProjects = React.useCallback(async () => {
    const docs = await listDocuments<PdfProjectPayload>("pdf");
    setDocuments(docs);

    const requestedId = searchParams.get("doc");
    if (requestedId) {
      const target = docs.find((d) => d.id === requestedId);
      if (target) {
        setSelectedId(target.id);
        setProjectTitle(target.title);
        setFileName(target.payload.fileName);
        setPdfBytes(base64ToUint8(target.payload.pdfBase64));
        setPageOrder(target.payload.pageOrder);
        setRotations(target.payload.rotations || {});
        setSignatureDataUrl(target.payload.signatureDataUrl ?? null);
      }
    }
  }, [searchParams]);

  React.useEffect(() => {
    void loadProjects();
  }, [loadProjects]);

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
    setSignatureDataUrl(null);

    if (!selectedId) {
      setProjectTitle(file.name.replace(/\.pdf$/i, "") || "Untitled PDF Project");
    }
  };

  React.useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const generatePreview = async () => {
      if (!pdfBytes) {
        if (prevUrlRef.current) {
          URL.revokeObjectURL(prevUrlRef.current);
          prevUrlRef.current = null;
        }
        setPdfUrl(null);
        return;
      }

      try {
        const srcDoc = await PDFDocument.load(pdfBytes);
        const newDoc = await PDFDocument.create();
        const sourceOrder = pageOrder.length ? pageOrder : Array.from({ length: srcDoc.getPageCount() }, (_, i) => i);
        const copiedPages = await newDoc.copyPages(srcDoc, sourceOrder);
        copiedPages.forEach((p, i) => {
          const rotation = rotations[i] || 0;
          if (rotation) p.setRotation((rotation / 180) * Math.PI);
          newDoc.addPage(p);
        });

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
        if (cancelled) return;
        const blob = new Blob([out], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        if (prevUrlRef.current) {
          URL.revokeObjectURL(prevUrlRef.current);
        }
        prevUrlRef.current = url;
        setPdfUrl(url);
      } catch {
        // keep last valid preview
      }
    };

    timer = setTimeout(() => {
      void generatePreview();
    }, 220);

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [pdfBytes, pageOrder, rotations, signatureDataUrl]);

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

    const copiedPages = await newDoc.copyPages(srcDoc, pageOrder);
    copiedPages.forEach((p, i) => {
      const rotation = rotations[i] || 0;
      if (rotation) p.setRotation((rotation / 180) * Math.PI);
      newDoc.addPage(p);
    });

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

  const saveProject = async () => {
    if (!pdfBytes || !fileName) return;

    const payload: PdfProjectPayload = {
      fileName,
      pdfBase64: uint8ToBase64(pdfBytes),
      pageOrder,
      rotations,
      signatureDataUrl,
    };

    if (selectedId) {
      await updateDocument<PdfProjectPayload>(selectedId, { title: projectTitle, payload });
    } else {
      const created = await createDocument<PdfProjectPayload>({
        toolType: "pdf",
        title: projectTitle,
        payload,
      });
      setSelectedId(created.id);
      setSearchParams({ doc: created.id }, { replace: true });
    }

    await loadProjects();
  };

  const openProject = async (doc: DocumentRecord<PdfProjectPayload>) => {
    setSelectedId(doc.id);
    setSearchParams({ doc: doc.id }, { replace: true });
    setProjectTitle(doc.title);
    setFileName(doc.payload.fileName);
    setPdfBytes(base64ToUint8(doc.payload.pdfBase64));
    setPageOrder(doc.payload.pageOrder);
    setRotations(doc.payload.rotations || {});
    setSignatureDataUrl(doc.payload.signatureDataUrl ?? null);
  };

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineWidth = 2;
    ctx.strokeStyle = "#000";
    ctx.lineCap = "round";

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
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
      <h2 className="text-2xl font-bold mb-2">PDF Pro</h2>
      <p className="text-sm text-muted-foreground mb-6">Archive-inspired offline editor with multi-page operations and saved projects.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <aside className="border rounded-lg p-4 bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Saved Projects</h3>
            <Button
              size="sm"
              onClick={() => {
                setSelectedId(null);
                setSearchParams({}, { replace: true });
                setProjectTitle("Untitled PDF Project");
                setFileName(null);
                setPdfBytes(null);
                setPageOrder([]);
                setRotations({});
                setSignatureDataUrl(null);
              }}
            >
              New
            </Button>
          </div>

          <InputProjectTitle value={projectTitle} onChange={setProjectTitle} />

          <div className="space-y-2 max-h-[55vh] overflow-auto pr-1 mt-3">
            {documents.length === 0 ? <div className="text-sm text-muted-foreground">No PDF projects yet.</div> : null}
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => void openProject(doc)}
                className={`w-full text-left border rounded-md p-3 ${selectedId === doc.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
              >
                <div className="font-medium truncate">{doc.title || "Untitled"}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(doc.updatedAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </aside>

        <div>
          <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => void handleFile(e.target.files?.[0] ?? null)} />
          <div className="flex flex-wrap gap-2 mb-5">
            <Button onClick={triggerFile}>Load PDF</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                const doc = await PDFDocument.create();
                const p1 = doc.addPage([400, 200]);
                p1.drawText("Sample Page 1", { x: 50, y: 150 });
                const p2 = doc.addPage([400, 200]);
                p2.drawText("Sample Page 2", { x: 50, y: 150 });
                const bytes = await doc.save();
                await handleFile(new File([bytes], "sample.pdf", { type: "application/pdf" }));
              }}
            >
              Load Sample
            </Button>
            <Button onClick={() => void saveProject()} disabled={!pdfBytes}>Save Project</Button>
            <Button onClick={() => void savePdf()} disabled={!pdfBytes}>Download Edited PDF</Button>
            <Button
              variant="secondary"
              onClick={async () => {
                if (!selectedId) return;
                await duplicateDocument(selectedId);
                await loadProjects();
              }}
              disabled={!selectedId}
            >
              Duplicate
            </Button>
            <Button
              variant="destructive"
              onClick={async () => {
                if (!selectedId) return;
                await deleteDocument(selectedId);
                setSelectedId(null);
                await loadProjects();
              }}
              disabled={!selectedId}
            >
              Delete
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                if (canvasRef.current) {
                  canvasRef.current.getContext("2d")?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
                }
                clearSignature();
              }}
            >
              Clear Signature
            </Button>
          </div>

          {pageOrder.length > 0 ? (
            <div className="space-y-3 mb-6">
              {pageOrder.map((pageIndex, i) => (
                <div key={`${pageIndex}-${i}`} className="p-3 border rounded-md flex flex-wrap gap-3 items-center justify-between">
                  <div>
                    <div className="font-medium">Page {i + 1} (source #{pageIndex + 1})</div>
                    <div className="text-sm text-muted-foreground">Rotation: {rotations[i] ?? 0}deg</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => movePage(i, Math.max(0, i - 1))}>Up</Button>
                    <Button size="sm" variant="outline" onClick={() => movePage(i, Math.min(pageOrder.length - 1, i + 1))}>Down</Button>
                    <Button size="sm" variant="outline" onClick={() => rotatePage(i, 90)}>Rotate</Button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mb-6">
            <h3 className="font-medium mb-2">Signature</h3>
            <canvas ref={canvasRef} width={800} height={120} className="border rounded-md w-full max-w-[860px]" />
            <div className="text-sm text-muted-foreground mt-2">Draw signature to stamp the first page on save/export.</div>
          </div>

          {pdfUrl ? (
            <div>
              <h3 className="font-medium mb-2">Preview</h3>
              <div className="border rounded-md overflow-hidden">
                <iframe title="pdf-preview" src={pdfUrl} style={{ width: "100%", height: 640 }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};

const InputProjectTitle = ({ value, onChange }: { value: string; onChange: (value: string) => void }) => {
  return (
    <input
      className="w-full rounded-md border px-3 py-2 text-sm"
      placeholder="Project title"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  );
};

export default PdfPro;
