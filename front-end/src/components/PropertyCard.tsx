import { Copy, ExternalLink, ArrowRightLeft } from "lucide-react";
import { useState } from "react";
import type { Property } from "../types/property";
import { useAuth } from "./AuthProvider";
import { copyToClipboard } from "../utils/clipboard";
import { formatTimestamp, truncateMiddle } from "../utils/format";
import TransferModal from "./TransferModal";

const riskStyles: Record<Property["fraudRisk"], string> = {
  Low: "bg-emerald-300/20 text-emerald-100 border-emerald-200/40",
  Medium: "bg-amber-300/20 text-amber-100 border-amber-200/40",
  High: "bg-red-300/20 text-red-100 border-red-200/40",
};

interface PropertyCardProps {
  property: Property;
  onTransfer?: (updated: Property) => void;
  canTransfer?: boolean;
}

export default function PropertyCard({
  property: initialProperty,
  onTransfer,
  canTransfer = false,
}: PropertyCardProps) {
  const { isAuthenticated } = useAuth();
  const [property, setProperty] = useState(initialProperty);
  const [showTransfer, setShowTransfer] = useState(false);
  const transferEnabled = canTransfer && isAuthenticated;

  const accountAddress = property.accountAddress ?? "";
  const explorerUrl = property.explorerUrl ?? "";

  function handleTransferSuccess(updated: Property) {
    setProperty(updated);
    setShowTransfer(false);
    onTransfer?.(updated);
  }

  return (
    <>
      <article className="rounded-2.5xl border border-emerald-200/30 bg-white/10 p-5 shadow-card backdrop-blur transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/75 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.35),0_0_28px_rgba(16,185,129,0.22)]">
        <h3 className="text-base font-semibold leading-snug text-white">{property.address}</h3>
        <p className="mt-1 text-sm text-emerald-50/85">Owner: {property.owner}</p>
        {property.previousOwner && (
          <p className="mt-0.5 text-xs text-emerald-100/50">
            Previously: {property.previousOwner}
          </p>
        )}

        <div className="mt-4 space-y-2 text-sm text-emerald-50/85">
          <p>Date: {formatTimestamp(property.timestamp)}</p>
          <p>Confidence: {property.confidenceScore}%</p>
          <p>Transfer Count: {property.transferCount ?? 0}</p>
        </div>

        <div className="mt-4 flex items-center justify-between gap-2">
          <span
            className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${riskStyles[property.fraudRisk]}`}
          >
            {property.fraudRisk} Risk
          </span>
        </div>

        <div className="mt-4 rounded-xl border border-emerald-200/30 bg-[#0A2E23]/55 px-3 py-2">
          <p className="text-xs uppercase tracking-wide text-emerald-100/75">On-chain account</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <code className="text-xs text-emerald-50">
              {truncateMiddle(accountAddress, 8, 8)}
            </code>
            <button
              type="button"
              onClick={() => copyToClipboard(accountAddress)}
              disabled={!accountAddress}
              className="rounded-lg border border-emerald-200/35 bg-white/10 p-1.5 text-emerald-50 hover:bg-white/20"
              aria-label="Copy account"
            >
              <Copy className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <a
            href={explorerUrl || "#"}
            target="_blank"
            rel="noreferrer"
            onClick={(event) => { if (!explorerUrl) event.preventDefault(); }}
            className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/35 px-3 py-2 text-sm font-medium text-emerald-50 hover:bg-white/10"
          >
            {explorerUrl ? "Explorer" : "Explorer Unavailable"}
            <ExternalLink className="h-4 w-4" />
          </a>

          {transferEnabled && (
            <button
              type="button"
              onClick={() => setShowTransfer(true)}
              className="inline-flex items-center gap-2 rounded-xl border border-emerald-200/35 px-3 py-2 text-sm font-medium text-emerald-50 hover:bg-white/10"
            >
              Transfer
              <ArrowRightLeft className="h-4 w-4" />
            </button>
          )}
        </div>
      </article>

      {transferEnabled && showTransfer && (
        <TransferModal
          property={property}
          onClose={() => setShowTransfer(false)}
          onSuccess={handleTransferSuccess}
        />
      )}
    </>
  );
}
