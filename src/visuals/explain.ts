import type { CheckResult } from "../checker/checkWork";
import type { Problem } from "../content/problems";
import { formatExpression, formatValue, parseExpression, type Expression, type FractionInput } from "../math/expressions";
import { lcm } from "../math/rational";
import { fractionStripSvg, numberLineSvg, type LineMarker } from "./svg";

export type Explanation = {
  title: string;
  text: string;
  defaultView: "strip" | "line";
  stripSvg: string | null;
  lineSvg: string | null;
  unavailable: string | null;
};

type Row = {
  label: string;
  numerator: bigint;
  denominator: bigint;
  pattern: "stripe" | "dot" | "cross";
};

const PATTERNS = ["stripe", "dot", "cross"] as const;

function writtenParts(input: FractionInput): { numerator: bigint; denominator: bigint } | null {
  if (!/^\d+$/.test(input.numerator.trim()) || !/^\d+$/.test(input.denominator.trim())) return null;
  if (input.denominator.trim().length > 4 || input.numerator.trim().length > 4) return null;
  const denominator = BigInt(input.denominator.trim());
  if (denominator === 0n) return null;
  return { numerator: BigInt(input.numerator.trim()), denominator };
}

function exceedsOne(expression: Expression): boolean {
  const parsed = parseExpression(expression);
  return parsed.ok && parsed.parsed.value.numerator > parsed.parsed.value.denominator;
}

function exactText(expressions: Expression[]): string {
  return expressions
    .map((expression) => {
      const parsed = parseExpression(expression);
      if (!parsed.ok) return formatExpression(expression);
      const written = formatExpression(expression);
      const value = formatValue(parsed.parsed.value);
      return written === value ? written : `${written}, which equals ${value}`;
    })
    .join(". ");
}

export function explain(problem: Problem, steps: Expression[], result: CheckResult | null): Explanation {
  const focusStep = result && result.focus.kind === "step" ? result.steps[result.focus.index] : null;
  const before = focusStep ? (focusStep.index === 0 ? problem.start : steps[focusStep.index - 1]) : problem.start;
  const after = focusStep ? steps[focusStep.index] : steps[steps.length - 1] ?? problem.start;
  const showing = focusStep ? [before, after] : [problem.start, ...(steps.length > 0 ? [steps[steps.length - 1]] : [])];
  const unique = showing.filter((expression, index) => showing.findIndex((item) => formatExpression(item) === formatExpression(expression)) === index);
  const condition = focusStep?.condition;
  const defaultView: "strip" | "line" =
    condition === "incorrect-scaling" || condition === "denominator-addition" || problem.world === "equivalent" ? "strip" : "line";
  const title =
    condition === "denominator-addition"
      ? "Denominators name the size of each part"
      : condition === "incorrect-scaling"
        ? "Only the denominator changed, so the amount changed"
        : condition === "value-change"
          ? "These two expressions have different values"
          : problem.world === "addition"
            ? "Equal units for this addition"
            : "Same amount, two partitions";

  const textParts = [exactText(unique)];
  if (focusStep?.message) textParts.push(focusStep.message);
  else if (result?.summary) textParts.push(result.summary);
  if (unique.some(exceedsOne)) {
    textParts.push("One whole stays the same size. The model continues past 1 when the value is greater than 1.");
  }

  const rows: Row[] = [];
  const markers: LineMarker[] = [];
  let unavailable: string | null = null;
  let patternIndex = 0;

  const pushFraction = (input: FractionInput, caption: string) => {
    const parts = writtenParts(input);
    const parsed = parseExpression({ kind: "fraction", value: input });
    if (!parts || !parsed.ok) return;
    const reduced = parsed.parsed.value;
    if (parts.denominator > 60n || parts.numerator > parts.denominator * 2n) {
      unavailable = "A denominator is greater than 60, or the amount is past two wholes. The text states the exact value. A simpler equal fraction is drawn only when that drawing stays readable, and it is labeled as simpler rather than rounded.";
      if (reduced.denominator <= 60n && reduced.numerator <= reduced.denominator * 2n) {
        rows.push({
          label: `Simpler equal fraction ${reduced.numerator.toString()}/${reduced.denominator.toString()} for ${caption}`,
          numerator: reduced.numerator,
          denominator: reduced.denominator,
          pattern: PATTERNS[patternIndex % 3],
        });
        markers.push({ numerator: reduced.numerator, denominator: reduced.denominator, label: `${reduced.numerator.toString()}/${reduced.denominator.toString()}` });
        patternIndex += 1;
      }
      return;
    }
    rows.push({
      label: `${caption} · ${parts.numerator.toString()} of ${parts.denominator.toString()} parts`,
      numerator: parts.numerator,
      denominator: parts.denominator,
      pattern: PATTERNS[patternIndex % 3],
    });
    markers.push({
      numerator: parts.numerator,
      denominator: parts.denominator,
      label: `${parts.numerator.toString()}/${parts.denominator.toString()}`,
    });
    patternIndex += 1;
  };

  for (const expression of unique) {
    if (expression.kind === "fraction") {
      pushFraction(expression.value, formatExpression(expression));
    } else {
      pushFraction(expression.left, formatExpression({ kind: "fraction", value: expression.left }));
      pushFraction(expression.right, formatExpression({ kind: "fraction", value: expression.right }));
      const parsed = parseExpression(expression);
      if (parsed.ok && parsed.parsed.value.denominator <= 60n) {
        rows.push({
          label: `Exact sum ${formatValue(parsed.parsed.value)}`,
          numerator: parsed.parsed.value.numerator,
          denominator: parsed.parsed.value.denominator,
          pattern: PATTERNS[patternIndex % 3],
        });
        markers.push({
          numerator: parsed.parsed.value.numerator,
          denominator: parsed.parsed.value.denominator,
          label: formatValue(parsed.parsed.value),
        });
        patternIndex += 1;
      }
    }
  }

  if (unavailable) textParts.push(unavailable);
  const strip = fractionStripSvg(title, rows);
  const dens = markers.map((marker) => marker.denominator);
  const partition = dens.length === 0 ? 1n : dens.reduce((acc, den) => lcm(acc, den));
  const wholeEnd: 1 | 2 = unique.some(exceedsOne) || markers.some((marker) => marker.numerator > marker.denominator) ? 2 : 1;
  const line =
    partition > 60n
      ? { unavailable: "The common partition is greater than 60. The exact comparison stays in the text." }
      : numberLineSvg({ title, denominator: partition, wholeEnd, markers });
  if ("unavailable" in line && !unavailable) unavailable = line.unavailable;

  return {
    title,
    text: textParts.join(" "),
    defaultView,
    stripSvg: "svg" in strip ? strip.svg : null,
    lineSvg: "svg" in line ? line.svg : null,
    unavailable: "unavailable" in strip ? strip.unavailable : unavailable,
  };
}
