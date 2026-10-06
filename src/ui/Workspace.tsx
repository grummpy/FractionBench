import { useEffect, useId, useState } from "react";
import { playCue } from "../audio/engine";
import type { AudioSettings } from "../audio/settings";
import { checkWork, type CheckResult } from "../checker/checkWork";
import { dialogue, dialogueLine, type DialogueStatus } from "../content/dialogue";
import { validNextStep, type Hint } from "../content/hints";
import { reasonLabel, type Problem } from "../content/problems";
import { MAX_STEPS } from "../content/limits";
import { formatExpression, type Step } from "../math/expressions";
import { PracticePoolExhausted, generatePair, selectPracticeSkill } from "../practice/generate";
import { explain } from "../visuals/explain";
import { IconCheck, IconEdit, IconHint, IconPractice } from "../game/art";
import { draftToStep, emptyDraft, type Draft } from "./draft";

const REASONS: Array<{ value: Draft["reasonKind"]; label: string }> = [
  { value: "", label: "No reason yet" },
  { value: "equivalentRewrite", label: "Rewrite an equivalent fraction" },
  { value: "scale", label: "Multiply top and bottom" },
  { value: "divide", label: "Divide top and bottom" },
  { value: "combineLikeDenominators", label: "Combine equal-denominator fractions" },
  { value: "reorder", label: "Reorder addends" },
  { value: "other", label: "Another method" },
];

function poseFor(result: CheckResult | null): "idle" | "thinking" | "cheering" {
  if (!result || result.focus.kind === "notStarted") return "idle";
  if (result.focus.kind === "complete" && result.steps.every((step) => step.status === "verified")) return "cheering";
  return "thinking";
}

function statusFor(result: CheckResult): DialogueStatus {
  if (result.focus.kind === "step") {
    if (result.focus.status === "not_judged") return "incomplete";
    return result.focus.status;
  }
  if (result.focus.kind === "complete") return "verified";
  if (result.focus.kind === "incomplete") return "incomplete";
  return "incomplete";
}

export function Workspace({
  problem,
  audio,
  seed,
  seen,
  onBack,
  onComplete,
  onBonus,
  onLine,
  onPose,
}: {
  problem: Problem;
  audio: AudioSettings;
  seed: number;
  seen: string[];
  onBack: () => void;
  onComplete: (id: string) => void;
  onBonus: (problems: [Problem, Problem], signatures: string[]) => void;
  onLine: (line: string) => void;
  onPose: (pose: "idle" | "thinking" | "cheering") => void;
}) {
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [result, setResult] = useState<CheckResult | null>(null);
  const [hint, setHint] = useState<Hint | null>(null);
  const [view, setView] = useState<"strip" | "line">(problem.world === "equivalent" ? "strip" : "line");
  const [note, setNote] = useState("");
  const baseId = useId();
  const steps: Step[] = drafts.map(draftToStep);
  const explanation = explain(problem, steps.map((step) => step.expression), result);

  useEffect(() => {
    setDrafts([]);
    setResult(null);
    setHint(null);
    setNote("");
    setView(problem.world === "equivalent" ? "strip" : "line");
    onLine(problem.world === "equivalent" ? dialogue.worldIntros.equivalent : dialogue.worldIntros.addition);
    onPose("idle");
  }, [problem.id, onLine, onPose]);

  useEffect(() => {
    if (result?.complete) onComplete(problem.id);
    onPose(poseFor(result));
  }, [result, problem.id, onComplete, onPose]);

  useEffect(() => {
    setView(explanation.defaultView);
  }, [explanation.defaultView, result?.focus.kind, result?.focus && "index" in result.focus ? result.focus.index : -1]);

  function update(index: number, patch: Partial<Draft>) {
    setDrafts((current) => current.map((draft, draftIndex) => (draftIndex === index ? { ...draft, ...patch } : draft)));
  }

  function addStep() {
    if (drafts.length >= MAX_STEPS) return;
    const shape = problem.world === "addition" ? "sum" : "fraction";
    setDrafts((current) => [...current, emptyDraft(`${baseId}-step-${current.length + 1}`, shape)]);
  }

  function check() {
    const next = checkWork({ start: problem.start, steps, completion: problem.completion });
    setResult(next);
    setHint(null);
    const status = statusFor(next);
    const line = dialogueLine(status, next.steps.length);
    onLine(line);
    if (audio.sfx && next.focus.kind === "complete" && next.steps.every((step) => step.status === "verified")) playCue("success");
    if (
      audio.sfx &&
      next.focus.kind === "step" &&
      (next.focus.status === "mathematical_error" ||
        next.focus.status === "equivalent_unverified_reason" ||
        next.focus.status === "invalid_input" ||
        next.focus.status === "no_progress")
    ) {
      playCue("lookAgain");
    }
  }

  function showHint() {
    const current = result ?? checkWork({ start: problem.start, steps, completion: problem.completion });
    const nextHint = validNextStep(problem, steps, current);
    setHint(nextHint);
    onLine(nextHint ? nextHint.text : "There isn't another step to show from here.");
  }

  function editStep() {
    const index = result?.focus.kind === "step" ? result.focus.index : Math.max(0, drafts.length - 1);
    const draft = drafts[index];
    if (!draft) {
      document.getElementById("add-step")?.focus();
      return;
    }
    const field = draft.shape === "fraction" ? `numerator-${draft.key}` : `left-numerator-${draft.key}`;
    document.getElementById(field)?.focus();
  }

  function tryTwoMore() {
    try {
      const skill = selectPracticeSkill(problem, result);
      const pair = generatePair({ skill, seed, avoid: [problem.signature, ...seen] });
      onBonus(pair, pair.map((item) => item.signature));
    } catch (error) {
      if (error instanceof PracticePoolExhausted) {
        setNote("Two more problems are not available for this skill right now.");
      } else {
        throw error;
      }
    }
  }

  const feedbackStatus = result ? (result.focus.kind === "step" ? result.focus.status : result.focus.kind) : "idle";

  return (
    <div className="workspace">
      <button type="button" onClick={onBack}>
        Back
      </button>
      <h1>{problem.prompt}</h1>
      <p className="goal">
        {problem.completion.kind === "denominator"
          ? `Goal: one fraction with denominator ${problem.completion.denominator}.`
          : problem.completion.kind === "simplestForm"
            ? "Goal: simplest form."
            : problem.completion.kind === "sumValue"
              ? "Goal: one fraction equal to the sum. Simplest form is welcome and not required."
              : "Goal: an equivalent fraction."}
      </p>
      <div className="layout">
        <div>
          <h2>Steps</h2>
          <p className="start-row">
            <span className="step-label">Start</span> {formatExpression(problem.start)}
          </p>
          <ol className="steps">
            {drafts.map((draft, index) => (
              <li key={draft.key} className={`step-card status-${result?.steps[index]?.status ?? "open"}`}>
                <div className="step-head">
                  <h3>Step {index + 1}</h3>
                  {result?.steps[index] ? <span>{statusLabel(result.steps[index].status)}</span> : <span>Not checked yet</span>}
                </div>
                <fieldset>
                  <legend>Expression</legend>
                  <label>
                    <input
                      type="radio"
                      name={`shape-${draft.key}`}
                      checked={draft.shape === "fraction"}
                      onChange={() => update(index, { shape: "fraction", target: "single" })}
                    />
                    One fraction
                  </label>
                  <label>
                    <input
                      type="radio"
                      name={`shape-${draft.key}`}
                      checked={draft.shape === "sum"}
                      onChange={() => update(index, { shape: "sum", target: draft.target === "single" ? "left" : draft.target })}
                    />
                    Sum of two fractions
                  </label>
                  {draft.shape === "fraction" ? (
                    <div className="fields">
                      <label>
                        Numerator
                        <input id={`numerator-${draft.key}`} inputMode="numeric" value={draft.numerator} onChange={(event) => update(index, { numerator: event.target.value })} />
                      </label>
                      <label>
                        Denominator
                        <input id={`denominator-${draft.key}`} inputMode="numeric" value={draft.denominator} onChange={(event) => update(index, { denominator: event.target.value })} />
                      </label>
                    </div>
                  ) : (
                    <div className="fields">
                      <label>
                        Left numerator
                        <input id={`left-numerator-${draft.key}`} inputMode="numeric" value={draft.leftNumerator} onChange={(event) => update(index, { leftNumerator: event.target.value })} />
                      </label>
                      <label>
                        Left denominator
                        <input id={`left-denominator-${draft.key}`} inputMode="numeric" value={draft.leftDenominator} onChange={(event) => update(index, { leftDenominator: event.target.value })} />
                      </label>
                      <label>
                        Right numerator
                        <input id={`right-numerator-${draft.key}`} inputMode="numeric" value={draft.rightNumerator} onChange={(event) => update(index, { rightNumerator: event.target.value })} />
                      </label>
                      <label>
                        Right denominator
                        <input id={`right-denominator-${draft.key}`} inputMode="numeric" value={draft.rightDenominator} onChange={(event) => update(index, { rightDenominator: event.target.value })} />
                      </label>
                    </div>
                  )}
                </fieldset>
                <label htmlFor={`reason-${draft.key}`}>Reason</label>
                <select id={`reason-${draft.key}`} value={draft.reasonKind} onChange={(event) => update(index, { reasonKind: event.target.value as Draft["reasonKind"] })}>
                  {REASONS.map((reason) => (
                    <option key={reason.label} value={reason.value}>
                      {reason.label}
                    </option>
                  ))}
                </select>
                {draft.reasonKind === "scale" || draft.reasonKind === "divide" ? (
                  <div className="fields">
                    <label>
                      Factor
                      <input inputMode="numeric" value={draft.factor} onChange={(event) => update(index, { factor: event.target.value })} />
                    </label>
                    {draft.shape === "sum" ? (
                      <>
                        <label htmlFor={`target-${draft.key}`}>Which part</label>
                        <select id={`target-${draft.key}`} value={draft.target === "single" ? "left" : draft.target} onChange={(event) => update(index, { target: event.target.value as Draft["target"] })}>
                          <option value="left">Left fraction</option>
                          <option value="right">Right fraction</option>
                        </select>
                      </>
                    ) : (
                      <p>This factor applies to the fraction.</p>
                    )}
                  </div>
                ) : null}
                {result?.steps[index] ? <p>{result.steps[index].message}</p> : null}
                <button type="button" onClick={() => setDrafts((current) => current.filter((item) => item.key !== draft.key))}>
                  Remove step {index + 1}
                </button>
              </li>
            ))}
          </ol>
          <button type="button" id="add-step" onClick={addStep} disabled={drafts.length >= MAX_STEPS}>
            Add step
          </button>
          {drafts.length >= MAX_STEPS ? <p>Twelve steps is the limit. You can edit or remove one.</p> : null}
          <div className="actions">
            <button type="button" onClick={check}>
              <IconCheck /> Check my steps
            </button>
            <button type="button" onClick={showHint}>
              <IconHint /> Show a valid next step
            </button>
            <button type="button" onClick={editStep}>
              <IconEdit /> Edit this step
            </button>
            <button type="button" onClick={tryTwoMore}>
              <IconPractice /> Try two more
            </button>
          </div>
        </div>
        <aside className="feedback-column">
          <div aria-live="polite" data-testid="feedback" data-status={feedbackStatus}>
            <h2>Feedback</h2>
            <p>{result?.summary ?? "Check when you want a look at the steps you have entered."}</p>
            {result?.complete ? <p>Completed for this session.</p> : null}
          </div>
          {hint ? (
            <div data-testid="hint">
              <h2>One next step</h2>
              <p>{hint.text}</p>
              <p>
                {formatExpression(hint.step.expression)} · {reasonLabel(hint.step.reason)}
              </p>
            </div>
          ) : null}
          {note ? <p>{note}</p> : null}
          <section className="model" aria-labelledby="model-title">
            <h2 id="model-title">{explanation.title}</h2>
            <div className="toggle">
              <label>
                <input type="radio" name="model-view" checked={view === "strip"} onChange={() => setView("strip")} /> Fraction strip
              </label>
              <label>
                <input type="radio" name="model-view" checked={view === "line"} onChange={() => setView("line")} /> Number line
              </label>
            </div>
            {view === "strip" && explanation.stripSvg ? <div dangerouslySetInnerHTML={{ __html: explanation.stripSvg }} /> : null}
            {view === "line" && explanation.lineSvg ? <div dangerouslySetInnerHTML={{ __html: explanation.lineSvg }} /> : null}
            {view === "strip" && !explanation.stripSvg ? <p>{explanation.unavailable}</p> : null}
            {view === "line" && !explanation.lineSvg ? <p>{explanation.unavailable}</p> : null}
            <p className="text-equivalent">{explanation.text}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "verified":
      return "Checked";
    case "mathematical_error":
      return "Different values";
    case "equivalent_unverified_reason":
      return "Value preserved";
    case "invalid_input":
      return "Needs a number";
    case "no_progress":
      return "No change yet";
    case "not_judged":
      return "Waiting";
    default:
      return status;
  }
}
