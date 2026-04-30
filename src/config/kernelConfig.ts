/**
 * ABSTRA KERNEL CONFIGURATION
 * Provider-neutral settings and model definitions.
 */

export const KernelConfig = {
  llmProvider: 'gemini', 
  visionProvider: process.env.VISION_PROVIDER || 'amd-vision',
  
  // Primary API keys
  geminiKey: process.env.GEMINI_API_KEY,
  amdVisionKey: process.env.AMD_VISION_API_KEY || '',
  
  models: {
    text: 'gemini-3.1-flash-lite-preview',
    gemini: 'gemini-3.1-flash-lite-preview',
    vision: process.env.VISION_MODEL || 'amd-vision-v1',
  },
  
  system: {
    appUrl: process.env.APP_URL || '',
    version: '2.1.0-cerebras-amd-stable',
  }
};
