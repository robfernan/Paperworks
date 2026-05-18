import * as React from "react";

const BusinessCards = () => {
  const [form, setForm] = React.useState({ name: "", title: "", company: "", phone: "", email: "" });

  const save = () => {
    localStorage.setItem("paperworks:business-card", JSON.stringify(form));
    alert("Saved locally — offline available");
  };

  return (
    <div className="max-w-3xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">Smart Business Cards (offline)</h2>
      <div className="grid gap-4">
        <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Full name" className="input" />
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Title" className="input" />
        <input value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} placeholder="Company" className="input" />
        <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="Phone" className="input" />
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" className="input" />
        <div className="flex gap-2">
          <button onClick={save} className="btn">Save</button>
          <button onClick={() => { const data = JSON.stringify(form); const blob = new Blob([data], { type: "application/json" }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'business-card.json'; a.click(); URL.revokeObjectURL(url); }} className="btn">Export</button>
        </div>
      </div>
      <div className="mt-8 p-6 border rounded">
        <div className="text-lg font-bold">{form.name || "Your Name"}</div>
        <div>{form.title}</div>
        <div>{form.company}</div>
        <div>{form.phone}</div>
        <div>{form.email}</div>
      </div>
    </div>
  );
};

export default BusinessCards;
