import { llmProvider } from "../providers/llmProvider";
import { visionProvider } from "../providers/visionProvider";
import { AGENT1_SYSTEM_PROMPT, AGENT2_SYSTEM_PROMPT, AGENT3_SYSTEM_PROMPT } from "./prompts";
import { computeSc, computeDoubleExposureEnergy, computeDoubleExposureMotion, DuoLensParams } from "../core/ssfDuoLens";

export interface Agent1Output {
  technicalSummary: string;
  dramaticInsight: string;
  semioticMeaning: string;
  validatedContext: {
    sceneType: string;
    domain: string;
    physicalSSFConstraints: string;
    constraints: string;
    forbiddenDistortions: string;
    requiredFidelityLevel: string;
    visualIntention: string;
    outputBoundary: string;
    enhancements: {
      denoise: number;
      sharpness: number;
    };
  };
  ssfParams: {
    rh: number;
    deltaR: number;
    r: number;
    omega: number;
    Sc: number;
    regime: "GR" | "QM" | "SSF";
  };
  contextStatus: "Validated" | "Insufficient - clarification required before generation" | "Interaction" | "Greeting";
  detectedContext: string;
}

/**
 * Agent 1: Sovereign Analyst
 * Centered on Gemini for high-precision analytical extraction.
 * Deterministic math applied via ssfDuoLens core.
 */
export const runAgent1 = async (
  input: string, 
  fidelity: number = 1.0,
  image?: { data: string; mimeType: string },
  history?: { role: "user" | "model"; parts: { text: string }[] }[]
): Promise<Agent1Output> => {
  try {
    const response = await llmProvider.generate({
      prompt: `[SOVEREIGN_ANALYSIS] Target Input: "${input}"\n\nFIDELITY_SETTING: ${fidelity}`,
      image,
      history,
      systemInstruction: AGENT1_SYSTEM_PROMPT,
      temperature: 0.1,
      responseMimeType: "application/json"
    });

    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : response.text);

    // Apply Deterministic SSF Logic (Deterministic part)
    const rh = data.ssfParams?.rh ?? 0.5;
    const deltaR = data.ssfParams?.deltaR ?? (0.1 * rh);
    const r = data.ssfParams?.r ?? 0.5;
    const omega = data.ssfParams?.omega ?? 0.0;

    const Sc = computeSc(r, rh, deltaR);
    
    let regime: "GR" | "QM" | "SSF" = "SSF";
    if (Sc >= 0.8) regime = "GR";
    else if (Sc <= 0.2) regime = "QM";

    const enhancedOutput: Agent1Output = {
      technicalSummary: data.technicalSummary || "Analysis pending.",
      dramaticInsight: data.dramaticInsight || "Context unclear.",
      semioticMeaning: data.semioticMeaning || "Symbolic data unavailable.",
      detectedContext: data.detectedContext || "General",
      contextStatus: data.contextStatus || "Validated",
      validatedContext: {
        sceneType: data.validatedContext?.sceneType || (image ? "Cinematic Render" : "Technical Analysis"),
        domain: data.validatedContext?.domain || "General Analysis",
        physicalSSFConstraints: data.validatedContext?.physicalSSFConstraints || "Standard scaling",
        constraints: data.validatedContext?.constraints || "None",
        forbiddenDistortions: data.validatedContext?.forbiddenDistortions || "None",
        requiredFidelityLevel: data.validatedContext?.requiredFidelityLevel || "BALANCED",
        visualIntention: data.validatedContext?.visualIntention || "Balanced exposition",
        outputBoundary: data.validatedContext?.outputBoundary || "16:9 cinematic framing",
        enhancements: {
          denoise: data.validatedContext?.enhancements?.denoise ?? 0.2,
          sharpness: data.validatedContext?.enhancements?.sharpness ?? 0.4
        }
      },
      ssfParams: {
        rh,
        deltaR,
        r,
        omega,
        Sc,
        regime
      }
    };

    return enhancedOutput;
  } catch (err: any) {
    // Fallback logic for Agent 1
    const isVisual = /image|vision|look|see|photo|render|visual|photo|graphic|صورة|رؤية|مشهد|تصوير/i.test(input);
    const rh = 0.5;
    const r = 0.5;
    const deltaR = 0.05;
    const Sc = computeSc(r, rh, deltaR);

    return {
      technicalSummary: "System operating in Deterministic Fallback Mode. Analysis handled by local kernel heuristics.",
      dramaticInsight: "Operational continuity active. DNA Protocol baseline engaged.",
      semioticMeaning: "Transitioning to deterministic mathematical scaling.",
      detectedContext: isVisual ? "Visual" : "Technical",
      contextStatus: "Validated",
      ssfParams: {
        rh,
        deltaR,
        r,
        omega: 0.1,
        Sc,
        regime: "SSF"
      },
      validatedContext: {
        sceneType: isVisual ? "Cinematic Render" : "Technical Schematic",
        domain: "Local Kernel",
        physicalSSFConstraints: "Standard Sc(r) scaling",
        constraints: "Deterministic processing",
        forbiddenDistortions: "No LLM artifacts",
        requiredFidelityLevel: fidelity > 0.7 ? "STRICT" : "BALANCED",
        visualIntention: "Balanced Luminance",
        outputBoundary: "16:9 cinematic framing",
        enhancements: {
          denoise: 0.2,
          sharpness: 0.4
        }
      }
    };
  }
};

/**
 * Agent 2: Visual Engineer
 * Exclusive interface for AMD Vision processing and Duo Lens HDR normalization.
 */
export const runAgent2 = async (
  analysis: Agent1Output, 
  creativity: number = 0.2, 
  aspectRatio: "16:9" | "1:1" | "4:3" | "9:16" = "16:9",
  userEnhancements?: { denoise: number; sharpness: number }
): Promise<{ image: string; log: string }> => {
  const enhancements = userEnhancements || analysis.validatedContext.enhancements;
  const context = JSON.stringify({ ...analysis.validatedContext, enhancements });
  
  // Deterministic Duo Lens Logic
  const duoParams: DuoLensParams = {
    Ifast: 0.8,
    Islow: 1.2,
    tFast: 0.01,
    tSlow: 0.04,
    Sfast: 0.5,
    Sslow: 0.5,
    r: analysis.ssfParams.r,
    rh: analysis.ssfParams.rh,
    deltaR: analysis.ssfParams.deltaR,
    omega: analysis.ssfParams.omega
  };

  const hdr = computeDoubleExposureEnergy(duoParams);
  const motion = computeDoubleExposureMotion(duoParams);

  // Dynamic Prompt Construction
  const dynamicStrategy = creativity > 0.6 ? "Abstarct/Expressionist" : (aspectRatio === "16:9" ? "Cinematic realism" : "High-fidelity macro");
  const visualIntention = analysis.validatedContext.visualIntention;
  const contextTag = analysis.detectedContext.toUpperCase();
  
  const fullPrompt = `[AMD_VISION_SPEC] 
  CORE_CONTEXT: {${contextTag}: ${analysis.technicalSummary.slice(0, 200)}} 
  INTENTION: ${visualIntention}
  STRATEGY: ${dynamicStrategy}
  [DuoLens_HDR] Energy: ${hdr.EfinalHDR.toFixed(4)} | Motion: ${motion.EfinalMotion.toFixed(4)}
  [SSF_Regime] ${analysis.ssfParams.regime}
  [ENHANCEMENTS] Denoise: ${enhancements.denoise} | Sharpness: ${enhancements.sharpness}
  [INSTRUCTION] Target: ${analysis.validatedContext.sceneType}. Apply Spectral Filter F ${hdr.F.toFixed(2)}. 
  Constraint: ${analysis.validatedContext.constraints}.`;

  const response = await visionProvider.generate({
    context: fullPrompt,
    systemInstruction: AGENT2_SYSTEM_PROMPT,
    creativity: creativity,
    aspectRatio: aspectRatio
  });

  return {
    image: response.image,
    log: `[Agent 2] ${response.log} | HDR: ${hdr.EfinalHDR.toFixed(3)} | MotionSuppression: ${motion.EfinalMotion.toFixed(3)}`
  };
};

/**
 * Agent 3: RAW & Lighting Processor
 * Uses Gemini for narrative roadmap and deterministic SSF math for technical validation.
 */
export const runAgent3 = async (
  analysis: Agent1Output,
  skipLLM: boolean = false
): Promise<{ solution: string; roadmap: string }> => {
  const duoParams: DuoLensParams = {
    Ifast: 0.8, Islow: 1.2, tFast: 0.01, tSlow: 0.04, Sfast: 0.5, Sslow: 0.5,
    r: analysis.ssfParams.r,
    rh: analysis.ssfParams.rh,
    deltaR: analysis.ssfParams.deltaR,
    omega: analysis.ssfParams.omega
  };

  const hdr = computeDoubleExposureEnergy(duoParams);
  const motion = computeDoubleExposureMotion(duoParams);

  const deterministicLog = `[SSF_Duo_Report] Regime: ${analysis.ssfParams.regime} | Sc: ${analysis.ssfParams.Sc.toFixed(4)} | HDR_E: ${hdr.EfinalHDR.toFixed(4)} | Motion_E: ${motion.EfinalMotion.toFixed(4)}`;

  if (skipLLM) {
    return {
      solution: `[Agent 3 Deterministic] SSF Logic applied to core luminance. Narrative roadmap bypassed for credit optimization.\n\n${deterministicLog}`,
      roadmap: "Deterministic Fallback Active: Values locked via local ssfDuoLens core."
    };
  }

  try {
    const llmResponse = await llmProvider.generate({
      prompt: `[RAW_DEVELOPMENT_LOG] 
      Context: ${JSON.stringify({ 
        scene: analysis.validatedContext.sceneType,
        intention: analysis.validatedContext.visualIntention,
        ssf: analysis.ssfParams 
      })}
      Deterministic_Values: ${deterministicLog}
      
      INSTRUCTION: Apply Tone & Color mapping using the SSF parameters. 
      Analyze the ${analysis.ssfParams.regime} regime for stylistic color grading.`,
      systemInstruction: AGENT3_SYSTEM_PROMPT,
      temperature: 0.1,
      responseMimeType: "application/json"
    });

    const jsonMatch = llmResponse.text.match(/\{[\s\S]*\}/);
    const data = JSON.parse(jsonMatch ? jsonMatch[0] : llmResponse.text);

    return {
      solution: `[Agent 3] ${data.details || data.solution || 'Processing complete.'}\n\n${deterministicLog}`,
      roadmap: data.roadmap || `Solution Roadmap based on ${analysis.ssfParams.regime} regime.`
    };
  } catch (err) {
    return {
      solution: `[Agent 3 Deterministic] ${deterministicLog}`,
      roadmap: "Gemini roadmap bypassed. SSF Local Logic engaged."
    };
  }
};
