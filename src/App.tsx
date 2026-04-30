import { useState, useEffect, useRef, type ChangeEvent } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Database, Send, AlertCircle, RefreshCw, Layers, Cpu, Eye, Zap, Image as ImageIcon, FileText, Upload, X, ShieldCheck, Trash2, History } from "lucide-react";
import { MemoryCore } from "./ui/MemoryCore";
import { AgentPanel } from "./ui/AgentPanel";
import { DoubleShutter } from "./ui/DoubleShutter";
import { SSFChart } from "./ui/SSFChart";
import { useKernel, Message } from "./orchestration/useKernel";
import { BOUNDARY_OPTIONS, WELCOME_MESSAGE } from "./utils/constants";
import { saveMemorySession, subscribeToMemories, clearMemories } from "./services/memoryService";
import { io } from "socket.io-client";

// Extend Window interface for AI Studio API
declare global {
  interface Window {
    aistudio: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface KernelError {
  category: "API" | "NETWORK" | "PROCESSING" | "UNKNOWN";
  message: string;
  isRetryable: boolean;
}

export default function App() {
  const [input, setInput] = useState("");
  const [showValidationError, setShowValidationError] = useState(false);
  const [outputBoundary, setOutputBoundary] = useState(BOUNDARY_OPTIONS[0].id);
  const [fidelity, setFidelity] = useState(1.0);
  const [creativity, setCreativity] = useState(0.2);
  const [denoise, setDenoise] = useState(0.2);
  const [sharpness, setSharpness] = useState(0.4);
  const [showSettings, setShowSettings] = useState(false);
  const [activeStrategy, setActiveStrategy] = useState<"auto" | "visual" | "strategic">("auto");
  const [selectedFile, setSelectedFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [liveLogs, setLiveLogs] = useState<string[]>([]);
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [isDismantling, setIsDismantling] = useState(false);
  const [confirmDismantle, setConfirmDismantle] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleClearArchive = async () => {
    if (!confirmDismantle) {
      setConfirmDismantle(true);
      setTimeout(() => setConfirmDismantle(false), 3000); // Reset confirm after 3s
      return;
    }

    setIsDismantling(true);
    try {
      await clearMemories();
      setConfirmDismantle(false);
    } catch (err) {
      console.error("Archive dismantle failed:", err);
    } finally {
      setIsDismantling(false);
    }
  };

  const socketRef = useRef<any>(null);

  const {
    messages,
    setMessages,
    isProcessing,
    intensity,
    processInput
  } = useKernel({
    fidelity,
    creativity,
    denoise,
    sharpness,
    outputBoundary,
    activeStrategy,
    boundaryOptions: BOUNDARY_OPTIONS
  });

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isProcessing]);

  useEffect(() => {
    // Socket initialization for Telemetry
    socketRef.current = io();
    socketRef.current.on("telemetry", (data: any) => {
      setLiveLogs(prev => [...prev, `[${data.agent}] ${data.log}`].slice(-5));
    });

    // Firebase History subscription
    const unsubscribe = subscribeToMemories((mems) => setHistory(mems));

    if (messages.length === 0) {
      setMessages([{
        id: "welcome",
        role: WELCOME_MESSAGE.agent as any,
        type: "text",
        content: WELCOME_MESSAGE.content,
        timestamp: new Date()
      }]);
    }

    return () => {
      socketRef.current?.disconnect();
      unsubscribe();
    };
  }, []);

  const clearMemory = () => {
    setMessages([
      {
        id: "welcome",
        role: "agent1",
        type: "text",
        content: "Memory core cleared. DNA Kernel re-initialized. How shall we proceed?",
        timestamp: new Date()
      }
    ]);
    setSelectedFile(null);
    setUploadError(null);
  };

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);

    // 1. Validate File Format
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
    if (!allowedTypes.includes(file.type)) {
      setUploadError("UNSUPPORTED_FORMAT: Please provide JPEG, PNG, or WEBP.");
      return;
    }

    // 2. Validate File Size (max 20MB)
    const maxSize = 20 * 1024 * 1024;
    if (file.size > maxSize) {
      setUploadError("DATA_OVERFLOW: File size exceeds the 20MB kernel limit.");
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => setUploadError("FS_ERROR: Failed to read local filesystem data.");
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedFile({
        data: base64.split(",")[1],
        mimeType: file.type,
        name: file.name
      });
    };
    reader.readAsDataURL(file);
    
    // Clear input so same file can be re-selected if needed
    e.target.value = "";
  };

  const boundaryOptions = [
    { id: "16:9 cinematic framing", ratio: "16:9" as const, label: "CINEMATIC", desc: "Wide 16:9 aspect ratio" },
    { id: "1:1 macro focus", ratio: "1:1" as const, label: "MACRO", desc: "Square 1:1 detail focus" },
    { id: "4:3 technical blueprint", ratio: "4:3" as const, label: "TECHNICAL", desc: "Standard 4:3 schematic" },
    { id: "9:16 vertical scan", ratio: "9:16" as const, label: "VERTICAL", desc: "Portrait 9:16 scan" },
  ];

  useEffect(() => {
    // Check for API key silently
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        // We still track it internally but don't show prompts
      }
    };
    checkKey();
  }, []);

  const getFriendlyErrorMessage = (error: string) => {
    if (error.startsWith("API_ERROR:")) {
      return "The system encountered an authentication or quota issue. Please verify your API keys in the settings.";
    }
    if (error.startsWith("NETWORK_ERROR:")) {
      return "A network disruption occurred. Please check your connection and try again.";
    }
    if (error.startsWith("CONTENT_ERROR:")) {
      return error.replace("CONTENT_ERROR: ", "");
    }
    if (error.startsWith("PROCESSING_ERROR:")) {
      return "The DNA Kernel encountered a processing anomaly. Please refine your input and retry.";
    }
    return error;
  };

  const processMemory = async () => {
    if (!input.trim() && !selectedFile) {
      setShowValidationError(true);
      setTimeout(() => setShowValidationError(false), 1000);
      return;
    }

    const currentInput = input;
    const currentFile = selectedFile;
    setInput("");
    setSelectedFile(null);
    
    try {
      const result = await processInput(currentInput, currentFile ? { data: currentFile.data, mimeType: currentFile.mimeType } : undefined);
      
      // Auto-save to Firebase if successful
      if (result && (result as any).ssfParams) {
        await saveMemorySession({
          input: currentInput,
          agent1Analysis: result,
          agent2Output: null, 
          agent3Output: null,
          ssfParams: (result as any).ssfParams
        });
      }
    } catch (err) {
      console.error("Processing failed:", err);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col bg-[var(--bg)] text-[var(--ink)] relative overflow-hidden">
      {/* Background Grid */}
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />

      {/* Header */}
      <header className="h-16 border-b border-[var(--line)] flex items-center px-6 sm:px-10 gap-6 z-30 bg-[var(--bg)]/80 backdrop-blur-xl sticky top-0">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-[var(--accent)] flex items-center justify-center text-white shadow-lg shadow-[var(--accent)]/20 relative group overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent pointer-events-none" />
            <Database className="w-5 h-5 relative z-10" />
          </div>
          <div className="flex flex-col">
            <h1 className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--ink)] leading-none">Abstra Kernel</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <span className={`w-1.5 h-1.5 rounded-full ${isProcessing ? 'bg-[var(--accent)] animate-pulse' : 'bg-green-500'}`} />
              <span className="text-[9px] font-mono uppercase tracking-widest text-[var(--ink)]/40">GEMINI // AMD v2.1 // {isProcessing ? 'PROCESSING' : 'SYSTEM_STABLE'}</span>
            </div>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <button
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-2 h-10 px-4 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider ${
              showHistory 
                ? 'bg-purple-500 text-white shadow-lg shadow-purple-500/20' 
                : 'bg-[var(--line)] text-[var(--ink)]/50 hover:text-[var(--ink)] hover:bg-purple-500/5'
            }`}
          >
            <History className="w-4 h-4" />
            <span className="hidden md:inline">Memory Bank</span>
          </button>

          <button
            onClick={clearMemory}
            className="group flex items-center gap-2 h-10 px-4 rounded-xl border border-[var(--line)] hover:border-red-500/30 hover:bg-red-500/5 text-[var(--ink)]/40 hover:text-red-500 transition-all text-[10px] font-bold uppercase tracking-wider"
            title="Wipe Memory Core"
          >
            <Trash2 className="w-4 h-4 group-hover:rotate-12 transition-transform" />
            <span className="hidden md:inline">Delete Memory</span>
          </button>
          
          <button 
            onClick={() => setShowSettings(!showSettings)}
            className={`flex items-center gap-2 h-10 px-4 rounded-xl transition-all text-[10px] font-bold uppercase tracking-wider ${
              showSettings 
                ? 'bg-[var(--accent)] text-white shadow-lg shadow-[var(--accent)]/20' 
                : 'bg-[var(--line)] text-[var(--ink)]/50 hover:text-[var(--ink)] hover:bg-[var(--line)]/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span className="hidden md:inline">Parameters</span>
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar Settings */}
        <AnimatePresence>
          {showSettings && (
            <motion.aside
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              className="w-72 border-r border-[var(--line)] bg-[var(--bg)]/50 backdrop-blur-xl p-6 flex flex-col gap-8 z-20 overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xs font-bold uppercase tracking-widest text-[var(--ink)]/40">Kernel Parameters</h2>
                <button onClick={() => setShowSettings(false)} className="text-[var(--ink)]/40 hover:text-[var(--ink)]">
                  <AlertCircle className="w-4 h-4 rotate-45" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-[var(--ink)]/40 uppercase tracking-[0.2em] flex justify-between">
                    <span>Agent 1: Fidelity</span>
                    <span className="text-[var(--accent)]">{(fidelity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={fidelity}
                    onChange={(e) => setFidelity(parseFloat(e.target.value))}
                    className="w-full accent-[var(--accent)] bg-[var(--line)] h-1.5 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-[var(--ink)]/40 uppercase tracking-[0.2em] flex justify-between">
                    <span>Agent 2: Creativity</span>
                    <span className="text-[var(--accent)]">{(creativity * 100).toFixed(0)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={creativity}
                    onChange={(e) => setCreativity(parseFloat(e.target.value))}
                    className="w-full accent-[var(--accent)] bg-[var(--line)] h-1.5 rounded-full appearance-none cursor-pointer"
                  />
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-[var(--ink)]/40 uppercase tracking-[0.2em] flex justify-between">
                    <span>Agent 2: Noise Reduction</span>
                    <span className="text-[var(--accent)]">{(denoise * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={denoise}
                    onChange={(e) => setDenoise(parseFloat(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-[var(--ink)]/40 uppercase tracking-[0.2em] flex justify-between">
                    <span>Agent 2: Sharpness</span>
                    <span className="text-[var(--accent)]">{(sharpness * 100).toFixed(0)}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="1" 
                    step="0.01" 
                    value={sharpness}
                    onChange={(e) => setSharpness(parseFloat(e.target.value))}
                    className="w-full accent-[var(--accent)]"
                  />
                </div>

                <div className="space-y-4">
                  <div className="text-[10px] font-bold text-[var(--ink)]/40 uppercase tracking-[0.2em]">
                    Output Boundary
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {BOUNDARY_OPTIONS.map((opt) => (
                      <button
                        key={opt.id}
                        onClick={() => setOutputBoundary(opt.id)}
                        className={`p-3 border rounded-xl text-left transition-all ${
                          outputBoundary === opt.id
                            ? "bg-[var(--accent-dim)] border-[var(--accent)] text-[var(--accent)]"
                            : "bg-transparent border-[var(--line)] text-[var(--ink)]/50 hover:border-[var(--ink)]/20"
                        }`}
                      >
                        <div className="text-[10px] font-bold">{opt.label}</div>
                        <div className="text-[8px] opacity-60 leading-tight mt-1">{opt.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="mt-auto pt-6 border-t border-[var(--line)] opacity-40 text-[9px] font-mono uppercase tracking-widest text-center">
                Stack: Google-Gemini // AMD-Vision
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col relative z-10 max-w-4xl mx-auto w-full bg-[var(--bg)]">
          {/* Real-time Telemetry Bar */}
          <AnimatePresence>
            {liveLogs.length > 0 && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-black/80 backdrop-blur border-b border-[var(--line)] px-6 py-2 overflow-hidden"
              >
                <div className="flex gap-4 items-center">
                  <div className="text-[8px] font-bold text-[var(--accent)] animate-pulse uppercase tracking-[0.2em]">Live Telemetry:</div>
                  <div className="flex-1 flex gap-4 overflow-hidden">
                    {liveLogs.map((log, i) => (
                      <span key={i} className="text-[9px] font-mono whitespace-nowrap opacity-40">{log}</span>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div 
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-8 space-y-12 custom-scrollbar scroll-smooth relative"
          >
            {/* Memory Bank Overlay */}
            <AnimatePresence>
              {showHistory && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute inset-0 z-50 bg-[var(--bg)]/95 backdrop-blur-3xl p-8 overflow-y-auto"
                >
                  <div className="max-w-2xl mx-auto space-y-8">
                    <div className="flex items-center justify-between border-b border-[var(--line)] pb-4">
                      <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-purple-500" />
                        <h2 className="text-sm font-bold uppercase tracking-widest text-purple-500">Memory Bank Archives</h2>
                      </div>
                      <div className="flex items-center gap-2">
                        {history.length > 0 && (
                          <button 
                            onClick={handleClearArchive}
                            disabled={isDismantling}
                            className={`p-2 rounded-xl transition-all flex items-center gap-2 text-[10px] font-bold uppercase ${
                              isDismantling ? 'bg-orange-500/10 text-orange-500 opacity-50' :
                              confirmDismantle ? 'bg-red-500 text-white animate-pulse' : 
                              'hover:bg-red-500/10 text-red-500'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            {isDismantling ? "Dismantling..." : confirmDismantle ? "Click to Confirm" : "Dismantle Archive"}
                          </button>
                        )}
                        <button onClick={() => setShowHistory(false)} className="p-2 hover:bg-[var(--line)] rounded-xl transition-all">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                      {history.length === 0 ? (
                        <div className="py-20 text-center opacity-30 text-xs font-mono">No archives found in Firebase. Start a session to persist data.</div>
                      ) : (
                        history.map((mem) => (
                          <button 
                            key={mem.id}
                            onClick={() => {
                              setMessages(prev => [...prev, {
                                id: "history-" + Date.now(),
                                role: "agent1",
                                type: "analysis",
                                content: mem.agent1Analysis,
                                timestamp: new Date()
                              }]);
                              setShowHistory(false);
                            }}
                            className="text-left futuristic-card p-4 hover:border-purple-500/50 transition-all group"
                          >
                            <div className="flex justify-between items-start mb-2">
                              <span className="text-[10px] font-bold text-purple-500">{mem.ssfParams?.regime} Regime Active</span>
                              <span className="text-[8px] opacity-40 font-mono">ID: {mem.id?.slice(0, 8)}</span>
                            </div>
                            <p className="text-xs font-medium text-[var(--ink)]/80 line-clamp-1 mb-1">{mem.input}</p>
                            <div className="text-[9px] opacity-40 font-mono italic">Sc: {mem.ssfParams?.Sc?.toFixed(4)}</div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center gap-6 opacity-40">
                <Database className="w-12 h-12 text-[var(--accent)]" />
                <div className="space-y-2">
                  <h2 className="text-lg font-semibold">DNA Kernel Ready</h2>
                  <p className="text-sm max-w-xs mx-auto">Input memory data for Kernel analysis & AMD vision synthesis.</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] ${msg.role === 'user' ? 'bg-[var(--accent)] text-white p-4 rounded-2xl rounded-tr-sm shadow-md' : 'w-full'}`}>
                    {msg.role === 'user' ? (
                      <div className="space-y-2">
                        {msg.content.startsWith("[IMAGE_ATTACHED]") && selectedFile && (
                          <div className="w-full max-w-sm rounded-xl overflow-hidden border border-white/20 shadow-sm">
                            <img src={`data:${selectedFile.mimeType};base64,${selectedFile.data}`} className="w-full h-auto" />
                          </div>
                        )}
                        <p className="text-sm font-medium leading-relaxed">{msg.content.replace("[IMAGE_ATTACHED] ", "")}</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--ink)]/40 mb-1">
                          {msg.role === 'agent1' && (
                            <span className="flex items-center gap-2">
                              <Cpu className="w-3.5 h-3.5 text-[var(--accent)]" />
                              {isProcessing && !msg.content.technicalSummary ? 'ANALYZING...' : 'Sovereign Analyst'}
                            </span>
                          )}
                          {msg.role === 'agent2' && (
                             <span className="flex items-center gap-2">
                               <Eye className="w-3.5 h-3.5 text-purple-500" />
                               Visual Engineer
                             </span>
                          )}
                          {msg.role === 'agent3' && (
                             <span className="flex items-center gap-2">
                               <Zap className="w-3.5 h-3.5 text-orange-500" />
                               RAW Logic
                             </span>
                          )}
                          {msg.role === 'orch' && <RefreshCw className="w-3 h-3 text-[var(--accent)] animate-spin-slow" />}
                          {msg.role === 'orch' && "System Kernel"}
                        </div>

                        {msg.role === 'orch' && (
                          <div className="flex items-start gap-3 py-2 px-4 rounded-xl bg-[var(--line)]/20 border border-[var(--line)]">
                            <p className="text-[11px] font-mono leading-relaxed text-[var(--ink)]/60">
                              <span className="text-[var(--accent)] font-bold">KERNEL // </span>
                              {msg.content}
                            </p>
                          </div>
                        )}

                        {msg.type === 'analysis' && msg.role === 'agent3' && (
                          <div className="futuristic-card p-6 space-y-6 border-l-2 border-l-purple-500 bg-purple-500/5">
                            <div className="space-y-4">
                              <div className="text-[9px] text-purple-500 font-bold uppercase tracking-widest flex items-center gap-2 opacity-60">
                                <Zap className="w-3 h-3" /> Deterministic Duo Processing (Gemini Roadmap)
                              </div>
                              <p className="text-sm leading-relaxed text-[var(--ink)]/80 font-medium whitespace-pre-wrap">{msg.content.solution}</p>
                            </div>
                            <div className="pt-4 border-t border-[var(--line)] space-y-4">
                              <div className="text-[9px] text-purple-500 font-bold uppercase tracking-widest flex items-center gap-2 opacity-60">
                                <Layers className="w-3 h-3" /> Technical Roadmap
                              </div>
                              <p className="text-xs leading-relaxed text-[var(--ink)]/60 font-mono italic">
                                {msg.content.roadmap}
                              </p>
                            </div>
                          </div>
                        )}

                        {msg.type === 'analysis' && msg.role === 'agent1' && (
                          <div className="futuristic-card p-6 space-y-6 border-l-2 border-l-[var(--accent)] bg-white/40 dark:bg-slate-900/40">
                             <div className="space-y-6">
                                {/* Technical Header */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                   <div className="md:col-span-2 space-y-3">
                                      <div className="text-[10px] font-black text-[var(--accent)] uppercase tracking-[0.2em] opacity-80">Sovereign Analysis synthesis</div>
                                      <p className="text-sm leading-relaxed text-[var(--ink)]/90 font-medium whitespace-pre-wrap">{msg.content.technicalSummary}</p>
                                   </div>
                                   <div className="bg-[var(--line)]/10 p-4 rounded-2xl border border-[var(--line)] space-y-3">
                                      <div className="flex items-center justify-between">
                                         <span className="text-[8px] font-bold opacity-40 uppercase">Kernel Sync</span>
                                         <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${msg.content.contextStatus.includes('Validated') ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-600'}`}>
                                            {msg.content.contextStatus}
                                         </span>
                                      </div>
                                      <div className="space-y-2">
                                         <div className="flex justify-between items-end">
                                            <span className="text-[8px] font-bold opacity-40 uppercase">Regime</span>
                                            <span className="text-xs font-bold text-[var(--accent)] font-mono">{msg.content.ssfParams?.regime}</span>
                                         </div>
                                         <div className="flex justify-between items-end">
                                            <span className="text-[8px] font-bold opacity-40 uppercase">Stability (Sc)</span>
                                            <span className="text-xs font-mono">{msg.content.ssfParams?.Sc?.toFixed(5)}</span>
                                         </div>
                                         <div className="w-full bg-[var(--line)] h-1 rounded-full overflow-hidden">
                                            <div className="bg-[var(--accent)] h-full" style={{ width: `${(msg.content.ssfParams?.Sc || 0.5) * 100}%` }} />
                                         </div>
                                      </div>
                                   </div>
                                </div>

                                {/* Insights Grid */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-[var(--line)]">
                                   <div className="space-y-2">
                                      <div className="text-[9px] font-bold text-[var(--accent)]/60 uppercase tracking-widest flex items-center gap-2">
                                         <RefreshCw className="w-3 h-3" /> Dramatic Context
                                      </div>
                                      <p className="text-sm leading-relaxed text-[var(--ink)]/70 italic">{msg.content.dramaticInsight}</p>
                                   </div>
                                   <div className="space-y-2">
                                      <div className="text-[9px] font-bold text-orange-500/60 uppercase tracking-widest flex items-center gap-2">
                                         <AlertCircle className="w-3 h-3" /> Semiotic Intent
                                      </div>
                                      <p className="text-sm leading-relaxed text-[var(--ink)]/70">{msg.content.semioticMeaning}</p>
                                   </div>
                                </div>

                                {/* Visual Boundary Specs */}
                                <div className="pt-6 border-t border-[var(--line)]">
                                   <div className="text-[8px] font-black text-[var(--ink)]/40 uppercase mb-4 tracking-widest">Validated Generation Parameters</div>
                                   <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      {Object.entries(msg.content.validatedContext || {}).filter(([key]) => key !== 'enhancements').map(([key, value]) => (
                                         <div key={key} className="bg-[var(--bg)]/30 p-2.5 rounded-xl border border-[var(--line)] hover:border-[var(--accent)]/20 transition-colors">
                                            <div className="text-[7px] uppercase font-black opacity-30 mb-1">{key.replace(/([A-Z])/g, ' $1')}</div>
                                            <div className="text-[10px] font-mono leading-tight truncate text-[var(--ink)]/80" title={String(value)}>{String(value)}</div>
                                         </div>
                                      ))}
                                   </div>
                                </div>
                             </div>
                          </div>
                        )}

                        {msg.type === 'image' && (
                          <div className="space-y-3">
                            <div className="rounded-2xl overflow-hidden shadow-lg border border-[var(--line)]">
                              <DoubleShutter image={msg.content.image} processing={false} />
                            </div>
                            <div className="text-[10px] opacity-40 leading-relaxed bg-[var(--card-bg)] p-3 rounded-xl border border-[var(--line)] font-mono">
                              {msg.content.log}
                            </div>
                          </div>
                        )}

                        {msg.type === 'text' && (
                          <div className={`p-5 rounded-2xl border shadow-sm ${msg.role === 'error' ? 'bg-red-500/5 border-red-500/20 text-red-600' : 'bg-[var(--card-bg)] border-[var(--line)] text-[var(--ink)]/80'} text-sm leading-relaxed`}>
                            {msg.content}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
            {isProcessing && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex justify-start"
              >
                <div className="flex items-center gap-3 text-[10px] font-bold text-[var(--accent)] uppercase tracking-widest">
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  Kernel Processing via Gemini AI...
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer Input Area */}
          <footer className="p-6 bg-[var(--bg)] border-t border-[var(--line)]">
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Strategy choices */}
              <div className="flex items-center gap-2 px-1">
                <span className="text-[9px] font-bold text-[var(--ink)]/30 uppercase tracking-[0.2em] mr-4">Strategy:</span>
                {[
                  { id: "auto", label: "Smart Routing", icon: Database },
                  { id: "visual", label: "Agent 2: AMD Vision", icon: Eye },
                  { id: "strategic", label: "Agent 3: Deterministic RAW", icon: Zap }
                ].map(strategy => (
                  <button
                    key={strategy.id}
                    onClick={() => setActiveStrategy(strategy.id as any)}
                    className={`flex items-center gap-2 px-3 py-1 transparent-btn rounded-full text-[9px] font-bold uppercase tracking-widest border transition-all ${
                      activeStrategy === strategy.id 
                        ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-dim)]' 
                        : 'border-[var(--line)] text-[var(--ink)]/40 hover:border-[var(--ink)]/20 shadow-sm'
                    }`}
                  >
                    <strategy.icon className="w-3 h-3" />
                    {strategy.label}
                  </button>
                ))}
              </div>

              <motion.div 
                className="w-full relative flex flex-col gap-3"
                animate={showValidationError ? { x: [-10, 10, -10, 10, 0] } : {}}
                transition={{ duration: 0.4 }}
              >
                {uploadError && (
                  <motion.div
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-2xl w-fit"
                  >
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-[10px] font-bold text-red-600">{uploadError}</span>
                    <button 
                      onClick={() => setUploadError(null)}
                      className="p-1 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                )}

                {selectedFile && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 p-3 bg-[var(--card-bg)] border border-[var(--line)] rounded-2xl w-fit"
                  >
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-[var(--line)] bg-black/5">
                       <img src={`data:${selectedFile.mimeType};base64,${selectedFile.data}`} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold truncate max-w-[150px]">{selectedFile.name}</span>
                      <span className="text-[9px] opacity-40 uppercase">Ready for Analysis</span>
                    </div>
                    <button 
                      onClick={() => setSelectedFile(null)}
                      className="p-1 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </motion.div>
                )}

                <div className="flex gap-2 w-full">
                  <div className="relative flex-1 group">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => {
                        setInput(e.target.value);
                        if (showValidationError && e.target.value.trim()) {
                          setShowValidationError(false);
                        }
                      }}
                      onKeyDown={(e) => e.key === "Enter" && processMemory()}
                      placeholder={showValidationError ? "DATA REQUIRED FOR KERNEL SYNC..." : "INPUT MEMORY DATA FOR GEMINI ANALYSIS..."}
                      className={`w-full bg-[var(--card-bg)] border rounded-2xl px-6 py-4 text-sm font-medium tracking-wide focus:outline-none transition-all pr-12 shadow-sm ${
                        showValidationError 
                          ? "border-red-500/50 text-red-600 placeholder:text-red-500/50" 
                          : "border-[var(--line)] focus:border-[var(--accent)]/50 text-[var(--ink)]"
                      }`}
                      disabled={isProcessing}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                       <label className="cursor-pointer p-2 hover:bg-[var(--line)]/40 rounded-xl transition-all text-[var(--ink)]/30 hover:text-[var(--accent)]">
                          <Upload className="w-4 h-4" />
                          <input 
                            type="file" 
                            className="hidden" 
                            accept="image/*" 
                            onChange={handleFileUpload}
                            disabled={isProcessing}
                          />
                       </label>
                    </div>
                  </div>
                  
                  <button
                    onClick={processMemory}
                    disabled={isProcessing && !selectedFile}
                    className={`p-4 rounded-2xl transition-all ${
                      showValidationError
                        ? "bg-red-500/10 text-red-500"
                        : "bg-[var(--accent)] text-white hover:opacity-90 disabled:opacity-20 shadow-sm"
                    }`}
                  >
                    {isProcessing ? (
                      <RefreshCw className="w-5 h-5 animate-spin" />
                    ) : showValidationError ? (
                      <AlertCircle className="w-5 h-5" />
                    ) : (
                      <Send className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </motion.div>
            </div>
          </footer>
        </main>
      </div>
    </div>
  );
}
