import { GoogleGenAI } from "@google/genai";
import { KernelConfig } from "../config/kernelConfig";

export interface InferenceRequest {
  prompt: string;
  history?: { role: "user" | "model"; parts: { text: string }[] }[];
  image?: {
    data: string;
    mimeType: string;
  };
  systemInstruction?: string;
  temperature?: number;
  responseMimeType?: string;
}

export interface InferenceResponse {
  text: string;
  usage?: any;
}

/**
 * DNA Kernel LLM Provider (Gemini-Only Mode)
 * Exclusive interface for Google Gemini AI.
 */
class LLMProvider {
  private geminiAI: any = null;

  constructor() {
    this.initGemini();
  }

  private initGemini() {
    const key = KernelConfig.geminiKey || (process.env as any).GEMINI_API_KEY;
    if (key) {
      this.geminiAI = new GoogleGenAI({ apiKey: key });
    }
  }

  /**
   * Main generation entry point with 15s timeout protection
   */
  async generate(req: InferenceRequest): Promise<InferenceResponse> {
    const timeout = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error("TIMEOUT: Gemini inference exceeded 15s limit.")), 15000)
    );

    return Promise.race([this._generateInternal(req), timeout]);
  }

  private async _generateInternal(req: InferenceRequest): Promise<InferenceResponse> {
    if (!this.geminiAI) {
      this.initGemini();
    }
    
    if (!this.geminiAI) {
      throw new Error("GEMINI_ERROR: Gemini API key not found. Ensure GEMINI_API_KEY is set.");
    }

    try {
      const contents: any[] = req.history ? [...req.history] : [];
      const userParts: any[] = [{ text: req.prompt }];
      
      if (req.image) {
        userParts.push({
          inlineData: {
            data: req.image.data,
            mimeType: req.image.mimeType
          }
        });
      }

      contents.push({ role: "user", parts: userParts });

      const response = await this.geminiAI.models.generateContent({
        model: KernelConfig.models.gemini,
        contents,
        config: {
          systemInstruction: req.systemInstruction,
          temperature: req.temperature ?? 0.7,
          responseMimeType: req.responseMimeType === 'application/json' ? 'application/json' : 'text/plain'
        }
      });

      return {
        text: response.text || "",
        usage: { total_tokens: 0 }
      };
    } catch (err) {
      console.error("[Gemini] failed:", err);
      throw err;
    }
  }
}

export const llmProvider = new LLMProvider();
