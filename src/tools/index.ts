import type { Category, L10n, Tool } from "../core/types";
import { L } from "../core/types";
import { reynolds, friction, pipeDP, pump } from "./fluid";
import { lmtdTool, ntu, convection, wall } from "./heat";
import { steam, antoine, idealGas, psychrometrics } from "./thermo";
import { flash, arrhenius } from "./mass";

export const TOOLS: Tool[] = [reynolds, friction, pipeDP, pump, lmtdTool, ntu, convection, wall, steam, antoine, idealGas, psychrometrics, flash, arrhenius];

export const CATEGORIES: { id: Category; name: L10n; icon: string }[] = [
  { id: "fluid", name: L("Fluid flow", "جريان الموائع"), icon: "〰" },
  { id: "heat", name: L("Heat transfer", "انتقال الحرارة"), icon: "♨" },
  { id: "thermo", name: L("Thermodynamics", "الديناميكا الحرارية"), icon: "⚗" },
  { id: "mass", name: L("Separations", "عمليات الفصل"), icon: "⇅" },
  { id: "reaction", name: L("Reactions", "التفاعلات"), icon: "⚛" },
];

export const toolById = (id: string) => TOOLS.find(t => t.id === id);
