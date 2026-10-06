import type { Completion } from "./completion";
import type { FieldIssue } from "../math/expressions";

export function verifiedMessage(condition: string): string {
  if (condition === "direct-sum") {
    return "This result equals the sum. I labeled it a correct equivalent result. A common-denominator breakdown is needed only when you want that method checked.";
  }
  if (condition === "combine") {
    return "These two expressions have the same value. The numerators were added, and the equal denominator stayed the same.";
  }
  if (condition === "reorder") {
    return "These two expressions have the same value. The addends changed places.";
  }
  if (condition === "scale") {
    return "These two expressions have the same value. The numerator and the denominator were multiplied by the same factor.";
  }
  if (condition === "divide") {
    return "These two expressions have the same value. The numerator and the denominator were divided by the same factor, exactly.";
  }
  return "These two expressions have the same value, and the reason matches this step.";
}

export function mathematicalErrorMessage(beforeText: string, beforeValue: string, afterText: string, afterValue: string, condition: string): string {
  const base = `These two expressions have different values. ${beforeText} equals ${beforeValue}. ${afterText} equals ${afterValue}.`;
  if (condition === "denominator-addition") {
    return `${base} The denominators name the size of the parts. Adding the denominators names a different unit, so that line is not the sum.`;
  }
  if (condition === "incorrect-scaling") {
    return `${base} The numerator stayed the same while the denominator changed, so the size of each part changed.`;
  }
  return base;
}

export function unverifiedMessage(condition: string, detail: string): string {
  const lead = "The value is preserved. I couldn't verify the selected reason.";
  switch (condition) {
    case "missing":
      return `${lead} No reason was selected.`;
    case "scale-factor-mismatch":
      return `${lead} ${detail}`;
    case "divide-factor-mismatch":
      return `${lead} ${detail}`;
    case "combine-denominator-mismatch":
      return `${lead} The denominators are not the same, so combining equal denominators does not describe this step.`;
    case "combine-numerator-mismatch":
      return `${lead} The result is not the numerator sum with that shared denominator.`;
    case "offsetting-terms":
      return `${lead} The total stayed equal, but neither fraction was replaced by an equivalent fraction.`;
    case "reason-structure-mismatch":
      return `${lead} ${detail || "The expression does not match that reason."}`;
    case "other-unverified":
      return "The value is preserved. Another method is outside the reasons I can verify.";
    default:
      return lead;
  }
}

export function invalidInputMessage(issues: FieldIssue[]): string {
  if (issues.length === 0) {
    return "This step has invalid input, so its value was not scored.";
  }
  return issues.map((issue) => issue.message).join(" ");
}

export function noProgressMessage(): string {
  return "This line matches the one before it. The value is preserved, and the expression has not changed yet.";
}

export function notJudgedMessage(): string {
  return "This line was not checked. An earlier line needs attention first, so this line is not used as a new starting point.";
}

export function stepLimitMessage(): string {
  return "Only 12 steps can be checked. This extra step was left as entered and was not scored.";
}

export function incompleteMessage(completion: Completion): string {
  switch (completion.kind) {
    case "denominator":
      return `The value matches, and the requested denominator ${completion.denominator} is not the last line yet.`;
    case "simplestForm":
      return "The value matches, and the simplest-form request is not finished yet.";
    case "sumValue":
      return "The value matches so far. The addition is not finished yet, because the last line is still a sum.";
    case "equivalentValue":
      return "The value matches, and a changed equivalent fraction is not on the last line yet.";
    default: {
      const _never: never = completion;
      return _never;
    }
  }
}

export function completeSummary(): string {
  return "The last line meets this goal, and no earlier line changed the value.";
}

export function notStartedMessage(): string {
  return "Add a step when you are ready. The starting expression stays as it is.";
}

export function blockedSummary(stepMessage: string): string {
  return stepMessage;
}
