import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  FileText,
  CreditCard,
  FileStack,
  Receipt,
  Plus,
  Moon,
  Sun,
  Laptop,
  FolderOpen,
  ArrowRight,
  Download,
} from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { listDocuments, createDocument, type DocumentRecord } from "@/lib/documentStore";
import { toast } from "sonner";

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const [documents, setDocuments] = React.useState<DocumentRecord[]>([]);

  React.useEffect(() => {
    if (open) {
      void listDocuments().then((docs) => setDocuments(docs));
    }
  }, [open]);

  // Global keyboard shortcut (Cmd+K / Ctrl+K)
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open, onOpenChange]);

  const runCommand = React.useCallback(
    (command: () => void) => {
      onOpenChange(false);
      command();
    },
    [onOpenChange]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search documents (e.g., 'invoice', 'resume', 'pdf')..." />
      <CommandList className="max-h-[380px]">
        <CommandEmpty>No matching tools, actions, or documents found.</CommandEmpty>

        {/* Quick Document Navigation */}
        {documents.length > 0 && (
          <CommandGroup heading="Recent Documents">
            {documents.slice(0, 5).map((doc) => {
              const route =
                doc.toolType === "invoice"
                  ? `/tools/invoice?doc=${doc.id}`
                  : doc.toolType === "resume"
                  ? `/tools/resume?doc=${doc.id}`
                  : doc.toolType === "business-card"
                  ? `/tools/business-cards?doc=${doc.id}`
                  : `/tools/pdf-pro?doc=${doc.id}`;

              return (
                <CommandItem
                  key={doc.id}
                  value={`doc ${doc.title} ${doc.toolType}`}
                  onSelect={() => runCommand(() => navigate(route))}
                  className="flex items-center justify-between py-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-medium text-xs truncate">{doc.title}</span>
                    <span className="text-[10px] text-muted-foreground uppercase border px-1 rounded bg-muted/30">
                      {doc.toolType}
                    </span>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground opacity-60" />
                </CommandItem>
              );
            })}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Navigation Tools */}
        <CommandGroup heading="Studio Tools">
          <CommandItem
            value="PDF Pro Studio Multi-page split merge rotate sign"
            onSelect={() => runCommand(() => navigate("/tools/pdf-pro"))}
          >
            <FileStack className="mr-2 h-4 w-4 text-emerald-500" />
            <span>PDF Pro Studio</span>
            <CommandShortcut>⌘P</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="Invoice Studio Billing payment tax line items"
            onSelect={() => runCommand(() => navigate("/tools/invoice"))}
          >
            <Receipt className="mr-2 h-4 w-4 text-blue-500" />
            <span>Invoice Studio</span>
            <CommandShortcut>⌘I</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="Resume Builder Studio CV career experience"
            onSelect={() => runCommand(() => navigate("/tools/resume"))}
          >
            <FileText className="mr-2 h-4 w-4 text-indigo-500" />
            <span>Resume Studio</span>
            <CommandShortcut>⌘R</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="Business Card Studio Print front back branding"
            onSelect={() => runCommand(() => navigate("/tools/business-cards"))}
          >
            <CreditCard className="mr-2 h-4 w-4 text-amber-500" />
            <span>Business Card Studio</span>
            <CommandShortcut>⌘B</CommandShortcut>
          </CommandItem>
          <CommandItem
            value="Document Vault Offline library storage records"
            onSelect={() => runCommand(() => navigate("/vault"))}
          >
            <FolderOpen className="mr-2 h-4 w-4 text-slate-500" />
            <span>Document Vault</span>
            <CommandShortcut>⌘V</CommandShortcut>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Instant Document Creation */}
        <CommandGroup heading="Create New Document">
          <CommandItem
            value="Create New Invoice Billing"
            onSelect={() =>
              runCommand(async () => {
                const doc = await createDocument({
                  toolType: "invoice",
                  title: `Invoice #${Math.floor(1000 + Math.random() * 9000)}`,
                  payload: {
                    companyName: "Acme Corp",
                    companyPhone: "+1 (555) 000-0000",
                    invoiceDate: new Date().toISOString().slice(0, 10),
                    clientName: "Client Partner",
                    clientAddress: "123 Business Way, Suite 100",
                    paymentTerms: "Net 30. Direct bank transfer.",
                    notes: "Thank you for your business.",
                    taxRate: 8.5,
                    discount: 0,
                    logo: null,
                    items: [
                      {
                        id: `${Date.now()}-1`,
                        desc: "Professional Services & Systems Consulting",
                        qty: 1,
                        price: 1500,
                      },
                    ],
                  },
                });
                toast.success("New invoice created");
                navigate(`/tools/invoice?doc=${doc.id}`);
              })
            }
          >
            <Plus className="mr-2 h-4 w-4 text-blue-500" />
            <span>New Invoice Document</span>
          </CommandItem>
          <CommandItem
            value="Create New Resume CV"
            onSelect={() =>
              runCommand(async () => {
                const doc = await createDocument({
                  toolType: "resume",
                  title: "Executive Professional Resume",
                  payload: {
                    fullName: "Alex Mercer",
                    email: "alex.mercer@example.com",
                    phone: "+1 (555) 234-5678",
                    location: "San Francisco, CA",
                    summary: "Principal Systems Engineer specializing in high-throughput cloud architectures and desktop tooling.",
                    skills: "TypeScript, Go, React, Rust, Distributed Systems, CI/CD, Vitest",
                    theme: "modern",
                    experience: [
                      {
                        id: `${Date.now()}-exp`,
                        role: "Principal Architect",
                        company: "NextGen Software",
                        duration: "2022 - Present",
                        highlights: "Architected enterprise document automation suite serving 500k+ active operations.",
                      },
                    ],
                    education: [
                      {
                        id: `${Date.now()}-edu`,
                        school: "University of California, Berkeley",
                        degree: "B.S. Computer Science",
                        graduation: "2020",
                      },
                    ],
                    projects: [
                      {
                        id: `${Date.now()}-proj`,
                        name: "Paperworks Commercial Suite",
                        details: "Cross-platform offline-first document engine for business and engineering workflows.",
                      },
                    ],
                  },
                });
                toast.success("New resume created");
                navigate(`/tools/resume?doc=${doc.id}`);
              })
            }
          >
            <Plus className="mr-2 h-4 w-4 text-indigo-500" />
            <span>New Resume Document</span>
          </CommandItem>
          <CommandItem
            value="Create New Business Card"
            onSelect={() =>
              runCommand(async () => {
                const doc = await createDocument({
                  toolType: "business-card",
                  title: "Founder & Architect Card",
                  payload: {
                    name: "Alex Mercer",
                    title: "Founder & CTO",
                    company: "Apex Systems Labs",
                    phone: "+1 (555) 987-6543",
                    email: "alex@apexlabs.dev",
                    website: "https://apexlabs.dev",
                    address: "Financial District, Suite 400",
                    tagline: "Engineering Precision & Autonomous Automation",
                    logo: null,
                    theme: "default",
                    textLayout: "left",
                  },
                });
                toast.success("New business card created");
                navigate(`/tools/business-cards?doc=${doc.id}`);
              })
            }
          >
            <Plus className="mr-2 h-4 w-4 text-amber-500" />
            <span>New Business Card</span>
          </CommandItem>
          <CommandItem
            value="Create New PDF Project"
            onSelect={() => runCommand(() => navigate("/tools/pdf-pro"))}
          >
            <Plus className="mr-2 h-4 w-4 text-emerald-500" />
            <span>New PDF Project</span>
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Global Operations */}
        <CommandGroup heading="System & Data Actions">
          <CommandItem
            value="Export Vault Backup Download JSON"
            onSelect={() =>
              runCommand(async () => {
                const all = await listDocuments();
                const json = JSON.stringify(all, null, 2);
                const blob = new Blob([json], { type: "application/json" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `paperworks-vault-backup-${new Date().toISOString().slice(0, 10)}.json`;
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Vault exported successfully");
              })
            }
          >
            <Download className="mr-2 h-4 w-4 text-muted-foreground" />
            <span>Export Complete Vault Backup (.json)</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
