import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Users, Stamp, Home, FileText } from "lucide-react";
import { TransactionParties } from "./types";

interface TransactionPartiesDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parties: TransactionParties;
  onUpdateParties: (parties: TransactionParties) => void;
  onSelectFieldToStamp: (fieldName: string, value: string) => void;
  isMobile?: boolean;
}

export const TransactionPartiesDrawer: React.FC<TransactionPartiesDrawerProps> = ({
  open,
  onOpenChange,
  parties,
  onUpdateParties,
  onSelectFieldToStamp,
  isMobile = false,
}) => {
  const handleChange = (field: keyof TransactionParties, value: string) => {
    onUpdateParties({
      ...parties,
      [field]: value,
    });
  };

  const stampButton = (label: string, value: string) => {
    if (!value) return null;
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-7 text-xs px-2 gap-1 text-primary hover:text-primary-foreground hover:bg-primary"
        onClick={() => {
          onSelectFieldToStamp(label, value);
          if (isMobile) onOpenChange(false);
        }}
        title={`Click to stamp "${value}" on document`}
      >
        <Stamp className="w-3 h-3" />
        Stamp
      </Button>
    );
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className={
          isMobile
            ? "max-h-[85vh] rounded-t-xl overflow-y-auto px-4 py-6"
            : "sm:max-w-[420px] overflow-y-auto p-6"
        }
      >
        <SheetHeader className="mb-4 text-left">
          <SheetTitle className="flex items-center gap-2 text-lg">
            <Users className="w-5 h-5 text-primary" />
            Transaction Parties & Auto-Fill
          </SheetTitle>
          <SheetDescription className="text-xs">
            Enter parties once. Click <span className="font-semibold text-primary">Stamp</span> to place any value directly onto the contract.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 text-sm">
          {/* Buyer 1 & 2 */}
          <div className="space-y-3 p-3 bg-muted/40 rounded-lg border">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Buyer Parties
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="buyer1Name" className="text-xs">Buyer 1 Full Name</Label>
                {stampButton("Buyer 1 Name", parties.buyer1Name)}
              </div>
              <Input
                id="buyer1Name"
                value={parties.buyer1Name}
                onChange={(e) => handleChange("buyer1Name", e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="buyer1Email" className="text-xs">Buyer 1 Email</Label>
                {stampButton("Buyer 1 Email", parties.buyer1Email)}
              </div>
              <Input
                id="buyer1Email"
                value={parties.buyer1Email}
                onChange={(e) => handleChange("buyer1Email", e.target.value)}
                placeholder="alex@example.com"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="buyer2Name" className="text-xs">Buyer 2 Full Name</Label>
                {stampButton("Buyer 2 Name", parties.buyer2Name)}
              </div>
              <Input
                id="buyer2Name"
                value={parties.buyer2Name}
                onChange={(e) => handleChange("buyer2Name", e.target.value)}
                placeholder="Optional second buyer"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Seller 1 & 2 */}
          <div className="space-y-3 p-3 bg-muted/40 rounded-lg border">
            <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
              Seller Parties
            </span>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="seller1Name" className="text-xs">Seller 1 Full Name</Label>
                {stampButton("Seller 1 Name", parties.seller1Name)}
              </div>
              <Input
                id="seller1Name"
                value={parties.seller1Name}
                onChange={(e) => handleChange("seller1Name", e.target.value)}
                placeholder="e.g. Jordan Hayes"
                className="h-8 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="seller2Name" className="text-xs">Seller 2 Full Name</Label>
                {stampButton("Seller 2 Name", parties.seller2Name)}
              </div>
              <Input
                id="seller2Name"
                value={parties.seller2Name}
                onChange={(e) => handleChange("seller2Name", e.target.value)}
                placeholder="Optional second seller"
                className="h-8 text-xs"
              />
            </div>
          </div>

          {/* Property Info */}
          <div className="space-y-3 p-3 bg-muted/40 rounded-lg border">
            <div className="flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Property Address
              </span>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="propAddress" className="text-xs">Street Address</Label>
                {stampButton("Address", parties.propertyAddress)}
              </div>
              <Input
                id="propAddress"
                value={parties.propertyAddress}
                onChange={(e) => handleChange("propertyAddress", e.target.value)}
                placeholder="742 Evergreen Terrace"
                className="h-8 text-xs"
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <Label htmlFor="propCity" className="text-xs">City</Label>
                <Input
                  id="propCity"
                  value={parties.propertyCity}
                  onChange={(e) => handleChange("propertyCity", e.target.value)}
                  placeholder="Springfield"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="propState" className="text-xs">State</Label>
                <Input
                  id="propState"
                  value={parties.propertyState}
                  onChange={(e) => handleChange("propertyState", e.target.value)}
                  placeholder="OR"
                  className="h-8 text-xs"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="propZip" className="text-xs">ZIP</Label>
                <Input
                  id="propZip"
                  value={parties.propertyZip}
                  onChange={(e) => handleChange("propertyZip", e.target.value)}
                  placeholder="97477"
                  className="h-8 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Terms & Escrow */}
          <div className="space-y-3 p-3 bg-muted/40 rounded-lg border">
            <div className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-primary" />
              <span className="font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                Terms & Closing
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="purchasePrice" className="text-xs">Purchase Price</Label>
                  {stampButton("Price", parties.purchasePrice)}
                </div>
                <Input
                  id="purchasePrice"
                  value={parties.purchasePrice}
                  onChange={(e) => handleChange("purchasePrice", e.target.value)}
                  placeholder="$485,000"
                  className="h-8 text-xs"
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label htmlFor="closingDate" className="text-xs">Closing Date</Label>
                  {stampButton("Closing", parties.closingDate)}
                </div>
                <Input
                  id="closingDate"
                  value={parties.closingDate}
                  onChange={(e) => handleChange("closingDate", e.target.value)}
                  placeholder="11/30/2026"
                  className="h-8 text-xs"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="agentName" className="text-xs">Agent / Broker</Label>
                {stampButton("Agent", parties.agentName)}
              </div>
              <Input
                id="agentName"
                value={parties.agentName}
                onChange={(e) => handleChange("agentName", e.target.value)}
                placeholder="Taylor Brooks"
                className="h-8 text-xs"
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
