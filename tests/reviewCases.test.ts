import { describe, expect, it } from "vitest";
import { checkWork } from "../src/checker/checkWork";
import { REVIEW_CASES, expectationMatches } from "./reviewCases";

describe("30-case review set", () => {
  it("has exactly 30 cases", () => {
    expect(REVIEW_CASES).toHaveLength(30);
    expect(REVIEW_CASES.map((item) => item.id)).toEqual(Array.from({ length: 30 }, (_, index) => index + 1));
  });

  it.each(REVIEW_CASES.map((item) => [item.id, item] as const))("case %s", (_id, item) => {
    const result = checkWork({ start: item.start, steps: item.steps, completion: item.completion });
    expect(expectationMatches(result, item.expected)).toEqual([]);
  });

  it("keeps a correct final line from washing out an earlier mathematical error", () => {
    const item = REVIEW_CASES[19];
    const result = checkWork({ start: item.start, steps: item.steps, completion: item.completion });
    expect(result.finalLineValueCorrect).toBe(true);
    expect(result.complete).toBe(false);
    expect(result.steps[1].status).toBe("not_judged");
    expect(result.firstMathematicalErrorTransition).toBe(1);
  });

  it("does not call a zero denominator a mathematical error", () => {
    const item = REVIEW_CASES[26];
    const result = checkWork({ start: item.start, steps: item.steps, completion: item.completion });
    expect(result.steps[0].status).toBe("invalid_input");
    expect(result.steps[0].message.toLowerCase()).toContain("denominator of 0");
    expect(result.steps[0].message.toLowerCase()).not.toContain("different values");
  });

  it("names the decimal and the blank denominator", () => {
    const item = REVIEW_CASES[27];
    const result = checkWork({ start: item.start, steps: item.steps, completion: item.completion });
    expect(result.steps[0].message).toContain("1.5");
    expect(result.steps[0].message).toContain("Enter a denominator.");
    expect(result.steps[0].issues.map((issue) => issue.path).sort()).toEqual(["value.denominator", "value.numerator"]);
  });

  it("explains a denominator-addition change as different values", () => {
    const item = REVIEW_CASES[12];
    const result = checkWork({ start: item.start, steps: item.steps, completion: item.completion });
    expect(result.steps[0].message).toContain("different values");
    expect(result.steps[0].message.toLowerCase()).toContain("denominator");
  });

  it("preserves value language for a mismatched scale factor", () => {
    const item = REVIEW_CASES[6];
    const result = checkWork({ start: item.start, steps: item.steps, completion: item.completion });
    expect(result.steps[0].message).toContain("value is preserved");
    expect(result.steps[0].message).toContain("3");
    expect(result.steps[0].status).not.toBe("mathematical_error");
  });

  it("labels a direct unlike sum as a correct equivalent result", () => {
    const item = REVIEW_CASES[15];
    const result = checkWork({ start: item.start, steps: item.steps, completion: item.completion });
    expect(result.steps[1].message.toLowerCase()).toContain("correct equivalent result");
  });
});
