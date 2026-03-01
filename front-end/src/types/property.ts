export type FraudRisk = "Low" | "Medium" | "High";

export interface Property {
  id: string;
  address: string;
  owner: string;
  salePrice?: number | null;
  confidenceScore: number;
  fraudRisk: FraudRisk;
  timestamp: string;
  accountAddress: string | null;
  explorerUrl: string | null;
  transferCount?: number;
  previousOwner?: string | null;
  analysis?: string | null;
  factors?: string[];
  recommendation?: string | null;
}

export interface RegisterPropertyResult {
  status: "success" | "rejected";
  data?: Property;
  error?: string;
  fraudAnalysis?: {
    riskScore?: number;
    riskLevel?: string;
    confidence?: number;
    recommendation?: string;
    factors?: string[];
    analysis?: string;
  };
}
