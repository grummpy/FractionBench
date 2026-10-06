export const DIALOGUE_STATUS_KEYS = [
  "verified",
  "mathematical_error",
  "equivalent_unverified_reason",
  "invalid_input",
  "incomplete",
  "no_progress",
] as const;

export type DialogueStatus = (typeof DIALOGUE_STATUS_KEYS)[number];

export const dialogue = {
  helperName: "Pip",
  greetings: [
    "Hi, I'm Pip. We'll check one step at a time and keep every fraction exact.",
    "Welcome to FractionBench. The starting line stays put, and each new line is checked against the one before it.",
  ],
  worldIntros: {
    equivalent: "This is the Equivalent Workshop. Same amount, new-sized parts.",
    addition: "This is the Addition Trail. The path is a number line from 0 to 2. We'll add two fractions along the way.",
  },
  encouragement: [
    "Take the time you need. One step is enough to check.",
    "Unsimplified fractions can still be correct here.",
    "A different common denominator can still be a valid path.",
  ],
  status: {
    verified: [
      "These two expressions have the same value, and the reason matches this step.",
      "The value stayed the same, and this step fits a rule I can check.",
    ],
    mathematical_error: [
      "These two expressions have different values. Let's look at this step together.",
      "The value changed on this step. Later lines stay unchecked so we don't build on that change.",
    ],
    equivalent_unverified_reason: [
      "The value is preserved. I couldn't verify the selected reason.",
      "The numbers match, and the reason does not match a rule I can check. That is not the same as a different value.",
    ],
    invalid_input: [
      "This step needs whole-number numerators and positive whole-number denominators before I can check the value.",
      "Something in this step is not a usable number yet. The value was not scored.",
    ],
    incomplete: [
      "The value so far matches, and the requested form is not finished yet.",
      "These steps can be correct and the goal can still be unfinished.",
    ],
    no_progress: [
      "This line matches the one before it. The value is the same, and the fraction has not changed yet.",
      "Nothing changed on this line, so the goal is not finished by this step.",
    ],
  },
} as const;

export function dialogueLine(status: DialogueStatus, index: number): string {
  const lines = dialogue.status[status];
  return lines[Math.abs(index) % lines.length];
}

export function allDialogueLines(): string[] {
  return [
    ...dialogue.greetings,
    dialogue.worldIntros.equivalent,
    dialogue.worldIntros.addition,
    ...dialogue.encouragement,
    ...DIALOGUE_STATUS_KEYS.flatMap((key) => [...dialogue.status[key]]),
  ];
}
