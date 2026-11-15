import { describe, it, expect } from "vitest";
import { optionsForResBill, tiersFrom, tiersDayNight } from "@/components/QuoteBuilder";

// Bill 40,000 YER at 290/kWh → 6.2 kW home system; the day/night choice changes the battery.
const base = () => tiersFrom(optionsForResBill(40000, 290));
describe("day/night usage choice (bill 40,000)", () => {
  it("50/50 keeps 6.2 kW · battery 5.12 · 4 panels", () => expect(tiersDayNight(base(), 50)!.rec.title).toContain("بطارية 5.12 كيلو — 4 ألواح"));
  it("night 70% picks battery 10.24 · 5 panels", () => expect(tiersDayNight(base(), 70)!.rec.title).toContain("بطارية 10.24 كيلو — 5 ألواح"));
  it("day 70% stays on 5.12 (no smaller 6.2 kW system)", () => expect(tiersDayNight(base(), 30)!.rec.title).toContain("بطارية 5.12 كيلو"));
});
