import { motion } from "framer-motion";

export default function InteractiveLandingLayer() {
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
    <div className="absolute inset-0 z-0" aria-hidden="true">
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
