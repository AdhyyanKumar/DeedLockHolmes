import { motion } from "framer-motion";
import { useMemo } from "react";

export default function InteractiveLandingLayer() {
  const stars = useMemo(() => {
    let seed = 872341;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    return Array.from({ length: 72 }).map((_, index) => {
      const spreadBias = rand();
      const left = 1 + rand() * 98;
      const top = 3 + Math.pow(spreadBias, 0.8) * 66;
      const size = 1 + rand() * 3.2;
      const minOpacity = 0.15 + rand() * 0.25;
      const maxOpacity = 0.65 + rand() * 0.35;
      const twinkleScale = 1 + rand() * 0.4;
      const duration = 1.8 + rand() * 3.1;
      const delay = rand() * 2.8;

      return {
        id: index,
        left: `${left}%`,
        top: `${top}%`,
        size,
        minOpacity,
        maxOpacity,
        twinkleScale,
        duration,
        delay,
      };
    });
  }, []);

  return (
    <div className="absolute inset-0 z-0" aria-hidden="true">
      <div className="absolute inset-0">
        <div className="scene-stars">
          {stars.map((star) => (
            <motion.span
              key={star.id}
              className="scene-star"
              style={{ left: star.left, top: star.top, width: star.size, height: star.size }}
              animate={{
                opacity: [star.minOpacity, star.maxOpacity, star.minOpacity + 0.08],
                scale: [1, star.twinkleScale, 1],
              }}
              transition={{
                duration: star.duration,
                repeat: Infinity,
                ease: "easeInOut",
                delay: star.delay,
              }}
            />
          ))}
        </div>

        <div className="neighborhood-scene">
          <motion.div
            className="scene-layer scene-layer-near"
            animate={{ x: ["0%", "-33.4%"] }}
            transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
          >
            <div className="scene-strip">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={`near-a-${idx}`} className="scene-unit">
                  {idx % 4 === 0 ? (
                    <div className="scene-house scene-house-near">
                      <span className="scene-house-roof" />
                      <span className="scene-house-body">
                        <span className="scene-window scene-window-left" />
                        <span className="scene-window scene-window-right" />
                        <span className="scene-window scene-window-top" />
                        <span className="scene-door" />
                      </span>
                    </div>
                  ) : (
                    <div className="scene-tree scene-tree-near">
                      <span className="scene-tree-trunk" />
                      <span className="scene-tree-canopy" />
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="scene-strip">
              {Array.from({ length: 12 }).map((_, idx) => (
                <div key={`near-b-${idx}`} className="scene-unit">
                  {idx % 4 === 0 ? (
                    <div className="scene-house scene-house-near">
                      <span className="scene-house-roof" />
                      <span className="scene-house-body">
                        <span className="scene-window scene-window-left" />
                        <span className="scene-window scene-window-right" />
                        <span className="scene-window scene-window-top" />
                        <span className="scene-door" />
                      </span>
                    </div>
                  ) : (
                    <div className="scene-tree scene-tree-near">
                      <span className="scene-tree-trunk" />
                      <span className="scene-tree-canopy" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          <div className="scene-road" />

          <motion.div
            className="scene-car"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <motion.div
              animate={{ rotate: [0, -0.6, 0.6, 0] }}
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
