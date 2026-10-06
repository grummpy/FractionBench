import { describe, expect, it } from "vitest";
import { checkWork } from "../src/checker/checkWork";
import { parseExpression } from "../src/math/expressions";

describe("input boundaries", () => {
  it("explains an out-of-range numerator without changing it", () => {
    const step = { expression: { kind: "fraction" as const, value: { numerator: "1000", denominator: "2" } } };
    const snapshot = JSON.parse(JSON.stringify(step));
    const result = checkWork({
      start: { kind: "fraction", value: { numerator: "1", denominator: "2" } },
      steps: [step],
      completion: { kind: "equivalentValue" },
    });
    expect(step).toEqual(snapshot);
    expect(result.steps[0].status).toBe("invalid_input");
    expect(result.steps[0].message).toContain("1000");
    expect(result.steps[0].message).toContain("not shortened");
  });

  it("does not evaluate arbitrary text", () => {
    const parsed = parseExpression({ kind: "fraction", value: { numerator: "1;alert(1)", denominator: "2" } });
    expect(parsed.ok).toBe(false);
  });

  it("stops checking after 12 steps", () => {
    const steps = Array.from({ length: 13 }, () => ({
      expression: { kind: "fraction" as const, value: { numerator: "2", denominator: "4" } },
      reason: { kind: "equivalentRewrite" as const },
    }));
    const result = checkWork({
      start: { kind: "fraction", value: { numerator: "1", denominator: "2" } },
      steps,
      completion: { kind: "denominator", denominator: "4" },
    });
    expect(result.steps[11].status).toBe("no_progress");
    expect(result.steps[12].status).toBe("invalid_input");
    expect(result.steps[12].message).toContain("12");
  });

  it("keeps a verified prefix when a later row is invalid", () => {
    const result = checkWork({
      start: { kind: "fraction", value: { numerator: "1", denominator: "2" } },
      steps: [
        { expression: { kind: "fraction", value: { numerator: "2", denominator: "4" } }, reason: { kind: "equivalentRewrite" } },
        { expression: { kind: "fraction", value: { numerator: "1", denominator: "0" } } },
        { expression: { kind: "fraction", value: { numerator: "1", denominator: "2" } } },
      ],
      completion: { kind: "denominator", denominator: "4" },
    });
    expect(result.steps.map((step) => step.status)).toEqual(["verified", "invalid_input", "not_judged"]);
  });
});
