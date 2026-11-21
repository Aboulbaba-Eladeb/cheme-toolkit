import type { Dim } from "./units";

/** Text in both interface languages. */
export interface L10n { en: string; ar: string }

export type Category = "fluid" | "heat" | "thermo" | "mass" | "reaction";

export interface NumInput {
  id: string;
  label: L10n;
  /** LaTeX symbol used in the worked solution, e.g. "\\rho" */
  sym: string;
  dim: Dim;
  /** default value, expressed in `unit` */
  value: number;
  unit: string;
  min?: number;
  max?: number;
  hint?: L10n;
  /** only show (and use) this input when a choice has a given value */
  when?: { choice: string; value: string | string[] };
}

export interface Choice {
  id: string;
  label: L10n;
  value: string;
  options: { value: string; label: L10n }[];
}

/** A multi-row table input (e.g. flash components). Values are plain numbers. */
export interface TableInput {
  id: string;
  label: L10n;
  columns: { id: string; label: L10n; sym: string }[];
  rows: Record<string, number | string>[];
  minRows: number;
  maxRows: number;
  /** column id that holds a text name instead of a number */
  nameColumn?: string;
}

export interface Result {
  id: string;
  label: L10n;
  sym: string;
  /** value in SI (or the dimensionless number) */
  value: number;
  dim: Dim;
  /** default display unit */
  unit: string;
  /** highlight as a main answer */
  main?: boolean;
}

export interface Step {
  /** short explanation above the equation */
  text: L10n;
  /** LaTeX: general form with symbols, then substituted numbers, then the answer */
  tex: string;
}

export interface Note { kind: "info" | "warn"; text: L10n }

export interface Output {
  results: Result[];
  steps: Step[];
  notes?: Note[];
  /** extra rows for table-type answers (flash compositions…) */
  table?: { columns: L10n[]; rows: (string | number)[][] };
}

export type SIValues = Record<string, number>;

export interface Tool {
  id: string;
  category: Category;
  name: L10n;
  summary: L10n;
  inputs: NumInput[];
  choices?: Choice[];
  table?: TableInput;
  /** inputs arrive in SI; choices by id; table rows as entered */
  compute(si: SIValues, choice: Record<string, string>, table?: Record<string, number | string>[]): Output;
  references: string[];
}

export class InputError extends Error {
  text: L10n;
  constructor(text: L10n) { super(text.en); this.text = text; }
}
export const L = (en: string, ar: string): L10n => ({ en, ar });
