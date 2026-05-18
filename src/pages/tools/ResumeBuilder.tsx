import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ResumeBuilder = () => {
  const [data, setData] = React.useState({ name: "", summary: "" });
  const save = () => { localStorage.setItem('paperworks:resume', JSON.stringify(data)); alert('Saved locally'); };
  return (
    <div className="max-w-5xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">Resume Builder (offline)</h2>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <Input className="mb-2" value={data.name} onChange={(e)=>setData({...data, name: e.target.value})} placeholder="Full name" />
          <textarea className="w-full rounded-md border px-3 py-2 mb-2" value={data.summary} onChange={(e)=>setData({...data, summary: e.target.value})} placeholder="Professional summary" />
          <div className="flex gap-2"><Button onClick={save}>Save</Button></div>
        </div>

        <div className="mt-2 p-6 border rounded bg-background/60">
          <h3 className="text-xl font-bold">{data.name || 'Your Name'}</h3>
          <p className="text-muted-foreground">{data.summary || 'Summary goes here'}</p>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
