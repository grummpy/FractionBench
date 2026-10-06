import { describe, expect, it } from "vitest";
import { explain } from "../src/visuals/explain";
import { fractionStripSvg, numberLineSvg } from "../src/visuals/svg";
import { PROBLEMS } from "../src/content/problems";

describe("svg models", () => {
  it("draws equal-length strips with exact labels and a title", () => {
    const drawn = fractionStripSvg("One half and two fourths", [
      { label: "1/2 · 1 of 2 parts", numerator: 1n, denominator: 2n, pattern: "stripe" },
      { label: "2/4 · 2 of 4 parts", numerator: 2n, denominator: 4n, pattern: "dot" },
    ]);
    expect("svg" in drawn).toBe(true);
    if (!("svg" in drawn)) return;
    expect(drawn.svg).toContain("<title");
    expect(drawn.svg).toContain("1/2 · 1 of 2 parts");
    expect(drawn.svg).toContain("2/4 · 2 of 4 parts");
    expect(drawn.svg).not.toContain("0.5");
    expect(drawn.svg).toContain('width="120"');
    expect(drawn.svg).toContain('width="60"');
  });

  it("extends a number line past one whole for 17/12", () => {
    const drawn = numberLineSvg({
      title: "Seventeen twelfths",
      denominator: 12n,
      wholeEnd: 2,
      markers: [{ numerator: 17n, denominator: 12n, label: "17/12" }],
    });
    expect("svg" in drawn).toBe(true);
    if (!("svg" in drawn)) return;
    expect(drawn.svg).toContain("Seventeen twelfths");
    expect(drawn.svg).toContain("17/12");
    expect(drawn.svg).not.toContain("1.416");
  });

  it("does not draw a dense partition", () => {
    const drawn = fractionStripSvg("Too many parts", [
      { label: "61/122", numerator: 61n, denominator: 122n, pattern: "stripe" },
    ]);
    expect(drawn).toEqual({ unavailable: expect.stringContaining("60") });
  });

  it("uses text and a simpler equal model past the dense limit", () => {
    const problem = PROBLEMS[0];
    const explanation = explain(
      { ...problem, start: { kind: "fraction", value: { numerator: "61", denominator: "122" } } },
      [],
      null,
    );
    expect(explanation.text).toContain("61/122");
    expect(explanation.text).toContain("1/2");
    expect(explanation.text.toLowerCase()).toContain("simpler");
    expect(explanation.stripSvg ?? "").not.toContain("61 of");
    expect(explanation.stripSvg ?? "").not.toContain("0.5");
  });
});
