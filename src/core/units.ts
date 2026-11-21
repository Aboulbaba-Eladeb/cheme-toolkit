// Units for every input/output, grouped by physical dimension.
// Each unit converts to SI with  si = value * factor + offset  (offset only for absolute temperatures).

export type Dim =
  | "length" | "area" | "velocity" | "pressure" | "temperature" | "deltaT" | "density" | "viscosity"
  | "volFlow" | "massFlow" | "power" | "conductivity" | "htc" | "cp" | "molarEnergy" | "specEnergy"
  | "specEntropy" | "specVolume" | "volume" | "amount" | "molarMass" | "time" | "rateConst" | "heatFlux" | "thermalRes" | "humidity" | "none";

export interface Unit { id: string; label: string; factor: number; offset?: number }

const U = (id: string, label: string, factor: number, offset = 0): Unit => ({ id, label, factor, offset });

export const UNITS: Record<Dim, Unit[]> = {
  length: [U("m", "m", 1), U("cm", "cm", 0.01), U("mm", "mm", 1e-3), U("um", "µm", 1e-6), U("in", "in", 0.0254), U("ft", "ft", 0.3048)],
  area: [U("m2", "m²", 1), U("cm2", "cm²", 1e-4), U("ft2", "ft²", 0.09290304)],
  velocity: [U("m/s", "m/s", 1), U("ft/s", "ft/s", 0.3048), U("km/h", "km/h", 1 / 3.6)],
  pressure: [U("Pa", "Pa", 1), U("kPa", "kPa", 1e3), U("MPa", "MPa", 1e6), U("bar", "bar", 1e5), U("atm", "atm", 101325),
    U("psi", "psi", 6894.757293168), U("mmHg", "mmHg", 133.322387415)],
  temperature: [U("degC", "°C", 1, 273.15), U("K", "K", 1), U("degF", "°F", 5 / 9, 273.15 - 32 * 5 / 9)],
  deltaT: [U("K", "K (= °C)", 1), U("degF", "°F", 5 / 9)],
  density: [U("kg/m3", "kg/m³", 1), U("g/cm3", "g/cm³", 1000), U("lb/ft3", "lb/ft³", 16.01846337)],
  viscosity: [U("Pa.s", "Pa·s", 1), U("mPa.s", "mPa·s", 1e-3), U("cP", "cP", 1e-3), U("lb/ft.s", "lb/(ft·s)", 1.488163944)],
  volFlow: [U("m3/s", "m³/s", 1), U("m3/h", "m³/h", 1 / 3600), U("L/s", "L/s", 1e-3), U("L/min", "L/min", 1e-3 / 60),
    U("gpm", "US gpm", 3.785411784e-3 / 60)],
  massFlow: [U("kg/s", "kg/s", 1), U("kg/h", "kg/h", 1 / 3600), U("t/h", "t/h", 1000 / 3600), U("lb/h", "lb/h", 0.45359237 / 3600)],
  power: [U("W", "W", 1), U("kW", "kW", 1e3), U("MW", "MW", 1e6), U("hp", "hp", 745.6998716), U("BTU/h", "BTU/h", 0.29307107)],
  conductivity: [U("W/m.K", "W/(m·K)", 1), U("BTU/h.ft.F", "BTU/(h·ft·°F)", 1.730734666)],
  htc: [U("W/m2.K", "W/(m²·K)", 1), U("kW/m2.K", "kW/(m²·K)", 1e3), U("BTU/h.ft2.F", "BTU/(h·ft²·°F)", 5.678263337)],
  cp: [U("J/kg.K", "J/(kg·K)", 1), U("kJ/kg.K", "kJ/(kg·K)", 1e3), U("BTU/lb.F", "BTU/(lb·°F)", 4186.8)],
  molarEnergy: [U("J/mol", "J/mol", 1), U("kJ/mol", "kJ/mol", 1e3), U("kcal/mol", "kcal/mol", 4184)],
  specEnergy: [U("kJ/kg", "kJ/kg", 1e3), U("J/kg", "J/kg", 1), U("BTU/lb", "BTU/lb", 2326)],
  specEntropy: [U("kJ/kg.K", "kJ/(kg·K)", 1e3), U("J/kg.K", "J/(kg·K)", 1)],
  specVolume: [U("m3/kg", "m³/kg", 1), U("L/kg", "L/kg", 1e-3), U("ft3/lb", "ft³/lb", 0.06242796)],
  volume: [U("m3", "m³", 1), U("L", "L", 1e-3), U("ft3", "ft³", 0.028316846592)],
  amount: [U("mol", "mol", 1), U("kmol", "kmol", 1e3)],
  molarMass: [U("g/mol", "g/mol", 1e-3), U("kg/kmol", "kg/kmol", 1e-3)],
  time: [U("s", "s", 1), U("min", "min", 60), U("h", "h", 3600)],
  rateConst: [U("1/s", "s⁻¹", 1), U("1/min", "min⁻¹", 1 / 60), U("1/h", "h⁻¹", 1 / 3600)],
  heatFlux: [U("W/m2", "W/m²", 1), U("kW/m2", "kW/m²", 1e3), U("BTU/h.ft2", "BTU/(h·ft²)", 3.154590745)],
  thermalRes: [U("K/W", "K/W", 1), U("degF.h/BTU", "°F·h/BTU", 1.895634)],
  humidity: [U("g/kg", "g/kg dry air", 1e-3), U("kg/kg", "kg/kg dry air", 1)],
  none: [U("-", "–", 1)],
};

export function unitOf(dim: Dim, id: string): Unit {
  const u = UNITS[dim].find(x => x.id === id);
  if (!u) throw new Error(`Unknown unit ${id} for ${dim}`);
  return u;
}
export const toSI = (value: number, dim: Dim, id: string) => { const u = unitOf(dim, id); return value * u.factor + (u.offset ?? 0); };
export const fromSI = (si: number, dim: Dim, id: string) => { const u = unitOf(dim, id); return (si - (u.offset ?? 0)) / u.factor; };

/** Engineering-friendly number formatting: 4 significant figures, scientific outside 1e-3..1e6. */
export function fmt(x: number, sig = 4): string {
  if (!Number.isFinite(x)) return "—";
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-3) {
    const [m, e] = x.toExponential(sig - 1).split("e");
    return `${m} × 10^${Number(e)}`;
  }
  return Number(x.toPrecision(sig)).toLocaleString("en-US", { maximumFractionDigits: 10 });
}
/** Same, as LaTeX (for the worked solutions). */
export function tex(x: number, sig = 4): string {
  if (!Number.isFinite(x)) return "\\text{—}";
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e6 || a < 1e-3) {
    const [m, e] = x.toExponential(sig - 1).split("e");
    return `${m}\\times10^{${Number(e)}}`;
  }
  return String(Number(x.toPrecision(sig)));
}
