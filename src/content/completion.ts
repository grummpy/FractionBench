import { gcd } from "../math/rational";
import { fractionValue, parseExpression, type Expression } from "../math/expressions";

export type Completion =
  | { kind: "equivalentValue" }
  | { kind: "denominator"; denominator: string }
  | { kind: "simplestForm" }
  | { kind: "sumValue" };

export function taskFormMet(completion: Completion, start: Expression, last: Expression | null): boolean {
  if (!last) return false;
  const startParsed = parseExpression(start);
  const lastParsed = parseExpression(last);
  if (!startParsed.ok || !lastParsed.ok) return false;
  if (startParsed.parsed.value.numerator * lastParsed.parsed.value.denominator !== lastParsed.parsed.value.numerator * startParsed.parsed.value.denominator) {
    return false;
  }
  if (last.kind !== "fraction") {
    return false;
  }
  const numerator = BigInt(last.value.numerator.trim());
  const denominator = BigInt(last.value.denominator.trim());
  switch (completion.kind) {
    case "equivalentValue":
    case "sumValue":
      return true;
    case "denominator":
      return denominator === BigInt(completion.denominator);
    case "simplestForm":
      return gcd(numerator, denominator) === 1n;
    default: {
      const _never: never = completion;
      return _never;
    }
  }
}

export function expressionValueText(expression: Expression): string | null {
  const parsed = parseExpression(expression);
  if (!parsed.ok) return null;
  return `${parsed.parsed.value.numerator.toString()}/${parsed.parsed.value.denominator.toString()}`;
}

export function writtenFractionValue(expression: Expression): ReturnType<typeof fractionValue> | null {
  const parsed = parseExpression(expression);
  return parsed.ok ? parsed.parsed.value : null;
}
