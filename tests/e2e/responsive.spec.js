import { test, expect } from '@playwright/test';

for (const width of [375, 768, 1280]) {
  test('customer/admin layouts and navigation at ' + width + 'px', async ({ page }) => {
    test.setTimeout(120000);
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    await page.goto('/');
    const orderId = await page.evaluate(async () => {
      const { store } = await import('/src/services/browserStore.js');
      const { quoteCart } = await import('/src/services/store.js');
      const customer = { name: 'Maya Sample', email: 'maya@example.com', phone: '09000000123', address: '123 Sample Lane, Demo City', paymentMethod: 'Cash on Delivery', notes: 'Fictional screenshot data.' };
      await store.addToCart('p-9pm', 2);
      const order = await store.placeOrder(customer, quoteCart(store.read()));
      for (const status of ['Confirmed', 'Preparing', 'Shipped', 'Completed']) await store.transitionOrder(order.id, status);
      await store.addToCart('p-hawas');
      await store.placeOrder({ ...customer, email: 'other@example.com', name: 'Alex Sample' }, quoteCart(store.read()));
      await store.addToCart('p-9pm');
      return order.id;
    });

    async function checkLayout(path, screenshot) {
      await page.goto(path);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator('h1')).toBeVisible();
      const dimensions = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth, outside: [...document.querySelectorAll('body *')].filter(element => element.getBoundingClientRect().right > innerWidth + 1 && !element.closest('.table-scroll')).slice(0, 12).map(element => ({ tag: element.tagName, class: element.className, right: element.getBoundingClientRect().right })) }));
      if (screenshot) await page.screenshot({ path: 'docs/screenshots/' + screenshot + '-' + width + '.png', fullPage: true, animations: 'disabled' });
      expect(dimensions.page, 'Page overflow at ' + width + 'px: ' + path + ': ' + JSON.stringify(dimensions.outside)).toBeLessThanOrEqual(dimensions.viewport);
      const clippedControls = await page.locator('button, input, select, textarea').evaluateAll(elements => elements.filter(element => {
        const rect = element.getBoundingClientRect();
        return rect.width > 0 && rect.height > 0 && !element.closest('.table-scroll') && (rect.left < -1 || rect.right > innerWidth + 1);
      }).map(element => element.getAttribute('aria-label') || element.textContent || element.id));
      expect(clippedControls, 'Clipped controls at ' + path).toEqual([]);
    }

    await checkLayout('/', 'home');
    if (width < 992) {
      await page.getByRole('button', { name: 'Toggle navigation', exact: true }).click();
      await page.getByRole('navigation', { name: 'Main navigation' }).getByRole('link', { name: 'Shop', exact: true }).click();
      await expect(page).toHaveURL(/\/shop$/);
    }
    await checkLayout('/shop', 'shop');
    await checkLayout('/collections');
    await checkLayout('/our-story');
    await checkLayout('/product/p-9pm', 'product');
    await checkLayout('/cart', 'cart');
    await checkLayout('/checkout', 'checkout');
    await checkLayout('/orders', 'my-orders');
    await checkLayout('/order/' + orderId, 'order');
    await checkLayout('/admin/login', 'admin-login');
    await page.getByRole('button', { name: 'Use demo credentials' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await expect(page.locator('.admin-shell')).toBeVisible();
    await checkLayout('/admin', 'admin-overview');
    if (width < 768) {
      await page.getByRole('button', { name: 'Toggle admin navigation' }).click();
      await page.getByRole('navigation', { name: 'Admin navigation' }).getByRole('link', { name: 'Products', exact: true }).click();
      await expect(page).toHaveURL(/\/admin\/products$/);
    }
    await checkLayout('/admin/products', 'admin-products');
    await checkLayout('/admin/products/new');
    await checkLayout('/admin/products/p-9pm/edit');
    await checkLayout('/admin/categories', 'admin-categories');
    await checkLayout('/admin/orders', 'admin-orders');
    await checkLayout('/admin/orders/' + orderId, 'admin-order');
    await checkLayout('/admin/customers', 'admin-customers');
    expect(errors).toEqual([]);
  });
}
