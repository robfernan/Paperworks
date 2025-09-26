import { Button } from "@/components/ui/button";
import { 
  FileStack, 
  Twitter, 
  Linkedin, 
  Github, 
  Mail, 
  Heart,
  ArrowRight
} from "lucide-react";

const footerSections = [
  {
    title: "Core Tools",
    links: [
      "Business Card Builder",
      "Resume Generator", 
      "Invoice Creator",
      "PDF Pro Toolkit",
      "Logo Maker",
      "QR Code Studio"
    ]
  },
  {
    title: "Creative Suite",
    links: [
      "Background Remover",
      "Flyer Designer", 
      "Certificate Creator",
      "Email Signatures",
      "Letterhead Designer",
      "Presentation Builder"
    ]
  },
  {
    title: "Company",
    links: [
      "About Us",
      "Careers",
      "Press Kit",
      "Blog",
      "Help Center",
      "Contact Support"
    ]
  },
  {
    title: "Legal",
    links: [
      "Privacy Policy",
      "Terms of Service", 
      "Cookie Policy",
      "GDPR Compliance",
      "Security",
      "Data Protection"
    ]
  }
];

const Footer = () => {
  return (
    <footer className="bg-foreground text-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/10" />
      
      <div className="relative max-w-7xl mx-auto px-4 pt-20 pb-8">
        {/* Newsletter Section */}
        <div className="text-center mb-16">
          <h3 className="text-3xl font-bold mb-4">
            Stay ahead of the curve
          </h3>
          <p className="text-background/70 mb-8 max-w-2xl mx-auto">
            Get the latest templates, design tips, and productivity hacks delivered to your inbox. 
            Join 10,000+ professionals building better documents.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <input 
              type="email" 
              placeholder="Enter your email" 
              className="flex-1 px-4 py-3 rounded-lg bg-background/10 border border-background/20 text-background placeholder:text-background/50 focus:outline-none focus:ring-2 focus:ring-background/30"
            />
            <Button className="bg-background text-foreground hover:bg-background/90 transition-all">
              Subscribe
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-background/10 rounded-xl">
                <FileStack className="w-6 h-6 text-background" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-background">DocSuite</h1>
                <p className="text-xs text-background/70 -mt-1">Professional Documents</p>
              </div>
            </div>
            <p className="text-background/70 mb-6 leading-relaxed">
              The all-in-one platform for creating professional documents. 
              From business cards to AI-powered logos, we've got everything 
              you need to build your brand and grow your business.
            </p>
            <div className="flex items-center gap-4">
              <a href="#" className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors">
                <Twitter className="w-5 h-5 text-background" />
              </a>
              <a href="#" className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors">
                <Linkedin className="w-5 h-5 text-background" />
              </a>
              <a href="#" className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors">
                <Github className="w-5 h-5 text-background" />
              </a>
              <a href="#" className="p-2 bg-background/10 rounded-lg hover:bg-background/20 transition-colors">
                <Mail className="w-5 h-5 text-background" />
              </a>
            </div>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="font-semibold text-background mb-4">{section.title}</h4>
              <ul className="space-y-3">
                {section.links.map((link) => (
                  <li key={link}>
                    <a 
                      href="#" 
                      className="text-background/70 hover:text-background transition-colors text-sm"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-background/20 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-6 text-sm text-background/70">
              <span>© 2024 DocSuite. All rights reserved.</span>
              <a href="#" className="hover:text-background transition-colors">Status</a>
              <a href="#" className="hover:text-background transition-colors">API Docs</a>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-background/70">
              <span>Made with</span>
              <Heart className="w-4 h-4 text-red-400 fill-current" />
              <span>for entrepreneurs and creators</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;