import type { Reason, Step } from "../math/expressions";

export type ReasonKind = "" | Reason["kind"];

export type Draft = {
  key: string;
  shape: "fraction" | "sum";
  numerator: string;
  denominator: string;
  leftNumerator: string;
  leftDenominator: string;
  rightNumerator: string;
  rightDenominator: string;
  reasonKind: ReasonKind;
  factor: string;
  target: "left" | "right" | "single";
};

export function emptyDraft(key: string, shape: Draft["shape"]): Draft {
  return {
    key,
    shape,
    numerator: "",
    denominator: "",
    leftNumerator: "",
    leftDenominator: "",
    rightNumerator: "",
    rightDenominator: "",
    reasonKind: "",
    factor: "",
    target: shape === "fraction" ? "single" : "left",
  };
}

export function draftToStep(draft: Draft): Step {
  const expression =
    draft.shape === "fraction"
      ? { kind: "fraction" as const, value: { numerator: draft.numerator, denominator: draft.denominator } }
      : {
          kind: "sum" as const,
          left: { numerator: draft.leftNumerator, denominator: draft.leftDenominator },
          right: { numerator: draft.rightNumerator, denominator: draft.rightDenominator },
        };
  if (!draft.reasonKind) return { expression };
  if (draft.reasonKind === "scale" || draft.reasonKind === "divide") {
    const target = draft.shape === "fraction" ? "single" : draft.target === "single" ? "left" : draft.target;
    return { expression, reason: { kind: draft.reasonKind, factor: draft.factor, target } };
  }
  return { expression, reason: { kind: draft.reasonKind } };
}
