import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSeed } from '../src/data/seed.js';
import { createStore, customerSummary, dashboardStats, filterProducts, quoteCart, STORAGE_KEY, validateCustomer } from '../src/services/store.js';
import { money, orderTotal, parsePrice } from '../src/utils/format.js';

const customer = { name: 'Maya Sample', email: ' MAYA@EXAMPLE.COM ', phone: '+63 (900) 000-0123', address: '123 Sample Lane, Demo City', paymentMethod: 'Cash on Delivery', notes: 'Fictional order.' };

function setup(seed = createSeed()) {
  let raw = JSON.stringify(seed);
  let fail = false;
  let counter = 0;
  const storage = { getItem: () => raw, setItem: (_, next) => { if (fail) throw new Error('Storage quota'); raw = next; } };
  const options = { id: () => `${String(++counter).padStart(8, '0')}-demo-unique`, now: () => new Date(Date.UTC(2026, 10, 13, 1, 0, counter)).toISOString() };
  return { store: createStore(storage, options), recreate: () => createStore(storage, options), setFail: value => { fail = value; }, setRaw: value => { raw = value; } };
}

async function purchase(store, email = customer.email, productId = 'p-9pm', quantity = 1, changes = {}) {
  await store.addToCart(productId, quantity);
  return store.placeOrder({ ...customer, email, ...changes }, quoteCart(store.read()));
}

function productInput(product, changes = {}) {
  return { ...product, price: (product.price / 100).toFixed(2), stock: String(product.stock), ...changes };
}

test('seed has 12 perfumes, three categories, inactive and active out-of-stock examples', () => {
  const state = createSeed();
  assert.equal(state.products.length, 12); assert.equal(state.categories.length, 3);
  assert.ok(state.products.some(p => !p.active)); assert.ok(state.products.some(p => p.active && p.stock === 0));
});

test('01: combined case-insensitive search/category and both price sorts; no matches', () => {
  const state = createSeed();
  for (const sort of ['low', 'high']) {
    const results = filterProducts(state.products, { query: 'a', category: 'amber', sort });
    assert.ok(results.length > 1);
    assert.ok(results.every(p => p.active && p.categoryId === 'amber' && p.name.toLowerCase().includes('a')));
    assert.deepEqual(results.map(p => p.price), [...results.map(p => p.price)].sort((a, b) => sort === 'low' ? a - b : b - a));
  }
  assert.equal(filterProducts(state.products, { query: 'HAWAS' })[0].id, 'p-hawas');
  assert.equal(filterProducts(state.products, { query: 'missing fragrance' }).length, 0);
  assert.ok(!filterProducts(state.products).some(p => !p.active));
});

test('02: cart merges repeated products and survives a new store instance', async () => {
  const fixture = setup();
  await fixture.store.addToCart('p-9pm', 2); await fixture.store.addToCart('p-9pm', 1);
  assert.deepEqual(fixture.recreate().read().cart, [{ productId: 'p-9pm', quantity: 3, selected: true }]);
  await fixture.store.setQuantity('p-9pm', 4); assert.equal(fixture.store.read().cart[0].quantity, 4);
  await fixture.store.removeFromCart('p-9pm'); assert.equal(fixture.store.read().cart.length, 0);
});

test('02: integer centavos produce exactly PHP 325.50 and two-decimal peso formatting', () => {
  const total = orderTotal([{ unitPrice: 12000, quantity: 2 }, { unitPrice: 8550, quantity: 1 }]);
  assert.equal(total, 32550); assert.equal(money(total), '₱325.50');
  assert.equal(parsePrice('85.50'), 8550); assert.equal(parsePrice('0.29'), 29);
  assert.ok(Number.isNaN(parsePrice('1.005'))); assert.ok(Number.isNaN(parsePrice('-1')));
});

test('03: invalid checkout fields, empty checkout, and quantities rejected', async () => {
  const { store } = setup();
  assert.equal(Object.keys(validateCustomer({ name: '  ', email: 'wrong', phone: '   ', address: ' ', paymentMethod: 'Card' })).length, 5);
  assert.deepEqual(validateCustomer(customer), {});
  await assert.rejects(store.placeOrder(customer, []), /cart is empty/);
  for (const quantity of [0, -1, 1.5, 19, NaN]) await assert.rejects(store.addToCart('p-9pm', quantity));
  await store.addToCart('p-9pm', 1);
  for (const quantity of [0, -1, 1.5, 19]) await assert.rejects(store.setQuantity('p-9pm', quantity));
  await assert.rejects(store.placeOrder({ ...customer, name: '  ' }, quoteCart(store.read())), /full name/);
  assert.equal(store.read().cart.length, 1);
});

test('04: inactive, missing, and out-of-stock fragrances cannot be added', async () => {
  const { store } = setup();
  for (const id of ['p-reserve', 'p-turathi', 'missing']) await assert.rejects(store.addToCart(id), /unavailable/);
  assert.equal(store.read().cart.length, 0);
});

test('04: stale price/stock quote requires explicit review then succeeds with new price', async () => {
  const { store } = setup();
  await store.addToCart('p-9pm');
  const oldQuote = quoteCart(store.read());
  const p = store.read().products.find(p => p.id === 'p-9pm');
  await store.saveProduct(productInput(p, { price: '2500.50', stock: '17' }), p.id);
  await assert.rejects(store.placeOrder(customer, oldQuote), error => error.code === 'REVIEW' && error.details.some(d => d.includes('₱2,500.50')) && error.details.some(d => d.includes('stock changed')));
  assert.equal(store.read().orders.length, 0); assert.equal(store.read().cart.length, 1);
  const order = await store.placeOrder(customer, quoteCart(store.read()));
  assert.equal(order.total, 250050);
});

test('04: changed availability and cart content block saving until reviewed/fixed', async () => {
  const { store } = setup();
  await store.addToCart('p-9pm', 2); const oldQuote = quoteCart(store.read());
  await store.setProductActive('p-9pm', false);
  await assert.rejects(store.placeOrder(customer, oldQuote), e => e.code === 'REVIEW');
  await assert.rejects(store.placeOrder(customer, quoteCart(store.read())), e => e.code === 'REVIEW');
  await store.setProductActive('p-9pm', true);
  await store.addToCart('p-hawas');
  await assert.rejects(store.placeOrder(customer, oldQuote), e => e.code === 'REVIEW');
  assert.equal(store.read().orders.length, 0);
});

test('05: successful purchase atomically saves snapshots, reduces stock, clears cart, and starts Pending', async () => {
  const { store, recreate } = setup();
  const order = await purchase(store, undefined, 'p-9pm', 2);
  const state = recreate().read();
  assert.equal(state.orders.length, 1); assert.equal(state.cart.length, 0);
  assert.equal(state.products.find(p => p.id === 'p-9pm').stock, 16);
  assert.equal(order.status, 'Pending'); assert.equal(order.total, 490000);
  assert.equal(order.customer.email, 'maya@example.com'); assert.match(order.number, /^OA-20261113-/);
  assert.equal(order.items[0].name, '9PM After Hours'); assert.equal(order.items[0].unitPrice, 245000);
});

test('05: failed order write preserves cart, stock, and all previous orders', async () => {
  const fixture = setup(); await fixture.store.addToCart('p-9pm', 2);
  const before = fixture.store.read(); fixture.setFail(true);
  await assert.rejects(fixture.store.placeOrder(customer, quoteCart(before)), e => e.code === 'STORAGE');
  assert.deepEqual(fixture.store.read(), before);
  fixture.setFail(false); await fixture.store.placeOrder(customer, quoteCart(before));
  assert.equal(fixture.store.read().orders.length, 1);
});

test('06: product/category CRUD validates and protects referenced/assigned records', async () => {
  const { store } = setup();
  await store.saveCategory({ name: 'Special Edit', description: 'Sample' });
  await assert.rejects(store.saveCategory({ name: '  SPECIAL EDIT  ' }), /already exists/);
  await assert.rejects(store.saveCategory({ name: '  ' }), /required/);
  const category = store.read().categories.find(c => c.name === 'Special Edit');
  await store.saveCategory({ name: 'Edited Edit' }, category.id);
  const p = store.read().products[0];
  const newId = await store.saveProduct(productInput(p, { name: 'New Sample', categoryId: category.id }));
  assert.equal(store.read().products.length, 13);
  await assert.rejects(store.deleteCategory(category.id), /assigned to products/);
  await store.deleteProduct(newId); await store.deleteCategory(category.id);
  await purchase(store);
  await assert.rejects(store.deleteProduct('p-9pm'), e => e.code === 'REFERENCED');
  await store.setProductActive('p-9pm', false);
  assert.ok(!filterProducts(store.read().products).some(p => p.id === 'p-9pm'));
});

test('06: product validation blocks malformed price, stock, image, description and category', async () => {
  const { store } = setup(); const p = store.read().products[0];
  const invalid = [{ name: ' ' }, { price: '0' }, { price: '12.345' }, { stock: '-1' }, { stock: '1.5' }, { stock: '' }, { description: ' ' }, { image: 'javascript:alert(1)' }, { categoryId: 'missing' }];
  for (const fields of invalid) await assert.rejects(store.saveProduct(productInput(p, fields), p.id));
  assert.equal(store.read().products[0].price, p.price);
});

test('07: only next statuses save; skipped, backward, repeated and terminal transitions fail', async () => {
  const { store } = setup(); const order = await purchase(store);
  await assert.rejects(store.transitionOrder(order.id, 'Preparing'));
  for (const status of ['Confirmed', 'Preparing', 'Shipped', 'Completed']) {
    await store.transitionOrder(order.id, status);
    await assert.rejects(store.transitionOrder(order.id, status));
    await assert.rejects(store.transitionOrder(order.id, 'Pending'));
  }
  await assert.rejects(store.transitionOrder(order.id, 'Cancelled'));
  assert.equal(store.read().orders[0].status, 'Completed');
});

test('07: Pending and Confirmed cancellations restore stock once, including across refresh', async () => {
  for (const confirm of [false, true]) {
    const { store, recreate } = setup(); const order = await purchase(store, undefined, 'p-9pm', 2);
    if (confirm) await store.transitionOrder(order.id, 'Confirmed');
    await store.transitionOrder(order.id, 'Cancelled');
    assert.equal(store.read().products.find(p => p.id === 'p-9pm').stock, 18);
    await assert.rejects(recreate().transitionOrder(order.id, 'Cancelled'));
    assert.equal(recreate().read().products.find(p => p.id === 'p-9pm').stock, 18);
  }
});

test('07: failed cancellation write does not restore stock or advance status', async () => {
  const fixture = setup(); const order = await purchase(fixture.store);
  const before = fixture.store.read(); fixture.setFail(true);
  await assert.rejects(fixture.store.transitionOrder(order.id, 'Cancelled'));
  assert.deepEqual(fixture.store.read(), before);
});

test('08: metrics count all orders/products, normalized unique emails and Completed sales only', async () => {
  const { store } = setup(); const completed = await purchase(store);
  for (const status of ['Confirmed', 'Preparing', 'Shipped', 'Completed']) await store.transitionOrder(completed.id, status);
  const cancelled = await purchase(store, 'maya@example.com', 'p-hawas', 1, { name: 'Latest Sample', phone: '09000009999' });
  await store.transitionOrder(cancelled.id, 'Cancelled');
  await purchase(store, 'other@example.com');
  assert.deepEqual(dashboardStats(store.read()), { products: 12, orders: 3, pending: 1, completed: 1, customers: 2, sales: 245000 });
  const maya = customerSummary(store.read().orders).find(c => c.email === 'maya@example.com');
  assert.equal(maya.totalOrders, 2); assert.equal(maya.completedValue, 245000);
  assert.equal(maya.name, 'Latest Sample'); assert.equal(maya.phone, '09000009999');
});

test('09: existing order names and prices survive product edits and reload', async () => {
  const { store, recreate } = setup(); const order = await purchase(store);
  const p = store.read().products.find(p => p.id === 'p-9pm');
  await store.saveProduct(productInput(p, { name: 'Changed name', price: '5000.25', description: 'Changed description', stock: '3' }), p.id);
  const snapshot = recreate().read().orders.find(o => o.id === order.id);
  assert.equal(snapshot.items[0].name, '9PM After Hours'); assert.equal(snapshot.items[0].unitPrice, 245000);
  assert.equal(snapshot.total, 245000);
  assert.equal(recreate().read().products.find(p => p.id === 'p-9pm').name, 'Changed name');
});

test('safe parsing preserves malformed data instead of silently deleting it', () => {
  const fixture = setup(); fixture.setRaw('{broken json');
  assert.throws(() => fixture.store.read(), e => e.code === 'CORRUPT');
  fixture.setRaw(JSON.stringify({ version: 99 }));
  assert.throws(() => fixture.store.read(), e => e.code === 'CORRUPT');
  assert.equal(STORAGE_KEY, 'oud-aura:store:v1');
});

test('concurrent purchases serialize, prevent overselling and produce distinct order numbers', async () => {
  let raw = JSON.stringify(createSeed()); let queue = Promise.resolve();
  const storage = { getItem: () => raw, setItem: (_, value) => { raw = value; } };
  const lock = run => { const result = queue.then(run); queue = result.catch(() => {}); return result; };
  const first = createStore(storage, { lock }); const second = createStore(storage, { lock });
  await first.addToCart('p-9pm', 18); const quote = quoteCart(first.read());
  const attempts = await Promise.allSettled([first.placeOrder(customer, quote), second.placeOrder(customer, quote)]);
  assert.equal(attempts.filter(r => r.status === 'fulfilled').length, 1);
  assert.equal(first.read().products.find(p => p.id === 'p-9pm').stock, 0);
  assert.equal(first.read().orders.length, 1);
});

test('selected-item checkout charges/removes only selected items and preserves the rest after reload', async () => {
  const { store, recreate } = setup();
  await store.addToCart('p-9pm', 2); await store.addToCart('p-hawas', 3);
  await store.selectCartItems(['p-hawas'], false);
  assert.equal(quoteCart(recreate().read()).length, 1);
  const order = await store.placeOrder(customer, quoteCart(store.read()));
  assert.equal(order.items.length, 1); assert.equal(order.total, 490000);
  assert.equal(recreate().read().cart[0].productId, 'p-hawas');
  assert.equal(recreate().read().cart[0].quantity, 3);
  assert.equal(recreate().read().products.find(p => p.id === 'p-hawas').stock, 24);
});

test('no selected items prevents checkout; adding an existing deselected item selects it again', async () => {
  const { store } = setup(); await store.addToCart('p-9pm');
  await store.selectCartItems(['p-9pm'], false);
  await assert.rejects(store.placeOrder(customer, []), /Select at least one/);
  await store.addToCart('p-9pm');
  assert.equal(quoteCart(store.read())[0].quantity, 2);
  assert.equal(store.read().cart.length, 1);
});

test('Buy Now checks out one product without adding, removing, or changing cart items', async () => {
  const { store } = setup(); await store.addToCart('p-9pm', 2);
  const before = store.read().cart;
  const buyNow = { productId: 'p-hawas', quantity: 3 };
  const order = await store.placeOrder(customer, quoteCart(store.read(), buyNow), buyNow);
  assert.equal(order.items.length, 1); assert.equal(order.items[0].productId, 'p-hawas');
  assert.equal(order.total, 855000);
  assert.deepEqual(store.read().cart, before);
  assert.equal(store.read().products.find(p => p.id === 'p-hawas').stock, 21);
});

test('Buy Now works with an empty cart and rejects invalid/excessive/unavailable selections', async () => {
  const { store } = setup();
  for (const buyNow of [{ productId: 'p-9pm', quantity: 0 }, { productId: 'p-9pm', quantity: 1.5 }, { productId: 'p-9pm', quantity: 19 }, { productId: 'p-reserve', quantity: 1 }, { productId: 'p-turathi', quantity: 1 }]) {
    await assert.rejects(store.placeOrder(customer, quoteCart(store.read(), buyNow), buyNow));
  }
  const buyNow = { productId: 'p-9pm', quantity: 1 };
  await store.placeOrder(customer, quoteCart(store.read(), buyNow), buyNow);
  assert.equal(store.read().orders.length, 1); assert.equal(store.read().cart.length, 0);
});

test('failed selected checkout preserves selection, cart, and inventory', async () => {
  const fixture = setup(); await fixture.store.addToCart('p-9pm'); await fixture.store.addToCart('p-hawas');
  await fixture.store.selectCartItems(['p-hawas'], false);
  const before = fixture.store.read(); fixture.setFail(true);
  await assert.rejects(fixture.store.placeOrder(customer, quoteCart(before)), e => e.code === 'STORAGE');
  assert.deepEqual(fixture.store.read(), before);
});

test('an admin form opened before a purchase cannot overwrite the deducted stock', async () => {
  const { store } = setup(); const original = store.read().products.find(p => p.id === 'p-9pm');
  await purchase(store);
  await assert.rejects(store.saveProduct(productInput(original, { price: '2999.00' }), original.id, original), e => e.code === 'CONFLICT');
  assert.equal(store.read().products.find(p => p.id === 'p-9pm').stock, 17);
  const latest = store.read().products.find(p => p.id === 'p-9pm');
  await store.saveProduct(productInput(latest, { price: '2999.00' }), latest.id, latest);
  assert.equal(store.read().products.find(p => p.id === 'p-9pm').stock, 17);
});

test('latest customer details remain correct when orders share a timestamp', async () => {
  const { store } = setup(); const first = await purchase(store);
  const second = await purchase(store, customer.email, 'p-hawas', 1, { name: 'Latest Name' });
  first.createdAt = second.createdAt;
  const summary = customerSummary([second, first]);
  assert.equal(summary[0].name, 'Latest Name');
});

test('saved orders with broken history fail safely instead of crashing order details', async () => {
  const fixture = setup(); await purchase(fixture.store);
  const broken = fixture.store.read(); delete broken.orders[0].history;
  fixture.setRaw(JSON.stringify(broken));
  assert.throws(() => fixture.store.read(), e => e.code === 'CORRUPT');
});

test('malformed display fields are rejected without replacing the stored data', async () => {
  const fixture = setup(); await purchase(fixture.store);
  const valid = fixture.store.read();
  const corruptions = [
    data => { data.categories[0].image = 42; },
    data => { data.categories[0].description = {}; },
    data => { data.products[0].brand = {}; },
    data => { data.products[0].size = []; },
    data => { data.products[0].notes = { top: {} }; },
    data => { data.orders[0].items[0].image = 42; },
    data => { data.orders[0].items[0].brand = {}; },
  ];
  for (const corrupt of corruptions) {
    const data = structuredClone(valid); corrupt(data);
    const raw = JSON.stringify(data); let writes = 0;
    const store = createStore({ getItem: () => raw, setItem: () => { writes += 1; } });
    assert.throws(() => store.read(), error => error.code === 'CORRUPT');
    assert.equal(writes, 0);
  }
});

test('older data with missing optional display fields still loads', async () => {
  const fixture = setup(); await purchase(fixture.store);
  const data = fixture.store.read();
  delete data.categories[0].image; delete data.categories[0].description;
  delete data.products[0].brand; delete data.products[0].size; delete data.products[0].notes;
  delete data.orders[0].items[0].image; delete data.orders[0].items[0].brand;
  fixture.setRaw(JSON.stringify(data));
  assert.equal(fixture.store.read().orders.length, 1);
});
