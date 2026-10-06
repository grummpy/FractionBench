import type { CheckResult } from "../checker/checkWork";
import { finish, type Problem } from "../content/problems";
import { problemSignature, type Skill } from "../content/signature";
import type { Expression } from "../math/expressions";
import { add, compare, lcm, rational } from "../math/rational";

export class PracticePoolExhausted extends Error {
  constructor() {
    super("practice pool could not produce two problems");
    this.name = "PracticePoolExhausted";
  }
}

const frac = (n: number, d: number): Expression => ({
  kind: "fraction",
  value: { numerator: String(n), denominator: String(d) },
});
const sum = (an: number, ad: number, bn: number, bd: number): Expression => ({
  kind: "sum",
  left: { numerator: String(an), denominator: String(ad) },
  right: { numerator: String(bn), denominator: String(bd) },
});

function scalingProblem(numerator: number, denominator: number, factor: number): Problem {
  const target = denominator * factor;
  return finish({
    id: `practice-scale-${numerator}/${denominator}->${target}`,
    world: "equivalent",
    skill: "equivalentScaling",
    prompt: `Rewrite ${numerator}/${denominator} with denominator ${target}.`,
    start: frac(numerator, denominator),
    completion: { kind: "denominator", denominator: String(target) },
    reference: [
      {
        expression: frac(numerator * factor, target),
        reason: { kind: "scale", factor: String(factor), target: "single" },
      },
    ],
    alternatives: [
      [
        {
          expression: frac(numerator * factor, target),
          reason: { kind: "equivalentRewrite" },
        },
      ],
    ],
  }, true);
}

function simplifyProblem(numerator: number, denominator: number, factor: number): Problem {
  return finish({
    id: `practice-simple-${numerator}/${denominator}`,
    world: "equivalent",
    skill: "simplification",
    prompt: `Write ${numerator}/${denominator} in simplest form.`,
    start: frac(numerator, denominator),
    completion: { kind: "simplestForm" },
    reference: [
      {
        expression: frac(numerator / factor, denominator / factor),
        reason: { kind: "divide", factor: String(factor), target: "single" },
      },
    ],
    alternatives: [
      [
        {
          expression: frac(numerator / factor, denominator / factor),
          reason: { kind: "equivalentRewrite" },
        },
      ],
    ],
  }, true);
}

function additionReference(an: number, ad: number, bn: number, bd: number): Problem["reference"] {
  if (ad === bd) {
    return [
      {
        expression: frac(an + bn, ad),
        reason: { kind: "combineLikeDenominators" },
      },
    ];
  }
  const shared = Number(lcm(BigInt(ad), BigInt(bd)));
  const steps: Problem["reference"] = [];
  let leftN = an;
  let leftD = ad;
  let rightN = bn;
  let rightD = bd;
  if (leftD !== shared) {
    const factor = shared / leftD;
    leftN *= factor;
    leftD = shared;
    steps.push({
      expression: sum(leftN, leftD, rightN, rightD),
      reason: { kind: "scale", factor: String(factor), target: "left" },
    });
  }
  if (rightD !== shared) {
    const factor = shared / rightD;
    rightN *= factor;
    rightD = shared;
    steps.push({
      expression: sum(leftN, leftD, rightN, rightD),
      reason: { kind: "scale", factor: String(factor), target: "right" },
    });
  }
  steps.push({
    expression: frac(leftN + rightN, shared),
    reason: { kind: "combineLikeDenominators" },
  });
  return steps;
}

function additionProblem(an: number, ad: number, bn: number, bd: number, skill: Skill): Problem {
  const reference = additionReference(an, ad, bn, bd);
  const finalStep = reference[reference.length - 1];
  return finish({
    id: `practice-add-${an}/${ad}+${bn}/${bd}`,
    world: "addition",
    skill,
    prompt: `Add ${an}/${ad} + ${bn}/${bd}. Simplest form is welcome and not required.`,
    start: sum(an, ad, bn, bd),
    completion: { kind: "sumValue" },
    reference,
    alternatives: finalStep ? [[finalStep.expression.kind === "fraction" ? { expression: finalStep.expression, reason: { kind: "other" } } : finalStep]] : [],
  }, true);
}

const COPRIME: Array<[number, number]> = [
  [1, 2],
  [1, 3],
  [2, 3],
  [1, 4],
  [3, 4],
  [1, 5],
  [2, 5],
  [3, 5],
  [4, 5],
  [1, 6],
  [5, 6],
];

const UNLIKE_PAIRS: Array<[number, number]> = [
  [2, 3],
  [2, 5],
  [2, 6],
  [2, 8],
  [2, 10],
  [2, 12],
  [3, 4],
  [3, 6],
  [3, 12],
  [4, 6],
  [4, 8],
  [4, 12],
  [5, 10],
  [6, 12],
];

function sumAtMostTwo(an: number, ad: number, bn: number, bd: number): boolean {
  const value = add(rational(BigInt(an), BigInt(ad)), rational(BigInt(bn), BigInt(bd)));
  return compare(value, rational(2n, 1n)) <= 0;
}

export function enumerateSignatures(skill: Skill): string[] {
  const signatures: string[] = [];
  if (skill === "equivalentScaling") {
    for (let denominator = 2; denominator <= 6; denominator += 1) {
      const maxFactor = Math.floor(12 / denominator);
      for (let factor = 2; factor <= maxFactor; factor += 1) {
        for (let numerator = 1; numerator < denominator; numerator += 1) {
          signatures.push(problemSignature(scalingProblem(numerator, denominator, factor)));
        }
      }
    }
  } else if (skill === "simplification") {
    for (const [baseN, baseD] of COPRIME) {
      const maxFactor = Math.floor(12 / baseD);
      for (let factor = 2; factor <= maxFactor; factor += 1) {
        signatures.push(problemSignature(simplifyProblem(baseN * factor, baseD * factor, factor)));
      }
    }
  } else if (skill === "equalDenominatorAddition") {
    for (let denominator = 2; denominator <= 12; denominator += 1) {
      for (let left = 1; left <= denominator; left += 1) {
        for (let right = 1; right <= denominator; right += 1) {
          if (!sumAtMostTwo(left, denominator, right, denominator)) continue;
          signatures.push(problemSignature(additionProblem(left, denominator, right, denominator, skill)));
        }
      }
    }
  } else {
    for (const [leftDen, rightDen] of UNLIKE_PAIRS) {
      for (let left = 1; left <= leftDen; left += 1) {
        for (let right = 1; right <= rightDen; right += 1) {
          if (!sumAtMostTwo(left, leftDen, right, rightDen)) continue;
          signatures.push(problemSignature(additionProblem(left, leftDen, right, rightDen, skill)));
        }
      }
    }
  }
  return signatures;
}

function roll(skill: Skill, rng: () => number): Problem {
  const pick = (count: number) => Math.floor(rng() * count);
  if (skill === "equivalentScaling") {
    const denominator = 2 + pick(5);
    const maxFactor = Math.floor(12 / denominator);
    const factor = 2 + pick(maxFactor - 1);
    const numerator = 1 + pick(denominator - 1);
    return scalingProblem(numerator, denominator, factor);
  }
  if (skill === "simplification") {
    const [baseN, baseD] = COPRIME[pick(COPRIME.length)];
    const maxFactor = Math.floor(12 / baseD);
    const factor = 2 + pick(Math.max(1, maxFactor - 1));
    return simplifyProblem(baseN * factor, baseD * factor, factor);
  }
  if (skill === "equalDenominatorAddition") {
    const denominator = 2 + pick(11);
    const left = 1 + pick(denominator);
    const right = 1 + pick(denominator);
    if (!sumAtMostTwo(left, denominator, right, denominator)) return roll(skill, rng);
    return additionProblem(left, denominator, right, denominator, skill);
  }
  const [leftDen, rightDen] = UNLIKE_PAIRS[pick(UNLIKE_PAIRS.length)];
  const left = 1 + pick(leftDen);
  const right = 1 + pick(rightDen);
  if (!sumAtMostTwo(left, leftDen, right, rightDen)) return roll(skill, rng);
  return additionProblem(left, leftDen, right, rightDen, skill);
}

export function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const fallbackPool: Record<Skill, Problem[]> = {
  equivalentScaling: [
    scalingProblem(1, 3, 2),
    scalingProblem(1, 5, 2),
    scalingProblem(3, 5, 2),
    scalingProblem(1, 6, 2),
  ],
  simplification: [
    simplifyProblem(4, 10, 2),
    simplifyProblem(6, 9, 3),
    simplifyProblem(8, 10, 2),
    simplifyProblem(9, 12, 3),
  ],
  equalDenominatorAddition: [
    additionProblem(1, 3, 1, 3, "equalDenominatorAddition"),
    additionProblem(1, 7, 2, 7, "equalDenominatorAddition"),
    additionProblem(2, 9, 3, 9, "equalDenominatorAddition"),
    additionProblem(1, 10, 3, 10, "equalDenominatorAddition"),
  ],
  unlikeDenominatorAddition: [
    additionProblem(1, 5, 1, 2, "unlikeDenominatorAddition"),
    additionProblem(1, 6, 1, 2, "unlikeDenominatorAddition"),
    additionProblem(1, 4, 1, 6, "unlikeDenominatorAddition"),
    additionProblem(1, 8, 1, 2, "unlikeDenominatorAddition"),
  ],
};

function takeFallback(skill: Skill, avoid: Set<string>, found: Problem[]): Problem[] {
  const next = found.slice();
  for (const item of fallbackPool[skill]) {
    if (next.length >= 2) break;
    if (avoid.has(item.signature) || next.some((problem) => problem.signature === item.signature)) continue;
    next.push(item);
  }
  return next;
}

export function generatePair(options: { skill: Skill; seed: number; avoid: string[]; maxAttempts?: number }): [Problem, Problem] {
  const rng = mulberry32(options.seed);
  const avoid = new Set(options.avoid);
  const found: Problem[] = [];
  const attempts = options.maxAttempts ?? 80;
  for (let attempt = 0; attempt < attempts && found.length < 2; attempt += 1) {
    const candidate = roll(options.skill, rng);
    if (avoid.has(candidate.signature) || found.some((problem) => problem.signature === candidate.signature)) continue;
    avoid.add(candidate.signature);
    found.push(candidate);
  }
  const filled = takeFallback(options.skill, new Set(options.avoid), found);
  if (filled.length < 2) throw new PracticePoolExhausted();
  return [filled[0], filled[1]];
}

export function selectPracticeSkill(problem: Problem, result: CheckResult | null): Skill {
  if (!result) return problem.skill;
  const failed = result.steps.find((step) => step.status === "mathematical_error");
  if (!failed) return problem.skill;
  if (failed.claimed === "scale" || failed.claimed === "divide" || failed.condition === "incorrect-scaling") {
    return "equivalentScaling";
  }
  return problem.skill;
}

export function withinPracticeBounds(problem: Problem): boolean {
  const fractions =
    problem.start.kind === "fraction"
      ? [problem.start.value]
      : [problem.start.left, problem.start.right];
  if (fractions.some((item) => {
    const denominator = Number(item.denominator);
    const numerator = Number(item.numerator);
    return denominator < 2 || denominator > 12 || numerator < 1;
  })) {
    return false;
  }
  if (problem.start.kind === "sum") {
    const value = add(
      rational(BigInt(problem.start.left.numerator), BigInt(problem.start.left.denominator)),
      rational(BigInt(problem.start.right.numerator), BigInt(problem.start.right.denominator)),
    );
    if (compare(value, rational(2n, 1n)) > 0) return false;
    if (problem.skill === "unlikeDenominatorAddition") {
      const shared = lcm(BigInt(problem.start.left.denominator), BigInt(problem.start.right.denominator));
      if (shared > 12n) return false;
    }
  }
  if (problem.skill === "equivalentScaling" && problem.completion.kind === "denominator") {
    const target = Number(problem.completion.denominator);
    if (target < 2 || target > 12) return false;
  }
  return true;
}
