import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { App } from "../src/ui/App";

describe("App defaults", () => {
  it("renders audio and voice switches off", () => {
    render(<App />);
    expect(screen.getByRole("switch", { name: /Music/ }).getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("switch", { name: /Sound effects/ }).getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("switch", { name: /Read lines aloud/ }).getAttribute("aria-checked")).toBe("false");
    expect(screen.getByRole("switch", { name: /Music/ }).textContent).toContain("off");
    expect(screen.getByTestId("captions").textContent).toContain("Caption");
    expect(screen.getByTestId("helper-line").textContent?.length).toBeGreaterThan(0);
  });

  it("keeps decorative trail marks on an equal 0 to 2 line and leaves workshop tiles unlabeled", () => {
    render(<App />);
    const workshop = document.getElementById("workshop-title")?.parentElement;
    expect(workshop?.textContent ?? "").not.toMatch(/\d/);
    const trail = document.getElementById("trail-title")?.parentElement;
    if (!trail) throw new Error("missing trail art");
    const labels = [...trail.querySelectorAll("text")].map((node) => node.textContent);
    expect(labels).toEqual(["0", "1/2", "1", "3/2", "2"]);
    const xs = [...trail.querySelectorAll("text")].map((node) => Number(node.getAttribute("x")));
    const gaps = xs.slice(1).map((value, index) => value - xs[index]);
    expect(new Set(gaps)).toEqual(new Set([120]));
  });
});
