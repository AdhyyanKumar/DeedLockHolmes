import { AnimatePresence, motion } from "framer-motion";
import { type PropsWithChildren, useEffect, useRef, useState } from "react";
import { subscribeToast } from "../utils/toast";

export function ToastProvider({ children }: PropsWithChildren) {
  const [message, setMessage] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    return subscribeToast(({ message: nextMessage }) => {
      setMessage(nextMessage);
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => setMessage(null), 1600);
    });
  }, []);

  return (
    <>
      {children}
      <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 -translate-x-1/2">
        <AnimatePresence>
          {message ? (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 6 }}
              transition={{ duration: 0.2 }}
              className="rounded-xl border border-line bg-[#121E3B] px-4 py-2 text-sm font-medium text-ink shadow-card"
            >
              {message}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </>
  );
}
