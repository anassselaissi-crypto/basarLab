import React from "react";
import { motion } from "motion/react";
import { Cpu, Eye, Zap } from "lucide-react";

interface AgentPanelProps {
  title: string;
  icon: "analyst" | "visualizer" | "processor";
  content: React.ReactNode;
  active?: boolean;
}

export const AgentPanel = ({ title, icon, content, active }: AgentPanelProps) => {
  const Icon = {
    analyst: Cpu,
    visualizer: Eye,
    processor: Zap,
  }[icon];

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={`futuristic-card p-5 w-full h-full flex flex-col gap-4 transition-all ${
        active ? "border-[var(--accent)]/30 shadow-sm" : "opacity-60"
      }`}
    >
      <div className="flex items-center gap-3 border-b border-[var(--line)] pb-3">
        <Icon className={`w-4 h-4 ${active ? 'text-[var(--accent)]' : 'text-[var(--ink)]/40'}`} />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--ink)]/60">
          {title}
        </h3>
        {active && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="ml-auto w-2 h-2 rounded-full bg-[var(--accent)]"
          />
        )}
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar text-sm leading-relaxed text-[var(--ink)]/90">
        {content}
      </div>
    </motion.div>
  );
};
