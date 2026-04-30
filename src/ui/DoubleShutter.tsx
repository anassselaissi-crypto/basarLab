import { motion } from "motion/react";

interface DoubleShutterProps {
  image: string | null;
  processing: boolean;
}

export const DoubleShutter = ({ image, processing }: DoubleShutterProps) => {
  return (
    <div className="relative w-full aspect-video futuristic-card overflow-hidden group shadow-lg">
      {!image && !processing && (
        <div className="absolute inset-0 flex items-center justify-center text-[var(--ink)]/20 font-medium text-xs uppercase tracking-widest">
          Waiting for visual data...
        </div>
      )}

      {processing && (
        <div className="absolute inset-0 bg-[var(--bg)]/60 backdrop-blur-sm flex items-center justify-center z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            className="w-10 h-10 border-2 border-[var(--accent)] border-t-transparent rounded-full"
          />
        </div>
      )}

      {image && (
        <>
          {/* Fast Channel (0.45) */}
          <motion.img
            src={image}
            className="absolute inset-0 w-full h-full object-cover opacity-45 grayscale brightness-110"
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.8 }}
            referrerPolicy="no-referrer"
          />
          
          {/* Slow Channel (0.55) */}
          <motion.img
            src={image}
            className="absolute inset-0 w-full h-full object-cover opacity-55 mix-blend-soft-light"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={{ duration: 1.5 }}
            referrerPolicy="no-referrer"
          />

          {/* Minimal Metadata Overlay */}
          <div className="absolute bottom-3 left-3 flex items-center gap-2">
            <div className="text-[8px] font-bold text-white/40 uppercase tracking-[0.2em] bg-white/5 backdrop-blur-sm px-2 py-0.5 rounded border border-white/10">
              DNA Kernel Sync
            </div>
            <div className="text-[8px] font-medium text-white/30 uppercase tracking-[0.2em]">
              1024x576 // Controlled
            </div>
          </div>
        </>
      )}

      {/* Subtle Grid Overlay */}
      <div className="absolute inset-0 grid-bg opacity-5 pointer-events-none" />
    </div>
  );
};
