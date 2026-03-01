import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProgressSteps from "../components/ProgressSteps";
import UploadCard from "../components/UploadCard";
import VerificationSummary from "../components/VerificationSummary";
import { registerProperty } from "../api/propertyApi";
import type { Property, RegisterPropertyResult } from "../types/property";

type FlowState = "idle" | "progress" | "success" | "failure";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

export default function RegisterPage() {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [propertyAddress, setPropertyAddress] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [salePrice, setSalePrice] = useState("");
  const [flowState, setFlowState] = useState<FlowState>("idle");
  const [currentStep, setCurrentStep] = useState(1);
  const [result, setResult] = useState<Property | null>(null);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [rejectionFraudAnalysis, setRejectionFraudAnalysis] =
    useState<RegisterPropertyResult["fraudAnalysis"] | null>(null);
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
    setRejectionFraudAnalysis(null);
  }

  async function onSubmit() {
    if (!file) return;
    if (!propertyAddress.trim() || !ownerName.trim() || !salePrice.trim()) {
      setError("Property address, owner name, and sale price are required.");
      return;
    }

    const parsedSalePrice = Number(salePrice);
    if (!Number.isFinite(parsedSalePrice) || parsedSalePrice <= 0) {
      setError("Sale price must be a positive number.");
      return;
    }

    setError(null);
    setFlowState("progress");
    setCurrentStep(1);
    setResult(null);
    setRejectionReason(null);
    setRejectionFraudAnalysis(null);

    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [
      window.setTimeout(() => setCurrentStep(2), 1200),
      window.setTimeout(() => setCurrentStep(3), 2400),
    ];

    const response = await registerProperty(
      file,
      propertyAddress.trim(),
      ownerName.trim(),
      parsedSalePrice,
    );

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
    setRejectionFraudAnalysis(response.fraudAnalysis ?? null);
  }

  function resetAfterFailure() {
    setFlowState("idle");
    setFile(null);
    setError(null);
    setRejectionReason(null);
    setRejectionFraudAnalysis(null);
  }

  const isFraudBlocked =
    flowState === "failure" &&
    String(rejectionReason || "").toLowerCase().includes("fraudulent deed found");

  return (
    <section className="relative min-h-[calc(100vh-6rem)] overflow-hidden bg-[#0F3B2E] px-4 py-12 sm:px-6 lg:px-8">
      <div
        className="pointer-events-none absolute inset-0 opacity-45"
        style={{
          backgroundImage:
            "linear-gradient(rgba(167,243,208,0.18) 1px, transparent 1px), linear-gradient(90deg, rgba(167,243,208,0.18) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(52,211,153,0.25),transparent_35%),radial-gradient(circle_at_80%_28%,rgba(16,185,129,0.2),transparent_38%),radial-gradient(circle_at_52%_82%,rgba(20,184,166,0.14),transparent_34%)]" />

      <div className="relative z-10 mx-auto max-w-3xl space-y-8">
        <div className="text-left">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-100/90">
            Registry Workflow
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Register property record.
          </h1>
          <p className="mt-3 max-w-2xl text-lg text-emerald-50/90">
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
              propertyAddress={propertyAddress}
              ownerName={ownerName}
              salePrice={salePrice}
              isSubmitting={false}
              isDragOver={isDragOver}
              onPropertyAddressChange={setPropertyAddress}
              onOwnerNameChange={setOwnerName}
              onSalePriceChange={setSalePrice}
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
            className="rounded-2.5xl border border-red-300/40 bg-red-500/15 p-6 shadow-card backdrop-blur"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-red-200" />
              <div>
                <h3 className="text-lg font-semibold text-red-100">
                  {isFraudBlocked ? "Fraudulent Deed Found" : "Registration Rejected"}
                </h3>
                {isFraudBlocked ? (
                  <p className="mt-2 text-sm font-semibold text-red-100">
                    This deed was flagged by AI and was not added to blockchain.
                  </p>
                ) : null}
                <p className="mt-2 text-sm text-red-100/90">
                  {rejectionReason ?? "Verification failed."}
                </p>
                {isFraudBlocked && rejectionFraudAnalysis ? (
                  <div className="mt-4 rounded-xl border border-red-200/30 bg-red-950/25 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-100/85">
                      AI Fraud Reasons
                    </p>
                    <p className="mt-1 text-xs text-red-100/90">
                      Risk Score: {Number(rejectionFraudAnalysis.riskScore ?? 0)} | Risk Level:{" "}
                      {String(rejectionFraudAnalysis.riskLevel || "N/A")} | Confidence:{" "}
                      {Number(rejectionFraudAnalysis.confidence ?? 0)}%
                    </p>
                    {Array.isArray(rejectionFraudAnalysis.factors) &&
                    rejectionFraudAnalysis.factors.length > 0 ? (
                      <ul className="mt-2 space-y-1">
                        {rejectionFraudAnalysis.factors.map((factor, idx) => (
                          <li key={`${idx}-${factor}`} className="text-xs text-red-100/90">
                            * {factor}
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {rejectionFraudAnalysis.recommendation ? (
                      <p className="mt-2 text-xs text-red-100/90">
                        Recommendation: {rejectionFraudAnalysis.recommendation}
                      </p>
                    ) : null}
                    {rejectionFraudAnalysis.analysis ? (
                      <p className="mt-2 whitespace-pre-wrap text-xs text-red-100/75">
                        {rejectionFraudAnalysis.analysis}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
            <button
              type="button"
              onClick={resetAfterFailure}
              className="mt-5 rounded-xl border border-red-200/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-red-100 hover:bg-white/20"
            >
              Try another PDF
            </button>
          </motion.div>
        ) : null}
        </AnimatePresence>
      </div>
    </section>
  );
}
