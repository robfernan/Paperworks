import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const BusinessCards = () => {
  const [form, setForm] = React.useState({ name: "", title: "", company: "", phone: "", email: "" });

  const [logoDataUrl, setLogoDataUrl] = React.useState<string | null>(null);
  const save = () => {
    localStorage.setItem("paperworks:business-card", JSON.stringify({ ...form, logo: logoDataUrl }));
    alert("Saved locally — offline available");
  };

  const onLogo = (f: File | null) => {
    if (!f) return setLogoDataUrl(null);
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result));
    reader.readAsDataURL(f);
  };

  return (
    <div className="max-w-5xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">Smart Business Cards (offline)</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" />
          <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" />
          <Input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" />
          <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" />
          <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" />
          <div className="mt-3">
            <label className="text-sm">Logo</label>
            <input type="file" accept="image/*" onChange={(e)=>onLogo(e.target.files?.[0] ?? null)} />
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={save}>Save</Button>
            <Button onClick={() => { const data = JSON.stringify(form); const blob = new Blob([data], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'business-card.json'; a.click(); URL.revokeObjectURL(url); }}>Export</Button>
          </div>
        </div>

        <div className="p-6 border rounded bg-background/60 flex items-center gap-4">
          <div className="w-20 h-20 bg-muted rounded flex items-center justify-center overflow-hidden">
            {logoDataUrl ? <img src={logoDataUrl} alt="logo" className="w-full h-full object-cover" /> : <div className="text-sm text-muted-foreground">Logo</div>}
          </div>
          <div>
            <div className="text-lg font-bold">{form.name || "Your Name"}</div>
            <div className="text-sm text-muted-foreground">{form.title}</div>
            <div className="mt-2">{form.company}</div>
            <div className="mt-1">{form.phone}</div>
            <div className="mt-1">{form.email}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCards;
