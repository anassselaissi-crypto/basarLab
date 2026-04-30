import { useState, useCallback } from "react";
import { runAgent1, runAgent2, runAgent3, Agent1Output } from "../agents/agentService";
import { normalizeKernelError } from "../utils/errors";

export interface Message {
  id: string;
  role: "user" | "agent1" | "agent2" | "agent3" | "error" | "orch";
  type: "text" | "image" | "analysis";
  content: any;
  timestamp: Date;
}

export const useKernel = (config: {
  fidelity: number;
  creativity: number;
  denoise: number;
  sharpness: number;
  outputBoundary: string;
  activeStrategy: string;
  boundaryOptions: any[];
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [intensity, setIntensity] = useState(0);

  const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const addOrchMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: generateId("orch"),
      role: "orch",
      type: "text",
      content: text,
      timestamp: new Date()
    }]);
  }, []);

  const addErrorMessage = useCallback((text: string) => {
    setMessages(prev => [...prev, {
      id: generateId("error"),
      role: "error",
      type: "text",
      content: normalizeKernelError(text),
      timestamp: new Date()
    }]);
  }, []);

  const executeAgent2 = async (analysis: Agent1Output) => {
    setIntensity(0.8);
    const selectedBoundary = config.boundaryOptions.find(b => b.id === config.outputBoundary) || config.boundaryOptions[0];
    
    try {
      const { image, log } = await runAgent2(
        analysis, 
        config.creativity, 
        selectedBoundary.ratio,
        { denoise: config.denoise, sharpness: config.sharpness }
      );
      setMessages(prev => [...prev, {
        id: generateId("agent2"),
        role: "agent2",
        type: "image",
        content: { image, log },
        timestamp: new Date()
      }]);

      // Move to Agent 3 for RAW/Color processing automatically after generation
      // Use skipLLM if we want to save tokens after a large visual generation
      await executeAgent3(analysis, true); 
    } catch (genErr) {
      addErrorMessage(genErr instanceof Error ? genErr.message : String(genErr));
    }
  };

  const executeAgent3 = async (analysis: Agent1Output, skipLLM: boolean = false) => {
    setIntensity(0.9);
    try {
      const { solution, roadmap } = await runAgent3(analysis, skipLLM);
      setMessages(prev => [...prev, {
        id: generateId("agent3"),
        role: "agent3",
        type: "analysis",
        content: { solution, roadmap },
        timestamp: new Date()
      }]);
      setIntensity(1.0);
    } catch (optErr) {
      console.error("Agent 3 fail:", optErr);
      addErrorMessage("Agent 3 processing anomaly. Kernel integrity maintained via local math.");
    }
  };

  const processInput = async (input: string, image?: { data: string; mimeType: string }) => {
    if (!input.trim() && !image) return;

    setIsProcessing(true);
    setIntensity(0.2);
    
    setMessages(prev => [...prev, {
      id: generateId("user"),
      role: "user",
      type: "text",
      content: image ? `[IMAGE_ATTACHED] ${input}` : input,
      timestamp: new Date()
    }]);

    const lowerInput = input.toLowerCase();

    try {
      let selectedAgent: "agent1" | "agent2" | "agent3" | "auto" = "auto";
      if (lowerInput.includes("force agent 2")) selectedAgent = "agent2";
      else if (lowerInput.includes("force agent 3") || lowerInput.includes("use raw")) selectedAgent = "agent3";
      else if (lowerInput.includes("force agent 1")) selectedAgent = "agent1";

      const lastAnalysis = [...messages].reverse().find(m => m.role === 'agent1' && m.type === 'analysis')?.content;

      // Extract conversation history for interactive context (Limit to last 10 messages for performance)
      const chatHistory = messages
        .filter(m => (m.role === 'user' || m.role === 'agent1'))
        .slice(-10)
        .map(m => {
          let text = "";
          if (typeof m.content === 'string') text = m.content;
          else if (m.content && m.content.technicalSummary) text = m.content.technicalSummary;
          
          return {
            role: (m.role === 'user' ? 'user' : 'model') as "user" | "model",
            parts: [{ text }]
          };
        })
        .filter(m => m.parts[0].text); // Only keep messages with content

      if ((selectedAgent === "agent2" || selectedAgent === "agent3") && !lastAnalysis) {
        addOrchMessage(`Routing conflict: ${selectedAgent} requested without context. Redirecting to Agent 1.`);
        selectedAgent = "agent1";
      }

      if (selectedAgent === "auto" || selectedAgent === "agent1") {
        addOrchMessage("Routing: Input assigned to [Agent 1] Sovereign Analyst.");
        setIntensity(0.5);
        addOrchMessage("Agent 1: Beginning multi-modal analysis & context extraction...");
        const result = await runAgent1(input, config.fidelity, image, chatHistory);
        
        addOrchMessage(`Agent 1: Analysis complete. Status: ${result.contextStatus}`);
        const isValidated = result.contextStatus?.toString().includes("Validated");
        
        setMessages(prev => [...prev, {
          id: generateId("agent1"),
          role: "agent1",
          type: isValidated ? "analysis" : "text",
          content: isValidated 
            ? result 
            : (result.contextStatus === "Interaction" || result.contextStatus === "Greeting" 
                ? result.technicalSummary 
                : `${result.technicalSummary}\n\n[Status: ${result.contextStatus}]`),
          timestamp: new Date()
        }]);

        if (isValidated) {
          const context = result.detectedContext || "";
          const isVisualIntent = /visual|dramatic|artistic|cinematic|creative|render/i.test(context);
          const isTechnicalIntent = /technical|deterministic|scientific|schematic|mathematical/i.test(context);

          if (isVisualIntent && !isTechnicalIntent) {
            addOrchMessage("Intelligence routed to [Agent 2] for high-fidelity visual synthesis.");
          } else {
            addOrchMessage("Intelligence routed to [Agent 3] for RAW logic & spectral mapping.");
          }
          
          const shouldVisualize = config.activeStrategy === "visual" || (config.activeStrategy === "auto" && isVisualIntent && !isTechnicalIntent);
          
          if (shouldVisualize) {
            await executeAgent2(result);
          } else {
            await executeAgent3(result);
          }
        } else {
          addOrchMessage("Routing: Context not validated for multi-agent synthesis. Awaiting user parameters.");
        }
        
        return result;
      } else if (selectedAgent === "agent2") {
        await executeAgent2(lastAnalysis);
        return lastAnalysis;
      } else if (selectedAgent === "agent3") {
        await executeAgent3(lastAnalysis);
        return lastAnalysis;
      }
    } catch (err) {
      addErrorMessage(err instanceof Error ? err.message : String(err));
    } finally {
      setIsProcessing(false);
      setTimeout(() => setIntensity(0), 2000);
    }
  };

  return { messages, setMessages, isProcessing, intensity, processInput };
};
