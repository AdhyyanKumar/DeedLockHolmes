import { ExternalLink, X } from "lucide-react";
import { useState } from "react";
import { transferProperty } from "../api/propertyApi";
import type { Property } from "../types/property";

interface TransferModalProps {
  property: Property;
  onClose: () => void;
  onSuccess: (updated: Property) => void;
}

type ModalState = "form" | "loading" | "success" | "error";

export default function TransferModal({ property, onClose, onSuccess }: TransferModalProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [state, setModalState] = useState<ModalState>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [transferredProperty, setTransferredProperty] = useState<Property | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!buyerName.trim() || !buyerEmail.trim()) return;

    setModalState("loading");
    const result = await transferProperty(
      property.id,
      buyerName.trim(),
      buyerEmail.trim(),
      Number(salePrice) || 1,
    );

    if (result.status === "success" && result.property) {
      setTransferredProperty(result.property);
      setModalState("success");
      onSuccess(result.property);
    } else {
      setErrorMsg(result.error ?? "Transfer failed.");
      setModalState("error");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-md rounded-2xl border border-emerald-200/30 bg-[#000000] p-6 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-emerald-300/75 hover:shadow-[0_0_0_1px_rgba(45,212,191,0.35),0_0_30px_rgba(16,185,129,0.24)]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-emerald-200/60 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {state === "form" && (
          <>
            <h2 className="text-lg font-semibold text-white">Transfer Property</h2>
            <p className="mt-1 text-sm text-emerald-100/70 truncate">{property.address}</p>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-emerald-100/75">
                  Buyer Name
                </label>
                <input
                  type="text"
                  required
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="John Doe"
                  className="mt-1.5 w-full rounded-xl border border-emerald-200/30 bg-[#0A2E23]/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-emerald-200/40 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-emerald-100/75">
                  Buyer Email
                </label>
                <input
                  type="email"
                  required
                  value={buyerEmail}
                  onChange={(e) => setBuyerEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="mt-1.5 w-full rounded-xl border border-emerald-200/30 bg-[#0A2E23]/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-emerald-200/40 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                />
              </div>

              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-emerald-100/75">
                  Sale Price (USD)
                </label>
                <input
                  type="number"
                  min="1"
                  value={salePrice}
                  onChange={(e) => setSalePrice(e.target.value)}
                  placeholder="450000"
                  className="mt-1.5 w-full rounded-xl border border-emerald-200/30 bg-[#0A2E23]/70 px-3 py-2.5 text-sm text-white outline-none placeholder:text-emerald-200/40 focus:border-emerald-400/50 focus:ring-1 focus:ring-emerald-400/30"
                />
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-emerald-200/30 px-4 py-2.5 text-sm font-medium text-emerald-100 hover:bg-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0F3B2E] hover:bg-emerald-100"
                >
                  Confirm Transfer
                </button>
              </div>
            </form>
          </>
        )}

        {state === "loading" && (
          <div className="flex flex-col items-center py-8 gap-4">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-200/30 border-t-white" />
            <p className="text-sm text-emerald-100/80">Recording transfer on Solana…</p>
          </div>
        )}

        {state === "success" && transferredProperty && (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-400/20 text-2xl">
                ✓
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Transfer Complete</h2>
                <p className="text-sm text-emerald-100/70">Recorded on Solana devnet</p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200/20 bg-[#0A2E23]/55 p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-emerald-100/60">Property</span>
                <span className="text-white truncate max-w-[200px]">{transferredProperty.address}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-100/60">Previous owner</span>
                <span className="text-white">{transferredProperty.previousOwner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-100/60">New owner</span>
                <span className="text-white">{transferredProperty.owner}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-emerald-100/60">Transfers</span>
                <span className="text-white">{transferredProperty.transferCount}</span>
              </div>
            </div>

            {transferredProperty.explorerUrl && (
              <a
                href={transferredProperty.explorerUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0F3B2E] hover:bg-emerald-100"
              >
                View on Solana Explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            )}

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-emerald-200/30 px-4 py-2.5 text-sm font-medium text-emerald-100 hover:bg-white/10"
            >
              Close
            </button>
          </div>
        )}

        {state === "error" && (
          <div className="flex flex-col gap-4">
            <h2 className="text-lg font-semibold text-red-300">Transfer Failed</h2>
            <p className="text-sm text-red-200/80">{errorMsg}</p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setModalState("form")}
                className="flex-1 rounded-xl border border-emerald-200/30 px-4 py-2.5 text-sm font-medium text-emerald-100 hover:bg-white/10"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#0F3B2E] hover:bg-emerald-100"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
