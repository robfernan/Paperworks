import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Terminal, ShieldCheck, Cpu, HardDrive, Lock, CheckCircle2, Zap } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative py-14 md:py-20 px-4 overflow-hidden border-b border-border/40">
      {/* Background architectural glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        
        {/* Verified Local Privacy Stamp */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-semibold mb-6 shadow-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span>100% Client-Side Privacy Guarantee</span>
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">0 Remote Telemetry</span>
        </div>

        {/* Primary headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
          High-Performance Document Engineering.
          <span className="block text-primary bg-gradient-to-r from-indigo-500 via-primary to-sky-500 bg-clip-text text-transparent">
            Zero Cloud Latency.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          The privacy-first open-source alternative to Adobe Acrobat and Canva. Create executive resumes, itemized invoices, branded business cards, and manipulate multi-page PDFs directly in your browser.
        </p>

        {/* Call to action */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button asChild size="lg" className="h-11 px-6 font-semibold text-xs shadow-md gap-2">
            <Link to="/tools/pdf-pro">
              Launch PDF Studio
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>

          <Button asChild variant="outline" size="lg" className="h-11 px-6 font-semibold text-xs border-border/80 gap-2">
            <Link to="/vault">
              <HardDrive className="w-4 h-4 text-muted-foreground" />
              Open Document Vault
            </Link>
          </Button>

          <Button asChild variant="ghost" size="lg" className="h-11 px-4 font-semibold text-xs gap-2">
            <a href="https://github.com/robfernan/Paperworks" target="_blank" rel="noopener noreferrer">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Star on GitHub
            </a>
          </Button>
        </div>

        {/* System Capabilities Pills */}
        <div className="mt-12 pt-8 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="p-3.5 rounded-lg border bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              <span>Zero-Cloud Storage</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Files never upload to third-party servers. All processing in WebAssembly.</p>
          </div>

          <div className="p-3.5 rounded-lg border bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>Async PDF Engine</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Vector manipulation, stamps, and signatures via pdf-lib & jsPDF.</p>
          </div>

          <div className="p-3.5 rounded-lg border bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Terminal className="w-3.5 h-3.5 text-sky-500" />
              <span>Command Palette (⌘K)</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Keyboard-driven workflow to switch tools and recall draft records.</p>
          </div>

          <div className="p-3.5 rounded-lg border bg-card/60 backdrop-blur-sm">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
              <span>Encrypted Vault</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Local IndexedDB document history with point-in-time reversions.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
