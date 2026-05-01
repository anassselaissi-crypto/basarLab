#!/usr/bin/env python3
"""
Agent 3 ROCm/AMD simulation worker scaffold.

Contract:
- Agent 3 is not an LLM.
- It consumes SimulationConfig and returns frames/metrics.
- This file provides a GPU-ready telemetry/simulation backend skeleton.
- Replace the lightweight tensor section with the full ROCm/HIP kernel later.

Run:
  python gpu/agent3_rocm_worker.py

Endpoints:
  GET  /health
  POST /simulate
"""

from __future__ import annotations

import math
import os
from typing import Any, Dict, Literal, Optional

from fastapi import FastAPI
from pydantic import BaseModel, Field
import uvicorn

try:
    import torch
except Exception:  # pragma: no cover
    torch = None


Mode = Literal["DUO", "GIANT_SUPPRESSION", "GIANT_BLUR_MAP"]


class WorldConfig(BaseModel):
    scene: int = Field(0, ge=0, le=2)
    mood: int = Field(0, ge=0, le=3)
    lightX: float = Field(0.82, ge=0, le=1)
    lightY: float = Field(0.22, ge=0, le=1)
    lightPower: float = Field(1.0, ge=0, le=3)
    atmosphere: float = Field(0.72, ge=0, le=2)
    shadowStrength: float = Field(0.82, ge=0, le=2)
    motionAmount: float = Field(1.0, ge=0, le=3)
    sceneDetail: float = Field(1.0, ge=0, le=3)
    cinematicContrast: float = Field(1.0, ge=0, le=2.5)


class SimulationConfig(BaseModel):
    schemaVersion: str = "basar.simulation-config.v1"
    source: str = "agent3-rocm-worker"
    mode: Mode = "GIANT_BLUR_MAP"
    previewIndex: int = Field(0, ge=0, le=16)
    world: WorldConfig = Field(default_factory=WorldConfig)
    params: Dict[str, Dict[str, Any]] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)


def _device() -> str:
    if torch is not None and torch.cuda.is_available():
        # ROCm PyTorch commonly reports HIP devices through the CUDA API surface.
        return "cuda"
    return "cpu"


def _active_params(config: SimulationConfig) -> Dict[str, Any]:
    if config.mode == "DUO":
        return config.params.get("duo", {})
    if config.mode == "GIANT_SUPPRESSION":
        return config.params.get("suppression", {})
    return config.params.get("blur", {})


def simulate_metrics(config: SimulationConfig) -> Dict[str, Any]:
    p = _active_params(config)

    if config.mode == "DUO":
        shutter = max(float(p.get("fastShutter", 1 / 250)), float(p.get("slowShutter", 1 / 60)))
        light = float(p.get("lightLux", 900))
        iris = max(float(p.get("irisHigh", 0.42)), float(p.get("irisLow", 0.88)))
        focal = float(p.get("focalMm", 35))
        distance = float(p.get("distanceM", 18))
        motion = float(p.get("motionMps", 2.5))
    else:
        shutter = float(p.get("shutter", 1 / 3 if config.mode == "GIANT_BLUR_MAP" else 1 / 18))
        light = float(p.get("lightLux", 2200 if config.mode == "GIANT_BLUR_MAP" else 1800))
        iris = float(p.get("iris", 0.84 if config.mode == "GIANT_BLUR_MAP" else 0.72))
        focal = float(p.get("focalMm", 64 if config.mode == "GIANT_BLUR_MAP" else 38))
        distance = float(p.get("distanceM", 56 if config.mode == "GIANT_BLUR_MAP" else 42))
        motion = float(p.get("motionMps", 5.8 if config.mode == "GIANT_BLUR_MAP" else 4.0))

    exposure = light * shutter * iris
    blur_px = (focal / max(distance, 0.75)) * motion * shutter * 220
    burn_risk = max(0.0, min(1.0, exposure / 1500.0))
    flow_energy = max(0.0, min(1.0, blur_px / 20.0)) if config.mode == "GIANT_BLUR_MAP" else 0.0
    identity_residual = max(0.0, 1.0 - min(1.0, blur_px / 14.0)) if config.mode == "GIANT_SUPPRESSION" else None

    device = _device()

    gpu_probe = None
    if torch is not None:
        x = torch.linspace(0, 1, 256, device=device)
        gpu_probe = float((torch.sin(x * math.pi) ** 2).mean().detach().cpu())

    return {
        "mode": config.mode,
        "device": device,
        "gpuRuntime": "torch-rocm-compatible" if device == "cuda" else "cpu-fallback",
        "exposureSignal": exposure,
        "blurPx": blur_px,
        "burnRisk": burn_risk,
        "flowEnergy": flow_energy,
        "identityResidual": identity_residual,
        "gpuProbe": gpu_probe,
        "configEcho": config.model_dump(),
    }


app = FastAPI(title="Abstra Agent 3 ROCm Worker", version="0.1.0")


@app.get("/health")
def health() -> Dict[str, Any]:
    return {
        "ok": True,
        "service": "agent3-rocm-worker",
        "torch": torch.__version__ if torch is not None else None,
        "device": _device(),
    }


@app.post("/simulate")
def simulate(config: SimulationConfig) -> Dict[str, Any]:
    return {
        "schemaVersion": "basar.telemetry.v1",
        "metrics": simulate_metrics(config),
    }


if __name__ == "__main__":
    host = os.getenv("AGENT3_HOST", "0.0.0.0")
    port = int(os.getenv("AGENT3_PORT", "8790"))
    uvicorn.run(app, host=host, port=port)
