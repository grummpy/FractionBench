import {
  MAX_DENOMINATOR,
  MAX_FACTOR,
  MAX_NUMERATOR,
  MIN_DENOMINATOR,
  MIN_FACTOR,
  MIN_NUMERATOR,
} from "../content/limits";
import { add, equal, formatRational, rational, type Rational } from "./rational";

export type FractionInput = { numerator: string; denominator: string };

export type Expression =
  | { kind: "fraction"; value: FractionInput }
  | { kind: "sum"; left: FractionInput; right: FractionInput };

export type Reason =
  | { kind: "equivalentRewrite" }
  | { kind: "scale"; factor: string; target: "left" | "right" | "single" }
  | { kind: "divide"; factor: string; target: "left" | "right" | "single" }
  | { kind: "combineLikeDenominators" }
  | { kind: "reorder" }
  | { kind: "other" };

export type Step = { expression: Expression; reason?: Reason };

export type FieldName = "numerator" | "denominator" | "factor" | "target";

export type FieldIssue = {
  field: FieldName;
  path: string;
  entered: string;
  message: string;
};

export type ParsedFraction = {
  input: FractionInput;
  numerator: bigint;
  denominator: bigint;
  value: Rational;
};

export type ParsedExpression = {
  expression: Expression;
  value: Rational;
  fractions: ParsedFraction[];
};

const TARGETS = new Set(["left", "right", "single"]);

function quoteEntered(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.length <= 80) return trimmed.length === 0 ? raw : trimmed;
  return `${trimmed.length}-character value`;
}

export function integerFieldMessage(
  label: "numerator" | "denominator" | "factor",
  raw: string,
): string | null {
  const min = label === "numerator" ? MIN_NUMERATOR : label === "factor" ? MIN_FACTOR : MIN_DENOMINATOR;
  const max = label === "numerator" ? MAX_NUMERATOR : label === "factor" ? MAX_FACTOR : MAX_DENOMINATOR;
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    if (label === "factor") return "Enter a factor.";
    return `Enter a ${label}.`;
  }
  if (!/^\d+$/.test(trimmed)) {
    const shown = quoteEntered(raw);
    return `${shown} is not a whole number. Enter a whole number from ${min} to ${max}. It was not shortened.`;
  }
  if (trimmed.length > 4) {
    const shown = quoteEntered(raw);
    return `${shown} is outside ${min}–${max}. It was not shortened. Enter a whole number from ${min} to ${max}.`;
  }
  const value = BigInt(trimmed);
  if (label === "denominator" && value === 0n) {
    return "A denominator of 0 does not name a fraction. This is invalid input, not a scored answer. Enter a whole number from 1 to 999.";
  }
  if (label === "factor" && value === 0n) {
    return "A factor of 0 cannot multiply or divide a fraction. This is invalid input. Enter a whole number from 1 to 999.";
  }
  if (value < BigInt(min) || value > BigInt(max)) {
    const shown = quoteEntered(raw);
    return `${shown} is outside ${min}–${max}. It was not shortened. Enter a whole number from ${min} to ${max}.`;
  }
  return null;
}

function parseFraction(input: FractionInput, pathPrefix: string): { fraction?: ParsedFraction; issues: FieldIssue[] } {
  const issues: FieldIssue[] = [];
  const numeratorMessage = integerFieldMessage("numerator", input.numerator);
  const denominatorMessage = integerFieldMessage("denominator", input.denominator);
  if (numeratorMessage) {
    issues.push({
      field: "numerator",
      path: `${pathPrefix}.numerator`,
      entered: input.numerator,
      message: numeratorMessage,
    });
  }
  if (denominatorMessage) {
    issues.push({
      field: "denominator",
      path: `${pathPrefix}.denominator`,
      entered: input.denominator,
      message: denominatorMessage,
    });
  }
  if (issues.length > 0) return { issues };
  const numerator = BigInt(input.numerator.trim());
  const denominator = BigInt(input.denominator.trim());
  return {
    issues,
    fraction: {
      input,
      numerator,
      denominator,
      value: rational(numerator, denominator),
    },
  };
}

export function parseExpression(expression: Expression): { ok: true; parsed: ParsedExpression } | { ok: false; issues: FieldIssue[] } {
  if (expression.kind === "fraction") {
    const parsed = parseFraction(expression.value, "value");
    if (!parsed.fraction) return { ok: false, issues: parsed.issues };
    return {
      ok: true,
      parsed: { expression, value: parsed.fraction.value, fractions: [parsed.fraction] },
    };
  }
  const left = parseFraction(expression.left, "left");
  const right = parseFraction(expression.right, "right");
  const issues = [...left.issues, ...right.issues];
  if (!left.fraction || !right.fraction) return { ok: false, issues };
  return {
    ok: true,
    parsed: {
      expression,
      value: add(left.fraction.value, right.fraction.value),
      fractions: [left.fraction, right.fraction],
    },
  };
}

export function parseReason(reason: Reason | undefined): { ok: true } | { ok: false; issues: FieldIssue[] } {
  if (!reason) return { ok: true };
  if (reason.kind !== "scale" && reason.kind !== "divide") return { ok: true };
  const issues: FieldIssue[] = [];
  const factorMessage = integerFieldMessage("factor", reason.factor);
  if (factorMessage) {
    issues.push({
      field: "factor",
      path: "reason.factor",
      entered: reason.factor,
      message: factorMessage,
    });
  }
  if (!TARGETS.has(reason.target)) {
    issues.push({
      field: "target",
      path: "reason.target",
      entered: String(reason.target),
      message: "Choose the fraction this factor applies to.",
    });
  }
  return issues.length > 0 ? { ok: false, issues } : { ok: true };
}

export function formatFractionInput(input: FractionInput): string {
  return `${input.numerator.trim() || "?"}/${input.denominator.trim() || "?"}`;
}

export function formatExpression(expression: Expression): string {
  if (expression.kind === "fraction") return formatFractionInput(expression.value);
  return `${formatFractionInput(expression.left)} + ${formatFractionInput(expression.right)}`;
}

export function formatValue(value: Rational): string {
  return formatRational(value);
}

export function sameFraction(a: FractionInput, b: FractionInput): boolean {
  const aNum = integerFieldMessage("numerator", a.numerator);
  const aDen = integerFieldMessage("denominator", a.denominator);
  const bNum = integerFieldMessage("numerator", b.numerator);
  const bDen = integerFieldMessage("denominator", b.denominator);
  if (aNum || aDen || bNum || bDen) return false;
  return BigInt(a.numerator.trim()) === BigInt(b.numerator.trim()) && BigInt(a.denominator.trim()) === BigInt(b.denominator.trim());
}

export function sameWritten(a: Expression, b: Expression): boolean {
  if (a.kind !== b.kind) return false;
  if (a.kind === "fraction" && b.kind === "fraction") return sameFraction(a.value, b.value);
  if (a.kind === "sum" && b.kind === "sum") return sameFraction(a.left, b.left) && sameFraction(a.right, b.right);
  return false;
}

export function fractionValue(input: FractionInput): Rational {
  return rational(BigInt(input.numerator.trim()), BigInt(input.denominator.trim()));
}

export function valuesEqual(a: Rational, b: Rational): boolean {
  return equal(a, b);
}
