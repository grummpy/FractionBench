# Voice casting

FractionBench v1 does not ship recorded audio. Optional read-aloud uses the browser's built-in `SpeechSynthesis` and is off until the learner turns it on. There is no cloud text-to-speech service and no API key. Some browsers may use an online voice for that built-in feature; leave the switch off when that is not wanted. Every spoken line is also the on-screen helper line and the caption.

## Pip, the helper

- Role: the only voice a learner needs. Pip talks about the step in front of them.
- Tone: warm, plain, and age-neutral. No baby talk, no sarcasm, no cheer that papers over a changed value.
- Pitch: a comfortable mid range. Not squeaky, not booming.
- Pacing: about 140 to 150 words per minute. Short sentences. A small pause before a fraction.
- Fractions: say the common name when it is unambiguous ("one half", "three fourths"). For other fractions, say "three over twelve" so the numerator and denominator stay distinct.
- Energy: interested, never urgent. A verified step can sound pleased. A changed value sounds calm and specific.
- Language: use the script in `docs/dialogue-script.md`. Do not add "you don't understand", ability labels, or diagnostic words while recording.

## Optional narrator

A second voice may later read only the activity instructions (the goal line and the button names). Keep it a little quieter and a little lower than Pip, with the same pacing rules. The narrator does not praise, correct, or repeat Pip's status lines. If only one voice is recorded, use Pip for everything.

## Recording notes for a later human or local take

- Quiet room, close and consistent microphone distance.
- 48 kHz, 24-bit wav, about 6 inches from the mic, no music under the voice.
- Leave a short handle of silence at the start and end of each line.
- Record each script line as its own file, named with the status key, for example `verified-01.wav`.
- Do not add a buzzer, a sad sting, or a "wrong" sound under the mathematical-error lines. The separate look-again cue is a soft falling major third, not a fail sound.
- Listen back for clipped fractions and for any line that could sound like a judgment of the person rather than a description of the step.
- These notes are for a future session. They are not a claim that a voice actor has already recorded the part.
