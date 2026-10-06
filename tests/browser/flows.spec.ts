import { expect, test } from "@playwright/test";

test("audio and read-aloud switches start off and the page stays local", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (request) => {
    const host = new URL(request.url()).hostname;
    if (host !== "127.0.0.1" && host !== "localhost") external.push(request.url());
  });
  await page.goto("/");
  await expect(page.getByRole("switch", { name: /Music/ })).toHaveAttribute("aria-checked", "false");
  await expect(page.getByRole("switch", { name: /Sound effects/ })).toHaveAttribute("aria-checked", "false");
  await expect(page.getByRole("switch", { name: /Read lines aloud/ })).toHaveAttribute("aria-checked", "false");
  await page.getByTestId("problem-E01").click();
  await page.getByRole("button", { name: "Add step" }).click();
  expect(external).toEqual([]);
});

test("checks a valid path, an early error, an unverified reason, an edit, and practice", async ({ page }) => {
  await page.goto("/");
  await page.getByTestId("problem-E01").focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("heading", { name: "Rewrite 1/2 with denominator 4." })).toBeVisible();

  await page.getByRole("button", { name: "Add step" }).click();
  await page.getByLabel("Numerator", { exact: true }).fill("2");
  await page.getByLabel("Denominator", { exact: true }).fill("3");
  await page.getByLabel("Reason", { exact: true }).selectOption({ label: "Rewrite an equivalent fraction" });
  const check = page.getByRole("button", { name: "Check my steps" });
  await check.click();
  await expect(check).toBeFocused();
  await expect(page.getByTestId("feedback")).toHaveAttribute("data-status", "mathematical_error");
  await expect(page.getByTestId("feedback")).toContainText("different values");

  await page.getByLabel("Denominator", { exact: true }).fill("4");
  await page.getByLabel("Reason", { exact: true }).selectOption({ label: "Multiply top and bottom" });
  await page.getByLabel("Factor", { exact: true }).fill("3");
  await check.click();
  await expect(page.getByTestId("feedback")).toHaveAttribute("data-status", "equivalent_unverified_reason");
  await expect(page.getByTestId("feedback")).toContainText("value is preserved");
  await expect(page.getByTestId("feedback")).not.toContainText("different values");

  await page.getByRole("button", { name: "Edit this step" }).click();
  await expect(page.getByLabel("Numerator", { exact: true })).toBeFocused();
  await page.getByLabel("Factor", { exact: true }).fill("2");
  await check.click();
  await expect(page.getByTestId("feedback")).toHaveAttribute("data-status", "complete");
  await expect(page.getByTestId("feedback")).toContainText("meets this goal");
  await expect(page.getByText("same value").first()).toBeVisible();

  await page.getByRole("button", { name: "Try two more" }).click();
  await expect(page.getByRole("heading", { name: "Try two more" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bonus 1/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Bonus 2/ })).toBeVisible();
  const bonusText = await page.getByRole("button", { name: /Bonus/ }).allTextContents();
  expect(new Set(bonusText).size).toBe(2);
  await page.getByRole("button", { name: "Back to map" }).click();
  await expect(page.getByTestId("problem-E01")).toContainText("Completed");
});

test("reflows on a phone width and at the width of a 1280px window at 200% zoom", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: "1 Equivalent Workshop" })).toBeVisible();
  await page.getByTestId("problem-A01").click();
  await page.getByRole("button", { name: "Add step" }).click();
  const narrowOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(narrowOverflow).toBe(false);

  await page.setViewportSize({ width: 640, height: 800 });
  await expect(page.getByRole("button", { name: "Check my steps" })).toBeVisible();
  const zoomReflowOverflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(zoomReflowOverflow).toBe(false);
});
