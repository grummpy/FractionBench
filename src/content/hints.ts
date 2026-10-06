import { taskFormMet } from "./completion";
import type { Problem } from "./problems";
import type { CheckResult } from "../checker/checkWork";
import { gcd, lcm } from "../math/rational";
import { formatExpression, parseExpression, sameWritten, type Expression, type Step } from "../math/expressions";
import { equal } from "../math/rational";

export type Hint = {
  step: Step;
  from: "current" | "start";
  text: string;
};

function checkpoint(problem: Problem, steps: Step[], result: CheckResult): { expression: Expression; trustworthy: boolean } {
  let expression = problem.start;
  let trustworthy = true;
  for (let index = 0; index < steps.length; index += 1) {
    const status = result.steps[index]?.status;
    if (status === "verified" || status === "equivalent_unverified_reason" || status === "no_progress") {
      expression = steps[index].expression;
    } else {
      trustworthy = false;
      break;
    }
  }
  return { expression, trustworthy };
}

function sameProgress(a: Expression, b: Expression): boolean {
  return sameWritten(a, b);
}

function nextOnPaths(problem: Problem, current: Expression): Step | null {
  const paths = [problem.reference, ...problem.alternatives];
  for (const path of paths) {
    if (sameWritten(problem.start, current)) return path[0] ?? null;
    let cursor = problem.start;
    for (let index = 0; index < path.length; index += 1) {
      cursor = path[index].expression;
      if (sameProgress(cursor, current)) return path[index + 1] ?? null;
    }
  }
  return null;
}

function synthesize(problem: Problem, current: Expression): Step | null {
  if (taskFormMet(problem.completion, problem.start, current)) return null;
  if (current.kind === "fraction" && (problem.completion.kind === "denominator" || problem.completion.kind === "simplestForm" || problem.completion.kind === "equivalentValue")) {
    const numerator = BigInt(current.value.numerator.trim());
    const denominator = BigInt(current.value.denominator.trim());
    if (problem.completion.kind === "denominator") {
      const target = BigInt(problem.completion.denominator);
      if (target % denominator === 0n) {
        const factor = target / denominator;
        return {
          expression: {
            kind: "fraction",
            value: { numerator: (numerator * factor).toString(), denominator: target.toString() },
          },
          reason: { kind: "scale", factor: factor.toString(), target: "single" },
        };
      }
      const divisor = gcd(numerator, denominator);
      if (divisor > 1n) {
        return {
          expression: {
            kind: "fraction",
            value: { numerator: (numerator / divisor).toString(), denominator: (denominator / divisor).toString() },
          },
          reason: { kind: "divide", factor: divisor.toString(), target: "single" },
        };
      }
      return null;
    }
    const divisor = gcd(numerator, denominator);
    if (divisor === 1n) return null;
    return {
      expression: {
        kind: "fraction",
        value: { numerator: (numerator / divisor).toString(), denominator: (denominator / divisor).toString() },
      },
      reason: { kind: "divide", factor: divisor.toString(), target: "single" },
    };
  }
  if (current.kind === "sum" && problem.completion.kind === "sumValue") {
    const leftDen = BigInt(current.left.denominator.trim());
    const rightDen = BigInt(current.right.denominator.trim());
    const leftNum = BigInt(current.left.numerator.trim());
    const rightNum = BigInt(current.right.numerator.trim());
    if (leftDen === rightDen) {
      return {
        expression: { kind: "fraction", value: { numerator: (leftNum + rightNum).toString(), denominator: leftDen.toString() } },
        reason: { kind: "combineLikeDenominators" },
      };
    }
    const shared = lcm(leftDen, rightDen);
    if (leftDen !== shared) {
      const factor = shared / leftDen;
      return {
        expression: {
          kind: "sum",
          left: { numerator: (leftNum * factor).toString(), denominator: shared.toString() },
          right: current.right,
        },
        reason: { kind: "scale", factor: factor.toString(), target: "left" },
      };
    }
    const factor = shared / rightDen;
    return {
      expression: {
        kind: "sum",
        left: current.left,
        right: { numerator: (rightNum * factor).toString(), denominator: shared.toString() },
      },
      reason: { kind: "scale", factor: factor.toString(), target: "right" },
    };
  }
  return problem.reference[0] ?? null;
}

export function validNextStep(problem: Problem, steps: Step[], result: CheckResult): Hint | null {
  const point = checkpoint(problem, steps, result);
  if (!point.trustworthy) {
    const step = problem.reference[0];
    if (!step) return null;
    return {
      step,
      from: "start",
      text: `One valid next step from the starting expression ${formatExpression(problem.start)} is ${formatExpression(step.expression)}. This does not continue from a line with a different value.`,
    };
  }
  const currentValue = parseExpression(point.expression);
  const startValue = parseExpression(problem.start);
  if (!currentValue.ok || !startValue.ok || !equal(currentValue.parsed.value, startValue.parsed.value)) {
    const step = problem.reference[0];
    if (!step) return null;
    return {
      step,
      from: "start",
      text: `One valid next step from the starting expression is ${formatExpression(step.expression)}.`,
    };
  }
  if (taskFormMet(problem.completion, problem.start, point.expression) && result.complete) return null;
  const step = nextOnPaths(problem, point.expression) ?? synthesize(problem, point.expression);
  if (!step) return null;
  return {
    step,
    from: "current",
    text: `One valid next step is ${formatExpression(step.expression)}.`,
  };
}
