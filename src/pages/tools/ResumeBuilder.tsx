import * as React from "react";
import { jsPDF } from "jspdf";
import { useSearchParams } from "react-router-dom";
import {
  FileText,
  Plus,
  Trash2,
  Copy,
  Download,
  Save,
  Undo2,
  Redo2,
  Briefcase,
  GraduationCap,
  FolderGit2,
  Sparkles,
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

export type Experience = {
  id: string;
  role: string;
  company: string;
  duration: string;
  highlights: string;
};

export type Education = {
  id: string;
  school: string;
  degree: string;
  graduation: string;
};

export type Project = {
  id: string;
  name: string;
  details: string;
};

export type ResumeTheme = "modern" | "classic" | "professionalBlue";

export type ResumePayload = {
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
  modern: { title: "text-slate-900 dark:text-slate-100", accent: "text-sky-700 dark:text-sky-400", section: "border-sky-500" },
  classic: { title: "text-neutral-900 dark:text-neutral-100", accent: "text-neutral-700 dark:text-neutral-300", section: "border-neutral-500" },
  professionalBlue: { title: "text-blue-950 dark:text-blue-100", accent: "text-blue-700 dark:text-blue-400", section: "border-blue-700" },
};

const ResumeBuilder = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [documents, setDocuments] = React.useState<DocumentRecord<ResumePayload>[]>([]);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [title, setTitle] = React.useState("Untitled Resume");
  const [isLoading, setIsLoading] = React.useState(true);

  // Undo/Redo & Snapshot Timeline state management
  const {
    state: resumeData,
    setState: setResumeData,
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
  } = useDocumentHistory<ResumePayload>({
    documentId: selectedId,
    initialState: emptyResume(),
    onAutosave: async (state) => {
      if (selectedId) {
        await updateDocument<ResumePayload>(selectedId, {
          title,
          payload: state,
        });
      }
    },
  });

  const loadDocuments = React.useCallback(async () => {
    setIsLoading(true);
    const docs = await listDocuments<ResumePayload>("resume");
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

  const updateExperience = (id: string, key: keyof Experience, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      experience: prev.experience.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const updateEducation = (id: string, key: keyof Education, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      education: prev.education.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const updateProject = (id: string, key: keyof Project, value: string) => {
    setResumeData((prev) => ({
      ...prev,
      projects: prev.projects.map((item) => (item.id === id ? { ...item, [key]: value } : item)),
    }));
  };

  const handleSave = async () => {
    if (selectedId) {
      await updateDocument<ResumePayload>(selectedId, { title, payload: resumeData });
      toast.success("Resume saved successfully");
    } else {
      const created = await createDocument<ResumePayload>({
        toolType: "resume",
        title: title || "New Resume",
        payload: resumeData,
      });
      setSelectedId(created.id);
      setSearchParams({ doc: created.id }, { replace: true });
      toast.success("New resume created");
    }
    await loadDocuments();
  };

  const handleNew = () => {
    setSelectedId(null);
    setSearchParams({}, { replace: true });
    setTitle("Untitled Resume");
    resetState(emptyResume());
  };

  const exportPdf = () => {
    const doc = new jsPDF({ orientation: "p", unit: "mm", format: "a4" });

    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(resumeData.fullName || "Your Name", 15, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    const contact = [resumeData.email, resumeData.phone, resumeData.location].filter(Boolean).join("  •  ");
    doc.text(contact || "Contact Details", 15, 27);

    let y = 36;

    if (resumeData.summary) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Professional Summary", 15, y);
      doc.line(15, y + 1.5, 195, y + 1.5);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      const summaryLines = doc.splitTextToSize(resumeData.summary, 180);
      doc.text(summaryLines, 15, y);
      y += summaryLines.length * 4.5 + 4;
    }

    if (resumeData.experience.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Experience", 15, y);
      doc.line(15, y + 1.5, 195, y + 1.5);
      y += 6;

      resumeData.experience.forEach((exp) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(exp.role || "Role", 15, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const meta = [exp.company, exp.duration].filter(Boolean).join("  •  ");
        if (meta) doc.text(meta, 15, y + 4.5);

        const lines = doc.splitTextToSize(exp.highlights || "-", 180);
        doc.text(lines, 15, y + 9.5);
        y += 11 + lines.length * 4;
      });
      y += 2;
    }

    if (resumeData.education.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Education", 15, y);
      doc.line(15, y + 1.5, 195, y + 1.5);
      y += 6;

      resumeData.education.forEach((ed) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(ed.degree || "Degree", 15, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const meta = [ed.school, ed.graduation].filter(Boolean).join("  •  ");
        if (meta) doc.text(meta, 15, y + 4.5);
        y += 9.5;
      });
      y += 2;
    }

    if (resumeData.projects.length > 0) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Key Projects", 15, y);
      doc.line(15, y + 1.5, 195, y + 1.5);
      y += 6;

      resumeData.projects.forEach((proj) => {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9.5);
        doc.text(proj.name || "Project", 15, y);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8.5);
        const lines = doc.splitTextToSize(proj.details || "-", 180);
        doc.text(lines, 15, y + 4.5);
        y += 6 + lines.length * 4;
      });
      y += 2;
    }

    if (resumeData.skills) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Skills & Technologies", 15, y);
      doc.line(15, y + 1.5, 195, y + 1.5);
      y += 6;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.text(doc.splitTextToSize(resumeData.skills, 180), 15, y);
    }

    doc.save(`${title || "resume"}.pdf`);
    toast.success("Resume PDF downloaded");
  };

  const theme = themeStyles[resumeData.theme];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-border/60">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight">Resume Studio</h1>
            <Badge variant="outline" className="text-xs bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20 font-semibold">
              Commercial
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Craft executive CVs with dynamic sections, themes, live formatting, and clean PDF typography.
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
            Save Resume
          </Button>

          <Button size="sm" variant="outline" onClick={exportPdf} className="gap-1.5 h-8 text-xs font-semibold">
            <Download className="w-3.5 h-3.5" />
            Export PDF
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        {/* Left Sidebar */}
        <aside className="border rounded-xl p-4 bg-card/60 backdrop-blur-sm flex flex-col h-[750px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5 font-semibold text-xs">
              <FileText className="w-4 h-4 text-indigo-500" />
              <span>Saved Resumes</span>
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
              placeholder="Resume title"
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
                No resumes found. Create your first resume!
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
                    <span>{doc.payload.fullName || "Draft"}</span>
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
                  toast.success("Resume duplicated");
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
                  toast.info("Resume deleted");
                }}
              >
                <Trash2 className="w-3 h-3 mr-1" />
                Delete
              </Button>
            </div>
          )}
        </aside>

        {/* Workspace: Form + Live Resume Paper Preview */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_1fr] gap-6">
          {/* Form */}
          <section className="border rounded-xl p-5 bg-card/60 space-y-4 max-h-[750px] overflow-y-auto pr-2">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Full Name</label>
                  <Input
                    value={resumeData.fullName}
                    onChange={(e) => setResumeData((p) => ({ ...p, fullName: e.target.value }))}
                    placeholder="e.g. Alex Mercer"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Email</label>
                  <Input
                    value={resumeData.email}
                    onChange={(e) => setResumeData((p) => ({ ...p, email: e.target.value }))}
                    placeholder="alex.mercer@example.com"
                    className="text-xs h-8"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium mb-1 block">Phone</label>
                  <Input
                    value={resumeData.phone}
                    onChange={(e) => setResumeData((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+1 (555) 019-2834"
                    className="text-xs h-8"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Location</label>
                  <Input
                    value={resumeData.location}
                    onChange={(e) => setResumeData((p) => ({ ...p, location: e.target.value }))}
                    placeholder="San Francisco, CA"
                    className="text-xs h-8"
                  />
                </div>
              </div>
            </div>

            {/* Theme Selector */}
            <div>
              <label className="text-xs font-medium mb-1.5 block">Visual Styling Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {(["modern", "classic", "professionalBlue"] as const).map((t) => (
                  <Button
                    key={t}
                    type="button"
                    size="sm"
                    variant={resumeData.theme === t ? "default" : "outline"}
                    className="text-xs h-7 capitalize"
                    onClick={() => setResumeData((p) => ({ ...p, theme: t }))}
                  >
                    {t === "professionalBlue" ? "Executive Blue" : t}
                  </Button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div>
              <label className="text-xs font-medium mb-1 block">Professional Summary</label>
              <textarea
                value={resumeData.summary}
                onChange={(e) => setResumeData((p) => ({ ...p, summary: e.target.value }))}
                placeholder="High-impact engineering leader with deep experience in distributed systems and cross-platform apps."
                className="w-full text-xs rounded-md border px-3 py-2 bg-background min-h-[64px]"
                rows={3}
              />
            </div>

            {/* Experience */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-primary" />
                  Work Experience
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setResumeData((p) => ({
                      ...p,
                      experience: [...p.experience, { id: makeId(), role: "", company: "", duration: "", highlights: "" }],
                    }))
                  }
                  className="h-6 text-[11px] gap-1 px-2"
                >
                  <Plus className="w-3 h-3" />
                  Add Experience
                </Button>
              </div>

              {resumeData.experience.map((exp) => (
                <div key={exp.id} className="border rounded-lg p-3 bg-muted/20 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={exp.role}
                      onChange={(e) => updateExperience(exp.id, "role", e.target.value)}
                      placeholder="Title / Role"
                      className="text-xs h-7"
                    />
                    <Input
                      value={exp.company}
                      onChange={(e) => updateExperience(exp.id, "company", e.target.value)}
                      placeholder="Company"
                      className="text-xs h-7"
                    />
                  </div>
                  <Input
                    value={exp.duration}
                    onChange={(e) => updateExperience(exp.id, "duration", e.target.value)}
                    placeholder="Duration (e.g. 2021 - Present)"
                    className="text-xs h-7"
                  />
                  <textarea
                    value={exp.highlights}
                    onChange={(e) => updateExperience(exp.id, "highlights", e.target.value)}
                    placeholder="Key highlights and quantifiable achievements..."
                    className="w-full text-xs rounded-md border px-2.5 py-1.5 bg-background min-h-[50px]"
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setResumeData((p) => ({
                          ...p,
                          experience: p.experience.length > 1 ? p.experience.filter((x) => x.id !== exp.id) : p.experience,
                        }))
                      }
                      className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                    >
                      Remove Role
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Education */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-primary" />
                  Education
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setResumeData((p) => ({
                      ...p,
                      education: [...p.education, { id: makeId(), school: "", degree: "", graduation: "" }],
                    }))
                  }
                  className="h-6 text-[11px] gap-1 px-2"
                >
                  <Plus className="w-3 h-3" />
                  Add Education
                </Button>
              </div>

              {resumeData.education.map((ed) => (
                <div key={ed.id} className="border rounded-lg p-2.5 bg-muted/20 space-y-2 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={ed.degree}
                      onChange={(e) => updateEducation(ed.id, "degree", e.target.value)}
                      placeholder="Degree / Major"
                      className="text-xs h-7"
                    />
                    <Input
                      value={ed.school}
                      onChange={(e) => updateEducation(ed.id, "school", e.target.value)}
                      placeholder="University / Institute"
                      className="text-xs h-7"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <Input
                      value={ed.graduation}
                      onChange={(e) => updateEducation(ed.id, "graduation", e.target.value)}
                      placeholder="Graduation Year"
                      className="text-xs h-7 max-w-[150px]"
                    />
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setResumeData((p) => ({
                          ...p,
                          education: p.education.length > 1 ? p.education.filter((x) => x.id !== ed.id) : p.education,
                        }))
                      }
                      className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Projects */}
            <div className="pt-2 border-t space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold flex items-center gap-1.5">
                  <FolderGit2 className="w-3.5 h-3.5 text-primary" />
                  Featured Projects
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setResumeData((p) => ({
                      ...p,
                      projects: [...p.projects, { id: makeId(), name: "", details: "" }],
                    }))
                  }
                  className="h-6 text-[11px] gap-1 px-2"
                >
                  <Plus className="w-3 h-3" />
                  Add Project
                </Button>
              </div>

              {resumeData.projects.map((proj) => (
                <div key={proj.id} className="border rounded-lg p-2.5 bg-muted/20 space-y-1.5 text-xs">
                  <Input
                    value={proj.name}
                    onChange={(e) => updateProject(proj.id, "name", e.target.value)}
                    placeholder="Project Name"
                    className="text-xs h-7"
                  />
                  <textarea
                    value={proj.details}
                    onChange={(e) => updateProject(proj.id, "details", e.target.value)}
                    placeholder="Project architecture and outcomes..."
                    className="w-full text-xs rounded-md border px-2.5 py-1.5 bg-background min-h-[44px]"
                    rows={2}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() =>
                        setResumeData((p) => ({
                          ...p,
                          projects: p.projects.length > 1 ? p.projects.filter((x) => x.id !== proj.id) : p.projects,
                        }))
                      }
                      className="h-6 text-[10px] text-destructive hover:bg-destructive/10"
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Skills */}
            <div className="pt-2 border-t">
              <label className="text-xs font-medium mb-1 block">Skills & Tooling</label>
              <textarea
                value={resumeData.skills}
                onChange={(e) => setResumeData((p) => ({ ...p, skills: e.target.value }))}
                placeholder="TypeScript, React, Go, Docker, PostgreSQL, Vitest, CI/CD"
                className="w-full text-xs rounded-md border px-3 py-2 bg-background min-h-[50px]"
                rows={2}
              />
            </div>
          </section>

          {/* Live Rendered Resume Sheet */}
          <section className="border rounded-xl p-8 bg-card/90 shadow-sm max-h-[750px] overflow-y-auto">
            <h2 className={`text-2xl font-black tracking-tight ${theme.title}`}>{resumeData.fullName || "Your Full Name"}</h2>
            <div className="text-xs text-muted-foreground mt-1 flex flex-wrap gap-2">
              {[resumeData.email, resumeData.phone, resumeData.location].filter(Boolean).join("  •  ") || "Contact information"}
            </div>

            {resumeData.summary && (
              <div className={`mt-5 border-l-2 pl-3 ${theme.section}`}>
                <div className={`font-bold text-xs uppercase tracking-wider ${theme.accent}`}>Summary</div>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{resumeData.summary}</p>
              </div>
            )}

            {resumeData.experience.length > 0 && (
              <div className={`mt-5 border-l-2 pl-3 ${theme.section}`}>
                <div className={`font-bold text-xs uppercase tracking-wider ${theme.accent}`}>Experience</div>
                <div className="space-y-3 mt-2">
                  {resumeData.experience.map((exp) => (
                    <div key={exp.id} className="text-xs">
                      <div className="font-semibold text-foreground">{exp.role || "Role"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {[exp.company, exp.duration].filter(Boolean).join("  •  ")}
                      </div>
                      <p className="text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{exp.highlights}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resumeData.education.length > 0 && (
              <div className={`mt-5 border-l-2 pl-3 ${theme.section}`}>
                <div className={`font-bold text-xs uppercase tracking-wider ${theme.accent}`}>Education</div>
                <div className="space-y-2 mt-2">
                  {resumeData.education.map((ed) => (
                    <div key={ed.id} className="text-xs">
                      <div className="font-semibold text-foreground">{ed.degree || "Degree"}</div>
                      <div className="text-[11px] text-muted-foreground">
                        {[ed.school, ed.graduation].filter(Boolean).join("  •  ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resumeData.projects.length > 0 && (
              <div className={`mt-5 border-l-2 pl-3 ${theme.section}`}>
                <div className={`font-bold text-xs uppercase tracking-wider ${theme.accent}`}>Projects</div>
                <div className="space-y-2 mt-2">
                  {resumeData.projects.map((proj) => (
                    <div key={proj.id} className="text-xs">
                      <div className="font-semibold text-foreground">{proj.name || "Project"}</div>
                      <p className="text-[11px] text-muted-foreground mt-0.5 whitespace-pre-wrap leading-relaxed">{proj.details}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {resumeData.skills && (
              <div className={`mt-5 border-l-2 pl-3 ${theme.section}`}>
                <div className={`font-bold text-xs uppercase tracking-wider ${theme.accent}`}>Skills & Competencies</div>
                <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap leading-relaxed">{resumeData.skills}</p>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default ResumeBuilder;
