# System explanation - OUD & AURA

A perfume shop built with React, Vite, React Router and Bootstrap. Customers shop as guests. Admin manages the same products, categories and orders in the same browser profile and site URL.

## System flow

1. Browse Home, categories or Shop. Search, category filtering and price sorting work together. Inactive products are hidden; zero-stock products remain visible with purchasing disabled.
2. Open a perfume and add a valid quantity. The cart merges repeated additions and keeps its contents after refresh. Customers can check out selected cart items or use Buy Now.
3. Enter guest delivery details and select a simulated payment method. `Checkout.jsx` calls `store.placeOrder()` in `src/services/store.js`.
4. The store rechecks current prices, availability and stock. It saves item snapshots, deducts stock and removes purchased cart items in one LocalStorage write. A successful save shows the order number; a failed write keeps the previous data.
5. Login and open Admin Orders to manage that same order: **Pending -> Confirmed -> Preparing -> Shipped -> Completed**. Changes are manual; payment collection and courier delivery are simulated. Pending or Confirmed orders may be cancelled, restoring stock once.
6. The dashboard counts all products and orders, while sales include Completed orders only. Customer summaries group orders by trimmed, lowercase email.

## Data model

| Record | Main data and relationship |
| --- | --- |
| Category | ID, name, description and image. A category can have many products. |
| Product | ID, category ID, name, image, description, price, stock and active setting. |
| Cart item | Product ID, quantity and selected state. |
| Order | ID/number, date, customer details, payment choice, notes, total, status and history. Contains item snapshots with product ID, purchased name/image, unit price and quantity. |
| Customer summary | Derived from orders by normalized email; no separate account table. |

Money is stored as integer centavos. Products, categories, cart and orders share the versioned `oud-aura:store:v1` LocalStorage document. SessionStorage holds the demo login and checkout draft. Referenced products cannot be deleted; categories with assigned products cannot be deleted.

## Known limits and unfinished items

- Data belongs to one browser profile and origin. Incognito, another browser, another port or another device has separate data. Clearing site storage removes it.
- Login is simulated client-side access. There is no backend, production authentication, real payment processing or courier integration.
- Uploaded photos use browser storage and can fill its quota. Failed writes are reported. Concurrent writes use Web Locks when available; the fallback does not guarantee safe simultaneous writes across tabs.
- No failing core flow was found in the automated checks. Physical devices, other browser engines, screen readers and full keyboard traversal remain unverified. The assessment video and final sharing links were not reviewed in this run.

## AI tools and assets

Codex assisted with coding support, UI refinements, debugging and automated testing. Some perfume images were generated using ChatGPT image generation; the generated assets are in `public/images/`. The UI uses Bootstrap 5, Bootstrap Icons, Inter and Playfair Display. No new external page template or tutorial was added for this evidence work.

[Test log](TEST-LOG.md) - [Desktop/mobile screenshots](screenshots/README.md)
