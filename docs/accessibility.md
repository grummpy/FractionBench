# Accessibility notes

These notes are not a certification. An automated test and a keyboard pass do not replace a screen-reader user.

## What the interface does

- Buttons and inputs have visible text labels. Icons sit beside those words.
- Focus uses a gold outline on the keyboard focus ring.
- Feedback is in an `aria-live="polite"` region and a check does not move focus by itself. "Edit this step" moves focus only because the learner asked.
- Fraction strips and number lines have a `title` and a plain-text paragraph beside them. Shading uses a pattern plus a written count, not color alone.
- Completed levels say "Completed" and show a star. Others say "Not completed yet".
- Text can wrap. The layout becomes one column under 800px.
- `prefers-reduced-motion: reduce` turns off CSS animation and transition. Music still waits for the music switch.

## Checks still open

- A person using a screen reader has not walked the full flow. The browser test checks names, focus, a 390px-wide layout, and a 640px-wide layout. 640 CSS pixels is the reflow width of a 1280px window at 200% zoom. The test does not drive the browser chrome's zoom menu.
- On October 6, 2026, `npx playwright test` passed the 390px and 640px reflow checks with no assertion failure. A preview pass the same day measured `scrollWidth` equal to `clientWidth` at 390 CSS pixels. That is the recorded result, not a certification.
- The decorative cover image is an illustration. The checker drawings are the fraction strips and number lines.
