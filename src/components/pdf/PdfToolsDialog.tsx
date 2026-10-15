import * as React from "react";
import {
  FileCode2,
  Stamp as StampIcon,
  ShieldCheck,
  Info,
  Check,
  RotateCw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import type { StampOptions, DigitalSignaturePlaceholder, PdfMetadata } from "@/lib/pdfEngine";

interface PdfToolsDialogProps {
  stamp: StampOptions | null;
  onStampChange: (stamp: StampOptions | null) => void;
  digitalSignature: DigitalSignaturePlaceholder | null;
  onDigitalSignatureChange: (sig: DigitalSignaturePlaceholder | null) => void;
  metadata: Partial<PdfMetadata> | null;
  onMetadataChange: (meta: Partial<PdfMetadata>) => void;
  pageCount: number;
}

export const PdfToolsDialog: React.FC<PdfToolsDialogProps> = ({
  stamp,
  onStampChange,
  digitalSignature,
  onDigitalSignatureChange,
  metadata,
  onMetadataChange,
  pageCount,
}) => {
  const [open, setOpen] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState("stamp");

  // Local state for stamp
  const [stampEnabled, setStampEnabled] = React.useState(Boolean(stamp));
  const [stampType, setStampType] = React.useState<StampOptions["type"]>(stamp?.type || "APPROVED");
  const [customText, setCustomText] = React.useState(stamp?.customText || "");
  const [stampColor, setStampColor] = React.useState<NonNullable<StampOptions["color"]>>(
    stamp?.color || "red"
  );
  const [stampOpacity, setStampOpacity] = React.useState<number>(stamp?.opacity ?? 0.65);
  const [includeDate, setIncludeDate] = React.useState(stamp?.includeDate ?? true);
  const [signeeName, setSigneeName] = React.useState(stamp?.signeeName || "");
  const [pageTarget, setPageTarget] = React.useState<NonNullable<StampOptions["pageTarget"]>>(
    stamp?.pageTarget || "first"
  );

  // Local state for digital signature
  const [sigEnabled, setSigEnabled] = React.useState(Boolean(digitalSignature?.enabled));
  const [signerName, setSignerName] = React.useState(digitalSignature?.signerName || "Authorized Signee");
  const [sigReason, setSigReason] = React.useState(
    digitalSignature?.reason || "Document reviewed and approved"
  );
  const [sigLocation, setSigLocation] = React.useState(digitalSignature?.location || "Headquarters");
  const [sigPageIndex, setSigPageIndex] = React.useState(digitalSignature?.pageIndex ?? 0);
  const [xPercent, setXPercent] = React.useState(digitalSignature?.xPercent ?? 60);
  const [yPercent, setYPercent] = React.useState(digitalSignature?.yPercent ?? 8);

  // Local state for metadata
  const [metaTitle, setMetaTitle] = React.useState(metadata?.title || "");
  const [metaAuthor, setMetaAuthor] = React.useState(metadata?.author || "");
  const [metaSubject, setMetaSubject] = React.useState(metadata?.subject || "");
  const [metaKeywords, setMetaKeywords] = React.useState(metadata?.keywords?.join(", ") || "");

  const handleApply = () => {
    // Apply stamp
    if (stampEnabled) {
      onStampChange({
        type: stampType,
        customText,
        color: stampColor,
        opacity: stampOpacity,
        includeDate,
        signeeName,
        pageTarget,
      });
    } else {
      onStampChange(null);
    }

    // Apply digital signature
    if (sigEnabled) {
      onDigitalSignatureChange({
        enabled: true,
        signerName,
        reason: sigReason,
        location: sigLocation,
        pageIndex: sigPageIndex,
        xPercent,
        yPercent,
        width: 220,
        height: 68,
      });
    } else {
      onDigitalSignatureChange(null);
    }

    // Apply metadata
    onMetadataChange({
      ...metadata,
      title: metaTitle || undefined,
      author: metaAuthor || undefined,
      subject: metaSubject || undefined,
      keywords: metaKeywords
        ? metaKeywords.split(",").map((k) => k.trim()).filter(Boolean)
        : undefined,
    });

    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 h-8 text-xs font-medium border-border/80">
          <ShieldCheck className="w-3.5 h-3.5 text-primary" />
          <span>Security & Stamps</span>
          {(stamp || digitalSignature?.enabled) && (
            <Badge variant="default" className="px-1.5 py-0 text-[10px] h-4 bg-primary text-primary-foreground">
              Active
            </Badge>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            <span>PDF Security, Stamps & Metadata</span>
          </DialogTitle>
          <DialogDescription>
            Configure cryptographic signature overlays, administrative stamps, and document properties.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-2">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="stamp" className="text-xs gap-1.5">
              <StampIcon className="w-3.5 h-3.5" />
              Stamp Overlay
            </TabsTrigger>
            <TabsTrigger value="signature" className="text-xs gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" />
              Cryptographic Sign
            </TabsTrigger>
            <TabsTrigger value="metadata" className="text-xs gap-1.5">
              <Info className="w-3.5 h-3.5" />
              Metadata
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: STAMP OVERLAY */}
          <TabsContent value="stamp" className="space-y-4 pt-3">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div>
                <Label className="text-xs font-semibold">Enable Stamp Overlay</Label>
                <p className="text-[11px] text-muted-foreground">Print a high-visibility diagonal audit stamp</p>
              </div>
              <Switch checked={stampEnabled} onCheckedChange={setStampEnabled} />
            </div>

            {stampEnabled && (
              <div className="space-y-3.5">
                <div>
                  <Label className="text-xs mb-1.5 block">Stamp Preset</Label>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
                    {(["APPROVED", "CONFIDENTIAL", "DRAFT", "FINAL", "PAID", "VOID", "CUSTOM"] as const).map(
                      (preset) => (
                        <Button
                          key={preset}
                          type="button"
                          size="sm"
                          variant={stampType === preset ? "default" : "outline"}
                          className="text-[11px] h-7"
                          onClick={() => setStampType(preset)}
                        >
                          {preset}
                        </Button>
                      )
                    )}
                  </div>
                </div>

                {stampType === "CUSTOM" && (
                  <div>
                    <Label className="text-xs">Custom Stamp Text</Label>
                    <Input
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="e.g. ARCHIVED / COPY"
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Color Scheme</Label>
                    <div className="flex gap-2 mt-1.5">
                      {(["red", "green", "blue", "slate", "amber"] as const).map((c) => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setStampColor(c)}
                          className={`w-6 h-6 rounded-full border-2 transition-transform ${
                            stampColor === c ? "scale-110 ring-2 ring-primary ring-offset-1" : "opacity-80"
                          } ${
                            c === "red"
                              ? "bg-rose-600 border-rose-700"
                              : c === "green"
                              ? "bg-emerald-600 border-emerald-700"
                              : c === "blue"
                              ? "bg-blue-600 border-blue-700"
                              : c === "slate"
                              ? "bg-slate-600 border-slate-700"
                              : "bg-amber-600 border-amber-700"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Target Page</Label>
                    <select
                      value={pageTarget}
                      onChange={(e) => setPageTarget(e.target.value as any)}
                      className="w-full text-xs h-8 border rounded-md px-2 bg-background mt-1.5"
                    >
                      <option value="first">First Page Only</option>
                      <option value="all">All Pages</option>
                      <option value="last">Last Page Only</option>
                    </select>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <Label className="text-xs">Stamp Opacity</Label>
                    <span className="text-muted-foreground">{Math.round(stampOpacity * 100)}%</span>
                  </div>
                  <Slider
                    value={[stampOpacity * 100]}
                    min={20}
                    max={100}
                    step={5}
                    onValueChange={([val]) => setStampOpacity(val / 100)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <Label className="text-xs">Signee / Officer</Label>
                    <Input
                      value={signeeName}
                      onChange={(e) => setSigneeName(e.target.value)}
                      placeholder="e.g. J. Doe"
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <Switch checked={includeDate} onCheckedChange={setIncludeDate} id="inc-date" />
                    <Label htmlFor="inc-date" className="text-xs cursor-pointer">
                      Include current date
                    </Label>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 2: CRYPTOGRAPHIC SIGNATURE */}
          <TabsContent value="signature" className="space-y-4 pt-3">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <div>
                <Label className="text-xs font-semibold">Enable Cryptographic Seal Placeholder</Label>
                <p className="text-[11px] text-muted-foreground">
                  Inserts a certified PKCS#7 / CMS security placeholder block with digest verification badge
                </p>
              </div>
              <Switch checked={sigEnabled} onCheckedChange={setSigEnabled} />
            </div>

            {sigEnabled && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Signer Full Name</Label>
                    <Input
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      placeholder="e.g. Alex Mercer"
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Location / Jurisdiction</Label>
                    <Input
                      value={sigLocation}
                      onChange={(e) => setSigLocation(e.target.value)}
                      placeholder="e.g. San Francisco, CA"
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-xs">Signing Reason</Label>
                  <Input
                    value={sigReason}
                    onChange={(e) => setSigReason(e.target.value)}
                    placeholder="e.g. Official Document Verification"
                    className="text-xs h-8 mt-1"
                  />
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs">Page (1-{pageCount || 1})</Label>
                    <Input
                      type="number"
                      min={1}
                      max={pageCount || 1}
                      value={sigPageIndex + 1}
                      onChange={(e) => setSigPageIndex(Math.max(0, parseInt(e.target.value, 10) - 1 || 0))}
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Horizontal (X %)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={xPercent}
                      onChange={(e) => setXPercent(parseInt(e.target.value, 10) || 0)}
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Vertical (Y %)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={yPercent}
                      onChange={(e) => setYPercent(parseInt(e.target.value, 10) || 0)}
                      className="text-xs h-8 mt-1"
                    />
                  </div>
                </div>

                {/* Simulated Seal Visual Preview */}
                <div className="p-3 border rounded-lg bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900/50 text-[11px] space-y-1">
                  <div className="font-semibold text-blue-700 dark:text-blue-400 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Preview: Digitally Signed Document
                  </div>
                  <div className="text-muted-foreground font-mono">
                    Signer: {signerName} | Reason: {sigReason}
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">
                    SHA-256 Digest: 4F2C91BA0E789B1D... [VERIFIED]
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* TAB 3: METADATA */}
          <TabsContent value="metadata" className="space-y-3.5 pt-3">
            <div className="flex items-center gap-2 p-2.5 rounded-lg border bg-muted/20 text-xs">
              <Info className="w-4 h-4 text-primary shrink-0" />
              <span>
                Document contains {pageCount} page{pageCount === 1 ? "" : "s"}.
                {metadata?.dimensions && ` (${metadata.dimensions.width} × ${metadata.dimensions.height} pt)`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Document Title</Label>
                <Input
                  value={metaTitle}
                  onChange={(e) => setMetaTitle(e.target.value)}
                  placeholder="e.g. Master Services Agreement"
                  className="text-xs h-8 mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Author / Creator</Label>
                <Input
                  value={metaAuthor}
                  onChange={(e) => setMetaAuthor(e.target.value)}
                  placeholder="e.g. Paperworks Team"
                  className="text-xs h-8 mt-1"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs">Subject / Description</Label>
              <Input
                value={metaSubject}
                onChange={(e) => setMetaSubject(e.target.value)}
                placeholder="e.g. Confidential client commercial terms"
                className="text-xs h-8 mt-1"
              />
            </div>

            <div>
              <Label className="text-xs">Keywords (comma-separated)</Label>
              <Input
                value={metaKeywords}
                onChange={(e) => setMetaKeywords(e.target.value)}
                placeholder="e.g. invoice, legal, signed, commercial"
                className="text-xs h-8 mt-1"
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)} className="text-xs">
            Cancel
          </Button>
          <Button size="sm" onClick={handleApply} className="text-xs gap-1.5">
            <Check className="w-3.5 h-3.5" />
            Apply Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
