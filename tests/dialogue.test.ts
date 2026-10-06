import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { DIALOGUE_STATUS_KEYS, allDialogueLines, dialogue } from "../src/content/dialogue";
import { defaultAudioSettings } from "../src/audio/settings";
import { themes } from "../src/audio/themes";

const BANNED = [
  "you don't understand",
  "you do not understand",
  "don't understand",
  "do not understand",
  "low ability",
  "high ability",
  "disability",
  "dyscalculia",
  "stupid",
  "dumb",
  "slow learner",
  "gifted",
  "you failed",
  "you're bad",
  "you are bad",
  "misconception",
  "diagnosis",
];

describe("dialogue and audio defaults", () => {
  it("has every status key and keeps the lines in the script", () => {
    expect(DIALOGUE_STATUS_KEYS).toEqual([
      "verified",
      "mathematical_error",
      "equivalent_unverified_reason",
      "invalid_input",
      "incomplete",
      "no_progress",
    ]);
    for (const key of DIALOGUE_STATUS_KEYS) {
      expect(dialogue.status[key].length).toBeGreaterThan(0);
    }
    const script = readFileSync("docs/dialogue-script.md", "utf8");
    for (const line of allDialogueLines()) expect(script).toContain(line);
  });

  it("uses specific kind language", () => {
    const blob = allDialogueLines().join("\n").toLowerCase();
    for (const phrase of BANNED) expect(blob).not.toContain(phrase);
  });

  it("keeps music, effects, and speech off by default", () => {
    expect(defaultAudioSettings).toEqual({ music: false, sfx: false, speech: false });
  });

  it("uses a soft sine look-again cue", () => {
    expect(themes.lookAgain.waveform).toBe("sine");
    expect(themes.lookAgain.loop).toBe(false);
    expect(themes.lookAgain.notes[0].midi).toBeGreaterThan(themes.lookAgain.notes[1].midi);
    const drop = themes.lookAgain.notes[0].midi - themes.lookAgain.notes[1].midi;
    expect([3, 4, 5, 7]).toContain(drop);
    for (const theme of Object.values(themes)) {
      expect(theme.waveform).toBe("sine");
      expect(theme.notes.length).toBeGreaterThan(0);
    }
  });
});
