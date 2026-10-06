import { fractionValue, parseExpression, sameFraction, sameWritten, type Expression, type Reason } from "../math/expressions";
import { equal } from "../math/rational";

export type TransitionCondition =
  | "equivalent"
  | "scale"
  | "divide"
  | "combine"
  | "reorder"
  | "direct-sum"
  | "missing"
  | "scale-factor-mismatch"
  | "divide-factor-mismatch"
  | "combine-denominator-mismatch"
  | "combine-numerator-mismatch"
  | "offsetting-terms"
  | "reason-structure-mismatch"
  | "other-unverified"
  | "value-change"
  | "denominator-addition"
  | "incorrect-scaling"
  | "no-progress";

export type TransitionJudgement = {
  status: "verified" | "equivalent_unverified_reason" | "no_progress";
  condition: TransitionCondition;
  detail: string;
};

function factorOf(reason: Reason): bigint {
  if (reason.kind === "scale" || reason.kind === "divide") return BigInt(reason.factor.trim());
  return 0n;
}

function scaled(beforeNum: bigint, beforeDen: bigint, factor: bigint, afterNum: bigint, afterDen: bigint): boolean {
  return afterNum === beforeNum * factor && afterDen === beforeDen * factor;
}

function divided(beforeNum: bigint, beforeDen: bigint, factor: bigint, afterNum: bigint, afterDen: bigint): boolean {
  if (factor < 1n) return false;
  if (beforeNum % factor !== 0n || beforeDen % factor !== 0n) return false;
  return afterNum === beforeNum / factor && afterDen === beforeDen / factor;
}

function ints(input: { numerator: string; denominator: string }): { n: bigint; d: bigint } {
  return { n: BigInt(input.numerator.trim()), d: BigInt(input.denominator.trim()) };
}

export function isIncorrectScaling(before: Expression, after: Expression): boolean {
  if (before.kind !== "fraction" || after.kind !== "fraction") return false;
  const a = ints(before.value);
  const b = ints(after.value);
  return a.n === b.n && a.d !== b.d;
}

export function isDenominatorAddition(before: Expression, after: Expression): boolean {
  if (before.kind !== "sum" || after.kind !== "fraction") return false;
  const left = ints(before.left);
  const right = ints(before.right);
  const result = ints(after.value);
  return result.n === left.n + right.n && result.d === left.d + right.d;
}

export function valueChangeCondition(before: Expression, after: Expression): TransitionCondition {
  if (isDenominatorAddition(before, after)) return "denominator-addition";
  if (isIncorrectScaling(before, after)) return "incorrect-scaling";
  return "value-change";
}

function pairwise(before: Expression, after: Expression): boolean {
  if (before.kind === "fraction" && after.kind === "fraction") {
    return equal(fractionValue(before.value), fractionValue(after.value));
  }
  if (before.kind === "sum" && after.kind === "sum") {
    return (
      equal(fractionValue(before.left), fractionValue(after.left)) &&
      equal(fractionValue(before.right), fractionValue(after.right))
    );
  }
  return false;
}

export function isReorder(before: Expression, after: Expression): boolean {
  if (before.kind !== "sum" || after.kind !== "sum") return false;
  if (sameWritten(before, after)) return false;
  return (
    equal(fractionValue(before.left), fractionValue(after.right)) &&
    equal(fractionValue(before.right), fractionValue(after.left))
  );
}

function isOffsetting(before: Expression, after: Expression): boolean {
  if (before.kind !== "sum" || after.kind !== "sum") return false;
  const leftSame = equal(fractionValue(before.left), fractionValue(after.left));
  const rightSame = equal(fractionValue(before.right), fractionValue(after.right));
  return !leftSame && !rightSame && !isReorder(before, after);
}

function scaleMatches(before: Expression, after: Expression, reason: Extract<Reason, { kind: "scale" }>): boolean {
  const factor = factorOf(reason);
  if (factor < 1n) return false;
  if (reason.target === "single") {
    if (before.kind !== "fraction" || after.kind !== "fraction") return false;
    const from = ints(before.value);
    const to = ints(after.value);
    return scaled(from.n, from.d, factor, to.n, to.d);
  }
  if (before.kind !== "sum" || after.kind !== "sum") return false;
  if (reason.target === "left") {
    const from = ints(before.left);
    const to = ints(after.left);
    return scaled(from.n, from.d, factor, to.n, to.d) && sameFraction(before.right, after.right);
  }
  const from = ints(before.right);
  const to = ints(after.right);
  return scaled(from.n, from.d, factor, to.n, to.d) && sameFraction(before.left, after.left);
}

function divideMatches(before: Expression, after: Expression, reason: Extract<Reason, { kind: "divide" }>): boolean {
  const factor = factorOf(reason);
  if (reason.target === "single") {
    if (before.kind !== "fraction" || after.kind !== "fraction") return false;
    const from = ints(before.value);
    const to = ints(after.value);
    return divided(from.n, from.d, factor, to.n, to.d);
  }
  if (before.kind !== "sum" || after.kind !== "sum") return false;
  if (reason.target === "left") {
    const from = ints(before.left);
    const to = ints(after.left);
    return divided(from.n, from.d, factor, to.n, to.d) && sameFraction(before.right, after.right);
  }
  const from = ints(before.right);
  const to = ints(after.right);
  return divided(from.n, from.d, factor, to.n, to.d) && sameFraction(before.left, after.left);
}

function combineMatches(before: Expression, after: Expression): boolean {
  if (before.kind !== "sum" || after.kind !== "fraction") return false;
  const left = ints(before.left);
  const right = ints(before.right);
  if (left.d !== right.d) return false;
  const result = ints(after.value);
  return result.n === left.n + right.n && result.d === left.d;
}

function isDirectSum(before: Expression, after: Expression): boolean {
  if (before.kind !== "sum" || after.kind !== "fraction") return false;
  const parsed = parseExpression(before);
  const afterParsed = parseExpression(after);
  if (!parsed.ok || !afterParsed.ok) return false;
  return equal(parsed.parsed.value, afterParsed.parsed.value);
}

/** Classify a value-preserving, parseable, changed transition. */
export function judgePreservingTransition(before: Expression, after: Expression, reason: Reason | undefined): TransitionJudgement {
  if (sameWritten(before, after)) {
    return { status: "no_progress", condition: "no-progress", detail: "" };
  }
  if (!reason) {
    return { status: "equivalent_unverified_reason", condition: "missing", detail: "" };
  }
  switch (reason.kind) {
    case "equivalentRewrite": {
      if (pairwise(before, after)) return { status: "verified", condition: "equivalent", detail: "" };
      if (isReorder(before, after)) {
        return {
          status: "equivalent_unverified_reason",
          condition: "reason-structure-mismatch",
          detail: "The addends changed places, so an equivalent-rewrite reason does not verify this step.",
        };
      }
      if (isOffsetting(before, after)) {
        return { status: "equivalent_unverified_reason", condition: "offsetting-terms", detail: "" };
      }
      return {
        status: "equivalent_unverified_reason",
        condition: "reason-structure-mismatch",
        detail: "An equivalent-rewrite reason replaces a fraction with an equal fraction. This step does not do that.",
      };
    }
    case "scale": {
      if (scaleMatches(before, after, reason)) return { status: "verified", condition: "scale", detail: "" };
      return {
        status: "equivalent_unverified_reason",
        condition: "scale-factor-mismatch",
        detail: `The scale factor ${reason.factor.trim()} does not turn the selected fraction into the entered fraction.`,
      };
    }
    case "divide": {
      if (divideMatches(before, after, reason)) return { status: "verified", condition: "divide", detail: "" };
      return {
        status: "equivalent_unverified_reason",
        condition: "divide-factor-mismatch",
        detail: `The division factor ${reason.factor.trim()} does not divide the selected numerator and denominator exactly into the entered fraction.`,
      };
    }
    case "combineLikeDenominators": {
      if (combineMatches(before, after)) return { status: "verified", condition: "combine", detail: "" };
      if (before.kind === "sum") {
        const left = ints(before.left);
        const right = ints(before.right);
        if (left.d !== right.d) {
          return { status: "equivalent_unverified_reason", condition: "combine-denominator-mismatch", detail: "" };
        }
      }
      return { status: "equivalent_unverified_reason", condition: "combine-numerator-mismatch", detail: "" };
    }
    case "reorder": {
      if (isReorder(before, after)) return { status: "verified", condition: "reorder", detail: "" };
      return {
        status: "equivalent_unverified_reason",
        condition: "reason-structure-mismatch",
        detail: "The addends did not change places.",
      };
    }
    case "other": {
      if (isDirectSum(before, after)) return { status: "verified", condition: "direct-sum", detail: "" };
      return { status: "equivalent_unverified_reason", condition: "other-unverified", detail: "" };
    }
    default: {
      const _never: never = reason;
      return _never;
    }
  }
}
