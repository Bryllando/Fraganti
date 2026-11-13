import { chromium, expect } from '@playwright/test';
import { mkdir, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

const quick = process.argv.includes('--quick');
const outputDirectory = path.resolve(quick ? 'tmp/demo-check' : 'docs/demo');
const chapterDuration = quick ? 400 : 12000;
const baseURL = process.env.DEMO_URL || 'http://127.0.0.1:5173';
await mkdir(outputDirectory, { recursive: true });
const browser = await chromium.launch();
const context = await browser.newContext({ baseURL, viewport: { width: 1280, height: 800 }, recordVideo: { dir: outputDirectory, size: { width: 1280, height: 800 } } });
const page = await context.newPage();
const video = page.video();
const started = Date.now();
const chapters = [];

async function chapter(title, detail, action) {
  const start = Date.now();
  await action();
  await page.evaluate(({ title, detail }) => {
    document.getElementById('recording-caption')?.remove();
    const caption = document.createElement('div');
    caption.id = 'recording-caption';
    caption.setAttribute('aria-hidden', 'true');
    caption.style.cssText = 'position:fixed;bottom:16px;left:24px;z-index:9999;max-width:580px;padding:14px 20px;background:#20211ff2;color:#f8f6f2;border:1px solid #b69a70;border-radius:8px;font:12px/1.7 Inter,sans-serif;pointer-events:none;box-shadow:0 4px 20px #0002';
    const heading = document.createElement('strong'); heading.textContent = title;
    const description = document.createElement('div'); description.textContent = detail;
    caption.append(heading, description); document.body.append(caption);
  }, { title, detail });
  chapters.push({ seconds: Math.round((start - started) / 1000), title, detail });
  await page.waitForTimeout(Math.max(200, chapterDuration - (Date.now() - start)));
  console.log(title);
}

async function fillCheckout() {
  await page.getByLabel('Customer Full Name').fill('Maya Sample');
  await page.getByLabel('Email Address').fill('maya@example.com');
  await page.getByLabel('Contact Number').fill('09000000123');
  await page.getByLabel('Delivery Address').fill('123 Sample Lane, Demo City');
  await page.getByRole('radio', { name: 'Cash on Delivery' }).check();
}

let order;
try {
  await chapter('01 · Welcome to OUD & AURA', 'A fictional Arabian fragrance boutique. All prices and payments are demonstration data.', async () => {
    await page.goto('/'); await expect(page.getByRole('heading', { name: 'Discover Your Signature Scent' })).toBeVisible();
  });
  await chapter('02 · Explore fragrance families', 'Three collections connect directly to filtered product browsing.', async () => { await page.goto('/collections'); });
  await chapter('03 · Search, filter, and sort together', 'Product-name search is case-insensitive. Both price directions work alongside category filters.', async () => {
    await page.goto('/shop');
    await page.getByRole('searchbox', { name: 'Search fragrances', exact: true }).fill('a');
    await page.getByLabel('Category', { exact: true }).selectOption('amber');
    await page.getByLabel('Sort by').selectOption('high');
    await expect(page.locator('.product-card')).toHaveCount(4);
  });
  await chapter('04 · Product details and quantity', 'Choose a whole-number quantity. Stock limits apply to both purchasing actions.', async () => {
    await page.goto('/product/p-9pm'); await page.getByRole('spinbutton').fill('2');
  });
  await chapter('05 · Add to Cart', 'The notification offers View cart. Repeated products merge into one cart line.', async () => {
    await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
    await page.getByRole('link', { name: 'View cart', exact: true }).click();
    await expect(page.getByRole('spinbutton')).toHaveValue('2');
  });
  await chapter('06 · Buy only the items you select', 'Selected totals update immediately; unselected items remain for later.', async () => {
    await page.goto('/product/p-hawas'); await page.getByRole('button', { name: 'Add to Cart', exact: true }).click();
    await page.goto('/cart'); await page.getByRole('checkbox', { name: 'Select Hawas Azure', exact: true }).uncheck();
    await page.reload(); await expect(page.getByRole('checkbox', { name: 'Select Hawas Azure', exact: true })).not.toBeChecked();
  });
  await chapter('07 · Validate before saving', 'Required guest fields are checked. The cart and stock remain unchanged when validation fails.', async () => {
    await page.getByRole('button', { name: 'Checkout (2)', exact: true }).click();
    await page.getByRole('button', { name: 'Place Order', exact: true }).click();
    await expect(page.getByText('Enter your full name.', { exact: true })).toBeVisible();
  });
  await chapter('08 · Review delivery, payment, and total', 'Guest checkout uses fictional contact details and a simulated payment choice. Subtotal equals total.', async () => { await fillCheckout(); });
  await chapter('09 · Save the order atomically', 'A Pending order, item snapshots, stock deduction, and purchased cart removal are saved together.', async () => {
    await page.getByRole('button', { name: 'Place Order', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Order placed successfully.' })).toBeVisible();
    order = await page.evaluate(() => JSON.parse(localStorage.getItem('oud-aura:store:v1')).orders[0]);
  });
  await chapter('10 · Return through My Orders', 'Guest orders remain accessible in the same browser and show their current saved status.', async () => { await page.goto('/orders'); await expect(page.locator('.customer-order-card')).toHaveCount(1); });
  await chapter('11 · Demo admin login', 'SessionStorage protects navigation for this assessment demo. It is not production authentication.', async () => {
    await page.goto('/admin/login'); await page.getByRole('button', { name: 'Use demo credentials' }).click();
  });
  await chapter('12 · The matching order in admin', 'The customer details, notes, quantities, snapshot prices, and total match checkout.', async () => {
    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.goto('/admin/orders/' + order.id);
    await expect(page.locator('.page-intro .status-badge')).toHaveText('Pending');
  });
  await chapter('13 · Confirm, then prepare', 'Only the next status is offered: Pending → Confirmed → Preparing.', async () => {
    await page.getByRole('button', { name: 'Mark as Confirmed', exact: true }).click();
    await page.getByRole('button', { name: 'Mark as Preparing', exact: true }).click();
  });
  await chapter('14 · Ship, then complete', 'Shipped → Completed. Completed and Cancelled are final; backwards or skipped transitions are rejected.', async () => {
    await page.getByRole('button', { name: 'Mark as Shipped', exact: true }).click();
    await page.getByRole('button', { name: 'Mark as Completed', exact: true }).click();
  });
  await chapter('15 · Accurate overview metrics', 'Sales include Completed orders only; customers are grouped by normalized checkout email.', async () => {
    await page.goto('/admin'); await expect(page.locator('.metric-card').filter({ hasText: 'Total Sales' })).toContainText('₱4,900.00');
  });
  await chapter('16 · Shared catalog and preserved history', 'Admin price edits affect future purchases. Existing order snapshots keep their original prices.', async () => {
    await page.goto('/admin/products/p-9pm/edit'); await page.getByLabel('Price (PHP)').fill('2600.50');
    await page.getByRole('button', { name: 'Save product', exact: true }).click(); await page.goto('/order/' + order.id);
    await expect(page.locator('.total-row')).toContainText('₱4,900.00');
  });
  await chapter('17 · Buy Now and eligible cancellation', 'Buy Now leaves the cart untouched. Cancelling Pending or Confirmed restores stock exactly once.', async () => {
    await page.goto('/product/p-hawas'); await page.getByRole('button', { name: 'Buy Now', exact: true }).click();
    await fillCheckout(); await page.getByRole('button', { name: 'Place Order', exact: true }).click();
    await page.getByRole('button', { name: 'Cancel this order', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Cancel order', exact: true }).click();
    await expect(page.locator('.confirmation-number .status-badge')).toHaveText('Cancelled');
  });
  await chapter('18 · Reliable, browser-local demonstration', 'Orders survive refresh. See README, system-flow analysis, acceptance log, and 375/768/1280 px screenshots.', async () => {
    await page.goto('/orders'); await page.reload(); await expect(page.locator('.customer-order-card')).toHaveCount(2);
  });
} finally {
  await context.close(); await browser.close();
}
const target = path.join(outputDirectory, 'oud-aura-walkthrough.webm');
await rename(await video.path(), target);
await writeFile(path.join(outputDirectory, 'chapters.json'), JSON.stringify({ recordedAt: new Date().toISOString(), seconds: Math.round((Date.now() - started) / 1000), automated: true, narration: false, chapters }, null, 2));
console.log('Saved ' + target);
