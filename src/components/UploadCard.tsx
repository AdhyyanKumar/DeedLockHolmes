import type { ChangeEvent, DragEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Upload } from "lucide-react";

interface UploadCardProps {
  file: File | null;
  error: string | null;
  isSubmitting: boolean;
  isDragOver: boolean;
  onDragOver: (event: DragEvent<HTMLLabelElement>) => void;
  onDragLeave: (event: DragEvent<HTMLLabelElement>) => void;
  onDrop: (event: DragEvent<HTMLLabelElement>) => void;
  onFileSelect: (event: ChangeEvent<HTMLInputElement>) => void;
  onSubmit: () => void;
}

export default function UploadCard({
  file,
  error,
  isSubmitting,
  isDragOver,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
  onSubmit,
}: UploadCardProps) {
  return (
    <div className="rounded-2.5xl border border-line bg-white p-6 shadow-card sm:p-8">
      <label
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={[
          "flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center transition-colors",
          isDragOver
            ? "border-brand bg-brandSoft/40"
            : "border-slate-300 hover:border-slate-400",
        ].join(" ")}
      >
        <input type="file" className="hidden" accept="application/pdf" onChange={onFileSelect} />
        <Upload className="h-8 w-8 text-slate-500" />
        <p className="mt-4 text-sm font-medium text-ink">Drag and drop deed PDF here</p>
        <p className="mt-1 text-sm text-slate-500">or click to browse file</p>
        <p className="mt-4 text-xs text-slate-500">PDF only, max 10MB</p>
      </label>

      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key={file.name}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 flex items-center gap-2 rounded-xl border border-line bg-[#FCFBF8] px-3 py-2 text-sm text-slate-700"
          >
            <FileText className="h-4 w-4 text-slate-500" />
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
        disabled={!file || isSubmitting}
        onClick={onSubmit}
        className="mt-6 inline-flex w-full items-center justify-center rounded-xl bg-brand px-4 py-3 text-sm font-semibold text-white hover:bg-[#e85d00] disabled:cursor-not-allowed disabled:opacity-50"
      >
        Validate & Register
      </button>

      <p className="mt-3 text-center text-xs text-slate-500">
        Mock login required for protected registry actions.
      </p>
    </div>
  );
}
