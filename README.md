# OUD & AURA

A fictional Arabian fragrance boutique built for the CubeTech Innovations Web Development Internship Assessment. It connects a guest shopping experience to a demo admin dashboard using one shared browser data store.

## Run locally

Use Node.js 24 (the version used for verification) and npm. In PowerShell:

```powershell
cd C:\Users\Lenovo\Desktop\Fragranti
npm.cmd ci
npm.cmd run dev
```

Open the exact Local URL printed by Vite, normally **http://127.0.0.1:5173/**. Keep the terminal open. Press Ctrl+C to stop it. Dependencies are already installed in the prepared workspace; `npm.cmd ci` is needed on a fresh checkout. There are no required environment variables, API keys, database migrations, or payment credentials.

Use the **same hostname and port** for the shop and admin. `localhost` and `127.0.0.1`, different ports, different browser profiles, and private browsing each have separate browser storage.

## Demo admin

- Route: `/admin/login`
- Email: `admin@oudandaura.demo`
- Password: `AuraDemo2026!`
- The login page has a **Use demo credentials** button.
- This is simulated authentication stored in SessionStorage. It provides no production security. Use fictional customer details only.

## Shopping flow

1. Browse **Shop**, combine product-name search with category and price sorting, and open a product.
2. Choose a whole-number quantity. **Add to Cart** lets you keep shopping and provides a **View cart** action. Adding the same product merges quantities.
3. In **Cart**, select the items to buy, adjust quantities, and review the subtotal/total. Unselected products stay in the cart. Choosing every item follows the PDF's standard cart-clearing flow.
4. **Buy Now** on a product opens checkout for that product and quantity directly. It does not change the existing cart.
5. Complete guest delivery details, choose a simulated payment method, and review all items/prices/totals. Form details survive a refresh or a trip back to edit items during the browser session. Buy Now keeps its selected quantity when you return to edit the product, including after refresh.
6. **Place Order** rechecks current products, quantities, prices, stock, and selection. Changed details require reviewing the updated summary and checking the acknowledgement before retrying.
7. A successful save creates a Pending order, deducts inventory, and removes only the purchased cart lines. Failed saves preserve the cart and stock. Buy Now leaves the existing cart unchanged.
8. **My Orders** shows saved purchases and their current status. Reopening an order displays its current state and history. Pending or Confirmed orders can be cancelled, restoring stock once.

Admin follows **Pending → Confirmed → Preparing → Shipped → Completed**. Only Pending and Confirmed can become Cancelled. Completed and Cancelled are final.

## Routes

| Customer | Purpose |
| --- | --- |
| `/` | Home and featured/new fragrances |
| `/shop` | Search, category filter, and price sorting |
| `/collections` | Fragrance families |
| `/our-story` | Brand story and demo disclosure |
| `/product/:id` | Details, quantity, Add to Cart, Buy Now |
| `/cart` | Persistent selected-item cart |
| `/checkout` | Selected cart checkout |
| `/checkout?buyNow=:id&quantity=2` | Direct product checkout |
| `/order/:id` | Saved order details and status |
| `/orders` | Guest order history in this browser |

| Admin | Purpose |
| --- | --- |
| `/admin/login` | Demo login |
| `/admin` | Six assessment metrics and reset |
| `/admin/products` | Search/filter, activate/deactivate, protected deletion |
| `/admin/products/new` | Add fragrance |
| `/admin/products/:id/edit` | Edit details, price, stock, and status |
| `/admin/categories` | Category CRUD with uniqueness/reference checks |
| `/admin/orders` | Orders newest first |
| `/admin/orders/:id` | Saved order, snapshots, history, next status/cancellation |
| `/admin/customers` | Read-only customer summary by normalized email |

## Stack and organization

React, Vite, JavaScript/JSX, React Router, Bootstrap 5, Bootstrap Icons, and custom CSS tokens. Inter and Playfair Display fonts are bundled. No backend or additional UI/state library is needed.

```text
src/components/       Shared cards, controls, order summaries and timelines
src/layouts/          Storefront and protected demo admin layouts
src/pages/            Customer pages
src/pages/admin/      Management pages
src/hooks/            Shared React store subscription
src/services/         Persistent domain rules and simulated authentication
src/data/             Twelve fictional sample perfumes and three categories
src/utils/            Integer money calculations and formatting
src/styles/           Brand tokens and responsive styles
tests/                Domain and browser acceptance tests
docs/                 Assessment analysis, flow, evidence and test log
```

## Data and storage limitations

LocalStorage key **`oud-aura:store:v1`** stores one versioned document containing products, categories, cart lines, and orders. Prices are integer centavos. Each order stores independent item name, brand, image, price, quantity, and customer snapshots; later catalog edits cannot rewrite them. Customers and sales metrics are calculated from orders rather than stored separately. Sales include Completed orders only.

Order placement and cancellation each update the entire shared document with a single `setItem` call. A failed write leaves the previous document intact. Web Locks serialize writes between tabs where supported. Product edits detect stale forms so an older stock value cannot overwrite a recent purchase; reload the latest product before saving again.

This is browser-local, user-editable storage. It is not a server, cross-device store, secure order system, or production login. All guest orders in the same browser profile are visible in My Orders. Browser storage quotas, private sessions, and clearing site data affect persistence. Cross-tab guarantees require Web Locks; use a modern browser at the local HTTP URL. No real payment is processed and no delivery/email is sent.

The checkout draft uses SessionStorage key `oud-aura:checkout-draft`; it is cleared after a successful purchase. It is a convenience, not an account or saved address service.

## Seed and reset

The first visit uses the bundled twelve-product seed. The first successful mutation persists it. It includes one inactive product (Oud Reserve) and one active product with zero stock (Turathi Blue Horizon). Existing compatible v1 data is preserved; old cart lines without a selection flag default to selected.

In **Admin → Overview → Reset demo data**, confirm the dialog to restore products/categories and remove all demo orders/cart contents. Reset affects only this application's LocalStorage document, and keeps the demo login. A corrupted document displays a recovery screen and preserves the unreadable data until you explicitly reset it.

## Verification

```powershell
npm.cmd test
npm.cmd run build
npx.cmd --no-install playwright install chromium
npm.cmd run test:e2e
```

Domain tests use Node's built-in test runner. Playwright tests use an isolated browser profile and fictional data, reusing or starting the development server on port 5173. They do not reset your normal browser data. Responsive tests inspect the customer and admin routes at **375, 768, and 1280 px**, exercise mobile navigation, check console errors/contained overflow, and save screenshots to `docs/screenshots/`.

See [the test log](docs/TEST-LOG.md), [system flow analysis](docs/SYSTEM-FLOW.md), and [PDF requirements map](docs/REQUIREMENTS.md). A successful build is separate from browser workflow verification.

For a production build preview, run `npm.cmd run build` then `npm.cmd run preview`. The preview URL uses a different port and therefore separate demo data. Static hosting needs an SPA fallback from customer/admin paths to `index.html`.

The [recorded walkthrough](docs/demo/oud-aura-walkthrough.webm) demonstrates the connected purchase/admin flow with explanatory captions. It is an automated screen recording without narration, using fictional data in a separate profile. To regenerate it with the development server running: `npm.cmd run demo:record`. The chapter list is in `docs/demo/chapters.json`.

## Assets and AI disclosure

OpenAI Codex assisted with assessment analysis, design, implementation, documentation, and tests. OpenAI's built-in ImageGen generated the original editorial image at `public/images/hero.png` and twelve-bottle atlas at `public/images/catalog.png`. The prompts requested neutral studio Arabian-inspired bottles and twelve distinct unbranded packshots; imagery is illustrative and does not show actual branded packaging. Catalog names, prices, formulations, stock, and contact information are fictional samples. The supplied Dubai Shop Baliuag reference informed product types only; no listing photos, prices, or stock were copied. Fonts come from Fontsource; icons and grid/utilities come from Bootstrap. No commercial website template was used.

## Submission status

The source, local demo, documentation, tests, 42 screenshots, and a captioned 3–5 minute walkthrough are prepared here. A local Git repository is initialized on `main`. GitHub publication and reviewer access still require the destination repository URL; no remote URL has been invented. See [publication steps](docs/PUBLISHING.md). No assessment email is sent automatically. If your reviewer requests personal narration, record it using [the demo guide](docs/DEMO-GUIDE.md). Review and understand the code before submitting it.
