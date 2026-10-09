import { themes, type Note, type ThemeId } from "./themes";

const BEAT = 0.48;
let context: AudioContext | null = null;
let loopTimer = 0;
let generation = 0;
const musicOscillators = new Set<OscillatorNode>();

function audioContext(): AudioContext | null {
  if (context) return context;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  context = new Ctx();
  return context;
}

function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

function schedule(
  ctx: AudioContext,
  notes: Note[],
  when: number,
  gainAmount: number,
  activeOscillators?: Set<OscillatorNode>,
): number {
  let time = when;
  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency(note.midi);
    const duration = Math.max(0.08, note.beats * BEAT);
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(gainAmount, time + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(time);
    osc.stop(time + duration + 0.02);
    if (activeOscillators) {
      activeOscillators.add(osc);
      osc.onended = () => activeOscillators.delete(osc);
    }
    time += duration;
  }
  return time;
}

export function startMusic(theme: "title" | "workshop" | "trail"): void {
  const ctx = audioContext();
  if (!ctx) return;
  void ctx.resume();
  stopMusic();
  const token = generation;
  const notes = themes[theme].notes;
  const run = () => {
    if (token !== generation || !context) return;
    const end = schedule(context, notes, context.currentTime + 0.05, 0.045, musicOscillators);
    const delay = Math.max(200, (end - context.currentTime) * 1000 - 40);
    loopTimer = window.setTimeout(run, delay);
  };
  run();
}

export function stopMusic(): void {
  generation += 1;
  window.clearTimeout(loopTimer);
  loopTimer = 0;
  if (!context) return;
  for (const oscillator of musicOscillators) {
    oscillator.stop(context.currentTime);
  }
  musicOscillators.clear();
}

export function playCue(theme: Extract<ThemeId, "success" | "lookAgain">): void {
  const ctx = audioContext();
  if (!ctx) return;
  void ctx.resume();
  schedule(ctx, themes[theme].notes, ctx.currentTime + 0.02, theme === "success" ? 0.06 : 0.04);
}
