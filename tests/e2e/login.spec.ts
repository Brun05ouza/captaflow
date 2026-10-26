import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
test('login legível e acessível em desktop e mobile', async ({ page }) => {
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/login');
    await expect(
      page.getByRole('heading', { name: 'Seu próximo movimento.', level: 1 }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.screenshot({
      path: `artifacts/login-${width === 1440 ? 'desktop' : 'mobile'}.png`,
      fullPage: true,
      caret: 'initial',
    });
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze())
        .violations,
    ).toEqual([]);
  }
});
