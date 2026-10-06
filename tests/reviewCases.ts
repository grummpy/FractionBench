import type { CheckResult, StepStatus } from "../src/checker/checkWork";
import type { Completion } from "../src/content/completion";
import type { Expression, Step } from "../src/math/expressions";

export type ReviewExpectation = {
  statuses: StepStatus[];
  firstMathematicalErrorTransition: number | null;
  finalLineValueCorrect: boolean;
  complete: boolean;
};

export type ReviewCase = {
  id: number;
  title: string;
  start: Expression;
  steps: Step[];
  completion: Completion;
  expected: ReviewExpectation;
};

const fraction = (numerator: string, denominator: string): Expression => ({
  kind: "fraction",
  value: { numerator, denominator },
});
const sum = (an: string, ad: string, bn: string, bd: string): Expression => ({
  kind: "sum",
  left: { numerator: an, denominator: ad },
  right: { numerator: bn, denominator: bd },
});
const rewrite = (expression: Expression): Step => ({ expression, reason: { kind: "equivalentRewrite" } });
const scale = (expression: Expression, factor: string): Step => ({
  expression,
  reason: { kind: "scale", factor, target: "single" },
});
const divide = (expression: Expression, factor: string): Step => ({
  expression,
  reason: { kind: "divide", factor, target: "single" },
});
const combine = (expression: Expression): Step => ({ expression, reason: { kind: "combineLikeDenominators" } });
const reorder = (expression: Expression): Step => ({ expression, reason: { kind: "reorder" } });
const other = (expression: Expression): Step => ({ expression, reason: { kind: "other" } });

const equivalent: Completion = { kind: "equivalentValue" };
const sumValue: Completion = { kind: "sumValue" };
const simplest: Completion = { kind: "simplestForm" };

export const REVIEW_CASES: ReviewCase[] = [
  { id: 1, title: "1/2 to 2/4 verified equivalent", start: fraction("1", "2"), steps: [rewrite(fraction("2", "4"))], completion: equivalent, expected: { statuses: ["verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 2, title: "2/3 to 6/9 verified equivalent", start: fraction("2", "3"), steps: [rewrite(fraction("6", "9"))], completion: equivalent, expected: { statuses: ["verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 3, title: "4/6 to 2/3 verified simplification", start: fraction("4", "6"), steps: [divide(fraction("2", "3"), "2")], completion: simplest, expected: { statuses: ["verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 4, title: "1/2 to 3/6 to 6/12 valid alternative", start: fraction("1", "2"), steps: [rewrite(fraction("3", "6")), rewrite(fraction("6", "12"))], completion: equivalent, expected: { statuses: ["verified", "verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 5, title: "1/2 to 2/3 first mathematical error", start: fraction("1", "2"), steps: [rewrite(fraction("2", "3"))], completion: equivalent, expected: { statuses: ["mathematical_error"], firstMathematicalErrorTransition: 1, finalLineValueCorrect: false, complete: false } },
  { id: 6, title: "2/3 to 2/6 first mathematical error", start: fraction("2", "3"), steps: [rewrite(fraction("2", "6"))], completion: equivalent, expected: { statuses: ["mathematical_error"], firstMathematicalErrorTransition: 1, finalLineValueCorrect: false, complete: false } },
  { id: 7, title: "1/2 to 2/4 claimed scale factor 3", start: fraction("1", "2"), steps: [scale(fraction("2", "4"), "3")], completion: equivalent, expected: { statuses: ["equivalent_unverified_reason"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 8, title: "3/6 to 1/2 claimed division factor 2", start: fraction("3", "6"), steps: [divide(fraction("1", "2"), "2")], completion: simplest, expected: { statuses: ["equivalent_unverified_reason"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 9, title: "1/2 to 1/2 no progress", start: fraction("1", "2"), steps: [rewrite(fraction("1", "2"))], completion: equivalent, expected: { statuses: ["no_progress"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: false } },
  { id: 10, title: "E01 ends at 3/6", start: fraction("1", "2"), steps: [rewrite(fraction("3", "6"))], completion: { kind: "denominator", denominator: "4" }, expected: { statuses: ["verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: false } },
  { id: 11, title: "E05 ends at 4/6", start: fraction("4", "6"), steps: [], completion: simplest, expected: { statuses: [], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: false } },
  { id: 12, title: "1/4 + 2/4 to 3/4 verified combine", start: sum("1", "4", "2", "4"), steps: [combine(fraction("3", "4"))], completion: sumValue, expected: { statuses: ["verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 13, title: "1/4 + 2/4 to 3/8 mathematical error", start: sum("1", "4", "2", "4"), steps: [combine(fraction("3", "8"))], completion: sumValue, expected: { statuses: ["mathematical_error"], firstMathematicalErrorTransition: 1, finalLineValueCorrect: false, complete: false } },
  { id: 14, title: "1/2 + 1/3 through sixths to 5/6", start: sum("1", "2", "1", "3"), steps: [rewrite(sum("3", "6", "2", "6")), combine(fraction("5", "6"))], completion: sumValue, expected: { statuses: ["verified", "verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 15, title: "1/2 + 1/3 through twelfths to 10/12", start: sum("1", "2", "1", "3"), steps: [rewrite(sum("6", "12", "4", "12")), combine(fraction("10", "12"))], completion: sumValue, expected: { statuses: ["verified", "verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 16, title: "reorder then direct sum", start: sum("1", "2", "1", "3"), steps: [reorder(sum("1", "3", "1", "2")), other(fraction("5", "6"))], completion: sumValue, expected: { statuses: ["verified", "verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 17, title: "simplify first then add", start: sum("2", "4", "1", "4"), steps: [rewrite(sum("1", "2", "1", "4")), other(fraction("3", "4"))], completion: sumValue, expected: { statuses: ["verified", "verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 18, title: "offsetting-looking change that actually changes the value", start: sum("1", "2", "1", "3"), steps: [rewrite(sum("2", "6", "2", "6")), combine(fraction("4", "6"))], completion: sumValue, expected: { statuses: ["mathematical_error", "not_judged"], firstMathematicalErrorTransition: 1, finalLineValueCorrect: false, complete: false } },
  { id: 19, title: "valid sixths then 6/6", start: sum("1", "2", "1", "3"), steps: [rewrite(sum("3", "6", "2", "6")), combine(fraction("6", "6"))], completion: sumValue, expected: { statuses: ["verified", "mathematical_error"], firstMathematicalErrorTransition: 2, finalLineValueCorrect: false, complete: false } },
  { id: 20, title: "wrong middle then a correct final value", start: sum("1", "2", "1", "3"), steps: [rewrite(fraction("2", "5")), other(fraction("5", "6"))], completion: sumValue, expected: { statuses: ["mathematical_error", "not_judged"], firstMathematicalErrorTransition: 1, finalLineValueCorrect: true, complete: false } },
  { id: 21, title: "direct sum claimed as combine", start: sum("1", "2", "1", "3"), steps: [combine(fraction("5", "6"))], completion: sumValue, expected: { statuses: ["equivalent_unverified_reason"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 22, title: "offsetting term rewrite", start: sum("1", "2", "1", "3"), steps: [rewrite(sum("1", "4", "7", "12"))], completion: sumValue, expected: { statuses: ["equivalent_unverified_reason"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: false } },
  { id: 23, title: "offsetting rewrite then 1", start: sum("1", "2", "1", "3"), steps: [rewrite(sum("1", "4", "7", "12")), other(fraction("1", "1"))], completion: sumValue, expected: { statuses: ["equivalent_unverified_reason", "mathematical_error"], firstMathematicalErrorTransition: 2, finalLineValueCorrect: false, complete: false } },
  { id: 24, title: "3/4 + 2/3 to 17/12", start: sum("3", "4", "2", "3"), steps: [rewrite(sum("9", "12", "8", "12")), combine(fraction("17", "12"))], completion: sumValue, expected: { statuses: ["verified", "verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 25, title: "5/6 + 1/3 to 7/6", start: sum("5", "6", "1", "3"), steps: [rewrite(sum("5", "6", "2", "6")), combine(fraction("7", "6"))], completion: sumValue, expected: { statuses: ["verified", "verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 26, title: "0/4 to 0/7", start: fraction("0", "4"), steps: [rewrite(fraction("0", "7"))], completion: equivalent, expected: { statuses: ["verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: true } },
  { id: 27, title: "1/0 invalid input", start: fraction("1", "2"), steps: [{ expression: fraction("1", "0") }], completion: equivalent, expected: { statuses: ["invalid_input"], firstMathematicalErrorTransition: null, finalLineValueCorrect: false, complete: false } },
  { id: 28, title: "decimal numerator and blank denominator", start: fraction("1", "2"), steps: [{ expression: fraction("1.5", "") }], completion: equivalent, expected: { statuses: ["invalid_input"], firstMathematicalErrorTransition: null, finalLineValueCorrect: false, complete: false } },
  { id: 29, title: "verified rewrite and unfinished addition", start: sum("1", "2", "1", "3"), steps: [rewrite(sum("3", "6", "2", "6"))], completion: sumValue, expected: { statuses: ["verified"], firstMathematicalErrorTransition: null, finalLineValueCorrect: true, complete: false } },
  { id: 30, title: "valid prefix then a later mathematical error", start: fraction("1", "2"), steps: [rewrite(fraction("6", "12")), rewrite(fraction("3", "4"))], completion: equivalent, expected: { statuses: ["verified", "mathematical_error"], firstMathematicalErrorTransition: 2, finalLineValueCorrect: false, complete: false } },
];

export function expectationMatches(result: CheckResult, expected: ReviewExpectation): string[] {
  const problems: string[] = [];
  const statuses = result.steps.map((step) => step.status);
  if (JSON.stringify(statuses) !== JSON.stringify(expected.statuses)) {
    problems.push(`statuses ${statuses.join(",")} !== ${expected.statuses.join(",")}`);
  }
  if (result.firstMathematicalErrorTransition !== expected.firstMathematicalErrorTransition) {
    problems.push(`first error ${result.firstMathematicalErrorTransition} !== ${expected.firstMathematicalErrorTransition}`);
  }
  if (result.finalLineValueCorrect !== expected.finalLineValueCorrect) problems.push("final value flag");
  if (result.complete !== expected.complete) problems.push("complete flag");
  return problems;
}
