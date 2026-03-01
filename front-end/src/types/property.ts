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
}

export interface RegisterPropertyResult {
  status: "success" | "rejected";
  data?: Property;
  error?: string;
}
