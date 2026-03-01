import type { ChangeEvent, DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Upload } from "lucide-react";

interface UploadCardProps {
  file: File | null;
  error: string | null;
  propertyAddress: string;
  ownerName: string;
  salePrice: string;
  isSubmitting: boolean;
  isDragOver: boolean;
  onPropertyAddressChange: (value: string) => void;
  onOwnerNameChange: (value: string) => void;
  onSalePriceChange: (value: string) => void;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: (event: DragEvent<HTMLLabelElement>) => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export default function UploadCard({
  file,
  error,
  propertyAddress,
  ownerName,
  salePrice,
  isSubmitting,
  isDragOver,
  onPropertyAddressChange,
  onOwnerNameChange,
  onSalePriceChange,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onSubmit,
}: UploadCardProps) {
  return (
    <div className="rounded-2.5xl border border-emerald-200/30 bg-white/10 p-6 shadow-card backdrop-blur sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm text-emerald-100">
          Property Address
          <input
            value={propertyAddress}
            onChange={(event) => onPropertyAddressChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-emerald-200/35 bg-[#0A2E23]/60 px-3 py-2.5 text-sm text-emerald-50 outline-none placeholder:text-emerald-200/55"
            placeholder="1428 Harbor View Dr, San Diego, CA"
          />
        </label>
        <label className="block text-sm text-emerald-100">
          Owner Name
          <input
            value={ownerName}
            onChange={(event) => onOwnerNameChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-emerald-200/35 bg-[#0A2E23]/60 px-3 py-2.5 text-sm text-emerald-50 outline-none placeholder:text-emerald-200/55"
            placeholder="Alex Morgan"
          />
        </label>
        <label className="block text-sm text-emerald-100 sm:col-span-2">
          Sale Price (USD)
          <input
            type="number"
            min="1"
            step="1"
            value={salePrice}
            onChange={(event) => onSalePriceChange(event.target.value)}
            className="mt-2 w-full rounded-xl border border-emerald-200/35 bg-[#0A2E23]/60 px-3 py-2.5 text-sm text-emerald-50 outline-none placeholder:text-emerald-200/55"
            placeholder="250000"
          />
        </label>
      </div>

      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragOver
            ? "border-emerald-100/70 bg-emerald-100/20"
            : "border-emerald-200/35 hover:border-emerald-200/55",
        ].join(" ")}
      >
        <input type="file" className="hidden" accept="application/pdf" onChange={onFileSelect} />
        <Upload className="h-8 w-8 text-emerald-100" />
        <p className="mt-4 text-sm font-medium text-white">Drag and drop deed PDF here</p>
        <p className="mt-1 text-sm text-emerald-100/85">or click to browse file</p>
        <p className="mt-4 text-xs text-emerald-100/80">PDF only, max 10MB</p>
      </label>

      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key={file.name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-200/35 bg-[#0A2E23]/55 px-3 py-2 text-sm text-emerald-50"
          >
            <FileText className="h-4 w-4 text-emerald-100/80" />
            <span className="truncate">{file.name}</span>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {error ? (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      <button
        type="button"
        disabled={!file || !propertyAddress.trim() || !ownerName.trim() || !salePrice.trim() || isSubmitting}
        onClick={onSubmit}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-white px-4 py-3 text-sm font-semibold text-[#0F3B2E] hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Validate & Register
      </button>

      <p className="mt-3 text-center text-xs text-emerald-100/80">
        Google sign-in required for protected registry actions.
      </p>
    </div>
  );
}
