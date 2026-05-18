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
      <div className="relative max-w-7xl mx-auto px-4 pt-8 pb-8">
        <div className="text-center">
          <h4 className="text-sm text-background/70">Paperworks — Professional Documents</h4>
          <div className="mt-4 text-sm text-background/70">© 2026 Paperworks. All rights reserved.</div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;