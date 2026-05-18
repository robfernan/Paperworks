import * as React from "react";
import { jsPDF } from "jspdf";
import { useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  createDocument,
  deleteDocument,
  duplicateDocument,
  listDocuments,
  type DocumentRecord,
  updateDocument,
} from "@/lib/documentStore";

type InvoiceItem = {
  id: string;
  desc: string;
  qty: number;
  price: number;
};

type InvoicePayload = {
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
  paymentTerms: "Deposit: 70% upfront. Remaining balance due on completion.",
  notes: "Thank you for your business.",
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
  const [data, setData] = React.useState<InvoicePayload>(emptyInvoice);
  const [isLoading, setIsLoading] = React.useState(true);

  const loadDocuments = React.useCallback(async () => {
    setIsLoading(true);
    const docs = await listDocuments<InvoicePayload>("invoice");
    setDocuments(docs);

    const requestedId = searchParams.get("doc");

    if (docs.length > 0) {
      const selected = docs.find((d) => d.id === requestedId) ?? docs.find((d) => d.id === selectedId) ?? docs[0];
      setSelectedId(selected.id);
      setTitle(selected.title);
      setData(selected.payload);
    } else {
      setSelectedId(null);
      setTitle("Untitled Invoice");
      setData(emptyInvoice());
    }

    setIsLoading(false);
  }, [searchParams, selectedId]);

  React.useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const subtotal = data.items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const tax = subtotal * (data.taxRate / 100);
  const total = subtotal + tax - data.discount;

  const updateItem = (itemId: string, key: keyof InvoiceItem, value: string | number) => {
    setData((prev) => ({
      ...prev,
      items: prev.items.map((item) => (item.id === itemId ? { ...item, [key]: value } : item)),
    }));
  };

  const addItem = () => {
    setData((prev) => ({ ...prev, items: [...prev.items, createItem()] }));
  };

  const removeItem = (itemId: string) => {
    setData((prev) => {
      const next = prev.items.filter((item) => item.id !== itemId);
      return { ...prev, items: next.length ? next : [createItem()] };
    });
  };

  const save = async () => {
    if (selectedId) {
      await updateDocument<InvoicePayload>(selectedId, { title, payload: data });
    } else {
      const created = await createDocument<InvoicePayload>({
        toolType: "invoice",
        title,
        payload: data,
      });
      setSelectedId(created.id);
      setSearchParams({ doc: created.id }, { replace: true });
    }

    await loadDocuments();
  };

  const onLogo = (file: File | null) => {
    if (!file) {
      setData((prev) => ({ ...prev, logo: null }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setData((prev) => ({ ...prev, logo: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const onExportPdf = async () => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    if (data.logo) {
      try {
        doc.addImage(data.logo, "PNG", 155, 8, 40, 20);
      } catch {
        // keep export robust even if logo parsing fails
      }
    }

    doc.setFontSize(24);
    doc.text("INVOICE", 15, 20);

    doc.setFontSize(11);
    doc.text(`Company: ${data.companyName || "-"}`, 15, 30);
    doc.text(`Phone: ${data.companyPhone || "-"}`, 15, 36);
    doc.text(`Invoice Date: ${data.invoiceDate || "-"}`, 15, 42);

    doc.text(`Client: ${data.clientName || "-"}`, 15, 52);
    const addressLines = doc.splitTextToSize(data.clientAddress || "-", 180);
    doc.text(addressLines, 15, 58);

    const tableY = 70 + addressLines.length * 4;
    doc.setFontSize(10);
    doc.text("Description", 15, tableY);
    doc.text("Qty", 120, tableY);
    doc.text("Price", 140, tableY);
    doc.text("Total", 170, tableY);

    doc.line(15, tableY + 1, 195, tableY + 1);

    let y = tableY + 8;
    data.items.forEach((item) => {
      doc.text(item.desc || "Item", 15, y);
      doc.text(String(item.qty), 120, y);
      doc.text(`$${item.price.toFixed(2)}`, 140, y);
      doc.text(`$${(item.qty * item.price).toFixed(2)}`, 170, y);
      y += 7;
    });

    y += 4;
    doc.line(120, y, 195, y);
    y += 6;
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, y);
    y += 6;
    doc.text(`Tax: $${tax.toFixed(2)}`, 140, y);
    y += 6;
    doc.text(`Discount: $${data.discount.toFixed(2)}`, 140, y);
    y += 6;
    doc.setFontSize(12);
    doc.text(`Total: $${total.toFixed(2)}`, 140, y);

    y += 12;
    doc.setFontSize(10);
    doc.text("Payment Terms", 15, y);
    doc.text(doc.splitTextToSize(data.paymentTerms || "-", 180), 15, y + 6);

    y += 24;
    doc.text("Notes", 15, y);
    doc.text(doc.splitTextToSize(data.notes || "-", 180), 15, y + 6);

    doc.save(`${title || "invoice"}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
      <h2 className="text-2xl font-bold mb-2">Invoice Studio</h2>
      <p className="text-sm text-muted-foreground mb-6">Archive-based professional invoice flow with offline drafts and PDF export.</p>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_1.5fr] gap-6">
        <aside className="border rounded-lg p-4 bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Saved Invoices</h3>
            <Button size="sm" onClick={() => { setSelectedId(null); setSearchParams({}, { replace: true }); setTitle("Untitled Invoice"); setData(emptyInvoice()); }}>New</Button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {isLoading ? <div className="text-sm text-muted-foreground">Loading invoices...</div> : null}
            {!isLoading && documents.length === 0 ? <div className="text-sm text-muted-foreground">No invoices yet.</div> : null}
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => { setSelectedId(doc.id); setTitle(doc.title); setData(doc.payload); }}
                onClickCapture={() => setSearchParams({ doc: doc.id }, { replace: true })}
                className={`w-full text-left border rounded-md p-3 ${selectedId === doc.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
              >
                <div className="font-medium truncate">{doc.title || "Untitled"}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(doc.updatedAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_2fr] gap-6">
          <section className="border rounded-lg p-5 bg-background/50">
            <Input className="mb-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Invoice title" />
            <Input className="mb-2" value={data.companyName} onChange={(e) => setData({ ...data, companyName: e.target.value })} placeholder="Company name" />
            <Input className="mb-2" value={data.companyPhone} onChange={(e) => setData({ ...data, companyPhone: e.target.value })} placeholder="Company phone" />
            <Input className="mb-2" type="date" value={data.invoiceDate} onChange={(e) => setData({ ...data, invoiceDate: e.target.value })} />
            <Input className="mb-2" value={data.clientName} onChange={(e) => setData({ ...data, clientName: e.target.value })} placeholder="Client name" />
            <textarea className="w-full rounded-md border px-3 py-2 mb-2" value={data.clientAddress} onChange={(e) => setData({ ...data, clientAddress: e.target.value })} placeholder="Client address" rows={3} />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" value={data.taxRate} onChange={(e) => setData({ ...data, taxRate: Number(e.target.value) })} placeholder="Tax %" />
              <Input type="number" value={data.discount} onChange={(e) => setData({ ...data, discount: Number(e.target.value) })} placeholder="Discount" />
            </div>

            <div className="mt-3">
              <label className="text-sm">Logo</label>
              <input className="block mt-1 text-sm" type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0] ?? null)} />
            </div>

            <div className="mt-4">
              <div className="font-medium mb-2">Items</div>
              <div className="space-y-2">
                {data.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-1 sm:grid-cols-[1fr_88px_96px_auto] gap-2">
                    <Input value={item.desc} onChange={(e) => updateItem(item.id, "desc", e.target.value)} placeholder="Description" className="w-full" />
                    <div className="flex gap-2 sm:contents">
                      <Input type="number" value={item.qty} onChange={(e) => updateItem(item.id, "qty", Number(e.target.value))} placeholder="Qty" className="flex-1" />
                      <Input type="number" value={item.price} onChange={(e) => updateItem(item.id, "price", Number(e.target.value))} placeholder="Price" className="flex-1" />
                      <Button variant="destructive" onClick={() => removeItem(item.id)}>Remove</Button>
                    </div>
                  </div>
                ))}
              </div>
              <Button className="mt-2" variant="secondary" onClick={addItem}>Add Item</Button>
            </div>

            <textarea className="w-full rounded-md border px-3 py-2 mt-4" value={data.paymentTerms} onChange={(e) => setData({ ...data, paymentTerms: e.target.value })} placeholder="Payment terms" rows={3} />
            <textarea className="w-full rounded-md border px-3 py-2 mt-2" value={data.notes} onChange={(e) => setData({ ...data, notes: e.target.value })} placeholder="Notes" rows={3} />

            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={save}>Save</Button>
              <Button variant="secondary" onClick={async () => { if (selectedId) { await duplicateDocument(selectedId); await loadDocuments(); } }} disabled={!selectedId}>Duplicate</Button>
              <Button variant="destructive" onClick={async () => { if (selectedId) { await deleteDocument(selectedId); await loadDocuments(); } }} disabled={!selectedId}>Delete</Button>
              <Button variant="outline" onClick={onExportPdf}>Download PDF</Button>
            </div>
          </section>

          <section className="border rounded-lg p-5 bg-background/50">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="text-2xl font-bold">INVOICE</div>
                <div className="text-sm text-muted-foreground">{data.invoiceDate || "Date"}</div>
              </div>
              {data.logo ? <img src={data.logo} alt="logo" className="max-h-14 max-w-[160px] object-contain" /> : null}
            </div>

            <div className="mt-4 text-sm">
              <div><span className="font-medium">Company:</span> {data.companyName || "-"}</div>
              <div><span className="font-medium">Phone:</span> {data.companyPhone || "-"}</div>
              <div className="mt-2"><span className="font-medium">Client:</span> {data.clientName || "-"}</div>
              <div className="text-muted-foreground whitespace-pre-wrap">{data.clientAddress || "-"}</div>
            </div>

            <div className="mt-4 border rounded-md overflow-x-auto">
              <div className="min-w-[400px]">
                <div className="grid grid-cols-[1fr_60px_100px_110px] bg-muted/50 text-sm font-medium px-3 py-2">
                  <div>Description</div>
                  <div className="text-right">Qty</div>
                  <div className="text-right">Price</div>
                  <div className="text-right">Line Total</div>
                </div>
                {data.items.map((item) => (
                  <div key={item.id} className="grid grid-cols-[1fr_60px_100px_110px] px-3 py-2 text-sm border-t">
                    <div className="truncate pr-2">{item.desc || "Item"}</div>
                    <div className="text-right">{item.qty}</div>
                    <div className="text-right">${item.price.toFixed(2)}</div>
                    <div className="text-right">${(item.qty * item.price).toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 text-sm space-y-1">
              <div className="flex justify-between"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Tax ({data.taxRate}%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="flex justify-between"><span>Discount</span><span>-${data.discount.toFixed(2)}</span></div>
              <div className="flex justify-between text-lg font-bold pt-1 border-t"><span>Total</span><span>${total.toFixed(2)}</span></div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreator;
