import { CATALOG_VERSION, createSeed, NEW_PRODUCTS, SEED_CATEGORIES } from '../data/seed.js';
import { money, normalizeEmail, orderTotal, parsePrice } from '../utils/format.js';

export const STORAGE_KEY = 'oud-aura:store:v1';
export const PAYMENT_METHODS = ['Cash on Delivery', 'E-Wallet', 'Bank Transfer'];
export const ORDER_STATUSES = ['Pending', 'Confirmed', 'Preparing', 'Shipped', 'Completed'];

export class StoreError extends Error {
  constructor(message, code = 'VALIDATION', details = []) {
    super(message);
    this.name = 'StoreError';
    this.code = code;
    this.details = details;
  }
}

function assert(condition, message, code) {
  if (!condition) throw new StoreError(message, code);
}

function optionalTextFields(record, fields) {
  return fields.every(key => record[key] === undefined || typeof record[key] === 'string');
}

function validDocument(data) {
  return data?.version === 1 && Number.isSafeInteger(data.revision) && Number.isSafeInteger(data.catalogVersion ?? 1) && (data.catalogVersion ?? 1) >= 1 && (data.catalogVersion ?? 1) <= CATALOG_VERSION &&
    ['categories', 'products', 'cart', 'orders'].every(key => Array.isArray(data[key])) &&
    data.categories.every(c => typeof c.id === 'string' && typeof c.name === 'string' && optionalTextFields(c, ['description', 'image'])) &&
    data.products.every(p => typeof p.id === 'string' && typeof p.name === 'string' && typeof p.categoryId === 'string' && typeof p.description === 'string' && typeof p.image === 'string' && typeof p.active === 'boolean' && Number.isSafeInteger(p.price) && p.price > 0 && Number.isSafeInteger(p.stock) && p.stock >= 0 && optionalTextFields(p, ['brand', 'size']) && (p.notes == null || (typeof p.notes === 'object' && !Array.isArray(p.notes) && optionalTextFields(p.notes, ['top', 'middle', 'base'])))) &&
    data.cart.every(i => typeof i.productId === 'string' && Number.isSafeInteger(i.quantity) && i.quantity > 0 && (i.selected === undefined || typeof i.selected === 'boolean')) &&
    data.orders.every(o => typeof o.id === 'string' && typeof o.number === 'string' && typeof o.createdAt === 'string' && !Number.isNaN(Date.parse(o.createdAt)) && o.customer && ['name', 'email', 'phone', 'address'].every(key => typeof o.customer[key] === 'string') && PAYMENT_METHODS.includes(o.paymentMethod) && typeof o.notes === 'string' && Array.isArray(o.items) && o.items.length > 0 && o.items.every(i => typeof i.productId === 'string' && typeof i.name === 'string' && Number.isSafeInteger(i.unitPrice) && i.unitPrice > 0 && Number.isSafeInteger(i.quantity) && i.quantity > 0 && optionalTextFields(i, ['brand', 'image'])) && Number.isSafeInteger(o.total) && o.total === orderTotal(o.items) && [...ORDER_STATUSES, 'Cancelled'].includes(o.status) && Array.isArray(o.history) && o.history.length > 0 && o.history.every(h => [...ORDER_STATUSES, 'Cancelled'].includes(h.status) && typeof h.at === 'string' && !Number.isNaN(Date.parse(h.at))) && o.history.at(-1).status === o.status && typeof o.stockRestored === 'boolean');
}

export function filterProducts(products, { query = '', category = '', sort = 'featured', status = 'active' } = {}) {
  const matching = products.filter(p => p.name.toLowerCase().includes(query.trim().toLowerCase()) && (!category || p.categoryId === category) && (status === 'all' || (status === 'inactive' ? !p.active : status === 'out' ? p.active && p.stock === 0 : p.active)));
  if (sort === 'low') matching.sort((a, b) => a.price - b.price);
  if (sort === 'high') matching.sort((a, b) => b.price - a.price);
  return matching;
}

export function cartLines(state) {
  return state.cart.map(item => ({ ...item, product: state.products.find(p => p.id === item.productId) }));
}

// A Buy Now selection is quoted independently and never changes the saved cart.
export function quoteCart(state, buyNow = null) {
  const items = buyNow ? [buyNow] : state.cart.filter(item => item.selected !== false);
  return items.map(item => {
    const p = state.products.find(product => product.id === item.productId);
    return { productId: item.productId, quantity: item.quantity, name: p?.name || 'Unavailable product', unitPrice: p?.price || 0, stock: p?.stock || 0, active: p?.active || false };
  });
}

export function validateCustomer(values) {
  const errors = {};
  if (!values.name?.trim()) errors.name = 'Enter your full name.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email?.trim() || '')) errors.email = 'Enter a valid email address.';
  const phone = values.phone?.trim() || '';
  if (!/^[+\d\s().-]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15) errors.phone = 'Enter a contact number with 7–15 digits.';
  if (!values.address?.trim()) errors.address = 'Enter your delivery address.';
  if (!PAYMENT_METHODS.includes(values.paymentMethod)) errors.paymentMethod = 'Choose a payment method.';
  return errors;
}

export function customerSummary(orders) {
  const grouped = new Map();
  [...orders].reverse().sort((a, b) => a.createdAt.localeCompare(b.createdAt)).forEach(order => {
    const email = normalizeEmail(order.customer.email);
    const previous = grouped.get(email) || { totalOrders: 0, completedValue: 0 };
    grouped.set(email, { ...order.customer, email, totalOrders: previous.totalOrders + 1, completedValue: previous.completedValue + (order.status === 'Completed' ? order.total : 0) });
  });
  return [...grouped.values()];
}

export function dashboardStats(state) {
  return {
    products: state.products.length, orders: state.orders.length,
    pending: state.orders.filter(o => o.status === 'Pending').length,
    completed: state.orders.filter(o => o.status === 'Completed').length,
    customers: customerSummary(state.orders).length,
    sales: state.orders.filter(o => o.status === 'Completed').reduce((sum, order) => sum + order.total, 0),
  };
}

export function nextStatuses(status) {
  const index = ORDER_STATUSES.indexOf(status);
  const next = index >= 0 && index < ORDER_STATUSES.length - 1 ? [ORDER_STATUSES[index + 1]] : [];
  return ['Pending', 'Confirmed'].includes(status) ? [...next, 'Cancelled'] : next;
}

export function createStore(storage, { lock = null, now = () => new Date().toISOString(), id = () => crypto.randomUUID(), notify = () => {} } = {}) {
  function read() {
    let raw;
    try { raw = storage.getItem(STORAGE_KEY); }
    catch { throw new StoreError('Browser storage is unavailable. Allow local site storage and try again.', 'STORAGE'); }
    if (raw === null) return createSeed();
    try {
      const data = JSON.parse(raw);
      assert(validDocument(data), 'Stored demo data has an unsupported format.', 'CORRUPT');
      // Upgrade in memory; the next successful write saves the marker and respects later deletions.
      if ((data.catalogVersion ?? 1) < CATALOG_VERSION) {
        for (const product of NEW_PRODUCTS) {
          if (data.products.some(existing => existing.id === product.id)) continue;
          const original = SEED_CATEGORIES.find(category => category.id === product.categoryId);
          let category = data.categories.find(category => category.id === original.id || category.name.trim().toLowerCase() === original.name.toLowerCase());
          if (!category) { category = structuredClone(original); data.categories.push(category); }
          data.products.push({ ...structuredClone(product), categoryId: category.id });
        }
        data.catalogVersion = CATALOG_VERSION;
      }
      return data;
    } catch {
      throw new StoreError('Saved demo data could not be read. Your stored data has been kept. Reset the demo to start again.', 'CORRUPT');
    }
  }

  function write(data) {
    assert(validDocument(data), 'The data could not be validated. Nothing was saved.', 'VALIDATION');
    try { storage.setItem(STORAGE_KEY, JSON.stringify(data)); }
    catch { throw new StoreError('We could not save your changes. Browser storage may be full or blocked. Your previous data and cart are unchanged. Please try again.', 'STORAGE'); }
    notify();
  }

  async function mutate(operation) {
    const run = () => {
      const state = read();
      const result = operation(state);
      state.revision += 1;
      write(state);
      return result;
    };
    return lock ? lock(run) : run();
  }

  return {
    read,
    async initialize() {
      return mutate(() => {});
    },
    async reset() {
      const run = () => { write(createSeed()); };
      return lock ? lock(run) : run();
    },
    async addToCart(productId, quantity = 1) {
      return mutate(state => {
        const p = state.products.find(p => p.id === productId);
        assert(p?.active && p.stock > 0, 'This fragrance is currently unavailable.');
        assert(Number.isSafeInteger(quantity) && quantity > 0, 'Quantity must be a positive whole number.');
        const line = state.cart.find(item => item.productId === productId);
        const total = (line?.quantity || 0) + quantity;
        assert(total <= p.stock, `Only ${p.stock} available. You already have ${line?.quantity || 0} in your cart.`);
        if (line) { line.quantity = total; line.selected = true; }
        else state.cart.push({ productId, quantity });
      });
    },
    async setQuantity(productId, quantity) {
      return mutate(state => {
        const p = state.products.find(p => p.id === productId);
        assert(p?.active, 'This fragrance is no longer available. Remove it from your cart.');
        assert(Number.isSafeInteger(quantity) && quantity > 0 && quantity <= p.stock, `Choose a whole-number quantity from 1 to ${p.stock}.`);
        const line = state.cart.find(item => item.productId === productId);
        assert(line, 'This item is no longer in your cart.');
        line.quantity = quantity;
      });
    },
    async removeFromCart(productId) {
      return mutate(state => { state.cart = state.cart.filter(item => item.productId !== productId); });
    },
    async selectCartItems(productIds, selected) {
      return mutate(state => {
        assert(Array.isArray(productIds) && typeof selected === 'boolean', 'Choose a valid cart selection.');
        for (const productId of productIds) {
          const line = state.cart.find(item => item.productId === productId);
          assert(line, 'An item is no longer in your cart. Refresh and try again.');
          line.selected = selected;
        }
      });
    },
    async placeOrder(values, reviewedQuote, buyNow = null) {
      return mutate(state => {
        const errors = validateCustomer(values);
        assert(!Object.keys(errors).length, Object.values(errors)[0]);
        const current = quoteCart(state, buyNow);
        assert(current.length > 0, state.cart.length ? 'Select at least one item in your cart to check out.' : 'Your cart is empty. Add a fragrance before checking out.');
        assert(current.every(item => Number.isSafeInteger(item.quantity) && item.quantity > 0), 'Quantity must be a positive whole number.');
        const differences = [];
        for (const line of current) {
          const previous = reviewedQuote?.find(item => item.productId === line.productId);
          if (!previous) differences.push(`${line.name} was added to your selection. Review the updated summary.`);
          else {
            if (line.unitPrice !== previous.unitPrice) differences.push(`${line.name}: price changed from ${money(previous.unitPrice)} to ${money(line.unitPrice)}.`);
            if (line.quantity !== previous.quantity) differences.push(`${line.name}: quantity changed to ${line.quantity}.`);
            if (line.stock !== previous.stock) differences.push(`${line.name}: available stock changed from ${previous.stock} to ${line.stock}.`);
            if (line.active !== previous.active || line.name !== previous.name) differences.push(`${previous.name}: product details or availability changed.`);
          }
          if (!line.active) differences.push(`${line.name} is no longer available. Choose another fragrance or remove it from your selection.`);
          else if (line.quantity > line.stock) differences.push(`${line.name}: only ${line.stock} available. Update your quantity before continuing.`);
        }
        if (reviewedQuote?.some(previous => !current.some(line => line.productId === previous.productId))) differences.push('An item was removed from your selection. Review the updated summary.');
        if (differences.length) throw new StoreError('Your order has changed. Review the updated summary before placing your order again.', 'REVIEW', differences);
        const orderId = id();
        const createdAt = now();
        const items = current.map(line => {
          const product = state.products.find(p => p.id === line.productId);
          assert(product.active && product.stock >= line.quantity, 'A fragrance is no longer available. Review your selection.');
          product.stock -= line.quantity;
          return { productId: product.id, name: product.name, brand: product.brand, image: product.image, quantity: line.quantity, unitPrice: product.price };
        });
        const order = { id: orderId, number: `OA-${createdAt.slice(0, 10).replaceAll('-', '')}-${orderId.replaceAll('-', '').slice(0, 8).toUpperCase()}`, createdAt, customer: { name: values.name.trim(), email: normalizeEmail(values.email), phone: values.phone.trim(), address: values.address.trim() }, paymentMethod: values.paymentMethod, notes: values.notes?.trim() || '', items, total: orderTotal(items), status: 'Pending', stockRestored: false, history: [{ status: 'Pending', at: createdAt }] };
        assert(!state.orders.some(o => o.number === order.number), 'Order number conflict. Please try again.');
        state.orders.unshift(order);
        if (!buyNow) state.cart = state.cart.filter(item => !current.some(line => line.productId === item.productId));
        return structuredClone(order);
      });
    },
    async saveProduct(input, productId = null, expectedProduct = null) {
      return mutate(state => {
        const name = input.name?.trim();
        const description = input.description?.trim();
        const image = input.image?.trim();
        const price = parsePrice(input.price);
        const stockText = String(input.stock).trim();
        assert(name, 'A product name is required.');
        assert(description, 'A description is required.');
        assert(image && (/^https?:\/\/[^\s]+$/.test(image) || /^\/(?!\/)[^\s]+$/.test(image)), 'Use an https:// image URL or a bundled path starting with /.');
        assert(state.categories.some(c => c.id === input.categoryId), 'Choose an existing category.');
        assert(Number.isSafeInteger(price) && price > 0 && price <= 100000000, 'Enter a positive price with up to two decimal places (maximum PHP 1,000,000).');
        assert(/^\d+$/.test(stockText) && Number.isSafeInteger(Number(stockText)) && Number(stockText) <= 1000000, 'Stock must be a whole number from 0 to 1,000,000.');
        const existing = productId ? state.products.find(p => p.id === productId) : null;
        assert(!productId || existing, 'This product no longer exists.');
        assert(!expectedProduct || JSON.stringify(existing) === JSON.stringify(expectedProduct), 'This product changed while you were editing, possibly because an order changed its stock. Reload the latest product before saving.', 'CONFLICT');
        const product = { ...existing, id: productId || id(), name, description, image, brand: input.brand?.trim() || '', categoryId: input.categoryId, price, stock: Number(stockText), active: input.active === true, size: input.size?.trim() || '' };
        if (existing) state.products[state.products.indexOf(existing)] = product;
        else state.products.push(product);
        return product.id;
      });
    },
    async setProductActive(productId, active) {
      return mutate(state => {
        const p = state.products.find(p => p.id === productId);
        assert(p, 'This product no longer exists.');
        p.active = Boolean(active);
      });
    },
    async deleteProduct(productId) {
      return mutate(state => {
        assert(!state.orders.some(order => order.items.some(item => item.productId === productId)), 'This fragrance is part of saved order history and cannot be deleted. Mark it inactive instead.', 'REFERENCED');
        state.products = state.products.filter(p => p.id !== productId);
      });
    },
    async saveCategory(input, categoryId = null) {
      return mutate(state => {
        const name = input.name?.trim();
        assert(name, 'A category name is required.');
        assert(!state.categories.some(c => c.id !== categoryId && c.name.toLowerCase() === name.toLowerCase()), 'A category with this name already exists.');
        const existing = categoryId ? state.categories.find(c => c.id === categoryId) : null;
        assert(!categoryId || existing, 'This category no longer exists.');
        const category = { ...existing, id: categoryId || id(), name, description: input.description?.trim() || '', image: existing?.image || '/images/catalog.png#bottle-3' };
        if (existing) state.categories[state.categories.indexOf(existing)] = category;
        else state.categories.push(category);
      });
    },
    async deleteCategory(categoryId) {
      return mutate(state => {
        assert(!state.products.some(product => product.categoryId === categoryId), 'This category is assigned to products, including inactive products. Move those products to another category first.');
        state.categories = state.categories.filter(c => c.id !== categoryId);
      });
    },
    async transitionOrder(orderId, nextStatus) {
      return mutate(state => {
        const order = state.orders.find(order => order.id === orderId);
        assert(order, 'This order no longer exists.');
        assert(nextStatuses(order.status).includes(nextStatus), `Cannot change an order from ${order.status} to ${nextStatus}. Follow the next available step.`);
        if (nextStatus === 'Cancelled') {
          assert(!order.stockRestored, 'Stock has already been restored for this order.');
          for (const item of order.items) {
            const product = state.products.find(p => p.id === item.productId);
            assert(product, 'An ordered product is missing. Stock could not be restored; no changes were saved.');
            product.stock += item.quantity;
          }
          order.stockRestored = true;
        }
        order.status = nextStatus;
        order.history.push({ status: nextStatus, at: now() });
      });
    },
  };
}
