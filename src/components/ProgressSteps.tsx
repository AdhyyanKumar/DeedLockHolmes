import { motion } from "framer-motion";
import { CheckCircle2, LoaderCircle } from "lucide-react";

const STEPS = [
  "Analyzing document with AI",
  "Checking fraud risk & metadata",
  "Registering on-chain record",
];

interface ProgressStepsProps {
  currentStep: number;
}

export default function ProgressSteps({ currentStep }: ProgressStepsProps) {
  return (
    <div className="space-y-4 rounded-2.5xl border border-line bg-[#111A33]/82 p-6 shadow-card backdrop-blur">
      <h3 className="text-base font-semibold text-ink">Validation in progress</h3>
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const stepNumber = index + 1;
          const isDone = currentStep > stepNumber;
          const isActive = currentStep === stepNumber;

          return (
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 rounded-xl border border-line/90 bg-[#0E1730] px-4 py-3"
            >
              <span className="flex h-6 w-6 items-center justify-center text-brand">
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : isActive ? (
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="h-2.5 w-2.5 rounded-full bg-slate-300" />
                )}
              </span>
              <span
                className={[
                  "text-sm",
                  isActive || isDone ? "text-ink" : "text-slate-400",
                ].join(" ")}
              >
                {step}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
