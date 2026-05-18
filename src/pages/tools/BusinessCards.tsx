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

type CardTheme = "default" | "bonestock" | "eggshell";
type TextLayout = "left" | "center" | "right";

type BusinessCardPayload = {
  name: string;
  title: string;
  company: string;
  phone: string;
  email: string;
  website: string;
  address: string;
  tagline: string;
  logo: string | null;
  theme: CardTheme;
  textLayout: TextLayout;
};

const emptyCard: BusinessCardPayload = {
  name: "",
  title: "",
  company: "",
  phone: "",
  email: "",
  website: "",
  address: "",
  tagline: "",
  logo: null,
  theme: "default",
  textLayout: "left",
};

const themeClass: Record<CardTheme, string> = {
  default: "bg-white text-slate-900",
  bonestock: "bg-zinc-50 text-slate-900",
  eggshell: "bg-amber-50 text-slate-900",
};

const BusinessCards = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = React.useState<DocumentRecord<BusinessCardPayload>[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("Untitled Business Card");
  const [form, setForm] = React.useState<BusinessCardPayload>(emptyCard);
  const [side, setSide] = React.useState<"front" | "back">("front");
  const [isLoading, setIsLoading] = React.useState(true);

  const loadDocuments = React.useCallback(async () => {
    setIsLoading(true);
    const docs = await listDocuments<BusinessCardPayload>("business-card");
    setDocuments(docs);

    const requestedId = searchParams.get("doc");
    if (docs.length > 0) {
      const selected = docs.find((d) => d.id === requestedId) ?? docs.find((d) => d.id === selectedId) ?? docs[0];
      setSelectedId(selected.id);
      setTitle(selected.title);
      setForm(selected.payload);
    } else {
      setSelectedId(null);
      setTitle("Untitled Business Card");
      setForm(emptyCard);
    }

    setIsLoading(false);
  }, [searchParams, selectedId]);

  React.useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const save = async () => {
    if (selectedId) {
      await updateDocument<BusinessCardPayload>(selectedId, { title, payload: form });
    } else {
      const created = await createDocument<BusinessCardPayload>({
        toolType: "business-card",
        title,
        payload: form,
      });
      setSelectedId(created.id);
      setSearchParams({ doc: created.id }, { replace: true });
    }

    await loadDocuments();
  };

  const onLogo = (file: File | null) => {
    if (!file) {
      setForm((prev) => ({ ...prev, logo: null }));
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({ ...prev, logo: String(reader.result) }));
    };
    reader.readAsDataURL(file);
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "landscape", unit: "in", format: [2, 3.5] });

    if (form.logo) {
      try {
        doc.addImage(form.logo, "PNG", 0.2, 0.45, 0.75, 0.75);
      } catch {
        // export should still work if logo is not parseable
      }
    }

    const x = form.textLayout === "left" ? 1.05 : form.textLayout === "center" ? 1.75 : 3.3;
    const align = form.textLayout;

    doc.setFontSize(16);
    doc.text(form.name || "Your Name", x, 0.55, { align });
    doc.setFontSize(10);
    doc.text(form.title || "Title", x, 0.78, { align });
    doc.text(form.company || "Company", x, 1.0, { align });
    doc.text(form.phone || "Phone", x, 1.2, { align });
    doc.text(form.email || "Email", x, 1.35, { align });

    doc.addPage([2, 3.5], "landscape");
    doc.setFontSize(14);
    doc.text(form.company || "Company", 1.75, 0.55, { align: "center" });
    doc.setFontSize(10);
    doc.text(form.tagline || "Tagline", 1.75, 0.8, { align: "center" });
    doc.text(form.website || "Website", 1.75, 1.0, { align: "center" });
    doc.text(form.address || "Address", 1.75, 1.2, { align: "center" });

    doc.save(`${title || "business-card"}.pdf`);
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
      <h2 className="text-2xl font-bold mb-2">Business Card Studio</h2>
      <p className="text-sm text-muted-foreground mb-6">Archive-inspired themes, front/back design, and offline draft CRUD.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
        <aside className="border rounded-lg p-4 bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Saved Cards</h3>
            <Button size="sm" onClick={() => { setSelectedId(null); setSearchParams({}, { replace: true }); setTitle("Untitled Business Card"); setForm(emptyCard); }}>New</Button>
          </div>

          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {isLoading ? <div className="text-sm text-muted-foreground">Loading cards...</div> : null}
            {!isLoading && documents.length === 0 ? <div className="text-sm text-muted-foreground">No saved cards yet.</div> : null}
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => { setSelectedId(doc.id); setSearchParams({ doc: doc.id }, { replace: true }); setTitle(doc.title); setForm(doc.payload); }}
                className={`w-full text-left border rounded-md p-3 ${selectedId === doc.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
              >
                <div className="font-medium truncate">{doc.title || "Untitled"}</div>
                <div className="text-xs text-muted-foreground mt-1">{new Date(doc.updatedAt).toLocaleString()}</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="border rounded-lg p-5 bg-background/50">
            <Input className="mb-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Card title" />
            <Input className="mb-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
            <Input className="mb-2" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Job title" />
            <Input className="mb-2" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" />
            <Input className="mb-2" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
            <Input className="mb-2" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
            <Input className="mb-2" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} placeholder="Website" />
            <textarea className="w-full rounded-md border px-3 py-2 mb-2" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="Address" rows={2} />
            <Input className="mb-2" value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} placeholder="Tagline" />

            <div className="grid grid-cols-3 gap-2 mb-2">
              <Button variant={form.theme === "default" ? "default" : "outline"} onClick={() => setForm({ ...form, theme: "default" })}>Default</Button>
              <Button variant={form.theme === "bonestock" ? "default" : "outline"} onClick={() => setForm({ ...form, theme: "bonestock" })}>Bonestock</Button>
              <Button variant={form.theme === "eggshell" ? "default" : "outline"} onClick={() => setForm({ ...form, theme: "eggshell" })}>Eggshell</Button>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-2">
              <Button variant={form.textLayout === "left" ? "default" : "outline"} onClick={() => setForm({ ...form, textLayout: "left" })}>Left</Button>
              <Button variant={form.textLayout === "center" ? "default" : "outline"} onClick={() => setForm({ ...form, textLayout: "center" })}>Center</Button>
              <Button variant={form.textLayout === "right" ? "default" : "outline"} onClick={() => setForm({ ...form, textLayout: "right" })}>Right</Button>
            </div>

            <div className="mt-2">
              <label className="text-sm">Logo</label>
              <input className="block mt-1 text-sm" type="file" accept="image/*" onChange={(e) => onLogo(e.target.files?.[0] ?? null)} />
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={save}>Save</Button>
              <Button variant="secondary" onClick={async () => { if (selectedId) { await duplicateDocument(selectedId); await loadDocuments(); } }} disabled={!selectedId}>Duplicate</Button>
              <Button variant="destructive" onClick={async () => { if (selectedId) { await deleteDocument(selectedId); await loadDocuments(); } }} disabled={!selectedId}>Delete</Button>
              <Button variant="outline" onClick={exportPdf}>Download PDF</Button>
            </div>
          </section>

          <section className="border rounded-lg p-5 bg-background/60">
            <div className="flex gap-2 mb-4">
              <Button size="sm" variant={side === "front" ? "default" : "outline"} onClick={() => setSide("front")}>Front</Button>
              <Button size="sm" variant={side === "back" ? "default" : "outline"} onClick={() => setSide("back")}>Back</Button>
            </div>

            <div className={`relative rounded-lg border p-5 min-h-[220px] ${themeClass[form.theme]} ${form.textLayout === "center" ? "text-center" : form.textLayout === "right" ? "text-right" : "text-left"}`}>
              {side === "front" ? (
                <div className="grid grid-cols-[88px_1fr] gap-4 items-center">
                  <div className="w-[88px] h-[88px] rounded-md bg-muted flex items-center justify-center overflow-hidden">
                    {form.logo ? <img src={form.logo} alt="logo" className="w-full h-full object-cover" /> : <span className="text-xs text-muted-foreground">Logo</span>}
                  </div>
                  <div>
                    <div className="text-xl font-bold">{form.name || "Your Name"}</div>
                    <div className="text-sm opacity-80">{form.title || "Title"}</div>
                    <div className="mt-1 font-medium">{form.company || "Company"}</div>
                    <div className="text-sm mt-1">{form.phone || "Phone"}</div>
                    <div className="text-sm">{form.email || "Email"}</div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  {form.logo ? <img src={form.logo} alt="logo" className="max-h-16 mb-3 object-contain" /> : null}
                  <div className="text-lg font-bold">{form.company || "Company"}</div>
                  <div className="text-sm mt-1">{form.tagline || "Tagline"}</div>
                  <div className="text-sm mt-2">{form.website || "Website"}</div>
                  <div className="text-sm mt-1 whitespace-pre-wrap">{form.address || "Address"}</div>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default BusinessCards;
