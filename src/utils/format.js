export const money = (centavos) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP', minimumFractionDigits: 2 }).format(centavos / 100);
export const dateTime = (date) => new Intl.DateTimeFormat('en-PH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Manila' }).format(new Date(date));
export const normalizeEmail = (email) => email.trim().toLowerCase();
export const itemCount = (cart) => cart.reduce((sum, item) => sum + item.quantity, 0);
export const orderTotal = (items) => items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

export function parsePrice(value) {
  const text = String(value).trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return NaN;
  const [whole, fraction = ''] = text.split('.');
  const result = Number(whole) * 100 + Number(fraction.padEnd(2, '0'));
  return Number.isSafeInteger(result) ? result : NaN;
}
