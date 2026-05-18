import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, FileUser, Receipt, FileEdit } from "lucide-react";

const coreTools = [
  {
    id: "business-cards",
    name: "Smart Business Cards",
    description: "Create both physical and digital business cards with AI-powered design suggestions",
    icon: CreditCard,
    gradient: "bg-gradient-primary",
  },
  {
    id: "resume",
    name: "AI Resume Builder",
    description: "Build ATS-optimized resumes with AI content suggestions and industry insights",
    icon: FileUser,
    gradient: "bg-gradient-accent",
  },
  {
    id: "invoices",
    name: "Invoice & Billing Suite",
    description: "Complete invoicing solution with payment tracking, reminders, and analytics",
    icon: Receipt,
    gradient: "bg-gradient-success",
  },
  {
    id: "pdf-pro",
    name: "PDF Pro Toolkit",
    description: "Advanced PDF editing: merge, split, rearrange, rotate, sign, and export",
    icon: FileEdit,
    gradient: "bg-gradient-primary",
  },
];

const ToolsGrid = () => {
  return (
    <section id="tools" className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h3 className="text-3xl font-bold mb-4">Core Tools</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">Essential document creation tools: business cards, resumes, invoices, and advanced PDF editing.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {coreTools.map((tool) => {
            const IconComponent = tool.icon as React.ComponentType<{ className?: string }>;
            return (
              <Card key={tool.id} className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className={`absolute inset-0 ${tool.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${tool.gradient} shadow-md group-hover:shadow-glow transition-shadow flex-shrink-0`}>
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">{tool.name}</h4>
                      <p className="text-muted-foreground mb-4 leading-relaxed text-sm">{tool.description}</p>
                      <Button asChild variant="outline" size="sm" className="w-full group-hover:border-primary group-hover:text-primary transition-all">
                        <a href={`/tools/${tool.id}`}>Launch Tool</a>
                      </Button>
                    </div>
                  </div>
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
