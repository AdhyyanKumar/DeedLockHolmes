import { Copy, ExternalLink } from "lucide-react";
import type { Property } from "../types/property";
import { copyToClipboard } from "../utils/clipboard";
import { formatTimestamp } from "../utils/format";

const riskStyles: Record<Property["fraudRisk"], string> = {
  Low: "bg-emerald-300/20 text-emerald-100 border-emerald-200/40",
  Medium: "bg-amber-300/20 text-amber-100 border-amber-200/40",
  High: "bg-red-300/20 text-red-100 border-red-200/40",
};

interface VerificationSummaryProps {
  property: Property;
}

export default function VerificationSummary({ property }: VerificationSummaryProps) {
  const accountAddress = property.accountAddress ?? "Not available";
  const explorerUrl = property.explorerUrl ?? "";

  return (
    <div className="rounded-2.5xl border border-emerald-200/30 bg-white/10 p-6 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/75 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.35),0_0_28px_rgba(16,185,129,0.22)]">
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-white">Verification Summary</h3>
          <p className="text-sm text-emerald-100/80">
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
          <dt className="text-xs uppercase tracking-wide text-emerald-100/75">Property Address</dt>
          <dd className="mt-1 text-sm font-medium text-white">{property.address}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-emerald-100/75">Owner Name</dt>
          <dd className="mt-1 text-sm font-medium text-white">{property.owner}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-emerald-100/75">Timestamp</dt>
          <dd className="mt-1 text-sm font-medium text-white">{formatTimestamp(property.timestamp)}</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-emerald-100/75">Confidence Score</dt>
          <dd className="mt-2">
            <div className="h-2 w-full rounded-full bg-emerald-200/25">
              <div
                className="h-2 rounded-full bg-white"
                style={{ width: `${property.confidenceScore}%` }}
              />
            </div>
            <p className="mt-1 text-sm font-medium text-white">{property.confidenceScore}%</p>
          </dd>
        </div>
      </dl>

      <div className="mt-5 rounded-xl border border-emerald-200/30 bg-[#0A2E23]/55 px-4 py-3">
        <p className="text-xs uppercase tracking-wide text-emerald-100/75">On-chain account / PDA</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <code className="text-xs text-emerald-50 sm:text-sm">{accountAddress}</code>
          <button
            type="button"
            onClick={() => copyToClipboard(accountAddress)}
            disabled={!property.accountAddress}
            className="inline-flex items-center gap-1 rounded-lg border border-emerald-200/35 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-emerald-50 hover:bg-white/20"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>
      </div>

      <a
        href={explorerUrl || "#"}
        target="_blank"
        rel="noreferrer"
        onClick={(event) => {
          if (!explorerUrl) event.preventDefault();
        }}
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0F3B2E] hover:bg-emerald-100"
      >
        {explorerUrl ? "View on Explorer" : "Explorer Unavailable"}
        <ExternalLink className="h-4 w-4" />
      </a>
    </div>
  );
}
