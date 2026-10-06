import type { Completion } from "./completion";
import { problemSignature, type Skill } from "./signature";
import type { Expression, FractionInput, Reason, Step } from "../math/expressions";

export type Problem = {
  id: string;
  world: "equivalent" | "addition";
  skill: Skill;
  prompt: string;
  start: Expression;
  completion: Completion;
  reference: Step[];
  alternatives: Step[][];
  signature: string;
  practice: boolean;
};

const f = (numerator: string, denominator: string): FractionInput => ({ numerator, denominator });
const frac = (numerator: string, denominator: string): Expression => ({ kind: "fraction", value: f(numerator, denominator) });
const sum = (an: string, ad: string, bn: string, bd: string): Expression => ({
  kind: "sum",
  left: f(an, ad),
  right: f(bn, bd),
});
const rewrite = (expression: Expression): Step => ({ expression, reason: { kind: "equivalentRewrite" } });
const scale = (expression: Expression, factor: string, target: "left" | "right" | "single"): Step => ({
  expression,
  reason: { kind: "scale", factor, target },
});
const divide = (expression: Expression, factor: string, target: "left" | "right" | "single"): Step => ({
  expression,
  reason: { kind: "divide", factor, target },
});
const combine = (expression: Expression): Step => ({ expression, reason: { kind: "combineLikeDenominators" } });
const reorder = (expression: Expression): Step => ({ expression, reason: { kind: "reorder" } });
const direct = (expression: Expression): Step => ({ expression, reason: { kind: "other" } });

type Draft = {
  id: string;
  world: Problem["world"];
  skill: Skill;
  prompt: string;
  start: Expression;
  completion: Completion;
  reference: Step[];
  alternatives: Step[][];
};

function finish(draft: Draft, practice = false): Problem {
  return {
    ...draft,
    practice,
    signature: problemSignature(draft),
  };
}

const authored: Draft[] = [
  {
    id: "E01",
    world: "equivalent",
    skill: "equivalentScaling",
    prompt: "Rewrite 1/2 with denominator 4.",
    start: frac("1", "2"),
    completion: { kind: "denominator", denominator: "4" },
    reference: [scale(frac("2", "4"), "2", "single")],
    alternatives: [[scale(frac("4", "8"), "4", "single"), divide(frac("2", "4"), "2", "single")]],
  },
  {
    id: "E02",
    world: "equivalent",
    skill: "equivalentScaling",
    prompt: "Rewrite 2/3 with denominator 9.",
    start: frac("2", "3"),
    completion: { kind: "denominator", denominator: "9" },
    reference: [scale(frac("6", "9"), "3", "single")],
    alternatives: [[rewrite(frac("6", "9"))]],
  },
  {
    id: "E03",
    world: "equivalent",
    skill: "equivalentScaling",
    prompt: "Rewrite 3/4 with denominator 12.",
    start: frac("3", "4"),
    completion: { kind: "denominator", denominator: "12" },
    reference: [scale(frac("9", "12"), "3", "single")],
    alternatives: [[scale(frac("6", "8"), "2", "single"), rewrite(frac("9", "12"))]],
  },
  {
    id: "E04",
    world: "equivalent",
    skill: "equivalentScaling",
    prompt: "Rewrite 2/5 with denominator 10.",
    start: frac("2", "5"),
    completion: { kind: "denominator", denominator: "10" },
    reference: [scale(frac("4", "10"), "2", "single")],
    alternatives: [[scale(frac("8", "20"), "4", "single"), divide(frac("4", "10"), "2", "single")]],
  },
  {
    id: "E05",
    world: "equivalent",
    skill: "simplification",
    prompt: "Write 4/6 in simplest form.",
    start: frac("4", "6"),
    completion: { kind: "simplestForm" },
    reference: [divide(frac("2", "3"), "2", "single")],
    alternatives: [[rewrite(frac("2", "3"))]],
  },
  {
    id: "E06",
    world: "equivalent",
    skill: "simplification",
    prompt: "Write 6/8 in simplest form.",
    start: frac("6", "8"),
    completion: { kind: "simplestForm" },
    reference: [divide(frac("3", "4"), "2", "single")],
    alternatives: [[rewrite(frac("3", "4"))]],
  },
  {
    id: "E07",
    world: "equivalent",
    skill: "simplification",
    prompt: "Write 6/10 in simplest form.",
    start: frac("6", "10"),
    completion: { kind: "simplestForm" },
    reference: [divide(frac("3", "5"), "2", "single")],
    alternatives: [[rewrite(frac("3", "5"))]],
  },
  {
    id: "E08",
    world: "equivalent",
    skill: "simplification",
    prompt: "Write 8/12 in simplest form.",
    start: frac("8", "12"),
    completion: { kind: "simplestForm" },
    reference: [divide(frac("2", "3"), "4", "single")],
    alternatives: [[divide(frac("4", "6"), "2", "single"), divide(frac("2", "3"), "2", "single")]],
  },
  {
    id: "A01",
    world: "addition",
    skill: "equalDenominatorAddition",
    prompt: "Add 1/4 + 2/4. Simplest form is welcome and not required.",
    start: sum("1", "4", "2", "4"),
    completion: { kind: "sumValue" },
    reference: [combine(frac("3", "4"))],
    alternatives: [[reorder(sum("2", "4", "1", "4")), combine(frac("3", "4"))]],
  },
  {
    id: "A02",
    world: "addition",
    skill: "equalDenominatorAddition",
    prompt: "Add 2/5 + 1/5. Simplest form is welcome and not required.",
    start: sum("2", "5", "1", "5"),
    completion: { kind: "sumValue" },
    reference: [combine(frac("3", "5"))],
    alternatives: [[direct(frac("3", "5"))]],
  },
  {
    id: "A03",
    world: "addition",
    skill: "equalDenominatorAddition",
    prompt: "Add 3/8 + 2/8. Simplest form is welcome and not required.",
    start: sum("3", "8", "2", "8"),
    completion: { kind: "sumValue" },
    reference: [combine(frac("5", "8"))],
    alternatives: [[direct(frac("5", "8"))]],
  },
  {
    id: "A04",
    world: "addition",
    skill: "equalDenominatorAddition",
    prompt: "Add 3/6 + 2/6. Simplest form is welcome and not required.",
    start: sum("3", "6", "2", "6"),
    completion: { kind: "sumValue" },
    reference: [combine(frac("5", "6"))],
    alternatives: [[rewrite(sum("1", "2", "2", "6")), direct(frac("5", "6"))]],
  },
  {
    id: "A05",
    world: "addition",
    skill: "unlikeDenominatorAddition",
    prompt: "Add 1/2 + 1/4. Simplest form is welcome and not required.",
    start: sum("1", "2", "1", "4"),
    completion: { kind: "sumValue" },
    reference: [scale(sum("2", "4", "1", "4"), "2", "left"), combine(frac("3", "4"))],
    alternatives: [[reorder(sum("1", "4", "1", "2")), scale(sum("1", "4", "2", "4"), "2", "right"), combine(frac("3", "4"))]],
  },
  {
    id: "A06",
    world: "addition",
    skill: "unlikeDenominatorAddition",
    prompt: "Add 1/3 + 1/6. Simplest form is welcome and not required.",
    start: sum("1", "3", "1", "6"),
    completion: { kind: "sumValue" },
    reference: [scale(sum("2", "6", "1", "6"), "2", "left"), combine(frac("3", "6"))],
    alternatives: [[direct(frac("1", "2"))]],
  },
  {
    id: "A07",
    world: "addition",
    skill: "unlikeDenominatorAddition",
    prompt: "Add 2/3 + 1/4. Simplest form is welcome and not required.",
    start: sum("2", "3", "1", "4"),
    completion: { kind: "sumValue" },
    reference: [scale(sum("8", "12", "1", "4"), "4", "left"), scale(sum("8", "12", "3", "12"), "3", "right"), combine(frac("11", "12"))],
    alternatives: [[direct(frac("11", "12"))]],
  },
  {
    id: "A08",
    world: "addition",
    skill: "unlikeDenominatorAddition",
    prompt: "Add 1/2 + 1/3. Simplest form is welcome and not required.",
    start: sum("1", "2", "1", "3"),
    completion: { kind: "sumValue" },
    reference: [scale(sum("3", "6", "1", "3"), "3", "left"), scale(sum("3", "6", "2", "6"), "2", "right"), combine(frac("5", "6"))],
    alternatives: [[rewrite(sum("6", "12", "4", "12")), combine(frac("10", "12"))]],
  },
  {
    id: "A09",
    world: "addition",
    skill: "unlikeDenominatorAddition",
    prompt: "Add 2/5 + 1/3. Simplest form is welcome and not required.",
    start: sum("2", "5", "1", "3"),
    completion: { kind: "sumValue" },
    reference: [scale(sum("6", "15", "1", "3"), "3", "left"), scale(sum("6", "15", "5", "15"), "5", "right"), combine(frac("11", "15"))],
    alternatives: [[direct(frac("11", "15"))]],
  },
  {
    id: "A10",
    world: "addition",
    skill: "unlikeDenominatorAddition",
    prompt: "Add 3/4 + 1/8. Simplest form is welcome and not required.",
    start: sum("3", "4", "1", "8"),
    completion: { kind: "sumValue" },
    reference: [scale(sum("6", "8", "1", "8"), "2", "left"), combine(frac("7", "8"))],
    alternatives: [[direct(frac("7", "8"))]],
  },
  {
    id: "A11",
    world: "addition",
    skill: "unlikeDenominatorAddition",
    prompt: "Add 3/4 + 2/3. Simplest form is welcome and not required.",
    start: sum("3", "4", "2", "3"),
    completion: { kind: "sumValue" },
    reference: [scale(sum("9", "12", "2", "3"), "3", "left"), scale(sum("9", "12", "8", "12"), "4", "right"), combine(frac("17", "12"))],
    alternatives: [[direct(frac("17", "12"))]],
  },
  {
    id: "A12",
    world: "addition",
    skill: "unlikeDenominatorAddition",
    prompt: "Add 5/6 + 1/3. Simplest form is welcome and not required.",
    start: sum("5", "6", "1", "3"),
    completion: { kind: "sumValue" },
    reference: [scale(sum("5", "6", "2", "6"), "2", "right"), combine(frac("7", "6"))],
    alternatives: [[direct(frac("7", "6"))]],
  },
];

export const PROBLEMS: Problem[] = authored.map((draft) => finish(draft));

export function getProblem(id: string): Problem | undefined {
  return PROBLEMS.find((problem) => problem.id === id);
}

export function reasonLabel(reason: Reason | undefined): string {
  if (!reason) return "no reason selected";
  switch (reason.kind) {
    case "equivalentRewrite":
      return "rewrite an equivalent fraction";
    case "scale":
      return `multiply the ${targetLabel(reason.target)} by ${reason.factor} on the top and the bottom`;
    case "divide":
      return `divide the ${targetLabel(reason.target)} by ${reason.factor} on the top and the bottom`;
    case "combineLikeDenominators":
      return "combine equal-denominator fractions";
    case "reorder":
      return "reorder the addends";
    case "other":
      return "another method with a correct equivalent result";
    default: {
      const _never: never = reason;
      return _never;
    }
  }
}

function targetLabel(target: "left" | "right" | "single"): string {
  if (target === "left") return "left fraction";
  if (target === "right") return "right fraction";
  return "fraction";
}

export { frac, sum, scale, divide, combine, rewrite, reorder, direct, finish };
