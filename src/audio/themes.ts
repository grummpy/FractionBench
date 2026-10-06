export type Note = { midi: number; beats: number };

export type ThemeId = "title" | "workshop" | "trail" | "success" | "lookAgain";

export type Theme = {
  id: ThemeId;
  waveform: "sine";
  loop: boolean;
  notes: Note[];
};

/** Original quiet themes. Pitch data only; the browser synthesizes them. */
export const themes: Record<ThemeId, Theme> = {
  title: {
    id: "title",
    waveform: "sine",
    loop: true,
    notes: [
      { midi: 60, beats: 1 },
      { midi: 64, beats: 1 },
      { midi: 67, beats: 1.5 },
      { midi: 64, beats: 1 },
      { midi: 62, beats: 1 },
      { midi: 60, beats: 1.5 },
      { midi: 62, beats: 1 },
      { midi: 64, beats: 1 },
      { midi: 67, beats: 1 },
      { midi: 69, beats: 1.5 },
      { midi: 67, beats: 1 },
      { midi: 64, beats: 1 },
      { midi: 62, beats: 1 },
      { midi: 60, beats: 2 },
    ],
  },
  workshop: {
    id: "workshop",
    waveform: "sine",
    loop: true,
    notes: [
      { midi: 65, beats: 1.5 },
      { midi: 69, beats: 1 },
      { midi: 72, beats: 1.5 },
      { midi: 69, beats: 1 },
      { midi: 67, beats: 1.5 },
      { midi: 65, beats: 1.5 },
      { midi: 69, beats: 1 },
      { midi: 65, beats: 2 },
    ],
  },
  trail: {
    id: "trail",
    waveform: "sine",
    loop: true,
    notes: [
      { midi: 67, beats: 1 },
      { midi: 71, beats: 1 },
      { midi: 74, beats: 1.5 },
      { midi: 71, beats: 1 },
      { midi: 69, beats: 1 },
      { midi: 67, beats: 1.5 },
      { midi: 71, beats: 1 },
      { midi: 74, beats: 1 },
      { midi: 71, beats: 1 },
      { midi: 67, beats: 2 },
    ],
  },
  success: {
    id: "success",
    waveform: "sine",
    loop: false,
    notes: [
      { midi: 72, beats: 0.45 },
      { midi: 76, beats: 0.45 },
      { midi: 79, beats: 0.8 },
    ],
  },
  lookAgain: {
    id: "lookAgain",
    waveform: "sine",
    loop: false,
    notes: [
      { midi: 64, beats: 0.9 },
      { midi: 60, beats: 1.3 },
    ],
  },
};

export const THEME_IDS = Object.keys(themes) as ThemeId[];
