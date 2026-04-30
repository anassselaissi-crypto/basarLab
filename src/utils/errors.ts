/**
 * ABSTRA KERNEL - ERROR HANDLER
 * Normalizes system and provider errors.
 */

export const normalizeKernelError = (error: string): string => {
  if (error.includes("Gemini API key not found") || error.includes("GEMINI_ERROR")) {
    return "API_CONFIG_ERROR: Your Gemini API key is missing or invalid. Please check your environments.";
  }
  
  if (error.includes("INTERNAL_GPU_ERROR") || error.includes("KERNEL_EXECUTION_ERROR")) {
    return "GPU_INTERNAL_ERROR: Local kernel bridge failed. Please verify /kernels directory linkage.";
  }
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
  if (error.startsWith("PROVIDER_ERROR:")) {
    return "The selected model provider returned a configuration error. Checking fallback logic.";
  }
  return error;
};
