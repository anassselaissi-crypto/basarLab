/**
 * ABSTRA KERNEL - SSF + DUO LENS DETERMINISTIC CORE
 * 
 * - computeSc: Derived from tanh profile in SSF Chapter 4.
 * - spectralFilter: Gaussian filter with J ≈ 2.125 and ωc = c/rh (SSF Chapter 3–4).
 * - Duo Lens Functions: Implementation of Double Shutter (Duo) within the SSF framework.
 */

export function computeSc(r: number, rh: number, deltaR: number): number {
  const x = (r - rh) / deltaR;
  const Sc = 0.5 * (1 + Math.tanh(x));
  // Clamp to [0, 1]
  return Math.max(0, Math.min(1, Sc));
}

export function eta(r: number, rh: number, deltaR: number): number {
  return computeSc(r, rh, deltaR);
}

export function spectralFilter(
  omega: number,
  rh: number,
  cConst: number = 1.0, // Light speed constant in normalized units
  J: number = 2.125     // SSF Filter constant
): number {
  const omegaC = cConst / rh;
  const ratio = omegaC === 0 ? 0 : omega / omegaC;
  const exponent = -1 * J * J * ratio * ratio;
  const f = Math.exp(exponent);
  // Boundary safety
  return Math.max(0, Math.min(1, f));
}

export type DuoLensParams = {
  Ifast: number;
  Islow: number;
  tFast: number;
  tSlow: number;
  Sfast: number;
  Sslow: number;
  r: number;
  rh: number;
  deltaR: number;
  omega: number;
  cConst?: number;
  J?: number;
};

/**
 * HDR Energy: E_double = 0.5 * (Ifast*tFast*Sfast + Islow*tSlow*Sslow)
 * Final HDR: E_final = η(r) * E_double * F(ω)
 */
export function computeDoubleExposureEnergy(params: DuoLensParams) {
  const {
    Ifast,
    Islow,
    tFast,
    tSlow,
    Sfast,
    Sslow,
    r,
    rh,
    deltaR,
    omega,
    cConst,
    J,
  } = params;

  const Edouble = 0.5 * (Ifast * tFast * Sfast + Islow * tSlow * Sslow);
  const etaVal = eta(r, rh, deltaR);
  const F = spectralFilter(omega, rh, cConst, J);

  const EfinalHDR = etaVal * Edouble * F;

  return {
    Edouble,
    eta: etaVal,
    F,
    EfinalHDR,
  };
}

/**
 * Motion Energy base: E_motion_base = 0.5 * (Ifast/tFast + Islow/tSlow)
 * Final Motion: E_final = η(r) * E_motion_base * F(ω)
 */
export function computeDoubleExposureMotion(params: DuoLensParams) {
  const {
    Ifast,
    Islow,
    tFast,
    tSlow,
    r,
    rh,
    deltaR,
    omega,
    cConst,
    J,
  } = params;

  const EmotionBase = 0.5 * (Ifast / tFast + Islow / tSlow);
  const etaVal = eta(r, rh, deltaR);
  const F = spectralFilter(omega, rh, cConst, J);

  const EfinalMotion = etaVal * EmotionBase * F;

  return {
    EmotionBase,
    eta: etaVal,
    F,
    EfinalMotion,
  };
}
