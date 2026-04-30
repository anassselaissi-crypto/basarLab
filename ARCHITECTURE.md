# Abstra Memory Core - Production Architecture (v2.1.0-Stable)

## Status: Production-Ready (Mocks Removed)
This project is in its **Production-Ready** state. All mock providers, routes, and development fallbacks have been completely excised. The system now operates on a deterministic mathematical foundation for visual processing and a high-precision linguistic backbone.

## Analysis Stack
- **Linguistic Engine**: Cerebras AI (Llama 3.1 8B/70B)
- **Visual Engine**: AMD Vision (GPU-Backed production endpoint)
- **Mathematical Kernel**: Deterministic local SSF Duo-Layer Fusion

## Formal Processing Model
The core of [Agent 3] is now driven by formal equations implemented in `src/utils/ssf.ts`:
- **Structural Stability Field (Sc)**: Deterministic sigmoid field.
- **Transition Weight (Wt)**: Calculated from Sc to ensure energy conservation.
- **Duo-Layer Fusion**: Localized blending of Fast/Slow virtual exposure channels.

## Deployment Guide
This repository is optimized for direct deployment on GPU-backed servers:
1. **Clone**: `git clone <repo>`
2. **Install**: `npm install`
3. **Environment**: Configure `.env` with `CEREBRAS_API_KEY` and `AMD_VISION_API_KEY`.
4. **Execution**: `npm run dev` (for development) or `npm run build && npm run start`.
