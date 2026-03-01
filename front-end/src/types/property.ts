export type FraudRisk = "Low" | "Medium" | "High";

export interface Property {
  id: string;
  address: string;
  owner: string;
  confidenceScore: number;
  fraudRisk: FraudRisk;
  timestamp: string;
  accountAddress: string | null;
  explorerUrl: string | null;
  transferCount?: number;
  analysis?: string | null;
  factors?: string[];
  recommendation?: string | null;
}

export interface RegisterPropertyResult {
  status: "success" | "rejected";
  data?: Property;
  error?: string;
}
