# Agent 3 ROCm/AMD Backend

Agent 3 is the real-time simulation backend. It is not an LLM and does not generate images/prompts.

## Run CPU fallback

```bash
cd gpu
python -m venv .venv
source .venv/bin/activate
pip install -r requirements-rocm.txt
python agent3_rocm_worker.py
```

## ROCm note

PyTorch on ROCm commonly exposes the device through `torch.cuda.is_available()`.
That is expected. The worker labels it `torch-rocm-compatible` when a HIP/ROCm build is available.

## API

```bash
curl http://localhost:8790/health
curl -X POST http://localhost:8790/simulate \
  -H 'Content-Type: application/json' \
  --data @../src/config/basar.simulation-config.v1.example.json
```
