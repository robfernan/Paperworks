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

type Experience = {
  id: string;
  role: string;
  company: string;
  duration: string;
  highlights: string;
};

type Education = {
  id: string;
  school: string;
  degree: string;
  graduation: string;
};

type Project = {
  id: string;
  name: string;
  details: string;
};

type ResumeTheme = "modern" | "classic" | "professionalBlue";

type ResumePayload = {
  fullName: string;
  email: string;
  phone: string;
  location: string;
  summary: string;
  skills: string;
  theme: ResumeTheme;
  experience: Experience[];
  education: Education[];
  projects: Project[];
};

const makeId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const emptyResume = (): ResumePayload => ({
  fullName: "",
  email: "",
  phone: "",
  location: "",
  summary: "",
  skills: "",
  theme: "modern",
  experience: [{ id: makeId(), role: "", company: "", duration: "", highlights: "" }],
  education: [{ id: makeId(), school: "", degree: "", graduation: "" }],
  projects: [{ id: makeId(), name: "", details: "" }],
});

const themeStyles: Record<ResumeTheme, { title: string; accent: string; section: string }> = {
  modern: { title: "text-slate-900", accent: "text-sky-700", section: "border-sky-500" },
  classic: { title: "text-neutral-900", accent: "text-neutral-700", section: "border-neutral-500" },
  professionalBlue: { title: "text-blue-950", accent: "text-blue-700", section: "border-blue-700" },
};

const ResumeBuilder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = React.useState<DocumentRecord<ResumePayload>[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("Untitled Resume");
  const [data, setData] = React.useState<ResumePayload>(emptyResume);

  const loadDocuments = React.useCallback(async () => {
    const docs = await listDocuments<ResumePayload>("resume");
    setDocuments(docs);

    const requestedId = searchParams.get("doc");

    if (docs.length > 0) {
      const selected = docs.find((d) => d.id === requestedId) ?? docs.find((d) => d.id === selectedId) ?? docs[0];
      setSelectedId(selected.id);
      setTitle(selected.title);
      setData(selected.payload);
    } else {
      setSelectedId(null);
      setTitle("Untitled Resume");
      setData(emptyResume());
    }
  }, [searchParams, selectedId]);

  React.useEffect(() => {
    void loadDocuments();
  }, [loadDocuments]);

  const updateExperience = (id: string, key: keyof Experience, value: string) => {
    setData((prev) => ({
      ...prev,
      experience: prev.experience.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const updateEducation = (id: string, key: keyof Education, value: string) => {
    setData((prev) => ({
      ...prev,
      education: prev.education.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const updateProject = (id: string, key: keyof Project, value: string) => {
    setData((prev) => ({
      ...prev,
      projects: prev.projects.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const save = async () => {
    if (selectedId) {
      await updateDocument<ResumePayload>(selectedId, { title, payload: data });
    } else {
      const created = await createDocument<ResumePayload>({
        toolType: "resume",
        title,
        payload: data,
      });
      setSelectedId(created.id);
      setSearchParams({ doc: created.id }, { replace: true });
    }

    await loadDocuments();
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });
    let y = 16;

    doc.setFontSize(20);
    doc.text(data.fullName || "Your Name", 14, y);
    y += 8;

    doc.setFontSize(10);
    doc.text([data.email || "", data.phone || "", data.location || ""].filter(Boolean).join(" | ") || "Contact details", 14, y);
    y += 8;

    doc.setFontSize(12);
    doc.text("Summary", 14, y);
    y += 5;
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(data.summary || "-", 180), 14, y);
    y += 10;

    doc.setFontSize(12);
    doc.text("Experience", 14, y);
    y += 5;
    doc.setFontSize(10);
    data.experience.forEach((exp) => {
      doc.text(`${exp.role || "Role"} - ${exp.company || "Company"}`, 14, y);
      y += 4;
      doc.text(exp.duration || "Duration", 14, y);
      y += 4;
      const lines = doc.splitTextToSize(exp.highlights || "", 180);
      doc.text(lines, 14, y);
      y += Math.max(lines.length * 4, 6);
    });

    y += 2;
    doc.setFontSize(12);
    doc.text("Education", 14, y);
    y += 5;
    doc.setFontSize(10);
    data.education.forEach((ed) => {
      doc.text(`${ed.degree || "Degree"} - ${ed.school || "School"}`, 14, y);
      y += 4;
      doc.text(ed.graduation || "Graduation", 14, y);
      y += 6;
    });

    doc.setFontSize(12);
    doc.text("Projects", 14, y);
    y += 5;
    doc.setFontSize(10);
    data.projects.forEach((project) => {
      doc.text(project.name || "Project", 14, y);
      y += 4;
      const lines = doc.splitTextToSize(project.details || "", 180);
      doc.text(lines, 14, y);
      y += Math.max(lines.length * 4, 6);
    });

    doc.setFontSize(12);
    doc.text("Skills", 14, Math.min(y + 2, 280));
    doc.setFontSize(10);
    doc.text(doc.splitTextToSize(data.skills || "-", 180), 14, Math.min(y + 8, 286));

    doc.save(`${title || "resume"}.pdf`);
  };

  const theme = themeStyles[data.theme];

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6">
      <h2 className="text-2xl font-bold mb-2">Resume Builder</h2>
      <p className="text-sm text-muted-foreground mb-6">Archive-inspired dynamic sections, themes, offline drafts, and PDF export.</p>

      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr] gap-6">
        <aside className="border rounded-lg p-4 bg-background/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Saved Resumes</h3>
            <Button size="sm" onClick={() => { setSelectedId(null); setSearchParams({}, { replace: true }); setTitle("Untitled Resume"); setData(emptyResume()); }}>New</Button>
          </div>
          <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
            {documents.length === 0 ? <div className="text-sm text-muted-foreground">No resumes yet.</div> : null}
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

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <section className="border rounded-lg p-5 bg-background/50">
            <Input className="mb-2" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resume title" />
            <Input className="mb-2" value={data.fullName} onChange={(e) => setData({ ...data, fullName: e.target.value })} placeholder="Full name" />
            <Input className="mb-2" value={data.email} onChange={(e) => setData({ ...data, email: e.target.value })} placeholder="Email" />
            <Input className="mb-2" value={data.phone} onChange={(e) => setData({ ...data, phone: e.target.value })} placeholder="Phone" />
            <Input className="mb-2" value={data.location} onChange={(e) => setData({ ...data, location: e.target.value })} placeholder="Location" />

            <div className="grid grid-cols-3 gap-2 mb-2">
              <Button variant={data.theme === "modern" ? "default" : "outline"} onClick={() => setData({ ...data, theme: "modern" })}>Modern</Button>
              <Button variant={data.theme === "classic" ? "default" : "outline"} onClick={() => setData({ ...data, theme: "classic" })}>Classic</Button>
              <Button variant={data.theme === "professionalBlue" ? "default" : "outline"} onClick={() => setData({ ...data, theme: "professionalBlue" })}>Blue</Button>
            </div>

            <textarea className="w-full rounded-md border px-3 py-2 mb-3" value={data.summary} onChange={(e) => setData({ ...data, summary: e.target.value })} placeholder="Professional summary" rows={4} />

            <div className="space-y-2 mb-3">
              <div className="font-medium">Experience</div>
              {data.experience.map((exp) => (
                <div key={exp.id} className="border rounded-md p-3 space-y-2">
                  <Input value={exp.role} onChange={(e) => updateExperience(exp.id, "role", e.target.value)} placeholder="Role" />
                  <Input value={exp.company} onChange={(e) => updateExperience(exp.id, "company", e.target.value)} placeholder="Company" />
                  <Input value={exp.duration} onChange={(e) => updateExperience(exp.id, "duration", e.target.value)} placeholder="Duration" />
                  <textarea className="w-full rounded-md border px-3 py-2" value={exp.highlights} onChange={(e) => updateExperience(exp.id, "highlights", e.target.value)} placeholder="Achievements" rows={3} />
                  <Button variant="destructive" size="sm" onClick={() => setData((prev) => ({ ...prev, experience: prev.experience.length > 1 ? prev.experience.filter((x) => x.id !== exp.id) : prev.experience }))}>Remove</Button>
                </div>
              ))}
              <Button size="sm" variant="secondary" onClick={() => setData((prev) => ({ ...prev, experience: [...prev.experience, { id: makeId(), role: "", company: "", duration: "", highlights: "" }] }))}>Add Experience</Button>
            </div>

            <div className="space-y-2 mb-3">
              <div className="font-medium">Education</div>
              {data.education.map((ed) => (
                <div key={ed.id} className="border rounded-md p-3 space-y-2">
                  <Input value={ed.degree} onChange={(e) => updateEducation(ed.id, "degree", e.target.value)} placeholder="Degree" />
                  <Input value={ed.school} onChange={(e) => updateEducation(ed.id, "school", e.target.value)} placeholder="School" />
                  <Input value={ed.graduation} onChange={(e) => updateEducation(ed.id, "graduation", e.target.value)} placeholder="Graduation date" />
                  <Button variant="destructive" size="sm" onClick={() => setData((prev) => ({ ...prev, education: prev.education.length > 1 ? prev.education.filter((x) => x.id !== ed.id) : prev.education }))}>Remove</Button>
                </div>
              ))}
              <Button size="sm" variant="secondary" onClick={() => setData((prev) => ({ ...prev, education: [...prev.education, { id: makeId(), school: "", degree: "", graduation: "" }] }))}>Add Education</Button>
            </div>

            <div className="space-y-2 mb-3">
              <div className="font-medium">Projects</div>
              {data.projects.map((project) => (
                <div key={project.id} className="border rounded-md p-3 space-y-2">
                  <Input value={project.name} onChange={(e) => updateProject(project.id, "name", e.target.value)} placeholder="Project" />
                  <textarea className="w-full rounded-md border px-3 py-2" value={project.details} onChange={(e) => updateProject(project.id, "details", e.target.value)} placeholder="Project details" rows={3} />
                  <Button variant="destructive" size="sm" onClick={() => setData((prev) => ({ ...prev, projects: prev.projects.length > 1 ? prev.projects.filter((x) => x.id !== project.id) : prev.projects }))}>Remove</Button>
                </div>
              ))}
              <Button size="sm" variant="secondary" onClick={() => setData((prev) => ({ ...prev, projects: [...prev.projects, { id: makeId(), name: "", details: "" }] }))}>Add Project</Button>
            </div>

            <textarea className="w-full rounded-md border px-3 py-2" value={data.skills} onChange={(e) => setData({ ...data, skills: e.target.value })} placeholder="Skills (comma separated)" rows={3} />

            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={save}>Save</Button>
              <Button variant="secondary" onClick={async () => { if (selectedId) { await duplicateDocument(selectedId); await loadDocuments(); } }} disabled={!selectedId}>Duplicate</Button>
              <Button variant="destructive" onClick={async () => { if (selectedId) { await deleteDocument(selectedId); await loadDocuments(); } }} disabled={!selectedId}>Delete</Button>
              <Button variant="outline" onClick={exportPdf}>Download PDF</Button>
            </div>
          </section>

          <section className="border rounded-lg p-6 bg-background/60">
            <h3 className={`text-2xl font-bold ${theme.title}`}>{data.fullName || "Your Name"}</h3>
            <div className="text-sm text-muted-foreground mt-1">
              {[data.email, data.phone, data.location].filter(Boolean).join(" | ") || "email | phone | location"}
            </div>

            <div className={`mt-5 border-l-4 pl-3 ${theme.section}`}>
              <div className={`font-semibold ${theme.accent}`}>Summary</div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{data.summary || "Your professional summary"}</p>
            </div>

            <div className={`mt-5 border-l-4 pl-3 ${theme.section}`}>
              <div className={`font-semibold ${theme.accent}`}>Experience</div>
              <div className="space-y-3 mt-2">
                {data.experience.map((exp) => (
                  <div key={exp.id}>
                    <div className="font-medium">{exp.role || "Role"}</div>
                    <div className="text-sm text-muted-foreground">{exp.company || "Company"} • {exp.duration || "Duration"}</div>
                    <p className="text-sm mt-1 whitespace-pre-wrap">{exp.highlights || "Achievements"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`mt-5 border-l-4 pl-3 ${theme.section}`}>
              <div className={`font-semibold ${theme.accent}`}>Education</div>
              <div className="space-y-2 mt-2">
                {data.education.map((ed) => (
                  <div key={ed.id} className="text-sm">
                    <div className="font-medium">{ed.degree || "Degree"}</div>
                    <div className="text-muted-foreground">{ed.school || "School"} • {ed.graduation || "Graduation"}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className={`mt-5 border-l-4 pl-3 ${theme.section}`}>
              <div className={`font-semibold ${theme.accent}`}>Projects</div>
              <div className="space-y-2 mt-2">
                {data.projects.map((project) => (
                  <div key={project.id} className="text-sm">
                    <div className="font-medium">{project.name || "Project"}</div>
                    <p className="text-muted-foreground whitespace-pre-wrap">{project.details || "Description"}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`mt-5 border-l-4 pl-3 ${theme.section}`}>
              <div className={`font-semibold ${theme.accent}`}>Skills</div>
              <p className="text-sm mt-1 whitespace-pre-wrap">{data.skills || "Skills list"}</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
