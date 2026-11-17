// Editable sizing factors ("المعادلات" screen). Saved in app_settings key `formulas` (text_value JSON),
// sent to the bot as FORMULAS in bot-catalog, and applied live in QuoteBuilder — one set of values for app and bot.
export type Formulas = {
  days: number;          // days per month for daily need
  sun: number;           // peak sun hours per day
  dod: number;           // usable battery share
  night: { 30: number; 50: number; 70: number }; // night % used for each day/night choice
  resRanges: number[][]; // residential preset ranges (kWh/day), same order as residential presets
  dcMaxLines: number;    // largest DC box (lines)
  dcStep: number;        // DC box line step
  acSingleV: number;     // single-phase voltage
  acThreeDiv: number;    // √3 × 380
  acSafety: number;      // breaker safety factor
  cableM: number;        // cable metres per system
  mc4PerString: number;  // MC4 sets per string
};
export const DEFAULT_FORMULAS: Formulas = {
  days: 26, sun: 5, dod: 0.85, night: { 30: 30, 50: 50, 70: 70 },
  resRanges: [[1.2], [2.5], [2.5], [4], [4], [5, 7.5], [13], [21], [31.7], [35.6], [55.4], [63.4], [71.3], [83.2], [106.9]],
  dcMaxLines: 10, dcStep: 2, acSingleV: 220, acThreeDiv: 658, acSafety: 1.25, cableM: 1, mc4PerString: 1,
};
export const F: Formulas = structuredClone(DEFAULT_FORMULAS);
export const mergeFormulas = (v: unknown): Formulas => {
  const o = (v && typeof v === "object" ? v : {}) as Partial<Formulas>;
  const num = (x: unknown, d: number) => (typeof x === "number" && isFinite(x) && x > 0 ? x : d);
  const D = DEFAULT_FORMULAS;
  return {
    days: num(o.days, D.days), sun: num(o.sun, D.sun), dod: num(o.dod, D.dod),
    night: { 30: num(o.night?.[30], 30), 50: num(o.night?.[50], 50), 70: num(o.night?.[70], 70) },
    resRanges: Array.isArray(o.resRanges) && o.resRanges.length === D.resRanges.length ? o.resRanges.map((r, i) => (Array.isArray(r) && r.every((x) => typeof x === "number") ? r : D.resRanges[i]!)) : D.resRanges,
    dcMaxLines: num(o.dcMaxLines, D.dcMaxLines), dcStep: num(o.dcStep, D.dcStep), acSingleV: num(o.acSingleV, D.acSingleV),
    acThreeDiv: num(o.acThreeDiv, D.acThreeDiv), acSafety: num(o.acSafety, D.acSafety), cableM: num(o.cableM, D.cableM), mc4PerString: num(o.mc4PerString, D.mc4PerString),
  };
};
export const applyFormulas = (v: unknown) => Object.assign(F, mergeFormulas(v));
// DC box: qty = ⌈N / max⌉, lines = ⌈(N/qty)/step⌉ × step.
export const dcBoxes = (strings: number, f: Formulas = F) => {
  const qty = Math.max(1, Math.ceil(strings / f.dcMaxLines));
  return { qty, lines: Math.ceil(strings / qty / f.dcStep) * f.dcStep };
};
// AC breaker amps = W / V × safety (single) or W / (√3×380) × safety (three).
export const acBreakerAmps = (watts: number, three: boolean, f: Formulas = F) => (watts / (three ? f.acThreeDiv : f.acSingleV)) * f.acSafety;
