import * as React from "react";

type InvoiceItem = { desc: string; qty: number; price: number };
const InvoiceCreator = () => {
  const [items, setItems] = React.useState<InvoiceItem[]>([{ desc: '', qty: 1, price: 0 }]);
  const add = () => setItems([...items, { desc: '', qty: 1, price: 0 }]);
  const update = (i:number, key: keyof InvoiceItem, value: string | number) => { const copy = [...items]; copy[i] = { ...copy[i], [key]: value } as InvoiceItem; setItems(copy); };
  const total = items.reduce((s, it) => s + (it.qty * it.price), 0);
  const save = () => { localStorage.setItem('paperworks:invoice', JSON.stringify(items)); alert('Saved locally'); };
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">Invoice Creator (offline)</h2>
      <div className="space-y-2">
        {items.map((it,i)=> (
          <div key={i} className="flex gap-2">
            <input className="input flex-1" value={it.desc} onChange={(e)=>update(i,'desc',e.target.value)} placeholder="Item description" />
            <input className="input w-20" type="number" value={it.qty} onChange={(e)=>update(i,'qty',Number(e.target.value))} />
            <input className="input w-24" type="number" value={it.price} onChange={(e)=>update(i,'price',Number(e.target.value))} />
          </div>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <button onClick={add} className="btn">Add Item</button>
        <button onClick={save} className="btn">Save</button>
      </div>
      <div className="mt-6 p-6 border rounded">
        <div className="text-sm text-muted-foreground">Total</div>
        <div className="text-xl font-bold">${total.toFixed(2)}</div>
      </div>
    </div>
  );
};

export default InvoiceCreator;
