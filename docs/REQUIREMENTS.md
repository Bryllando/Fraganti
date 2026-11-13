# Assessment analysis and implementation map

Sources reviewed: all seven pages of `CubeTech_Web_Development_Intern_Assessment.pdf` and the supplied OUD & AURA project brief. The PDF is the assessment baseline; the brief supplies the brand, stack, and fragrance content. They have no material conflict. “PHP” in the assessment means Philippine peso currency, not a requirement to use the PHP language.

## Required implementation

| Source | Requirement | Implementation location |
| --- | --- | --- |
| PDF 1–2 / brief 3–4 | Branded responsive home, working navigation, category links, featured cards, fictional contacts | `src/layouts/StoreLayout.jsx`, `src/pages/Home.jsx`, `src/styles/` |
| PDF 2 | Combined name search, category filter, both price sorts; active products only; empty/invalid states | `src/pages/Shop.jsx`, `src/services/store.js` |
| PDF 2 | Details, stock-limited integer quantity, up to three related active products | `src/pages/ProductDetails.jsx` |
| PDF 2 | Persistent merged cart; integer centavos; no fees; empty checkout prevention | `src/pages/Cart.jsx`, `src/services/store.js`, `src/utils/format.js` |
| PDF 3 | Guest validation; three simulated payment methods; review changed availability/prices; failed saves preserve cart | `src/pages/Checkout.jsx`, `src/services/store.js` |
| PDF 3 | Order/item snapshots, stock deduction, unique number, Pending status, confirmation after saving | `src/services/store.js`, `src/pages/Confirmation.jsx` |
| PDF 3–5 | Strict next-status workflow; cancellation only from Pending/Confirmed; restore stock once | `src/services/store.js`, `src/pages/admin/OrderDetails.jsx` |
| PDF 4 | SessionStorage demo login, route guard, logout, disclosed credentials | `src/services/auth.js`, `src/layouts/AdminLayout.jsx`, `src/pages/admin/Login.jsx` |
| PDF 4 | Six exact overview metrics; normalize customer emails; completed sales only | `src/services/store.js`, `src/pages/admin/Overview.jsx` |
| PDF 4 | Product CRUD, validation, filters, confirmation before deletion, protect referenced products and offer deactivation | `src/pages/admin/Products.jsx`, `src/pages/admin/ProductForm.jsx`, `src/services/store.js` |
| PDF 4 | Category CRUD; case-insensitive uniqueness; block assigned category deletion | `src/pages/admin/Categories.jsx`, `src/services/store.js` |
| PDF 4–5 | Orders newest first, full details and feedback; read-only customer summary with latest contact | `src/pages/admin/Orders.jsx`, `src/pages/admin/Customers.jsx` |
| PDF 5 | One origin and shared persistent products/categories/cart/orders; safe parsing; storage limitations | `src/services/store.js`, `src/hooks/useStore.jsx`, `README.md` |
| PDF 1 / brief 6 | 10+ perfumes, three categories, inactive and out-of-stock examples, multiple prices | `src/data/seed.js` |
| PDF 6 / brief 7,9 | Acceptance log, meaningful domain checks, connected browser checks, 375/768/1280 px layouts | `tests/`, `docs/TEST-LOG.md`, `docs/screenshots/` |
| PDF 7 | README, data/order flow, AI disclosure, screenshots, 3–5 minute demo, repository | `README.md`, `docs/`, Git repository |

## Architecture decisions

- React + Vite in JavaScript, React Router, Bootstrap 5 grid/utilities and Bootstrap Icons. Inter and Playfair Display are bundled, so fonts do not depend on an external service.
- A single versioned LocalStorage document contains products, categories, cart, and orders. Order creation saves snapshots, stock changes, and cart clearing in one `setItem` so a write failure cannot leave a half-saved order. All mutations reread current storage.
- Browser Web Locks serialize mutations across same-origin tabs where supported; the documented demo limitation remains where unavailable. There is no backend, payment collection, or production authentication.
- Shared domain functions enforce validation and status rules. UI components handle presentation and show returned errors. No duplicate customer table or sales counter is stored.
- Images are illustrative sample assets. Catalog names/prices/stock are fictional demonstration data inspired only by the product types in the supplied reference shop, not scraped listings.

## Submission boundaries

The assessment email address and instruction to submit are reference information, not an instruction to send an email. No submission is sent automatically. A GitHub destination and reviewer access must be configured by the project owner; local source, evidence, and exact publication instructions are prepared here.

## Marketplace-style flow refinement

The follow-up request adds familiar purchasing behavior while preserving the PDF's guest/demo scope:

- Selected-item cart checkout uses `cart.selected` (missing values on existing records default to selected), charges only purchased items, and keeps the rest for later. Selecting every item clears the cart after success.
- Buy Now uses a separate product/quantity quote and never edits the existing cart.
- My Orders (`src/pages/CustomerOrders.jsx`) provides browser-local guest history and filters. Saved order details show current status and a shared timeline (`src/components/OrderJourney.jsx`).
- Checkout progress, actionable cart feedback, a session-scoped form draft, and explicit change acknowledgement make the next action clear.
- Product forms detect concurrent changes so stale stock cannot overwrite purchased inventory.
- Search/filter/sort updates merge the latest browser URL, preventing rapid changes from dropping previous filters.

See `SYSTEM-FLOW.md` for the analysis and diagrams, `TEST-LOG.md` for verification, and `screenshots/` for evidence at all three required widths.
