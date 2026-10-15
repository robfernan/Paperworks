import * as React from "react";
import { Button } from "@/components/ui/button";
import { FileStack, Menu, Search, Command as CmdIcon, Sparkles } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { detectRuntime } from "@/lib/platformBridge";

interface HeaderProps {
  onOpenCommandPalette?: () => void;
}

const navItems = [
  { to: "/", label: "Home" },
  { to: "/vault", label: "Vault" },
  { to: "/tools/pdf-pro", label: "PDF Pro", badge: "Engine" },
  { to: "/tools/invoice", label: "Invoice Studio" },
  { to: "/tools/resume", label: "Resume Studio" },
  { to: "/tools/business-cards", label: "Business Cards" },
];

const Header: React.FC<HeaderProps> = ({ onOpenCommandPalette }) => {
  const location = useLocation();
  const runtime = React.useMemo(() => detectRuntime(), []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/70 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80 wails-drag-region">
      <div className="max-w-7xl mx-auto px-4 h-15 flex items-center justify-between gap-3">
        {/* Logo & Brand */}
        <Link to="/" className="flex items-center gap-2.5 wails-no-drag group">
          <div className="p-2 bg-gradient-to-tr from-indigo-600 via-primary to-sky-500 rounded-xl shadow-sm group-hover:shadow-md transition-shadow">
            <FileStack className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-base font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-muted-foreground bg-clip-text text-transparent">
                Paperworks
              </span>
              <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded border border-primary/20 bg-primary/10 text-primary">
                PRO
              </span>
            </div>
            <span className="text-[10px] text-muted-foreground -mt-0.5 font-medium">Business Automation Suite</span>
          </div>
        </Link>

        {/* Navigation - Desktop */}
        <nav className="hidden lg:flex items-center gap-1 wails-no-drag">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  isActive
                    ? "text-primary bg-primary/10 font-semibold"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {item.label}
                  {item.badge && (
                    <span className="text-[9px] px-1 py-0 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border border-emerald-500/20">
                      {item.badge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </nav>

        {/* Actions & Command Palette Trigger */}
        <div className="flex items-center gap-2.5 wails-no-drag">
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenCommandPalette}
            className="hidden sm:flex items-center gap-3 h-8 px-2.5 text-xs text-muted-foreground border-border/80 hover:border-border hover:bg-accent/80 transition-colors shadow-none"
            title="Open Command Palette (Cmd+K)"
          >
            <div className="flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              <span>Search & commands...</span>
            </div>
            <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
              <span className="text-xs">⌘</span>K
            </kbd>
          </Button>

          {/* Quick Command Icon for Mobile */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onOpenCommandPalette}
            className="sm:hidden h-8 w-8 text-muted-foreground hover:text-foreground"
            aria-label="Search and command palette"
          >
            <Search className="w-4 h-4" />
          </Button>

          {/* Runtime Indicator */}
          {runtime !== "web" && (
            <Badge variant="outline" className="hidden md:inline-flex text-[10px] h-6 uppercase font-semibold text-primary border-primary/30">
              {runtime === "wails" ? "Desktop (Wails)" : "Mobile (Capacitor)"}
            </Badge>
          )}

          {/* Mobile Menu */}
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden h-8 w-8" aria-label="Open navigation menu">
                <Menu className="h-4 w-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="pt-[max(1.5rem,env(safe-area-inset-top))] w-[280px]">
              <div className="flex items-center gap-2 mb-6">
                <FileStack className="w-5 h-5 text-primary" />
                <span className="font-bold text-base">Paperworks Pro</span>
              </div>
              <div className="flex flex-col gap-1.5">
                {navItems.map((item) => (
                  <SheetClose key={item.to} asChild>
                    <Link
                      to={item.to}
                      className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        location.pathname === item.to
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      }`}
                    >
                      {item.label}
                    </Link>
                  </SheetClose>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;