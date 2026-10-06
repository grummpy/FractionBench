import { describe, expect, it } from "vitest";
import { checkWork } from "../src/checker/checkWork";
import { validNextStep } from "../src/content/hints";
import { PROBLEMS } from "../src/content/problems";
import type { Step } from "../src/math/expressions";

describe("authored problems", () => {
  it("contains the 20 stable problems", () => {
    expect(PROBLEMS.map((problem) => problem.id)).toEqual([
      "E01", "E02", "E03", "E04", "E05", "E06", "E07", "E08",
      "A01", "A02", "A03", "A04", "A05", "A06", "A07", "A08", "A09", "A10", "A11", "A12",
    ]);
  });

  it("accepts every reference and alternative path", () => {
    for (const problem of PROBLEMS) {
      for (const path of [problem.reference, ...problem.alternatives]) {
        const result = checkWork({ start: problem.start, steps: path, completion: problem.completion });
        expect(result.steps.map((step) => step.status), `${problem.id} ${JSON.stringify(path)}`).toEqual(path.map(() => "verified"));
        expect(result.complete, problem.id).toBe(true);
      }
      expect(problem.alternatives.length).toBeGreaterThan(0);
    }
  });

  it("shows one hint step at a time", () => {
    for (const problem of PROBLEMS) {
      let steps: Step[] = [];
      const first = checkWork({ start: problem.start, steps, completion: problem.completion });
      const hint = validNextStep(problem, steps, first);
      expect(hint?.step).toEqual(problem.reference[0]);
      for (const step of problem.reference) {
        const before = checkWork({ start: problem.start, steps, completion: problem.completion });
        const next = validNextStep(problem, steps, before);
        expect(next?.step).toEqual(step);
        steps = [...steps, step];
      }
      const done = checkWork({ start: problem.start, steps, completion: problem.completion });
      expect(done.complete).toBe(true);
      expect(validNextStep(problem, steps, done)).toBeNull();
    }
  });
});
