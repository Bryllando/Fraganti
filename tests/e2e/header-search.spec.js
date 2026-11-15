import { test, expect } from '@playwright/test';

for (const width of [375, 768, 1280]) {
  test('one catalog search works from Home, categories and other pages at ' + width + 'px', async ({ page }) => {
    test.setTimeout(60000);
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/');
    const searchLink = page.getByRole('link', { name: 'Search fragrances', exact: true });
    const input = page.getByRole('searchbox', { name: 'Search fragrances', exact: true });
    const menu = page.getByRole('button', { name: 'Toggle navigation', exact: true });

    await expect(page.locator('.store-header').getByRole('searchbox')).toHaveCount(0);
    if (width < 992) {
      await menu.click();
      await expect(menu).toHaveAttribute('aria-expanded', 'true');
    }
    await searchLink.click();
    await expect(page).toHaveURL(/\/shop#product-search$/);
    await expect(input).toBeFocused();
    await expect(input).toBeInViewport();
    await expect(page.getByRole('searchbox')).toHaveCount(1);
    await expect(page.locator('.store-header').getByRole('link', { name: 'Search fragrances', exact: true })).toHaveCount(0);
    if (width < 992) await expect(menu).toHaveAttribute('aria-expanded', 'false');

    await input.fill('Hawas');
    await input.pressSequentially(' Ice');
    await expect(input).toHaveValue('Hawas Ice');
    await expect(input).toBeFocused();
    await expect(page.locator('.product-card')).toHaveCount(1);
    await expect(page.locator('.product-card')).toContainText('Hawas Ice');
    await expect.poll(() => new URL(page.url()).searchParams.get('q')).toBe('Hawas Ice');
    await page.getByLabel('Category', { exact: true }).selectOption('fresh');
    const sort = page.getByLabel('Sort by');
    await sort.focus();
    await sort.selectOption('low');
    await expect(sort).toBeFocused();
    await expect(input).toHaveValue('Hawas Ice');
    await expect(page.getByLabel('Category', { exact: true })).toHaveValue('fresh');
    await expect(page.locator('.product-card')).toHaveCount(1);
    await input.press('Enter');
    await expect(page.locator('.product-card')).toHaveCount(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
    await page.screenshot({ path: 'test-results/search-flow-' + width + '.png', animations: 'disabled' });

    await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
    await expect(input).toHaveValue('');
    await expect(page.getByLabel('Category', { exact: true })).toHaveValue('');
    await expect(sort).toHaveValue('featured');
    expect(await page.locator('.product-card').count()).toBeGreaterThan(1);

    await page.goto('/collections');
    await page.locator('.category-card').filter({ has: page.getByRole('heading', { name: 'Fresh & Aquatic', exact: true }) }).click();
    await expect(page.getByLabel('Category', { exact: true })).toHaveValue('fresh');
    await expect(page.getByRole('searchbox')).toHaveCount(1);
    await expect(searchLink).toHaveCount(0);
    await input.fill('Hawas Ice');
    await expect(page.locator('.product-card')).toHaveCount(1);
    await expect(page.getByLabel('Category', { exact: true })).toHaveValue('fresh');

    for (const path of ['/collections', '/our-story', '/product/p-hawas-ice', '/orders', '/cart']) {
      await page.goto(path);
      await searchLink.click();
      await expect(page).toHaveURL(/\/shop#product-search$/);
      await expect(input).toBeFocused();
      await expect(input).toHaveValue('');
      await expect(page.getByRole('searchbox')).toHaveCount(1);
    }
  });
}
