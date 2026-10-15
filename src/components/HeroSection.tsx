import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Sparkles, Terminal, ShieldCheck, Cpu, HardDrive } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative py-16 md:py-24 px-4 overflow-hidden border-b border-border/40">
      {/* Background architectural glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-primary/10 via-sky-500/5 to-transparent blur-3xl pointer-events-none" />

      <div className="relative max-w-5xl mx-auto text-center">
        {/* Release badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary text-xs font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Paperworks Enterprise v2.0 Commercial Suite</span>
          <span className="w-1 h-1 rounded-full bg-primary" />
          <span className="text-muted-foreground font-mono text-[10px]">Wails • Capacitor • Web</span>
        </div>

        {/* Primary headline */}
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 bg-gradient-to-b from-foreground via-foreground to-muted-foreground bg-clip-text text-transparent">
          High-Performance Document Engineering.
          <span className="block text-primary bg-gradient-to-r from-indigo-500 via-primary to-sky-500 bg-clip-text text-transparent">
            Zero Cloud Latency.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
          The cross-platform business automation workstation for invoices, executive resumes, branded business cards, and client-side multi-page PDF processing with cryptographic stamps.
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
        </div>

        {/* System Capabilities Pills */}
        <div className="mt-12 pt-8 border-t border-border/50 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
          <div className="p-3 rounded-lg border bg-card/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>100% Offline-First</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Zero telemetry. Data stays on your native hardware.</p>
          </div>

          <div className="p-3 rounded-lg border bg-card/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Cpu className="w-3.5 h-3.5 text-primary" />
              <span>Async PDF Engine</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Chunked Web Worker & native Go binary offload.</p>
          </div>

          <div className="p-3 rounded-lg border bg-card/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <Terminal className="w-3.5 h-3.5 text-sky-500" />
              <span>Universal Command Palette</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Press ⌘K or Ctrl+K for instant navigation & search.</p>
          </div>

          <div className="p-3 rounded-lg border bg-card/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
              <HardDrive className="w-3.5 h-3.5 text-amber-500" />
              <span>Autosave & Timeline</span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">Point-in-time snapshot reversions and undo/redo.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;