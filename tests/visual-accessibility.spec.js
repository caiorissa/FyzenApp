import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

for (const width of [390, 1440]) {
  test(`revisão visual e acessibilidade ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto("/?scenario=login");
    await expect(
      page.getByRole("heading", { name: "Bom ter você de volta" }),
    ).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({
      path: `docs/qa/login-${width}.png`,
      fullPage: false,
    });
    let results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => ({
          target: n.target,
          summary: n.failureSummary,
        })),
      })),
    ).toEqual([]);
    await page.goto("/?plan=ultra");
    await expect(
      page.getByRole("heading", { name: "Olá, Marina." }),
    ).toBeVisible();
    await page.screenshot({
      path: `docs/qa/home-${width}.png`,
      fullPage: false,
    });
    for (const label of ["Treino", "Alimentação", "Progresso"]) {
      const nav = page.getByRole("navigation", {
        name: width < 768 ? "Navegação mobile" : "Navegação principal",
        exact: true,
      });
      await nav.getByRole("button", { name: label, exact: true }).click();
      await expect(
        page.getByRole("heading", {
          name: {
            Treino: "Seu plano de treino",
            Alimentação: "Seu diário alimentar",
            Progresso: "Cada treino conta",
          }[label],
          exact: true,
        }),
      ).toBeVisible();
      await expect(page.locator(".screen-content")).toHaveCSS("opacity", "1");
      await page.screenshot({
        path: `docs/qa/${label}-${width}.png`,
        fullPage: false,
      });
      results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
        .analyze();
      expect(
        results.violations.map((v) => ({
          id: v.id,
          nodes: v.nodes.map((n) => ({
            target: n.target,
            summary: n.failureSummary,
          })),
        })),
      ).toEqual([]);
    }
  });
}
