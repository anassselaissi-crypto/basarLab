# Abstra Memory Core Engine

Advanced DNA Kernel for multi-agent cognitive data processing, visual synthesis, and RAW-layer grading.

## Status: Stage A.3 (Freeze)
This repository contains the **Stage A.3** version of the Abstra Memory Core. 
- **Architecture**: Frozen and decoupled from specific AI providers.
- **Agents**: Sovereign Analyst (A1), Visual Engineer (A2), and RAW Processor (A3).
- **Processing**: Formal mathematical specifications for SSF/Duo-layer fusion are established in `/processing`.

## Development Context
This project was prepared in the Google AI Studio environment as a migration-ready prototype. It is specifically designed to be moved to an **AMD SSH** environment with **Cerebras** (linguistic) and **Llama Vision** (visual) as the primary backends.

## Current Architecture
- `src/agents`: Content logic (DNA Prompts).
- `src/providers`: Isolated adapters for LLM and Vision services.
- `src/orchestration`: Kernel routing and agent sequence control.
- `processing/`: Mathematical specifications and future Python execution layers.

## Migration to AMD SSH
To continue development in an AMD environment:
1. Clone this repository.
2. Install the analysis stack: `pip install -r requirements_stage_a.txt`.
3. Configure environment variables (see `.env.example`).
4. Implement the formal equations in `processing/python/` using OpenCV and PyTorch.

---
*For technical details, see [ARCHITECTURE.md](ARCHITECTURE.md)*
