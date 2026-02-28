import { Copy, ExternalLink } from "lucide-react";
import type { Property } from "../types/property";
import { copyToClipboard } from "../utils/clipboard";
import { formatTimestamp } from "../utils/format";

const riskStyles: Record<Property["fraudRisk"], string> = {
  Low: "bg-emerald-950/40 text-emerald-300 border-emerald-700/50",
  Medium: "bg-amber-950/40 text-amber-300 border-amber-700/50",
  High: "bg-red-950/40 text-red-300 border-red-700/50",
};

interface VerificationSummaryProps {
  property: Property;
}

export default function VerificationSummary({ property }: VerificationSummaryProps) {
  return (
    <div className="rounded-2.5xl border border-line bg-[#111A33]/82 p-6 shadow-card backdrop-blur">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-ink">Verification Summary</h3>
          <p className="text-sm text-slate-400">
            Registry entry has been written and indexed.
          </p>
        </div>
        <span
          className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold ${riskStyles[property.fraudRisk]}`}
        >
          Fraud Risk: {property.fraudRisk}
        </span>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Property Address</dt>
          <dd className="mt-1 text-sm font-medium">{property.address}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Owner Name</dt>
          <dd className="mt-1 text-sm font-medium">{property.owner}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Timestamp</dt>
          <dd className="mt-1 text-sm font-medium">{formatTimestamp(property.timestamp)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-slate-400">Confidence Score</dt>
          <dd className="mt-2">
            <div className="h-2 w-full rounded-full bg-[#1A2A4D]">
              <div
                className="h-2 rounded-full bg-brand"
                style={{ width: `${property.confidenceScore}%` }}
              />
            </div>
            <p className="mt-1 text-sm font-medium">{property.confidenceScore}%</p>
          </dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl border border-line bg-[#0E1730] px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-slate-400">On-chain account / PDA</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <code className="text-xs text-slate-300 sm:text-sm">{property.accountAddress}</code>
          <button
            type="button"
            onClick={() => copyToClipboard(property.accountAddress)}
            className="inline-flex items-center gap-1 rounded-lg border border-line bg-[#152343] px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-[#1B2B56]"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>
      </div>

      <a
        href={property.explorerUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-[#0B1230] hover:brightness-110"
      >
        View on Explorer
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
