import { taskFormMet, type Completion } from "../content/completion";
import {
  blockedSummary,
  completeSummary,
  incompleteMessage,
  invalidInputMessage,
  mathematicalErrorMessage,
  noProgressMessage,
  notJudgedMessage,
  notStartedMessage,
  stepLimitMessage,
  unverifiedMessage,
  verifiedMessage,
} from "../content/feedback";
import { MAX_STEPS } from "../content/limits";
import {
  formatExpression,
  formatValue,
  parseExpression,
  parseReason,
  sameWritten,
  type Expression,
  type FieldIssue,
  type Reason,
  type Step,
} from "../math/expressions";
import { equal } from "../math/rational";
import { judgePreservingTransition, valueChangeCondition, type TransitionCondition } from "./transitions";

export type StepStatus =
  | "verified"
  | "mathematical_error"
  | "equivalent_unverified_reason"
  | "invalid_input"
  | "no_progress"
  | "not_judged";

export type StepCheck = {
  index: number;
  transition: number;
  status: StepStatus;
  message: string;
  issues: FieldIssue[];
  beforeText: string;
  afterText: string;
  beforeValue: string | null;
  afterValue: string | null;
  condition: TransitionCondition | "invalid" | "not-judged" | "step-limit";
  claimed: Reason["kind"] | null;
};

export type Focus =
  | { kind: "step"; index: number; status: StepStatus }
  | { kind: "incomplete" }
  | { kind: "complete" }
  | { kind: "notStarted" };

export type CheckResult = {
  steps: StepCheck[];
  firstMathematicalErrorTransition: number | null;
  finalLineValueCorrect: boolean;
  taskFormMet: boolean;
  progressMade: boolean;
  complete: boolean;
  focus: Focus;
  summary: string;
};

function lastParsedExpression(start: Expression, steps: Step[]): Expression | null {
  if (steps.length === 0) return start;
  const last = steps[steps.length - 1].expression;
  return parseExpression(last).ok ? last : null;
}

export function checkWork(input: { start: Expression; steps: Step[]; completion: Completion }): CheckResult {
  const startParsed = parseExpression(input.start);
  if (!startParsed.ok) {
    throw new Error("starting expression must be valid");
  }

  const checks: StepCheck[] = [];
  let previous = input.start;
  let blocked = false;

  input.steps.forEach((step, index) => {
    const transition = index + 1;
    const beforeText = formatExpression(previous);
    const afterText = formatExpression(step.expression);
    const claimed = step.reason?.kind ?? null;

    if (blocked) {
      checks.push({
        index,
        transition,
        status: "not_judged",
        message: notJudgedMessage(),
        issues: [],
        beforeText,
        afterText,
        beforeValue: null,
        afterValue: null,
        condition: "not-judged",
        claimed,
      });
      return;
    }

    if (index >= MAX_STEPS) {
      blocked = true;
      checks.push({
        index,
        transition,
        status: "invalid_input",
        message: stepLimitMessage(),
        issues: [],
        beforeText,
        afterText,
        beforeValue: null,
        afterValue: null,
        condition: "step-limit",
        claimed,
      });
      return;
    }

    const parsedAfter = parseExpression(step.expression);
    const parsedReason = parseReason(step.reason);
    if (!parsedAfter.ok || !parsedReason.ok) {
      blocked = true;
      const issues = [...(!parsedAfter.ok ? parsedAfter.issues : []), ...(!parsedReason.ok ? parsedReason.issues : [])];
      checks.push({
        index,
        transition,
        status: "invalid_input",
        message: invalidInputMessage(issues),
        issues,
        beforeText,
        afterText,
        beforeValue: formatValue(startParsed.parsed.value),
        afterValue: null,
        condition: "invalid",
        claimed,
      });
      return;
    }

    const beforeParsed = parseExpression(previous);
    if (!beforeParsed.ok) {
      throw new Error("previous expression became invalid");
    }
    const valuesMatch = equal(beforeParsed.parsed.value, parsedAfter.parsed.value);
    if (!valuesMatch) {
      blocked = true;
      const condition = valueChangeCondition(previous, step.expression);
      checks.push({
        index,
        transition,
        status: "mathematical_error",
        message: mathematicalErrorMessage(
          beforeText,
          formatValue(beforeParsed.parsed.value),
          afterText,
          formatValue(parsedAfter.parsed.value),
          condition,
        ),
        issues: [],
        beforeText,
        afterText,
        beforeValue: formatValue(beforeParsed.parsed.value),
        afterValue: formatValue(parsedAfter.parsed.value),
        condition,
        claimed,
      });
      return;
    }

    if (sameWritten(previous, step.expression)) {
      checks.push({
        index,
        transition,
        status: "no_progress",
        message: noProgressMessage(),
        issues: [],
        beforeText,
        afterText,
        beforeValue: formatValue(beforeParsed.parsed.value),
        afterValue: formatValue(parsedAfter.parsed.value),
        condition: "no-progress",
        claimed,
      });
      previous = step.expression;
      return;
    }

    const judged = judgePreservingTransition(previous, step.expression, step.reason);
    const message =
      judged.status === "verified"
        ? verifiedMessage(judged.condition)
        : judged.status === "no_progress"
          ? noProgressMessage()
          : unverifiedMessage(judged.condition, judged.detail);
    checks.push({
      index,
      transition,
      status: judged.status,
      message,
      issues: [],
      beforeText,
      afterText,
      beforeValue: formatValue(beforeParsed.parsed.value),
      afterValue: formatValue(parsedAfter.parsed.value),
      condition: judged.condition,
      claimed,
    });
    previous = step.expression;
  });

  const last = lastParsedExpression(input.start, input.steps);
  const lastParsed = last ? parseExpression(last) : null;
  const finalLineValueCorrect = Boolean(lastParsed && lastParsed.ok && equal(lastParsed.parsed.value, startParsed.parsed.value));
  const formMet = taskFormMet(input.completion, input.start, input.steps.length === 0 ? null : last);
  const progressMade = checks.some((step) => step.status === "verified" || step.status === "equivalent_unverified_reason");
  const hasBlocking = checks.some((step) => step.status === "mathematical_error" || step.status === "invalid_input");
  const complete = formMet && progressMade && !hasBlocking;
  const firstMath = checks.find((step) => step.status === "mathematical_error");

  const focus = selectFocus(checks, complete, input.steps.length === 0);
  const summary = buildSummary(checks, focus, complete, input.completion);

  return {
    steps: checks,
    firstMathematicalErrorTransition: firstMath ? firstMath.transition : null,
    finalLineValueCorrect,
    taskFormMet: formMet,
    progressMade,
    complete,
    focus,
    summary,
  };
}

function selectFocus(checks: StepCheck[], complete: boolean, empty: boolean): Focus {
  if (empty) return { kind: "incomplete" };
  const blocking = checks.find((step) => step.status === "invalid_input" || step.status === "mathematical_error");
  if (blocking) return { kind: "step", index: blocking.index, status: blocking.status };
  const unverified = checks.find((step) => step.status === "equivalent_unverified_reason");
  if (unverified) return { kind: "step", index: unverified.index, status: unverified.status };
  if (!complete) {
    const stalled = checks.find((step) => step.status === "no_progress");
    if (stalled && !checks.some((step) => step.status === "verified")) {
      return { kind: "step", index: stalled.index, status: stalled.status };
    }
    return { kind: "incomplete" };
  }
  return { kind: "complete" };
}

function buildSummary(checks: StepCheck[], focus: Focus, complete: boolean, completion: Completion): string {
  if (checks.length === 0) return `${notStartedMessage()} ${incompleteMessage(completion)}`;
  if (focus.kind === "notStarted") return notStartedMessage();
  if (focus.kind === "step") {
    const step = checks[focus.index];
    if (complete && step.status === "equivalent_unverified_reason") {
      return `${step.message} ${completeSummary()}`;
    }
    return blockedSummary(step.message);
  }
  if (focus.kind === "incomplete") return incompleteMessage(completion);
  return completeSummary();
}

export function claimedKind(reason: Reason | undefined): Reason["kind"] | null {
  return reason?.kind ?? null;
}
