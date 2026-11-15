import { test, expect } from '@playwright/test';

const key = 'oud-aura:store:v1';
const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);

async function fillCheckout(page) {
  await page.getByLabel('Customer Full Name').fill('Maya Sample');
  await page.getByLabel('Email Address').fill('maya@example.com');
  await page.getByLabel('Contact Number').fill('+63 (900) 000-0123');
  await page.getByLabel('Delivery Address').fill('123 Sample Lane, Demo City');
  await page.getByRole('radio', { name: 'Cash on Delivery' }).check();
}

async function adminLogin(page, path = '/admin') {
  await page.goto(path);
  await expect(page.locator('.admin-shell, .login-page')).toBeVisible();
  if (await page.locator('.login-page').isVisible()) {
    await page.getByRole('button', { name: 'Use demo credentials' }).click();
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  }
  await expect(page.locator('.admin-shell')).toBeVisible();
}

async function purchase(page, id = 'p-9pm', quantity = 1) {
  await page.goto('/product/' + id);
  await page.getByRole('spinbutton').fill(String(quantity));
  await page.getByRole('button', { name: 'Buy Now', exact: true }).click();
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await page.waitForURL(/\/order\/[^/]+$/);
  return (await read(page)).orders[0];
}

test('typed product quantity is the quantity added by the next click', async ({ page }) => {
  await page.goto('/product/p-9pm');
  await page.getByRole('spinbutton', { name: 'Quantity for 9PM After Hours' }).fill('3');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await expect.poll(async () => (await read(page))?.cart[0]?.quantity).toBe(3);
  await page.getByRole('link', { name: 'View cart', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Shopping Cart' })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('spinbutton')).toHaveValue('3');
});

test('search, category and both price sorts combine; unavailable products are handled', async ({ page }) => {
  await page.goto('/shop');
  await page.getByRole('searchbox', { name: 'Search fragrances', exact: true }).fill('a');
  await page.getByLabel('Category', { exact: true }).selectOption('amber');
  await page.getByLabel('Sort by').selectOption('low');
  await expect(page.getByRole('searchbox', { name: 'Search fragrances', exact: true })).toHaveValue('a');
  await expect(page.getByLabel('Category', { exact: true })).toHaveValue('amber');
  await expect(page.getByLabel('Sort by')).toHaveValue('low');
  const cards = page.locator('.product-card');
  await expect(cards).toHaveCount(4);
  await expect(cards.first()).toContainText('Amber Reverie');
  await expect(cards.last()).toContainText('Rose of Arabia');
  await page.getByLabel('Sort by').selectOption('high');
  await expect(cards.first()).toContainText('Rose of Arabia');
  await page.getByRole('searchbox', { name: 'Search fragrances', exact: true }).fill('NOT A PERFUME');
  await expect(page.getByText('No fragrances match your selection.')).toBeVisible();
  await page.goto('/product/p-reserve');
  await expect(page.getByRole('heading', { name: 'This fragrance is unavailable.' })).toBeVisible();
  await page.goto('/product/p-turathi');
  await expect(page.getByRole('button', { name: 'Buy Now', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toBeDisabled();
});

test('invalid quantities block purchasing and checkout; related products reset quantity', async ({ page }) => {
  await page.goto('/product/p-9pm');
  await page.getByRole('spinbutton').fill('1.5');
  await expect(page.getByRole('button', { name: 'Buy Now', exact: true })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Add to Cart', exact: true })).toBeDisabled();
  await page.getByRole('spinbutton').fill('12');
  await page.getByRole('link', { name: 'View Rose of Arabia', exact: true }).click();
  await expect(page.getByRole('spinbutton')).toHaveValue('1');
  await expect(page.getByRole('button', { name: 'Buy Now', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.getByRole('link', { name: 'View cart', exact: true }).click();
  await page.getByRole('spinbutton').fill('0');
  await expect(page.getByRole('button', { name: /Checkout \(/ })).toBeDisabled();
  await page.getByRole('spinbutton').fill('2');
  await expect(page.getByRole('button', { name: 'Checkout (2)', exact: true })).toBeEnabled();
});

test('selected checkout connects to admin, completes, updates sales and preserves snapshots', async ({ page }) => {
  await page.goto('/product/p-9pm');
  await page.getByRole('spinbutton').fill('2');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.goto('/product/p-hawas');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.goto('/cart');
  await page.getByRole('checkbox', { name: 'Select Hawas Azure', exact: true }).uncheck();
  await expect(page.getByRole('checkbox', { name: 'Select Hawas Azure', exact: true })).not.toBeChecked();
  await page.reload();
  await expect(page.getByRole('checkbox', { name: 'Select Hawas Azure', exact: true })).not.toBeChecked();
  await page.getByRole('button', { name: 'Checkout (2)', exact: true }).click();
  await expect(page.locator('.summary-items')).toContainText('9PM After Hours');
  await expect(page.locator('.summary-items')).not.toContainText('Hawas Azure');
  await fillCheckout(page);
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Order placed successfully.' })).toBeVisible();
  const state = await read(page);
  const order = state.orders[0];
  expect(order.total).toBe(490000);
  expect(state.cart.map(item => item.productId)).toEqual(['p-hawas']);
  expect(state.products.find(p => p.id === 'p-9pm').stock).toBe(16);
  await page.getByRole('link', { name: 'View My Orders', exact: true }).click();
  await expect(page.locator('.customer-order-card')).toContainText(order.number);

  await adminLogin(page, '/admin/orders');
  await page.getByRole('link', { name: 'View details for ' + order.number, exact: true }).click();
  for (const status of ['Confirmed', 'Preparing', 'Shipped', 'Completed']) {
    await page.getByRole('button', { name: 'Mark as ' + status, exact: true }).click();
    await expect(page.locator('.page-intro .status-badge')).toHaveText(status);
  }
  await expect(page.getByRole('button', { name: 'Cancel order', exact: true })).toHaveCount(0);
  await page.goto('/admin');
  await expect(page.locator('.metric-card').filter({ hasText: 'Total Sales' })).toContainText('₱4,900.00');
  await page.goto('/admin/products/p-9pm/edit');
  await page.getByLabel('Product name').fill('9PM Updated Sample');
  await page.getByLabel('Price (PHP)').fill('2600.50');
  await page.getByLabel('Description').fill('An updated sample description.');
  await page.getByRole('button', { name: 'Save product', exact: true }).click();
  await page.goto('/shop?q=Updated');
  await expect(page.locator('.product-card')).toHaveCount(1);
  await expect(page.locator('.product-card')).toContainText('₱2,600.50');
  await page.goto('/order/' + order.id);
  await expect(page.locator('.summary-items')).toContainText('9PM After Hours');
  await expect(page.locator('.summary-items')).not.toContainText('Updated Sample');
  await expect(page.locator('.total-row')).toContainText('₱4,900.00');
  await expect(page.getByRole('heading', { name: 'Order placed successfully.' })).toHaveCount(0);
  await page.goto('/orders');
  await page.getByRole('button', { name: /Completed/ }).click();
  await expect(page.locator('.customer-order-card .status-badge')).toHaveText('Completed');
});

test('Buy Now bypasses the cart and checkout details survive editing items', async ({ page }) => {
  await page.goto('/product/p-9pm');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  const cart = (await read(page)).cart;
  await page.goto('/product/p-hawas');
  await page.getByRole('spinbutton').fill('3');
  await page.getByRole('button', { name: 'Buy Now', exact: true }).click();
  await fillCheckout(page);
  await page.getByRole('link', { name: 'Edit items', exact: true }).click();
  await expect(page.getByRole('spinbutton')).toHaveValue('3');
  await page.reload();
  await expect(page.getByRole('spinbutton')).toHaveValue('3');
  await page.getByRole('button', { name: 'Buy Now', exact: true }).click();
  await expect(page.getByLabel('Customer Full Name')).toHaveValue('Maya Sample');
  await expect(page.locator('.summary-items')).not.toContainText('9PM After Hours');
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await page.waitForURL(/\/order\/[^/]+$/);
  const state = await read(page);
  expect(state.cart).toEqual(cart);
  expect(state.orders[0].total).toBe(855000);
  expect(state.products.find(p => p.id === 'p-hawas').stock).toBe(21);
});

test('checkout rejects invalid fields and empty/invalid direct checkout', async ({ page }) => {
  await page.goto('/checkout');
  await expect(page).toHaveURL(/\/cart$/);
  await page.goto('/checkout?buyNow=p-9pm&quantity=-1');
  await expect(page.getByRole('heading', { name: 'This selection is unavailable.' })).toBeVisible();
  await page.goto('/product/p-9pm');
  await page.getByRole('button', { name: 'Buy Now', exact: true }).click();
  await expect(page.getByRole('alert')).toHaveCount(0);
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByText('Enter your full name.', { exact: true })).toBeVisible();
  await page.getByLabel('Email Address').fill('invalid-email');
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByText('Enter a valid email address.', { exact: true })).toBeVisible();
  expect((await read(page))?.orders || []).toHaveLength(0);
});

test('price changes require an explicit review; admin edits cannot overwrite purchased stock', async ({ page, context }) => {
  await page.goto('/product/p-9pm');
  await page.getByRole('button', { name: 'Buy Now', exact: true }).click();
  await fillCheckout(page);
  const admin = await context.newPage();
  await adminLogin(admin, '/admin/products/p-9pm/edit');
  await admin.getByLabel('Price (PHP)').fill('2500.50');
  await admin.getByRole('button', { name: 'Save product', exact: true }).click();
  await admin.goto('/admin/products/p-9pm/edit');
  await admin.getByLabel('Price (PHP)').fill('2700.00');
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('price changed');
  await expect(page.getByRole('button', { name: 'Place Order', exact: true })).toBeDisabled();
  await page.getByRole('checkbox', { name: 'I have reviewed the updated prices, quantities, and availability.' }).check();
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await page.waitForURL(/\/order\/[^/]+$/);
  expect((await read(page)).orders[0].total).toBe(250050);
  await admin.getByRole('button', { name: 'Save product', exact: true }).click();
  await expect(admin.getByRole('alert')).toContainText('changed while you were editing');
  expect((await read(page)).products.find(p => p.id === 'p-9pm').stock).toBe(17);
  await admin.getByRole('button', { name: 'Reload latest product' }).click();
  await expect(admin.getByLabel('Stock quantity')).toHaveValue('17');
  await admin.close();
});

test('failed save preserves cart, quantities and form; saving disables duplicate submission', async ({ page }) => {
  await page.goto('/product/p-9pm');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.goto('/checkout');
  await fillCheckout(page);
  const before = await read(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    window.restoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Test storage failure', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, key);
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not save');
  expect(await read(page)).toEqual(before);
  await expect(page.getByLabel('Customer Full Name')).toHaveValue('Maya Sample');
  await page.evaluate(() => {
    window.restoreStorage();
    navigator.locks.request('oud-aura:write', () => new Promise(resolve => { window.releaseTestLock = resolve; }));
  });
  await expect.poll(() => page.evaluate(() => Boolean(window.releaseTestLock))).toBe(true);
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Saving your order…', exact: true })).toBeDisabled();
  await page.evaluate(() => window.releaseTestLock());
  await page.waitForURL(/\/order\/[^/]+$/);
  expect((await read(page)).orders).toHaveLength(1);
  expect((await read(page)).cart).toHaveLength(0);
});

test('customer cancellation restores stock once and remains final after refresh', async ({ page }) => {
  const order = await purchase(page, 'p-9pm', 2);
  await page.getByRole('button', { name: 'Cancel this order', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Cancel order', exact: true }).click();
  await expect(page.locator('.confirmation-number .status-badge')).toHaveText('Cancelled');
  await page.reload();
  expect((await read(page)).products.find(p => p.id === 'p-9pm').stock).toBe(18);
  await expect(page.getByRole('button', { name: 'Cancel this order', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Order placed successfully.' })).toHaveCount(0);
  await adminLogin(page, '/admin/orders/' + order.id);
  await expect(page.locator('.page-intro .status-badge')).toHaveText('Cancelled');
  await expect(page.getByRole('button', { name: /Mark as/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Logout', exact: true }).click();
  await page.goto('/admin/orders');
  await expect(page).toHaveURL(/\/admin\/login$/);
});

test('admin category/product CRUD is reflected in the storefront and deletion is confirmed', async ({ page }) => {
  await adminLogin(page, '/admin/categories');
  await page.getByLabel('Category name').fill('Sample Edit');
  await page.getByRole('button', { name: 'Add category', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Sample Edit', exact: true })).toBeVisible();
  await page.getByLabel('Category name').fill('sample edit');
  await page.getByRole('button', { name: 'Add category', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('already exists');
  await page.getByRole('button', { name: 'Edit Sample Edit', exact: true }).click();
  await page.getByLabel('Category name').fill('Fresh Sample Edit');
  await page.getByRole('button', { name: 'Save category', exact: true }).click();
  await page.goto('/admin/products/new');
  await page.getByLabel('Product name').fill('Test Fragrance');
  await page.getByLabel('Or use an image link').fill('/images/products/hawas-ice.webp');
  await page.getByLabel('Category', { exact: false }).selectOption({ label: 'Fresh Sample Edit' });
  await page.getByLabel('Description').fill('A sample fragrance for the browser acceptance check.');
  await page.getByLabel('Price (PHP)').fill('120.50');
  await page.getByLabel('Stock quantity').fill('3');
  await page.getByRole('button', { name: 'Save product', exact: true }).click();
  await page.goto('/shop?q=Test%20Fragrance');
  await expect(page.locator('.product-card')).toHaveCount(1);
  const id = (await read(page)).products.find(p => p.name === 'Test Fragrance').id;
  await page.goto('/admin/products/' + id + '/edit');
  await page.getByLabel('Active on storefront').uncheck();
  await page.getByRole('button', { name: 'Save product', exact: true }).click();
  await page.goto('/shop?q=Test%20Fragrance');
  await expect(page.locator('.product-card')).toHaveCount(0);
  await page.goto('/admin/products');
  await page.getByRole('button', { name: 'Delete Test Fragrance', exact: true }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete product', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Delete Test Fragrance', exact: true })).toHaveCount(0);
  await page.goto('/admin/categories');
  await page.getByRole('button', { name: 'Delete Fresh Sample Edit', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete category', exact: true }).click();
  await expect(page.getByRole('cell', { name: 'Fresh Sample Edit', exact: true })).toHaveCount(0);
});

test('referenced products offer deactivation and assigned categories cannot be deleted', async ({ page }) => {
  const order = await purchase(page);
  await adminLogin(page, '/admin/categories');
  await page.getByRole('button', { name: 'Delete Sweet & Amber', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Delete category', exact: true }).click();
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText('assigned to products');
  await page.getByRole('dialog').getByRole('button', { name: 'Keep it', exact: true }).click();
  await page.goto('/admin/products');
  await page.getByRole('button', { name: 'Delete 9PM After Hours', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('cannot be permanently deleted');
  await page.getByRole('dialog').getByRole('button', { name: 'Mark inactive', exact: true }).click();
  await page.goto('/product/p-9pm');
  await expect(page.getByRole('heading', { name: 'This fragrance is unavailable.' })).toBeVisible();
  await page.goto('/order/' + order.id);
  await expect(page.locator('.summary-items')).toContainText('9PM After Hours');
});

test('stock changes block checkout and unavailable cart items can be left for later', async ({ page, context }) => {
  await page.goto('/product/p-9pm');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.goto('/product/p-hawas');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.goto('/checkout');
  await fillCheckout(page);
  const admin = await context.newPage();
  await adminLogin(admin, '/admin/products/p-9pm/edit');
  await admin.getByLabel('Stock quantity').fill('0');
  await admin.getByRole('button', { name: 'Save product', exact: true }).click();
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('only 0 available');
  await expect(page.getByRole('button', { name: 'Place Order', exact: true })).toBeDisabled();
  expect((await read(page)).orders).toHaveLength(0);
  await page.getByRole('link', { name: 'Edit your selection to continue.' }).click();
  await page.getByRole('checkbox', { name: 'Select 9PM After Hours', exact: true }).uncheck();
  await page.getByRole('button', { name: 'Checkout (1)', exact: true }).click();
  await expect(page.getByLabel('Customer Full Name')).toHaveValue('Maya Sample');
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await page.waitForURL(/\/order\/[^/]+$/);
  const state = await read(page);
  expect(state.orders[0].items.map(item => item.productId)).toEqual(['p-hawas']);
  expect(state.cart[0].productId).toBe('p-9pm');
  expect(state.products.find(product => product.id === 'p-9pm').stock).toBe(0);
  await admin.close();
});

test('cart quantity keeps focus and saves every digit when typing 5 to 12', async ({ page }) => {
  await page.goto('/product/p-9pm');
  await page.getByRole('spinbutton').fill('5');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.goto('/cart');
  const input = page.getByRole('spinbutton');
  await input.focus();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('12', { delay: 150 });
  await expect(input).toHaveValue('12');
  await expect(input).toBeFocused();
  await expect.poll(async () => (await read(page)).cart[0].quantity).toBe(12);
  await expect(page.getByRole('button', { name: 'Checkout (12)', exact: true })).toBeEnabled();
});

test('typing stays available during queued quantity saves and checkout waits for the last one', async ({ page }) => {
  await page.goto('/product/p-9pm');
  await page.getByRole('spinbutton').fill('5');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.goto('/cart');
  await page.evaluate(() => {
    navigator.locks.request('oud-aura:write', () => new Promise(resolve => { window.releaseQuantityLock = resolve; }));
  });
  await expect.poll(() => page.evaluate(() => Boolean(window.releaseQuantityLock))).toBe(true);
  const input = page.getByRole('spinbutton');
  await input.focus();
  await page.keyboard.press('Control+A');
  await page.keyboard.type('12', { delay: 20 });
  await expect(input).toHaveValue('12');
  await expect(input).toBeFocused();
  await expect(input).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Updating cart…', exact: true })).toBeDisabled();
  expect((await read(page)).cart[0].quantity).toBe(5);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    let failFirstWrite = true;
    Storage.prototype.setItem = function (name, value) {
      if (name === key && failFirstWrite) {
        failFirstWrite = false;
        throw new DOMException('Transient test failure', 'QuotaExceededError');
      }
      return original.call(this, name, value);
    };
  }, key);
  await page.evaluate(() => window.releaseQuantityLock());
  await expect.poll(async () => (await read(page)).cart[0].quantity).toBe(12);
  await expect(page.getByRole('button', { name: 'Checkout (12)', exact: true })).toBeEnabled();
  await expect(page.getByRole('alert')).toHaveCount(0);
});

test('an invalid draft remains blocked when an earlier quantity save finishes', async ({ page }) => {
  await page.goto('/product/p-9pm');
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await page.goto('/cart');
  await page.evaluate(() => {
    navigator.locks.request('oud-aura:write', () => new Promise(resolve => { window.releaseQuantityLock = resolve; }));
  });
  await expect.poll(() => page.evaluate(() => Boolean(window.releaseQuantityLock))).toBe(true);
  const input = page.getByRole('spinbutton');
  await input.fill('2');
  await input.fill('');
  await page.evaluate(() => window.releaseQuantityLock());
  await expect.poll(async () => (await read(page)).cart[0].quantity).toBe(2);
  await expect(input).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Checkout (2)', exact: true })).toBeDisabled();
  await input.fill('3');
  await expect(page.getByRole('button', { name: 'Checkout (3)', exact: true })).toBeEnabled();
});

test('malformed saved category images show recovery and preserve data until reset is confirmed', async ({ page }) => {
  await page.goto('/');
  const raw = await page.evaluate(async () => {
    const { createSeed } = await import('/src/data/seed.js');
    const data = createSeed(); data.categories[0].image = 42;
    const raw = JSON.stringify(data);
    localStorage.setItem('oud-aura:store:v1', raw);
    return raw;
  });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.reload();
  await expect(page.getByRole('heading', { name: /recover your boutique/ })).toBeVisible();
  await expect(page.getByRole('alert')).toContainText('Saved demo data could not be read');
  expect(await page.evaluate(key => localStorage.getItem(key), key)).toBe(raw);
  expect(errors).toEqual([]);
  page.once('dialog', dialog => dialog.accept());
  await page.getByRole('button', { name: 'Reset demo data', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Discover Your Signature Scent' })).toBeVisible();
  expect(typeof (await read(page)).categories[0].image).toBe('string');
});

test('admin distinguishes empty browser data from filters hiding a saved guest order', async ({ page, context }) => {
  await page.setViewportSize({ width: 375, height: 900 });
  await adminLogin(page, '/admin/orders');
  await expect(page.getByRole('heading', { name: 'No orders saved in this browser.', exact: true })).toBeVisible();
  await expect(page.locator('.panel-count')).toContainText('Showing 0 of 0 orders');
  const guest = await context.newPage();
  const order = await purchase(guest, 'p-hawas-ice');
  await expect(page.locator('tbody tr')).toContainText(order.number);
  await expect(page.locator('tbody .status-badge')).toHaveText('Pending');
  await expect(page.locator('.panel-count')).toContainText('Showing 1 of 1 order');

  await page.getByLabel('Filter order status').selectOption('Completed');
  await expect(page.getByRole('heading', { name: 'No orders match your filters.', exact: true })).toBeVisible();
  await expect(page.locator('.panel-count')).toContainText('Showing 0 of 1 order');
  await expect(page.getByRole('button', { name: 'Clear filters', exact: true })).toBeInViewport();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await expect(page.locator('tbody tr')).toContainText(order.number);
  await expect(page.getByLabel('Filter order status')).toHaveValue('');

  await page.getByRole('searchbox', { name: 'Search orders', exact: true }).fill('not-an-order');
  await expect(page.getByRole('heading', { name: 'No orders match your filters.', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Clear filters', exact: true }).click();
  await page.getByRole('button', { name: 'Refresh orders', exact: true }).click();
  await expect(page.locator('tbody tr')).toContainText(order.number);
  expect((await read(page)).orders).toHaveLength(1);
  expect((await read(page)).orders[0].status).toBe('Pending');
  await guest.close();
});

test('resetting orders and sales keeps custom catalog, prices, inventory and cart after reload', async ({ page }) => {
  test.setTimeout(60000);
  const order = await purchase(page, 'p-9pm', 2);
  await adminLogin(page, '/admin/orders/' + order.id);
  for (const status of ['Confirmed', 'Preparing', 'Shipped', 'Completed']) {
    await page.getByRole('button', { name: 'Mark as ' + status, exact: true }).click();
    await expect(page.locator('.page-intro .status-badge')).toHaveText(status);
  }
  await page.evaluate(async () => {
    const { store } = await import('/src/services/browserStore.js');
    const product = store.read().products.find(p => p.id === 'p-9pm');
    await store.saveProduct({ ...product, name: 'My edited 9PM', price: '2600.50', stock: String(product.stock) }, product.id);
    await store.saveProduct({ name: 'My Rayhaan Lion', brand: 'Rayhaan', categoryId: 'amber', description: 'A custom fragrance to preserve during the reset.', price: '2250.00', stock: '7', size: '100 ml', active: true, image: '/images/products/rayhaan-lion.webp' });
    await store.addToCart('p-hawas-ice', 1);
  });
  await page.goto('/admin');
  const before = await read(page);
  const sales = page.locator('.metric-card').filter({ has: page.getByText('Total Sales', { exact: true }) }).locator('strong');
  await expect(sales).toHaveText('₱4,900.00');
  await page.getByRole('button', { name: 'Reset orders & sales', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Your products, images, prices, stock, categories, and cart are kept.');
  await dialog.getByRole('button', { name: 'Keep orders', exact: true }).click();
  expect(await read(page)).toEqual(before);
  await expect(sales).toHaveText('₱4,900.00');

  await page.getByRole('button', { name: 'Reset orders & sales', exact: true }).click();
  await dialog.getByRole('button', { name: 'Reset orders & sales', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(sales).toHaveText('₱0.00');
  for (const label of ['Total Orders', 'Pending Orders', 'Completed Orders', 'Total Customers']) {
    await expect(page.locator('.metric-card').filter({ has: page.getByText(label, { exact: true }) }).locator('strong')).toHaveText('0');
  }
  const after = await read(page);
  expect(after.orders).toEqual([]);
  expect(after.products).toEqual(before.products);
  expect(after.categories).toEqual(before.categories);
  expect(after.cart).toEqual(before.cart);
  await page.reload();
  await expect(sales).toHaveText('₱0.00');
  await expect(page.getByRole('button', { name: 'Reset orders & sales', exact: true })).toBeDisabled();
  await page.goto('/orders');
  await expect(page.locator('.customer-order-card')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Your first order starts here.', exact: true })).toBeVisible();
  await page.goto('/cart');
  await expect(page.locator('.cart-item')).toContainText('Hawas Ice');
  await expect(page.getByRole('spinbutton')).toHaveValue('1');
});

test('failed orders reset keeps history and sales and permits retry', async ({ page }) => {
  const order = await purchase(page);
  await page.evaluate(async orderId => {
    const { store } = await import('/src/services/browserStore.js');
    for (const status of ['Confirmed', 'Preparing', 'Shipped', 'Completed']) await store.transitionOrder(orderId, status);
  }, order.id);
  await adminLogin(page);
  const before = await read(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    window.restoreResetStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Test storage failure', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, key);
  await page.getByRole('button', { name: 'Reset orders & sales', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Reset orders & sales', exact: true }).click();
  await expect(dialog.getByRole('alert')).toContainText('could not save');
  expect(await read(page)).toEqual(before);
  const sales = page.locator('.metric-card').filter({ has: page.getByText('Total Sales', { exact: true }) }).locator('strong');
  await expect(sales).toHaveText('₱2,450.00');
  await page.evaluate(() => window.restoreResetStorage());
  await dialog.getByRole('button', { name: 'Reset orders & sales', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(sales).toHaveText('₱0.00');
  expect((await read(page)).orders).toEqual([]);
  expect((await read(page)).products).toEqual(before.products);
});
