import * as React from "react";

const ResumeBuilder = () => {
  const [data, setData] = React.useState({ name: "", summary: "" });
  const save = () => { localStorage.setItem('paperworks:resume', JSON.stringify(data)); alert('Saved locally'); };
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h2 className="text-2xl font-bold mb-4">AI Resume Builder (offline)</h2>
      <input className="input mb-2" value={data.name} onChange={(e)=>setData({...data, name: e.target.value})} placeholder="Full name" />
      <textarea className="input mb-2" value={data.summary} onChange={(e)=>setData({...data, summary: e.target.value})} placeholder="Professional summary" />
      <div className="flex gap-2"><button onClick={save} className="btn">Save</button></div>
      <div className="mt-6 p-6 border rounded">
        <h3 className="text-xl font-bold">{data.name || 'Your Name'}</h3>
        <p className="text-muted-foreground">{data.summary || 'Summary goes here'}</p>
      </div>
    </div>
  );
};

export default ResumeBuilder;
