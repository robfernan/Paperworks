import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  CreditCard, 
  FileUser, 
  Receipt, 
  FileEdit,
  ArrowRight,
  Sparkles,
  Merge,
  QrCode,
  Palette,
  FileText,
  Award,
  Megaphone,
  Mail,
  Presentation,
  FileCheck,
  ScanLine,
  ImageIcon,
  Smartphone,
  BarChart3
} from "lucide-react";

const coreTools = [
  {
    id: "business-cards",
    name: "Smart Business Cards",
    description: "Create both physical and digital business cards with AI-powered design suggestions",
    icon: CreditCard,
    gradient: "bg-gradient-primary",
    features: ["AI Templates", "QR Integration", "Digital Cards", "NFC Support"],
    badge: "Popular"
  },
  {
    id: "resume",
    name: "AI Resume Builder", 
    description: "Build ATS-optimized resumes with AI content suggestions and industry insights",
    icon: FileUser,
    gradient: "bg-gradient-accent",
    features: ["AI Writing", "ATS Score", "Industry Templates", "Skills Match"],
    badge: "AI Powered"
  },
  {
    id: "invoices",
    name: "Invoice & Billing Suite",
    description: "Complete invoicing solution with payment tracking, reminders, and analytics",
    icon: Receipt,
    gradient: "bg-gradient-success", 
    features: ["Payment Tracking", "Auto Reminders", "Analytics", "Multi-Currency"],
    badge: "Pro"
  },
  {
    id: "pdf-pro",
    name: "PDF Pro Toolkit",
    description: "Advanced PDF editing: merge, split, rearrange, OCR, watermarks, and digital signatures",
    icon: FileEdit,
    gradient: "bg-gradient-primary",
    features: ["Merge & Split", "OCR Extract", "Watermarks", "E-Signatures"],
    badge: "Advanced"
  }
];

const creativeTools = [
  {
    id: "logo-maker",
    name: "AI Logo Maker",
    description: "Generate professional logos with AI, customize colors, fonts, and export in multiple formats",
    icon: Palette,
    gradient: "bg-gradient-accent",
    features: ["AI Generation", "Vector Export", "Brand Kit", "Variations"]
  },
  {
    id: "qr-generator", 
    name: "QR Code Studio",
    description: "Create custom QR codes for URLs, WiFi, contacts, payments with branded designs",
    icon: QrCode,
    gradient: "bg-gradient-success",
    features: ["Custom Design", "Analytics", "Bulk Generate", "Dynamic QR"]
  },
  {
    id: "letterhead",
    name: "Letterhead Designer",
    description: "Design professional letterheads with brand consistency and legal compliance",
    icon: FileText,
    gradient: "bg-gradient-primary",
    features: ["Brand Templates", "Legal Formats", "Multi-Language", "Compliance"]
  },
  {
    id: "certificates",
    name: "Certificate Creator",
    description: "Generate professional certificates, awards, and completion documents",
    icon: Award,
    gradient: "bg-gradient-accent",
    features: ["Bulk Generation", "Digital Verify", "Templates", "Branding"]
  }
];

const digitalTools = [
  {
    id: "flyer-maker",
    name: "Marketing Flyer Studio", 
    description: "Create eye-catching flyers, posters, and promotional materials with AI assistance",
    icon: Megaphone,
    gradient: "bg-gradient-success",
    features: ["AI Design", "Print Ready", "Social Sizes", "Brand Colors"]
  },
  {
    id: "email-signature",
    name: "Email Signature Pro",
    description: "Design professional email signatures with social links, banners, and tracking",
    icon: Mail,
    gradient: "bg-gradient-primary", 
    features: ["HTML Export", "Social Links", "Analytics", "Team Management"]
  },
  {
    id: "presentation",
    name: "Pitch Deck Builder",
    description: "Create compelling presentations and pitch decks with professional templates",
    icon: Presentation,
    gradient: "bg-gradient-accent",
    features: ["Pitch Templates", "Data Charts", "Animations", "Investor Ready"]
  },
  {
    id: "background-remover",
    name: "AI Background Remover",
    description: "Remove backgrounds from images instantly using advanced AI processing",
    icon: ImageIcon,
    gradient: "bg-gradient-success",
    features: ["AI Powered", "Bulk Process", "High Quality", "Instant Preview"]
  }
];

const ToolsGrid = () => {
  const renderToolSection = (title: string, subtitle: string, tools: Array<{
    id: string;
    name: string; 
    description: string;
    icon: any;
    gradient: string;
    features: string[];
    badge?: string;
  }>, cols = "md:grid-cols-2") => (
    <div className="mb-20">
      <div className="text-center mb-12">
        <h3 className="text-3xl font-bold mb-4">{title}</h3>
        <p className="text-muted-foreground max-w-2xl mx-auto">{subtitle}</p>
      </div>
      
      <div className={`grid ${cols} gap-6`}>
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          return (
            <Card 
              key={tool.id} 
              className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2"
            >
              <div className={`absolute inset-0 ${tool.gradient} opacity-5 group-hover:opacity-10 transition-opacity`} />
              
              {tool.badge && (
                <div className="absolute top-4 right-4 z-10">
                  <span className="px-3 py-1 bg-accent text-accent-foreground text-xs font-medium rounded-full">
                    {tool.badge}
                  </span>
                </div>
              )}
              
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-xl ${tool.gradient} shadow-md group-hover:shadow-glow transition-shadow flex-shrink-0`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                      {tool.name}
                    </h4>
                    <p className="text-muted-foreground mb-4 leading-relaxed text-sm">
                      {tool.description}
                    </p>
                    
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {tool.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-xs">
                          <div className="w-1 h-1 bg-success rounded-full flex-shrink-0" />
                          <span className="text-muted-foreground truncate">{feature}</span>
                        </div>
                      ))}
                    </div>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="w-full group-hover:border-primary group-hover:text-primary transition-all"
                    >
                      Launch Tool
                      <ArrowRight className="w-3 h-3 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Main Header */}
        <div className="text-center mb-20">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-accent" />
            <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
              Complete Document Suite
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-bold mb-6">
            12+ Professional Tools
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              All in One Platform
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            From business cards to AI-powered logos, advanced PDF editing to digital marketing materials - 
            everything you need to create professional documents and grow your business.
          </p>
        </div>

        {/* Core Business Tools */}
        {renderToolSection(
          "Core Business Tools", 
          "Essential document creation tools with AI-powered features and professional templates",
          coreTools
        )}

        {/* Creative Design Tools */}
        {renderToolSection(
          "Creative & Design Studio", 
          "AI-powered creative tools for branding, marketing, and professional document design",
          creativeTools
        )}

        {/* Digital Marketing Tools */}
        {renderToolSection(
          "Digital Marketing Suite", 
          "Modern tools for presentations, marketing materials, and digital business presence",
          digitalTools
        )}

        {/* Call to Action */}
        <div className="text-center mt-16 p-8 bg-gradient-subtle rounded-3xl border">
          <h3 className="text-2xl font-bold mb-4">Ready to Transform Your Documents?</h3>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            Join thousands of professionals using DocSuite to create stunning documents in minutes, not hours.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all">
              Start Creating Free
              <Sparkles className="w-4 h-4 ml-2" />
            </Button>
            <Button variant="outline" size="lg">
              View All Templates
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ToolsGrid;