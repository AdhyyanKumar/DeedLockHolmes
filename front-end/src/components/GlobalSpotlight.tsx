import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function GlobalSpotlight() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const sx = useSpring(mouseX, { stiffness: 220, damping: 30, mass: 0.35 });
  const sy = useSpring(mouseY, { stiffness: 220, damping: 30, mass: 0.35 });
  const glowX = useTransform(sx, [0, 1], ["0%", "100%"]);
  const glowY = useTransform(sy, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    function onPointerMove(event: PointerEvent) {
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      mouseX.set(Math.min(1, Math.max(0, event.clientX / w)));
      mouseY.set(Math.min(1, Math.max(0, event.clientY / h)));
    }

    function onPointerLeave() {
      mouseX.set(0.5);
      mouseY.set(0.5);
    }

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerleave", onPointerLeave);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerleave", onPointerLeave);
    };
  }, [mouseX, mouseY]);

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-[30] mix-blend-screen blur-2xl"
      style={{
        background:
          "radial-gradient(circle at var(--gx) var(--gy), rgba(16,185,129,0.18), rgba(16,185,129,0) 14%)",
        ["--gx" as string]: glowX,
        ["--gy" as string]: glowY,
      }}
    />
  );
}
