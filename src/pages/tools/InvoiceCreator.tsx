import * as React from "react";
import { jsPDF } from "jspdf";
import { useSearchParams } from "react-router-dom";
import {
  Receipt,
  Plus,
  Trash2,
  Copy,
  Download,
  Save,
  Undo2,
  Redo2,
  Building2,
  User,
  Calculator,
  Image as ImageIcon,
  CheckCircle2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  listDocuments,
  type DocumentRecord,
  updateDocument,
} from "@/lib/documentStore";
import { useDocumentHistory } from "@/hooks/useDocumentHistory";
import { SnapshotTimeline } from "@/components/SnapshotTimeline";
import { toast } from "sonner";

export type InvoiceItem = {
  id: string;
  desc: string;
  qty: number;
  price: number;
};

export type InvoicePayload = {
  companyName: string;
  companyPhone: string;
  invoiceDate: string;
  clientName: string;
  clientAddress: string;
  paymentTerms: string;
  notes: string;
  taxRate: number;
  discount: number;
  logo: string | null;
  items: InvoiceItem[];
};

const createItem = (): InvoiceItem => ({
  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  desc: "",
  qty: 1,
  price: 0,
});

const emptyInvoice = (): InvoicePayload => ({
  companyName: "",
  companyPhone: "",
  invoiceDate: new Date().toISOString().slice(0, 10),
  clientName: "",
  clientAddress: "",
  paymentTerms: "Deposit: 50% upfront. Balance due Net 30 upon delivery.",
  notes: "Thank you for your business. Please remit payments directly.",
  taxRate: 0,
  discount: 0,
  logo: null,
  items: [createItem()],
});

const InvoiceCreator = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = React.useState<DocumentRecord<InvoicePayload>[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("Untitled Invoice");
  const [isLoading, setIsLoading] = React.useState(true);

  // Undo/Redo & Snapshot Timeline state management
  const {
    state: invoiceData,
    setState: setInvoiceData,
    undo,
    redo,
    canUndo,
    canRedo,
    isDirty,
    snapshots,
    loadSnapshots,
    createSnapshot,
    restoreSnapshot,
    resetState,
  } = useDocumentHistory<InvoicePayload>({
    documentId: selectedId,
    initialState: emptyInvoice(),
    onAutosave: async (state) => {
      if (selectedId) {
        await updateDocument<InvoicePayload>(selectedId, {
          title,
          payload: state,
        });
      }
    },
  });

  const loadDocuments = React.useCallback(async () => {
    setIsLoading(true);
    const docs = await listDocuments<InvoicePayload>("invoice");
    setDocuments(docs);

    const requestedId = searchParams.get("doc");
    if (requestedId) {
      const selected = docs.find((d) => d.id === requestedId);
      if (selected) {
        setSelectedId(selected.id);
        setTitle(selected.title);
        resetState(selected.payload);
      }
    } else if (docs.length > 0 && !selectedId) {
      setSelectedId(docs[0].id);
      setTitle(docs[0].title);
      resetState(docs[0].payload);
    }
    setIsLoading(false);
  }, [searchParams, selectedId, resetState]);

  React.useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const subtotal = invoiceData.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tax = subtotal * (invoiceData.taxRate / 100);
  const total = subtotal + tax - invoiceData.discount;

  const updateItem = (itemId: string, key: keyof InvoiceItem, value: string | number) => {
    setInvoiceData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, [key]: value } : item)),
    }));
  };

  const addItem = () => {
    setInvoiceData((prev) => ({ ...prev, items: [...prev.items, createItem()] }));
  };

  const removeItem = (itemId: string) => {
    setInvoiceData((prev) => {
      const next = prev.items.filter((item) => item.id !== itemId);
      return { ...prev, items: next.length ? next : [createItem()] };
    });
  };

  const handleSave = async () => {
    if (selectedId) {
      await updateDocument<InvoicePayload>(selectedId, { title, payload: invoiceData });
      toast.success("Invoice saved successfully");
    } else {
      const created = await createDocument<InvoicePayload>({
        toolType: "invoice",
        title: title || "New Invoice",
        payload: invoiceData,
      });
      setSelectedId(created.id);
      setSearchParams({ doc: created.id }, { replace: true });
      toast.success("New invoice created");
    }
    await loadDocuments();
  };

  const handleNew = () => {
    setSelectedId(null);
    setSearchParams({}, { replace: true });
    setTitle("Untitled Invoice");
    resetState(emptyInvoice());
  };

  const onLogo = (file: File | null) => {
    if (!file) {
      setInvoiceData((prev) => ({ ...prev, logo: null }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setInvoiceData((prev) => ({ ...prev, logo: String(reader.result) }));
      toast.info("Invoice logo updated");
    };
    reader.readAsDataURL(file);
  };

  const onExportPdf = async () => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    if (invoiceData.logo) {
      try {
        doc.addImage(invoiceData.logo, "PNG", 155, 10, 40, 20);
      } catch {
        // keep export robust even if logo parsing fails
      }
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.setTextColor(30, 41, 59);
    doc.text("INVOICE", 15, 22);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`Company: ${invoiceData.companyName || "-"}`, 15, 32);
    doc.text(`Phone: ${invoiceData.companyPhone || "-"}`, 15, 38);
    doc.text(`Invoice Date: ${invoiceData.invoiceDate || "-"}`, 15, 44);

    doc.text(`Client: ${invoiceData.clientName || "-"}`, 15, 54);
    const addressLines = doc.splitTextToSize(invoiceData.clientAddress || "-", 180);
    doc.text(addressLines, 15, 60);

    const tableY = 72 + addressLines.length * 4;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Description", 15, tableY);
    doc.text("Qty", 120, tableY);
    doc.text("Price", 145, tableY);
    doc.text("Line Total", 175, tableY);

    doc.setDrawColor(203, 213, 225);
    doc.line(15, tableY + 2, 195, tableY + 2);

    let y = tableY + 8;
    doc.setFont("helvetica", "normal");
    invoiceData.items.forEach((item) => {
      doc.text(item.desc || "Item", 15, y);
      doc.text(String(item.qty), 120, y);
      doc.text(`$${item.price.toFixed(2)}`, 145, y);
      doc.text(`$${(item.qty * item.price).toFixed(2)}`, 175, y);
      y += 6.5;
    });

    y += 4;
    doc.line(120, y, 195, y);
    y += 6;
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, y);
    y += 5.5;
    doc.text(`Tax (${invoiceData.taxRate}%): $${tax.toFixed(2)}`, 140, y);
    y += 5.5;
    doc.text(`Discount: -$${invoiceData.discount.toFixed(2)}`, 140, y);
    y += 6;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(`Total: $${total.toFixed(2)}`, 140, y);

    y += 14;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text("Payment Terms", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(invoiceData.paymentTerms || "-", 180), 15, y + 5);

    y += 20;
    doc.setFont("helvetica", "bold");
    doc.text("Notes", 15, y);
    doc.setFont("helvetica", "normal");
    doc.text(doc.splitTextToSize(invoiceData.notes || "-", 180), 15, y + 5);

    doc.save(`${title || "invoice"}.pdf`);
    toast.success("Invoice PDF generated and downloaded");
  };

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Invoice Studio</h1>
            <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-semibold">
              Commercial
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Offline billing system with automatic calculations, itemization, brand logos, and instant PDF generation.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Undo / Redo */}
          <div className="flex items-center rounded-lg border bg-background/80 p-0.5 shadow-sm">
            <Button
              size="icon"
              variant="ghost"
              disabled={!canUndo}
              onClick={undo}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Undo (Ctrl+Z / ⌘Z)"
            >
              <Undo2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              disabled={!canRedo}
              onClick={redo}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              title="Redo (Ctrl+Y / ⌘⇧Z)"
            >
              <Redo2 className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Timeline Snapshot Dialog */}
          <SnapshotTimeline
            documentId={selectedId}
            snapshots={snapshots}
            onRestore={restoreSnapshot}
            onCreateSnapshot={createSnapshot}
            onRefresh={loadSnapshots}
            disabled={!selectedId}
          />

          <Button size="sm" onClick={handleSave} className="gap-1.5 h-8 text-xs font-semibold">
            <Save className="w-3.5 h-3.5" />
            Save Invoice
          </Button>

          <Button size="sm" variant="outline" onClick={onExportPdf} className="gap-1.5 h-8 text-xs font-semibold">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Left Sidebar: Invoices */}
        <aside className="border rounded-xl p-4 bg-card/60 backdrop-blur-sm flex flex-col h-[750px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <Receipt className="w-4 h-4 text-blue-500" />
              <span>Saved Invoices</span>
            </div>
            <Button size="sm" variant="outline" onClick={handleNew} className="h-7 text-xs px-2 gap-1">
              <Plus className="w-3 h-3" />
              New
            </Button>
          </div>

          <div className="mb-3">
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Invoice title"
              className="text-xs h-8"
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-14 w-full" />
                <Skeleton className="h-14 w-full" />
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8 text-xs text-muted-foreground border border-dashed rounded-lg p-4">
                No invoices found. Create your first invoice!
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => {
                    setSelectedId(doc.id);
                    setTitle(doc.title);
                    resetState(doc.payload);
                    setSearchParams({ doc: doc.id }, { replace: true });
                  }}
                  className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                    selectedId === doc.id
                      ? "border-primary bg-primary/10 shadow-sm"
                      : "hover:bg-accent/50 border-border/70"
                  }`}
                >
                  <div className="font-medium text-xs truncate text-foreground">{doc.title || "Untitled"}</div>
                  <div className="text-[10px] text-muted-foreground mt-1 flex items-center justify-between">
                    <span>{new Date(doc.updatedAt).toLocaleDateString()}</span>
                    <span>{doc.payload.clientName || "Draft"}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {selectedId && (
            <div className="pt-3 border-t flex items-center justify-between gap-2 mt-auto">
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-[11px] flex-1"
                onClick={async () => {
                  await duplicateDocument(selectedId);
                  await loadDocuments();
                  toast.success("Invoice duplicated");
                }}
              >
                <Copy className="w-3 h-3 mr-1" />
                Duplicate
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-7 text-[11px] flex-1"
                onClick={async () => {
                  await deleteDocument(selectedId);
                  handleNew();
                  await loadDocuments();
                  toast.info("Invoice deleted");
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </aside>

        {/* Workspace: Editor + Live Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-6">
          {/* Form Editor */}
          <section className="border rounded-xl p-5 bg-card/60 space-y-4">
            <div className="flex items-center gap-1.5 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              <Building2 className="w-3.5 h-3.5" />
              Company & Client Information
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Your Company Name</label>
                <Input
                  value={invoiceData.companyName}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, companyName: e.target.value }))}
                  placeholder="e.g. Apex Engineering Ltd."
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Company Phone</label>
                <Input
                  value={invoiceData.companyPhone}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, companyPhone: e.target.value }))}
                  placeholder="+1 (555) 000-0000"
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Client / Customer Name</label>
                <Input
                  value={invoiceData.clientName}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, clientName: e.target.value }))}
                  placeholder="e.g. Acquirer Corp"
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Invoice Issue Date</label>
                <Input
                  type="date"
                  value={invoiceData.invoiceDate}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, invoiceDate: e.target.value }))}
                  className="text-xs h-8"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium mb-1 block">Client Billing Address</label>
              <textarea
                value={invoiceData.clientAddress}
                onChange={(e) => setInvoiceData((prev) => ({ ...prev, clientAddress: e.target.value }))}
                placeholder="100 Enterprise Way, Suite 200, Austin, TX"
                className="w-full text-xs rounded-md border px-3 py-2 bg-background min-h-[64px]"
                rows={2}
              />
            </div>

            {/* Line items */}
            <div className="pt-2 border-t">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Calculator className="w-3.5 h-3.5 text-primary" />
                  Billable Line Items
                </span>
                <Button size="sm" variant="outline" onClick={addItem} className="h-6 text-[11px] gap-1 px-2">
                  <Plus className="w-3 h-3" />
                  Add Line
                </Button>
              </div>

              <div className="space-y-2">
                {invoiceData.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_75px_95px_auto] gap-2 items-center">
                    <Input
                      value={item.desc}
                      onChange={(e) => updateItem(item.id, "desc", e.target.value)}
                      placeholder="Item description / service"
                      className="text-xs h-8"
                    />
                    <Input
                      type="number"
                      min={1}
                      value={item.qty}
                      onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))}
                      placeholder="Qty"
                      className="text-xs h-8"
                    />
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      value={item.price}
                      onChange={(e) => updateItem(item.id, "price", Number(e.target.value))}
                      placeholder="Price"
                      className="text-xs h-8"
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => removeItem(item.id)}
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Tax & Discount */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-xs font-medium mb-1 block">Sales Tax Rate (%)</label>
                <Input
                  type="number"
                  min={0}
                  step={0.1}
                  value={invoiceData.taxRate}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, taxRate: Number(e.target.value) }))}
                  className="text-xs h-8"
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Fixed Discount ($)</label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={invoiceData.discount}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, discount: Number(e.target.value) }))}
                  className="text-xs h-8"
                />
              </div>
            </div>

            {/* Logo file */}
            <div>
              <label className="text-xs font-medium mb-1 flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-muted-foreground" />
                Brand Logo (Optional)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => onLogo(e.target.files?.[0] ?? null)}
                className="text-xs block w-full file:mr-2 file:py-1 file:px-2.5 file:rounded file:border-0 file:text-xs file:bg-primary file:text-primary-foreground hover:file:cursor-pointer"
              />
            </div>

            {/* Terms and notes */}
            <div className="pt-2 border-t space-y-3">
              <div>
                <label className="text-xs font-medium mb-1 block">Payment Terms & Instructions</label>
                <textarea
                  value={invoiceData.paymentTerms}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, paymentTerms: e.target.value }))}
                  className="w-full text-xs rounded-md border px-3 py-2 bg-background min-h-[50px]"
                  rows={2}
                />
              </div>
              <div>
                <label className="text-xs font-medium mb-1 block">Notes / Acknowledgments</label>
                <textarea
                  value={invoiceData.notes}
                  onChange={(e) => setInvoiceData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full text-xs rounded-md border px-3 py-2 bg-background min-h-[50px]"
                  rows={2}
                />
              </div>
            </div>
          </section>

          {/* Real-time Rendered Sheet Preview */}
          <section className="border rounded-xl p-6 bg-card/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between pb-4 border-b">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-foreground">INVOICE</h3>
                  <div className="text-xs text-muted-foreground mt-0.5">{invoiceData.invoiceDate}</div>
                </div>
                {invoiceData.logo && (
                  <img src={invoiceData.logo} alt="Logo" className="max-h-12 max-w-[140px] object-contain rounded" />
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 my-5 text-xs">
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase font-semibold">From</div>
                  <div className="font-semibold text-foreground mt-0.5">{invoiceData.companyName || "Your Company"}</div>
                  <div className="text-muted-foreground">{invoiceData.companyPhone}</div>
                </div>
                <div>
                  <div className="text-muted-foreground text-[10px] uppercase font-semibold">Bill To</div>
                  <div className="font-semibold text-foreground mt-0.5">{invoiceData.clientName || "Client Name"}</div>
                  <div className="text-muted-foreground whitespace-pre-wrap">{invoiceData.clientAddress}</div>
                </div>
              </div>

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden text-xs my-4">
                <div className="grid grid-cols-[1fr_50px_70px_80px] bg-muted/60 font-semibold p-2 border-b">
                  <span>Description</span>
                  <span className="text-right">Qty</span>
                  <span className="text-right">Price</span>
                  <span className="text-right">Total</span>
                </div>
                {invoiceData.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_50px_70px_80px] p-2 border-b last:border-b-0">
                    <span className="truncate pr-1">{item.desc || "Item"}</span>
                    <span className="text-right">{item.qty}</span>
                    <span className="text-right">${item.price.toFixed(2)}</span>
                    <span className="text-right font-medium">${(item.qty * item.price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Calculations Summary */}
              <div className="space-y-1.5 text-xs w-48 ml-auto my-4">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {invoiceData.taxRate > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Tax ({invoiceData.taxRate}%)</span>
                    <span>${tax.toFixed(2)}</span>
                  </div>
                )}
                {invoiceData.discount > 0 && (
                  <div className="flex justify-between text-muted-foreground">
                    <span>Discount</span>
                    <span>-${invoiceData.discount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-sm text-foreground pt-1.5 border-t">
                  <span>Total Due</span>
                  <span className="text-primary font-mono">${total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Footer notes */}
            <div className="pt-4 border-t text-[11px] text-muted-foreground space-y-2 mt-6">
              <div>
                <span className="font-semibold text-foreground">Terms: </span>
                {invoiceData.paymentTerms}
              </div>
              <div>
                <span className="font-semibold text-foreground">Notes: </span>
                {invoiceData.notes}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreator;
