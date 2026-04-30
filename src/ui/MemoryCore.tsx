import { motion } from "motion/react";

export const MemoryCore = ({ active, intensity = 0 }: { active: boolean; intensity?: number }) => {
  // Base durations that get shorter (faster) as intensity increases
  const outerRotateDuration = 20 / (1 + intensity * 2);
  const innerRotateDuration = 15 / (1 + intensity * 2);
  const pulseDuration = 3 / (1 + intensity * 1.5);

  return (
    <div className="relative w-64 h-64 flex items-center justify-center">
      {/* Outer Ring */}
      <motion.div
        className="absolute inset-0 border border-[var(--line)] rounded-full"
        animate={{ 
          rotate: 360,
          scale: active ? [1, 1 + 0.02 * intensity, 1] : 1,
        }}
        transition={{ 
          rotate: { duration: outerRotateDuration, repeat: Infinity, ease: "linear" },
          scale: { duration: pulseDuration, repeat: Infinity, ease: "easeInOut" },
        }}
      />
      
      {/* Inner Ring */}
      <motion.div
        className="absolute inset-8 border border-[var(--accent)]/20 rounded-full border-dashed"
        animate={{ 
          rotate: -360,
          opacity: active ? [0.2, 0.4 + intensity * 0.4, 0.2] : 0.3
        }}
        transition={{ 
          rotate: { duration: innerRotateDuration, repeat: Infinity, ease: "linear" },
          opacity: { duration: pulseDuration, repeat: Infinity, ease: "easeInOut" }
        }}
      />

      {/* Core Sphere */}
      <motion.div
        className="w-32 h-32 rounded-full bg-gradient-to-br from-[var(--accent)] to-[#60a5fa] shadow-xl flex items-center justify-center overflow-hidden relative"
        animate={active ? {
          scale: [1, 1 + 0.05 * intensity, 1],
          filter: [
            "brightness(1)", 
            `brightness(${1 + intensity * 0.3})`, 
            "brightness(1)"
          ],
        } : {}}
        transition={{
          duration: pulseDuration,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        <div className="absolute inset-0 bg-white/10 opacity-20" />
        <motion.div 
          className="text-white font-semibold text-[10px] tracking-[0.2em] z-10"
          animate={active ? { opacity: [0.6, 1, 0.6] } : {}}
          transition={{ duration: pulseDuration * 0.5, repeat: Infinity }}
        >
          CORE
        </motion.div>
        
        {/* Subtle Glow Overlay */}
        {active && (
          <motion.div
            className="absolute inset-0 bg-white/20 mix-blend-overlay"
            animate={{
              opacity: [0, 0.1 + intensity * 0.2, 0],
            }}
            transition={{
              duration: 0.8 / (1 + intensity),
              repeat: Infinity,
              repeatType: "reverse"
            }}
          />
        )}
      </motion.div>

      {/* Minimal Particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-[var(--accent)] rounded-full"
            style={{
              left: "50%",
              top: "50%",
            }}
            animate={{
              x: [
                Math.cos(i * 60 * (Math.PI / 180)) * 60,
                Math.cos(i * 60 * (Math.PI / 180)) * (80 + intensity * 40),
                Math.cos(i * 60 * (Math.PI / 180)) * 60,
              ],
              y: [
                Math.sin(i * 60 * (Math.PI / 180)) * 60,
                Math.sin(i * 60 * (Math.PI / 180)) * (80 + intensity * 40),
                Math.sin(i * 60 * (Math.PI / 180)) * 60,
              ],
              opacity: [0, 0.5 + intensity * 0.5, 0],
              scale: [0.5, 1 + intensity, 0.5]
            }}
            transition={{
              duration: 2.5 / (1 + intensity * 0.5),
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>
    </div>
  );
};
