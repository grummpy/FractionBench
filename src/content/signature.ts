import type { Completion } from "./completion";
import type { Expression, FractionInput } from "../math/expressions";

export type Skill = "equivalentScaling" | "simplification" | "equalDenominatorAddition" | "unlikeDenominatorAddition";

function canonFraction(input: FractionInput): string {
  return `${BigInt(input.numerator.trim()).toString()}/${BigInt(input.denominator.trim()).toString()}`;
}

function compareFractions(a: FractionInput, b: FractionInput): number {
  const aDen = BigInt(a.denominator.trim());
  const bDen = BigInt(b.denominator.trim());
  if (aDen < bDen) return -1;
  if (aDen > bDen) return 1;
  const aNum = BigInt(a.numerator.trim());
  const bNum = BigInt(b.numerator.trim());
  if (aNum < bNum) return -1;
  if (aNum > bNum) return 1;
  return 0;
}

export function additionSignature(left: FractionInput, right: FractionInput): string {
  const ordered = [left, right].slice().sort(compareFractions);
  return `${canonFraction(ordered[0])}+${canonFraction(ordered[1])}`;
}

export function problemSignature(input: { skill: Skill; start: Expression; completion: Completion }): string {
  if (input.skill === "equivalentScaling" && input.completion.kind === "denominator" && input.start.kind === "fraction") {
    return `${canonFraction(input.start.value)}->${BigInt(input.completion.denominator).toString()}`;
  }
  if (input.skill === "simplification" && input.start.kind === "fraction") {
    return `${canonFraction(input.start.value)}->simplest`;
  }
  if (input.start.kind === "sum") return additionSignature(input.start.left, input.start.right);
  throw new Error("problem signature is not defined for this shape");
}
