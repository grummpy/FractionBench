import { describe, expect, it } from "vitest";
import { checkWork } from "../src/checker/checkWork";
import { PROBLEMS } from "../src/content/problems";
import type { Skill } from "../src/content/signature";
import { enumerateSignatures, fallbackPool, generatePair, selectPracticeSkill, withinPracticeBounds } from "../src/practice/generate";

const SKILLS: Skill[] = ["equivalentScaling", "simplification", "equalDenominatorAddition", "unlikeDenominatorAddition"];

describe("practice generation", () => {
  it("is deterministic and returns two distinct in-bounds problems", () => {
    for (const skill of SKILLS) {
      const first = generatePair({ skill, seed: 7, avoid: ["1/2->4"] });
      const second = generatePair({ skill, seed: 7, avoid: ["1/2->4"] });
      expect(first.map((problem) => problem.signature)).toEqual(second.map((problem) => problem.signature));
      expect(new Set(first.map((problem) => problem.signature)).size).toBe(2);
      for (const problem of first) {
        expect(problem.signature).not.toBe("1/2->4");
        expect(withinPracticeBounds(problem)).toBe(true);
        const result = checkWork({ start: problem.start, steps: problem.reference, completion: problem.completion });
        expect(result.complete).toBe(true);
        expect(result.steps.every((step) => step.status === "verified")).toBe(true);
      }
    }
  });

  it("avoids signatures already seen", () => {
    const skill = "equivalentScaling" as const;
    const first = generatePair({ skill, seed: 3, avoid: [] });
    const next = generatePair({ skill, seed: 3, avoid: first.map((problem) => problem.signature) });
    const signatures = [...first, ...next].map((problem) => problem.signature);
    expect(new Set(signatures).size).toBe(4);
  });

  it("uses the fallback pool when random attempts are exhausted", () => {
    for (const skill of SKILLS) {
      const pair = generatePair({ skill, seed: 1, avoid: [], maxAttempts: 0 });
      expect(pair.map((problem) => problem.signature)).toEqual(fallbackPool[skill].slice(0, 2).map((problem) => problem.signature));
      expect(() =>
        generatePair({
          skill,
          seed: 1,
          avoid: [...enumerateSignatures(skill), ...fallbackPool[skill].map((problem) => problem.signature)],
          maxAttempts: 0,
        }),
      ).toThrow(/practice pool/);
    }
  });

  it("chooses a skill from the problem unless a scale operation demonstrably failed", () => {
    const addition = PROBLEMS.find((problem) => problem.id === "A08");
    const scaling = PROBLEMS.find((problem) => problem.id === "E01");
    if (!addition || !scaling) throw new Error("missing problem");
    expect(selectPracticeSkill(addition, null)).toBe(addition.skill);
    const failedScale = checkWork({
      start: scaling.start,
      steps: [{ expression: { kind: "fraction", value: { numerator: "2", denominator: "6" } }, reason: { kind: "scale", factor: "2", target: "single" } }],
      completion: scaling.completion,
    });
    expect(selectPracticeSkill(scaling, failedScale)).toBe("equivalentScaling");
    const failedAdd = checkWork({
      start: addition.start,
      steps: [{ expression: { kind: "fraction", value: { numerator: "2", denominator: "5" } } }],
      completion: addition.completion,
    });
    expect(selectPracticeSkill(addition, failedAdd)).toBe(addition.skill);
  });
});
