# [Agent 3] Formal Mathematical Specification
## Duo Layer & Structural Stability Field (SSF) Model

### 1. Overview
This document defines the official mathematical foundation for [Agent 3]'s processing engine. The goal is to perform luminance balancing and color grading by fusing two virtual exposure channels (**Fast** and **Slow**) using a localized **Structural Stability Field (SSF)**.

### 2. Core Equations

#### 2.1 Structural Stability Field (SSF)
The SSF, denoted as $Sc(r)$, is a sigmoid-like field that determines the baseline dominance of the highlight-protected channel across the image space $r$.

$$Sc(r) = \frac{1}{2} \left[ 1 + \tanh\left(\frac{r - r_h}{\Delta}\right) \right]$$

- $r$: Local pixel coordinates/region.
- $r_h$: Transition horizon (anchor point for exposure shift).
- $\Delta$: Field transition width (controls the softness of the transition).

#### 2.2 Transition Weight
The transition weight $Wt(r)$ calculates the "energy" of the mid-tone transition, derived from the SSF to ensure perfect complementarity.

$$Wt(r) = 4 \cdot Sc(r) \cdot [1 - Sc(r)]$$

#### 2.3 Layer Assignments
The fusion process utilizes two primary weights:
- **Fast Weight ($w_f$):** Assigned to the **Fast_Channel** ($I_{fast}$), prioritizing highlight retention.
  - $w_f(r) = Sc(r)$
- **Slow Weight ($w_s$):** Assigned to the **Slow_Channel** ($I_{slow}$), prioritizing shadow recovery.
  - $w_s(r) = Wt(r)$

#### 2.4 Normalized Fusion Rule
To ensure energy conservation and prevent clipping, weights are normalized using a small non-zero epsilon $\epsilon$ to prevent division by zero.

$$\tilde{w}_f(r) = \frac{w_f(r)}{w_f(r) + w_s(r) + \epsilon}$$
$$\tilde{w}_s(r) = \frac{w_s(r)}{w_f(r) + w_s(r) + \epsilon}$$

Final local fusion:
$$I_{final}(r) = \tilde{w}_f(r) \cdot I_{fast} + \tilde{w}_s(r) \cdot I_{slow}$$

### 3. Processing Parameters
| Parameter | Symbol | Role | Implementation Note |
|---|---|---|---|
| Horizon | $r_h$ | Centroid | Dynamic based on Agent 1 analysis |
| Delta | $\Delta$ | Softness | Controlled by Agent 2 Creativity/SSF spec |
| Epsilon | $\epsilon$ | Stability | Constant ($10^{-6}$) |

### 4. Implementation Constraints
- **Hardware Agnostic:** Equations must be implemented as vectorized tensor operations.
- **Latency Target:** Must be compatible with AMD SSH real-time processing requirements.
- **I/O:** Inputs $I_{fast}$ and $I_{slow}$ are derived from the primary image buffer via virtual shutter-speed shifts.

---
*Status: Formalized Stage A.3*
