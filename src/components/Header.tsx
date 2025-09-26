import { Button } from "@/components/ui/button";
import { FileStack, Menu } from "lucide-react";

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-primary rounded-xl shadow-md">
            <FileStack className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              DocSuite
            </h1>
            <p className="text-xs text-muted-foreground -mt-1">Professional Documents</p>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#tools" className="text-sm font-medium hover:text-primary transition-colors">
            Tools
          </a>
          <a href="#templates" className="text-sm font-medium hover:text-primary transition-colors">
            Templates
          </a>
          <a href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
            Pricing
          </a>
          <a href="#help" className="text-sm font-medium hover:text-primary transition-colors">
            Help
          </a>
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" className="hidden sm:flex">
            Sign In
          </Button>
          <Button className="bg-gradient-primary hover:shadow-glow transition-all">
            Get Started
          </Button>
          
          {/* Mobile menu button */}
          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;