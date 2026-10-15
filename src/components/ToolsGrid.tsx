import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { CreditCard, FileText, Receipt, FileStack, ArrowRight } from "lucide-react";

const coreTools = [
  {
    id: "pdf-pro",
    name: "PDF Pro Studio",
    tagline: "Core Document Engine",
    description: "Multi-page visual reordering, 90° rotation, cryptographic audit seals, administrative stamps, and memory offload.",
    icon: FileStack,
    accent: "text-emerald-500",
    border: "hover:border-emerald-500/50",
    badge: "⌘P",
  },
  {
    id: "invoice",
    name: "Invoice Studio",
    tagline: "Commercial Billing",
    description: "Automatic tax calculations, discounts, itemized services, company logo embedding, and PDF invoice generation.",
    icon: Receipt,
    accent: "text-blue-500",
    border: "hover:border-blue-500/50",
    badge: "⌘I",
  },
  {
    id: "resume",
    name: "Resume Studio",
    tagline: "Executive CV Design",
    description: "ATS-optimized dynamic sections, executive typography themes, project portfolios, and clean printable output.",
    icon: FileText,
    accent: "text-indigo-500",
    border: "hover:border-indigo-500/50",
    badge: "⌘R",
  },
  {
    id: "business-cards",
    name: "Business Card Studio",
    tagline: "Identity & Print Layout",
    description: "Front & back 3.5\" × 2\" print-ready cards with paper stock themes (Bonestock, Eggshell) and logo placements.",
    icon: CreditCard,
    accent: "text-amber-500",
    border: "hover:border-amber-500/50",
    badge: "⌘B",
  },
];

const ToolsGrid = () => {
  return (
    <section id="tools" className="py-16 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">
              Production Workstations
            </div>
            <h2 className="text-3xl font-black tracking-tight">Commercial Suite Tools</h2>
          </div>
          <p className="text-xs text-muted-foreground max-w-md">
            All tools operate 100% client-side with native desktop and mobile storage adapters, autosave timelines, and deep-state undo/redo history.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-5">
          {coreTools.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <Card
                key={tool.id}
                className={`group border border-border/70 bg-card/60 hover:bg-card/90 transition-all duration-200 hover:shadow-lg ${tool.border}`}
              >
                <CardContent className="p-6 flex flex-col justify-between h-full">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="p-2.5 rounded-xl border bg-background shadow-xs">
                        <IconComponent className={`w-5 h-5 ${tool.accent}`} />
                      </div>
                      <Badge variant="outline" className="font-mono text-[10px] px-2 py-0.5">
                        {tool.badge}
                      </Badge>
                    </div>

                    <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {tool.tagline}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mt-0.5 mb-2 group-hover:text-primary transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-6">
                      {tool.description}
                    </p>
                  </div>

                  <Button asChild size="sm" className="w-full gap-1.5 h-8 text-xs font-medium">
                    <Link to={`/tools/${tool.id}`}>
                      <span>Launch Workstation</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;
