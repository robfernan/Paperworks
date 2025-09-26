import { Card, CardContent } from "@/components/ui/card";
import { 
  Zap, 
  Brain, 
  Shield, 
  Smartphone, 
  Cloud, 
  Palette,
  CheckCircle,
  Users,
  TrendingUp
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI-Powered Everything",
    description: "From content generation to design suggestions, our AI helps you create better documents faster",
    highlights: ["Smart content suggestions", "Auto-formatting", "Design optimization", "Content improvement"]
  },
  {
    icon: Zap,
    title: "Lightning Fast Processing", 
    description: "Advanced algorithms ensure your documents are processed and ready in seconds, not minutes",
    highlights: ["Instant PDF generation", "Real-time collaboration", "Quick exports", "Fast rendering"]
  },
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level security with end-to-end encryption keeps your sensitive documents protected",
    highlights: ["256-bit encryption", "SOC 2 compliant", "GDPR ready", "Secure storage"]
  },
  {
    icon: Smartphone,
    title: "Cross-Platform Magic",
    description: "Perfect experience across desktop, tablet, and mobile. Edit anywhere, sync everywhere",
    highlights: ["Progressive web app", "Mobile optimized", "Offline editing", "Cloud sync"]
  },
  {
    icon: Cloud,
    title: "Smart Cloud Features",
    description: "Intelligent backup, version control, and team collaboration built right into the platform",
    highlights: ["Auto-backup", "Version history", "Team workspaces", "Smart search"]
  },
  {
    icon: Palette,
    title: "Professional Design System",
    description: "Consistently beautiful results with our design system based on industry best practices",
    highlights: ["Brand consistency", "Professional templates", "Color psychology", "Typography mastery"]
  }
];

const stats = [
  { value: "12+", label: "Professional Tools", icon: CheckCircle },
  { value: "50+", label: "Premium Templates", icon: Palette },
  { value: "10K+", label: "Happy Users", icon: Users },
  { value: "99.9%", label: "Uptime Guarantee", icon: TrendingUp }
];

const FeaturesShowcase = () => {
  return (
    <section className="py-20 px-4 bg-gradient-subtle">
      <div className="max-w-7xl mx-auto">
        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
          {stats.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.label} className="text-center">
                <div className="flex items-center justify-center mb-4">
                  <div className="p-3 bg-primary/10 rounded-full">
                    <IconComponent className="w-6 h-6 text-primary" />
                  </div>
                </div>
                <div className="text-3xl font-bold bg-gradient-hero bg-clip-text text-transparent mb-2">
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Features */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Why DocSuite Beats
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              Every Other Platform
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We've combined cutting-edge AI, enterprise security, and professional design 
            to create the most powerful document creation platform ever built.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <Card 
                key={feature.title}
                className="group relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2 bg-background/80 backdrop-blur"
              >
                <div className="absolute inset-0 bg-gradient-primary opacity-0 group-hover:opacity-5 transition-opacity" />
                
                <CardContent className="p-6">
                  <div className="mb-6">
                    <div className="p-4 bg-gradient-primary rounded-2xl shadow-md group-hover:shadow-glow transition-shadow w-fit">
                      <IconComponent className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {feature.title}
                  </h3>
                  
                  <p className="text-muted-foreground mb-6 leading-relaxed">
                    {feature.description}
                  </p>
                  
                  <div className="space-y-2">
                    {feature.highlights.map((highlight) => (
                      <div key={highlight} className="flex items-center gap-3 text-sm">
                        <div className="w-2 h-2 bg-success rounded-full flex-shrink-0" />
                        <span className="text-muted-foreground">{highlight}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="p-8 bg-background/60 backdrop-blur rounded-3xl border shadow-lg">
            <h3 className="text-2xl font-bold mb-4">
              Experience the difference yourself
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Join the revolution in document creation. Start with our free tier and 
              see why professionals choose DocSuite over expensive alternatives.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>Free forever plan</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-success" />
                <span>30-day money back guarantee</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturesShowcase;