import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X, Crown, Zap } from "lucide-react";

const competitors = [
  {
    name: "DocSuite",
    logo: "DS", 
    price: "Free",
    priceNote: "Forever",
    isPrimary: true,
    features: {
      "Business Cards": true,
      "Resume Builder": true,
      "Invoice Generator": true,
      "Advanced PDF Tools": true,
      "PDF Merge & Split": true,
      "AI Logo Maker": true,
      "QR Code Generator": true,
      "Background Remover": true,
      "Email Signatures": true,
      "Certificate Creator": true,
      "Flyer Designer": true,
      "Digital Business Cards": true,
      "12+ Total Tools": true,
      "AI Writing Assistant": true,
      "Cloud Storage": true,
      "Team Collaboration": true,
      "API Access": true,
      "White Label": true
    }
  },
  {
    name: "Canva Pro",
    logo: "CP",
    price: "$15",
    priceNote: "/month",
    isPrimary: false,
    features: {
      "Business Cards": true,
      "Resume Builder": true,
      "Invoice Generator": false,
      "Advanced PDF Tools": false,
      "PDF Merge & Split": false,
      "AI Logo Maker": true,
      "QR Code Generator": false,
      "Background Remover": true,
      "Email Signatures": true,
      "Certificate Creator": true,
      "Flyer Designer": true,
      "Digital Business Cards": false,
      "12+ Total Tools": false,
      "AI Writing Assistant": false,
      "Cloud Storage": true,
      "Team Collaboration": true,
      "API Access": false,
      "White Label": false
    }
  },
  {
    name: "Adobe Creative",
    logo: "AC",
    price: "$60",
    priceNote: "/month",
    isPrimary: false,
    features: {
      "Business Cards": true,
      "Resume Builder": false,
      "Invoice Generator": false,
      "Advanced PDF Tools": true,
      "PDF Merge & Split": true,
      "AI Logo Maker": false,
      "QR Code Generator": false,
      "Background Remover": true,
      "Email Signatures": false,
      "Certificate Creator": true,
      "Flyer Designer": true,
      "Digital Business Cards": false,
      "12+ Total Tools": false,
      "AI Writing Assistant": false,
      "Cloud Storage": true,
      "Team Collaboration": true,
      "API Access": true,
      "White Label": false
    }
  },
  {
    name: "Others",
    logo: "?",
    price: "$25",
    priceNote: "/month avg",
    isPrimary: false,
    features: {
      "Business Cards": true,
      "Resume Builder": true,
      "Invoice Generator": true,
      "Advanced PDF Tools": false,
      "PDF Merge & Split": false,
      "AI Logo Maker": false,
      "QR Code Generator": true,
      "Background Remover": false,
      "Email Signatures": false,
      "Certificate Creator": false,
      "Flyer Designer": true,
      "Digital Business Cards": false,
      "12+ Total Tools": false,
      "AI Writing Assistant": false,
      "Cloud Storage": true,
      "Team Collaboration": false,
      "API Access": false,
      "White Label": false
    }
  }
];

const ComparisonTable = () => {
  return (
    <section className="py-20 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            See How We
            <span className="block bg-gradient-hero bg-clip-text text-transparent">
              Stack Up Against Everyone
            </span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            We provide more tools, better AI features, and superior value compared to any competitor. 
            Plus, our free plan includes features others charge hundreds for.
          </p>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            {/* Header Row */}
            <div className="grid grid-cols-5 gap-4 mb-8">
              <div className="font-semibold text-muted-foreground">Features</div>
              {competitors.map((competitor) => (
                <Card key={competitor.name} className={`text-center p-4 ${competitor.isPrimary ? 'ring-2 ring-primary shadow-glow' : ''}`}>
                  <CardContent className="p-0">
                    {competitor.isPrimary && (
                      <div className="mb-2">
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent text-accent-foreground text-xs rounded-full">
                          <Crown className="w-3 h-3" />
                          Most Popular
                        </span>
                      </div>
                    )}
                    <div className={`w-12 h-12 rounded-xl mx-auto mb-3 flex items-center justify-center text-white font-bold ${competitor.isPrimary ? 'bg-gradient-primary' : 'bg-muted'}`}>
                      {competitor.logo}
                    </div>
                    <h3 className="font-bold text-lg mb-2">{competitor.name}</h3>
                    <div className="text-2xl font-bold text-primary mb-1">{competitor.price}</div>
                    <div className="text-sm text-muted-foreground mb-4">{competitor.priceNote}</div>
                    {competitor.isPrimary && (
                      <Button className="w-full bg-gradient-primary hover:shadow-glow transition-all">
                        <Zap className="w-4 h-4 mr-2" />
                        Get Started
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Feature Rows */}
            <div className="space-y-2">
              {Object.keys(competitors[0].features).map((feature) => (
                <div key={feature} className="grid grid-cols-5 gap-4 items-center py-3 hover:bg-muted/30 rounded-lg px-2 transition-colors">
                  <div className="font-medium text-foreground">{feature}</div>
                  {competitors.map((competitor) => (
                    <div key={`${competitor.name}-${feature}`} className="text-center">
                      {competitor.features[feature as keyof typeof competitor.features] ? (
                        <Check className={`w-5 h-5 mx-auto ${competitor.isPrimary ? 'text-primary' : 'text-success'}`} />
                      ) : (
                        <X className="w-5 h-5 text-muted-foreground mx-auto" />
                      )}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Bottom CTA */}
            <div className="mt-12 text-center">
              <Card className="p-8 bg-gradient-subtle">
                <CardContent className="p-0">
                  <h3 className="text-2xl font-bold mb-4">
                    Why pay more for less?
                  </h3>
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    DocSuite gives you everything the expensive competitors offer, plus exclusive AI features 
                    they don't have - all starting completely free.
                  </p>
                  <Button size="lg" className="bg-gradient-primary hover:shadow-glow transition-all">
                    Start Building for Free
                    <Zap className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ComparisonTable;