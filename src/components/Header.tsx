import { Button } from "@/components/ui/button";
import { FileStack, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/vault", label: "Vault" },
  { to: "/tools/business-cards", label: "Cards" },
  { to: "/tools/pdf-pro", label: "PDF" },
  { to: "/tools/resume", label: "Resume" },
  { to: "/tools/invoice", label: "Invoices" },
];

const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 wails-drag-region">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3 wails-no-drag">
          <div className="p-2 bg-gradient-primary rounded-xl shadow-md">
            <FileStack className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold bg-gradient-hero bg-clip-text text-transparent">
              Paperworks
            </h1>
            <p className="text-xs text-muted-foreground -mt-1">Professional Documents</p>
          </div>
        </div>

        {/* Navigation - Desktop */}
        <nav className="hidden md:flex items-center gap-6 wails-no-drag">
          {navItems.map((item) => (
            <Link key={item.to} to={item.to} className="text-sm font-medium hover:text-primary transition-colors">
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-4 wails-no-drag">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="md:hidden" aria-label="Open navigation menu">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pt-[max(1.5rem,env(safe-area-inset-top))]">
              <div className="flex flex-col gap-2 mt-6">
                {navItems.map((item) => (
                  <SheetClose key={item.to} asChild>
                    <Link to={item.to} className="rounded-md border px-4 py-3 text-sm font-medium hover:bg-muted transition-colors">
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
          <Button asChild className="bg-gradient-primary hover:shadow-glow transition-all">
            <Link to="/">Get Started</Link>
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;