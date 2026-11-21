import { describe, expect, it } from "vitest";
import { evaluate, EXAMPLES } from "./calc";

describe("unit calculator", () => {
  it.each(EXAMPLES)("example evaluates: %s", e => expect(() => evaluate(e)).not.toThrow());
  it("pump power: 2.5 bar × 30 L/min = 0.125 kW", () => expect(evaluate("2.5 bar * 30 L/min to kW").text).toBe("0.125 kW"));
  it("Reynolds number is dimensionless", () => expect(Number(evaluate("998 kg/m^3 * 1.5 m/s * 50 mm / (1 cP)").text)).toBeCloseTo(74850, 0));
  it("min() still works as a function", () => expect(evaluate("min(3, 2)").text).toBe("2"));
  it("molar volume at 25 °C, 1 atm ≈ 24.45 L/mol", () => expect(parseFloat(evaluate("gasConstant * 298.15 K / (101.325 kPa) to L/mol").text)).toBeCloseTo(24.465, 2));
});
