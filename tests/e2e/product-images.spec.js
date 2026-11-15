import { test, expect } from '@playwright/test';

const key = 'oud-aura:store:v1';
const read = page => page.evaluate(key => JSON.parse(localStorage.getItem(key)), key);

async function adminLogin(page, path = '/admin/products/new') {
  await page.goto(path);
  await page.getByRole('button', { name: 'Use demo credentials' }).click();
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('.product-form')).toBeVisible();
}

for (const width of [375, 1280]) {
  test('product photo upload, replacement and image links persist at ' + width + 'px', async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await adminLogin(page);
    await expect(page.getByText('Your fragrance photo', { exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: 'test-results/product-form-empty-' + width + '.png', fullPage: true, animations: 'disabled' });
    await page.getByLabel('Product name').fill('Uploaded Sample');
    await page.getByLabel('Bottle size').fill('100 ml');
    await page.getByLabel('Brand / collection').fill('Sample Collection');
    await page.getByLabel('Category', { exact: false }).selectOption('fresh');
    await page.getByLabel('Description').fill('A fresh fragrance with citrus and cool aquatic notes.');
    await page.getByLabel('Price (PHP)').fill('2250.00');
    await page.getByLabel('Stock quantity').fill('12');
    await page.getByRole('button', { name: 'Save product', exact: true }).click();
    await expect(page.getByLabel('Or use an image link')).toBeFocused();
    await expect(page).toHaveURL(/\/admin\/products\/new$/);

    const picker = page.getByLabel('Upload product photo');
    const [chooser] = await Promise.all([
      page.waitForEvent('filechooser'),
      page.getByRole('button', { name: 'Upload photo', exact: true }).click(),
    ]);
    await chooser.setFiles('public/images/products/hawas-ice.webp');
    const preview = page.locator('img.form-image-preview');
    await expect(preview).toHaveAttribute('src', /^data:image\/webp;base64,/);
    await expect(preview).toHaveJSProperty('naturalWidth', 960);
    const uploaded = await preview.getAttribute('src');
    expect(uploaded.length).toBeLessThanOrEqual(500000);
    await expect(page.getByLabel('Or use an image link')).toHaveValue('');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.evaluate(() => document.fonts.ready);
    await page.evaluate(() => {
      document.activeElement.blur();
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await page.screenshot({ path: 'test-results/product-form-' + width + '.png', fullPage: true, animations: 'disabled' });

    await page.getByRole('button', { name: 'Save product', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    const product = (await read(page)).products.find(p => p.name === 'Uploaded Sample');
    expect(product.image).toBe(uploaded);
    await page.goto('/shop?q=Uploaded%20Sample');
    await page.reload();
    await expect(page.locator('.product-card img')).toHaveAttribute('src', uploaded);
    await expect(page.locator('.product-card img')).toHaveJSProperty('naturalWidth', 960);

    await page.goto('/admin/products/' + product.id + '/edit');
    await expect(preview).toHaveAttribute('src', uploaded);
    await picker.setInputFiles('public/images/products/shiyaaka-snow.webp');
    await expect(preview).not.toHaveAttribute('src', uploaded);
    await expect(page.getByRole('button', { name: 'Save product', exact: true })).toBeEnabled();
    const replacement = await preview.getAttribute('src');
    expect(replacement).toMatch(/^data:image\/webp;base64,/);
    await page.getByRole('button', { name: 'Save product', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    await page.goto('/admin/products/' + product.id + '/edit');
    await expect(preview).toHaveAttribute('src', replacement);

    await page.getByRole('button', { name: 'Remove', exact: true }).click();
    await expect(page.getByText('Your fragrance photo', { exact: true })).toBeVisible();
    await page.getByLabel('Or use an image link').fill('/images/products/hawas-kobra.webp');
    await expect(preview).toHaveJSProperty('naturalWidth', 1254);
    await page.getByRole('button', { name: 'Save product', exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/products$/);
    expect((await read(page)).products.find(p => p.id === product.id).image).toBe('/images/products/hawas-kobra.webp');
  });
}

test('invalid, oversized and unreadable photos keep the previous image and form details', async ({ page }) => {
  await adminLogin(page, '/admin/products/p-hawas-ice/edit');
  const preview = page.locator('img.form-image-preview');
  const original = await preview.getAttribute('src');
  const picker = page.getByLabel('Upload product photo');
  await page.getByLabel('Product name').fill('Keep my draft');

  await picker.setInputFiles({ name: 'photo.svg', mimeType: 'image/svg+xml', buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>') });
  await expect(page.getByRole('alert')).toContainText('Choose a JPG, PNG or WebP');
  await picker.setInputFiles({ name: 'too-large.jpg', mimeType: 'image/jpeg', buffer: Buffer.alloc(5 * 1024 * 1024 + 1) });
  await expect(page.getByRole('alert')).toContainText('under 5 MB');
  await picker.setInputFiles({ name: 'broken.png', mimeType: 'image/png', buffer: Buffer.from('This is not an image.') });
  await expect(page.getByRole('alert')).toContainText('could not be opened');

  await expect(preview).toHaveAttribute('src', original);
  await expect(page.getByLabel('Product name')).toHaveValue('Keep my draft');
  await expect(page.getByRole('button', { name: 'Save product', exact: true })).toBeEnabled();
  await expect(page.getByLabel('Upload product photo')).toHaveValue('');
});

test('an uploaded JPEG stays in the form when storage fails and saves after retry', async ({ page }) => {
  await adminLogin(page, '/admin/products/p-hawas-ice/edit');
  const jpeg = await page.evaluate(async () => {
    const bitmap = await createImageBitmap(await (await fetch('/images/products/hawas-kobra.webp')).blob());
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    bitmap.close();
    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
  });
  await page.getByLabel('Upload product photo').setInputFiles({ name: 'perfume.jpg', mimeType: 'image/jpeg', buffer: Buffer.from(jpeg, 'base64') });
  const preview = page.locator('img.form-image-preview');
  await expect(preview).toHaveAttribute('src', /^data:image\/webp;base64,/);
  const uploaded = await preview.getAttribute('src');
  await page.getByLabel('Product name').fill('Photo kept for retry');
  const before = await read(page);
  await page.evaluate(key => {
    const original = Storage.prototype.setItem;
    window.restoreStorage = () => { Storage.prototype.setItem = original; };
    Storage.prototype.setItem = function (name, value) {
      if (name === key) throw new DOMException('Test storage failure', 'QuotaExceededError');
      return original.call(this, name, value);
    };
  }, key);
  await page.getByRole('button', { name: 'Save product', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('could not save');
  expect(await read(page)).toEqual(before);
  await expect(preview).toHaveAttribute('src', uploaded);
  await expect(page.getByLabel('Product name')).toHaveValue('Photo kept for retry');
  await page.evaluate(() => window.restoreStorage());
  await page.getByRole('button', { name: 'Save product', exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/products$/);
  expect((await read(page)).products.find(p => p.id === 'p-hawas-ice').image).toBe(uploaded);
});
