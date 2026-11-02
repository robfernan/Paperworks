export type ToolMode =
  | "select"
  | "text"
  | "signature"
  | "initial"
  | "checkmark"
  | "crossmark"
  | "date";

export interface Annotation {
  id: string;
  page: number; // 1-based page number
  type: "text" | "signature" | "initial" | "checkmark" | "crossmark" | "date";
  x: number; // percentage (0 - 100) relative to page width
  y: number; // percentage (0 - 100) relative to page height
  width?: number; // percentage
  height?: number; // percentage
  value: string; // text content or base64 PNG dataUrl
  fontSize?: number; // in points (default: 12)
  fontFamily?: string;
  color?: string; // hex code
  autoShrink?: boolean;
  alignBaseline?: boolean;
}

export interface TransactionParties {
  buyer1Name: string;
  buyer1Email: string;
  buyer1Phone: string;
  buyer2Name: string;
  buyer2Email: string;
  buyer2Phone: string;
  seller1Name: string;
  seller1Email: string;
  seller1Phone: string;
  seller2Name: string;
  seller2Email: string;
  seller2Phone: string;
  propertyAddress: string;
  propertyCity: string;
  propertyState: string;
  propertyZip: string;
  purchasePrice: string;
  earnestMoney: string;
  closingDate: string;
  escrowAgent: string;
  agentName: string;
  agentBrokerage: string;
}

export const DEFAULT_PARTIES: TransactionParties = {
  buyer1Name: "Alex Morgan",
  buyer1Email: "alex.morgan@example.com",
  buyer1Phone: "(555) 234-5678",
  buyer2Name: "",
  buyer2Email: "",
  buyer2Phone: "",
  seller1Name: "Jordan Hayes",
  seller1Email: "jordan.hayes@example.com",
  seller1Phone: "(555) 876-5432",
  seller2Name: "",
  seller2Email: "",
  seller2Phone: "",
  propertyAddress: "742 Evergreen Terrace",
  propertyCity: "Springfield",
  propertyState: "OR",
  propertyZip: "97477",
  purchasePrice: "$485,000",
  earnestMoney: "$15,000",
  closingDate: "11/30/2026",
  escrowAgent: "First American Title & Escrow",
  agentName: "Taylor Brooks",
  agentBrokerage: "Pacific Crest Realty",
};
