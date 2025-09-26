import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  FileUser, 
  Receipt, 
  FileEdit,
  ArrowRight,
  Sparkles
} from "lucide-react";

const tools = [
  {
    id: "business-cards",
    name: "Business Card Builder",
    description: "Create professional business cards with custom designs, layouts, and branding elements",
    icon: CreditCard,
    gradient: "bg-gradient-primary",
    features: ["Custom Templates", "Brand Colors", "QR Codes", "Multiple Formats"]
  },
  {
    id: "resume",
    name: "Resume Generator", 
    description: "Build ATS-friendly resumes with professional templates and smart formatting",
    icon: FileUser,
    gradient: "bg-gradient-accent",
    features: ["ATS Optimized", "Smart Templates", "Skills Section", "Export PDF/Word"]
  },
  {
    id: "invoices",
    name: "Invoice Generator",
    description: "Generate professional invoices with automatic calculations and custom branding",
    icon: Receipt,
    gradient: "bg-gradient-success", 
    features: ["Auto Calculations", "Custom Branding", "Payment Tracking", "Tax Management"]
  },
  {
    id: "pdf-editor",
    name: "PDF Editor",
    description: "Edit, annotate, and modify PDF documents with powerful editing tools",
    icon: FileEdit,
    gradient: "bg-gradient-primary",
    features: ["Text Editing", "Annotations", "Form Filling", "Digital Signatures"]
  }
];

const ToolsGrid = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Powerful Tools
            </span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Everything You Need to
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              Create Professional Documents
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose from our suite of specialized tools, each designed for specific document types with industry-standard features.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {tools.map((tool, index) => {
            const IconComponent = tool.icon;
            return (
              <Card 
                key={tool.id} 
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`absolute inset-0 ${tool.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
                
                <CardContent className="p-8">
                  <div className="flex items-start gap-6">
                    <div className={`p-4 rounded-2xl ${tool.gradient} shadow-md group-hover:shadow-glow transition-shadow`}>
                      <IconComponent className="w-8 h-8 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">
                        {tool.name}
                      </h3>
                      <p className="text-muted-foreground mb-6 leading-relaxed">
                        {tool.description}
                      </p>
                      
                      <div className="grid grid-cols-2 gap-3 mb-6">
                        {tool.features.map((feature) => (
                          <div key={feature} className="flex items-center gap-2 text-sm">
                            <div className="w-1.5 h-1.5 bg-success rounded-full" />
                            <span className="text-muted-foreground">{feature}</span>
                          </div>
                        ))}
                      </div>
                      
                      <Button 
                        variant="outline" 
                        className="group-hover:border-primary group-hover:text-primary group-hover:shadow-sm transition-all"
                      >
                        Start Building
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
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