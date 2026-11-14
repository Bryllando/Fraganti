import { test, expect } from '@playwright/test';
import { createSeed, NEW_PRODUCTS } from '../../src/data/seed.js';
import { createStore, quoteCart, STORAGE_KEY } from '../../src/services/store.js';

const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), STORAGE_KEY);
const customer = { name: 'Maya Sample', email: 'maya@example.com', phone: '09000000123', address: '123 Sample Lane, Demo City', paymentMethod: 'Cash on Delivery', notes: '' };
const arrivals = page => page.locator('section').filter({ has: page.getByRole('heading', { name: 'New to the collection.', exact: true }) });

test('all four new perfumes have working images and connect guest checkout to admin', async ({ page }) => {
  await page.goto('/');
  await expect(arrivals(page).locator('.product-card')).toHaveCount(4);
  for (const product of NEW_PRODUCTS) {
    await expect(arrivals(page).getByRole('heading', { name: product.name, exact: true })).toBeVisible();
    await page.goto('/shop?q=' + encodeURIComponent(product.name));
    await expect(page.locator('.product-card')).toHaveCount(1);
    const image = page.locator('.product-card img');
    await expect(image).toHaveAttribute('src', product.image);
    await expect.poll(() => image.evaluate(image => image.complete && image.naturalWidth > 0)).toBe(true);
    await page.getByRole('button', { name: 'Add ' + product.name + ' to cart', exact: true }).click();
    await page.goto('/');
  }
  await page.goto('/cart');
  await expect(page.locator('.cart-item')).toHaveCount(4);
  await page.getByRole('button', { name: 'Checkout (4)', exact: true }).click();
  await page.getByLabel('Customer Full Name').fill(customer.name);
  await page.getByLabel('Email Address').fill(customer.email);
  await page.getByLabel('Contact Number').fill(customer.phone);
  await page.getByLabel('Delivery Address').fill(customer.address);
  await page.getByRole('radio', { name: customer.paymentMethod }).check();
  await page.getByRole('button', { name: 'Place Order', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Order placed successfully.', exact: true })).toBeVisible();
  const saved = await read(page);
  expect(saved.orders[0].total).toBe(1120000);
  expect(saved.cart).toEqual([]);
  for (const product of NEW_PRODUCTS) {
    expect(saved.orders[0].items.find(item => item.productId === product.id)).toMatchObject({ name: product.name, image: product.image, quantity: 1 });
    expect(saved.products.find(item => item.id === product.id).stock).toBe(product.stock - 1);
  }
  await page.getByRole('link', { name: 'Login', exact: true }).click();
  await page.getByRole('button', { name: 'Use demo credentials' }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.admin-shell')).toBeVisible();
  await page.goto('/admin/products');
  for (const product of NEW_PRODUCTS) {
    await page.getByRole('searchbox', { name: 'Search products', exact: true }).fill(product.name);
    await expect(page.locator('tbody tr')).toHaveCount(1);
    await expect(page.getByRole('link', { name: product.name, exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Edit ' + product.name, exact: true }).click();
    await expect(page.getByLabel('Product name')).toHaveValue(product.name);
    await expect(page.getByLabel('Stock quantity')).toHaveValue(String(product.stock - 1));
    await page.goto('/admin/products');
  }
});

test('existing browser catalogs receive the additions without resetting their cart or orders', async ({ page }) => {
  let raw = JSON.stringify(createSeed());
  const oldStore = createStore({ getItem: () => raw, setItem: (_, value) => { raw = value; } });
  await oldStore.addToCart('p-9pm', 2);
  await oldStore.placeOrder(customer, quoteCart(oldStore.read()));
  await oldStore.addToCart('p-hawas', 3);
  const legacy = oldStore.read();
  delete legacy.catalogVersion;
  legacy.products = legacy.products.filter(product => !NEW_PRODUCTS.some(added => added.id === product.id));
  legacy.products.find(product => product.id === 'p-9pm').name = 'My edited 9PM';
  await page.addInitScript(({ key, legacy }) => {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, JSON.stringify(legacy));
  }, { key: STORAGE_KEY, legacy });
  await page.goto('/');
  for (const product of NEW_PRODUCTS) {
    await expect(arrivals(page).getByRole('heading', { name: product.name, exact: true })).toBeVisible();
  }
  await page.goto('/orders');
  await expect(page.locator('.customer-order-card')).toContainText(legacy.orders[0].number);
  await page.goto('/product/p-hawas-ice');
  await expect(page.getByRole('heading', { name: 'Hawas Ice', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
  await expect.poll(async () => (await read(page)).catalogVersion).toBe(2);
  await page.reload();
  const saved = await read(page);
  expect(saved.products).toHaveLength(16);
  expect(saved.orders).toEqual(legacy.orders);
  expect(saved.cart).toHaveLength(legacy.cart.length + 1);
  expect(saved.cart.slice(0, legacy.cart.length)).toEqual(legacy.cart);
  expect(saved.cart.at(-1)).toMatchObject({ productId: 'p-hawas-ice', quantity: 1 });
  expect(saved.cart.at(-1).selected).not.toBe(false);
  expect(saved.products.find(product => product.id === 'p-9pm')).toEqual(legacy.products.find(product => product.id === 'p-9pm'));
});

test('new perfume cards and images fit mobile, tablet and desktop screens', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const width of [375, 768, 1280]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/');
    await page.evaluate(() => document.fonts.ready);
    const section = arrivals(page);
    await section.scrollIntoViewIfNeeded();
    await expect.poll(() => section.locator('img').evaluateAll(images => images.length === 4 && images.every(image => image.complete && image.naturalWidth > 0))).toBe(true);
    const dimensions = await page.evaluate(() => ({ page: document.documentElement.scrollWidth, viewport: innerWidth }));
    expect(dimensions.page).toBeLessThanOrEqual(dimensions.viewport);
    await section.screenshot({ path: 'docs/screenshots/new-fragrances-' + width + '.png', animations: 'disabled' });
  }
  expect(errors).toEqual([]);
});
