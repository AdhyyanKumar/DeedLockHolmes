import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProgressSteps from "../components/ProgressSteps";
import UploadCard from "../components/UploadCard";
import VerificationSummary from "../components/VerificationSummary";
import { registerProperty } from "../api/propertyApi";
import type { Property } from "../types/property";

type FlowState = "idle" | "progress" | "success" | "failure";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function RegisterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [currentStep, setCurrentStep] = useState(1);
  const [result, setResult] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  function validateFile(nextFile: File): string | null {
    if (nextFile.type !== "application/pdf") {
      return "Only PDF files are supported.";
    }
    if (nextFile.size > MAX_FILE_BYTES) {
      return "File too large. Please upload a PDF under 10MB.";
    }
    return null;
  }

  function onFilePicked(nextFile: File | null) {
    if (!nextFile) return;
    const validationError = validateFile(nextFile);
    if (validationError) {
      setFile(null);
      setError(validationError);
      return;
    }

    setError(null);
    setFile(nextFile);
    setFlowState("idle");
    setResult(null);
    setRejectionReason(null);
  }

  async function onSubmit() {
    if (!file) return;
    setFlowState("progress");
    setCurrentStep(1);
    setResult(null);
    setRejectionReason(null);

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [
      window.setTimeout(() => setCurrentStep(2), 1200),
      window.setTimeout(() => setCurrentStep(3), 2400),
    ];

    const response = await registerProperty(file);

    if (response.status === "success" && response.data) {
      setCurrentStep(3);
      setFlowState("success");
      setResult(response.data);
      return;
    }

    setCurrentStep(3);
    setFlowState("failure");
    setRejectionReason(
      response.error ??
        "Registration could not be completed. Document integrity checks were inconclusive.",
    );
  }

  function resetAfterFailure() {
    setFlowState("idle");
    setFile(null);
    setError(null);
    setRejectionReason(null);
  }

  return (
    <section className="mx-auto max-w-3xl space-y-8 py-6">
      <div className="text-left">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-brand">
          Registry Workflow
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight text-ink sm:text-5xl">
          Register property on-chain.
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-slate-600">
          Upload a deed PDF. We validate authenticity with AI and register the
          record immutably.
        </p>
      </div>

      <AnimatePresence mode="wait">
        {flowState === "idle" ? (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <UploadCard
              file={file}
              error={error}
              isSubmitting={false}
              isDragOver={isDragOver}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setIsDragOver(false);
              }}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragOver(false);
                onFilePicked(event.dataTransfer.files[0] ?? null);
              }}
              onFileSelect={(event) => onFilePicked(event.target.files?.[0] ?? null)}
              onSubmit={onSubmit}
            />
          </motion.div>
        ) : null}

        {flowState === "progress" ? (
          <motion.div
            key="progress"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <ProgressSteps currentStep={currentStep} />
          </motion.div>
        ) : null}

        {flowState === "success" && result ? (
          <motion.div
            key="summary"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
          >
            <VerificationSummary property={result} />
          </motion.div>
        ) : null}

        {flowState === "failure" ? (
          <motion.div
            key="failure"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="rounded-2.5xl border border-red-200 bg-red-50 p-6 shadow-card"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-700" />
              <div>
                <h3 className="text-lg font-semibold text-red-900">
                  Registration Rejected
                </h3>
                <p className="mt-2 text-sm text-red-800">
                  {rejectionReason ?? "Verification failed."}
                </p>
                <p className="mt-1 text-sm text-red-700">
                  Fraud risk assessment: Elevated risk signals detected.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={resetAfterFailure}
              className="mt-5 rounded-xl border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-800 hover:bg-red-100"
            >
              Try another PDF
            </button>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
