import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";

export default function InteractiveLandingLayer() {
  const mouseX = useMotionValue(0.5);
  const mouseY = useMotionValue(0.5);
  const sx = useSpring(mouseX, { stiffness: 90, damping: 24, mass: 0.7 });
  const sy = useSpring(mouseY, { stiffness: 90, damping: 24, mass: 0.7 });
  const glowX = useTransform(sx, [0, 1], ["8%", "92%"]);
  const glowY = useTransform(sy, [0, 1], ["10%", "90%"]);

  function onMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    mouseX.set(Math.min(1, Math.max(0, x)));
    mouseY.set(Math.min(1, Math.max(0, y)));
  }

  function onLeave() {
    mouseX.set(0.5);
    mouseY.set(0.5);
  }

  const stars = Array.from({ length: 34 }).map((_, index) => {
    const x = ((index * 11) % 94) + 3;
    const y = ((index * 17) % 58) + 5;
    return {
      left: `${x}%`,
      top: `${y}%`,
      size: 2 + (index % 4),
      delay: (index % 9) * 0.17,
    };
  });

  return (
    <div className="absolute inset-0 z-0" aria-hidden="true" onMouseMove={onMove} onMouseLeave={onLeave}>
      <motion.div
        className="pointer-events-none absolute -inset-x-16 -inset-y-8 blur-3xl"
        style={{
          background:
            "radial-gradient(circle at var(--gx) var(--gy), rgba(251,191,36,0.24), rgba(251,191,36,0) 34%)",
          ["--gx" as string]: glowX,
          ["--gy" as string]: glowY,
        }}
      />

      <div className="absolute inset-0">
        <div className="scene-stars">
          {stars.map((star, index) => (
            <motion.span
              key={`${star.left}-${star.top}-${index}`}
              className="scene-star"
              style={{ left: star.left, top: star.top, width: star.size, height: star.size }}
              animate={{ opacity: [0.2, 0.95, 0.3], scale: [1, 1.2, 1] }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
                delay: star.delay,
              }}
            />
          ))}
        </div>

        <div className="neighborhood-scene">
          <motion.div
            className="scene-layer scene-layer-far"
            animate={{ x: ["0%", "-10%"] }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          >
            <div className="scene-strip">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={`far-a-${idx}`} className="scene-unit">
                  {idx % 3 === 0 ? (
                    <div className="scene-tree scene-tree-far" />
                  ) : (
                    <div className="scene-house scene-house-far" />
                  )}
                </div>
              ))}
            </div>
            <div className="scene-strip">
              {Array.from({ length: 10 }).map((_, idx) => (
                <div key={`far-b-${idx}`} className="scene-unit">
                  {idx % 3 === 0 ? (
                    <div className="scene-tree scene-tree-far" />
                  ) : (
                    <div className="scene-house scene-house-far" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="scene-layer scene-layer-near"
            animate={{ x: ["0%", "-16%"] }}
            transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          >
            <div className="scene-strip">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={`near-a-${idx}`} className="scene-unit">
                  {idx % 4 === 0 ? (
                    <div className="scene-tree scene-tree-near" />
                  ) : (
                    <div className="scene-house scene-house-near" />
                  )}
                </div>
              ))}
            </div>
            <div className="scene-strip">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={`near-b-${idx}`} className="scene-unit">
                  {idx % 4 === 0 ? (
                    <div className="scene-tree scene-tree-near" />
                  ) : (
                    <div className="scene-house scene-house-near" />
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="scene-road" />

          <motion.div
            className="scene-car"
            animate={{ left: ["-14%", "108%"] }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            <motion.div
              animate={{ y: [0, -4, 0], rotate: [0, -0.5, 0.5, 0] }}
              transition={{ duration: 1.25, repeat: Infinity, ease: "easeInOut" }}
              className="relative h-full w-full"
            >
              <div className="scene-car-top" />
              <div className="scene-car-body">
                <div className="scene-car-window" />
              </div>
              <div className="scene-wheel scene-wheel-left" />
              <div className="scene-wheel scene-wheel-right" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
