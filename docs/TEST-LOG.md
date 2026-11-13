# Acceptance test log

Verified on **13 November 2026** using Node.js 24 and Playwright Chromium. Every browser test uses an isolated profile with fictional data. The application's normal browser storage is unaffected.

Final commands and results:

- `npm.cmd test` — **Pass: 29 tests**.
- `npm.cmd run test:e2e` — **Pass: 19 tests**, including three complete responsive route checks; 2.3 minutes for the final run.
- `npx.cmd --no-install playwright test shopping --grep 'search, category' --repeat-each 5` — **Pass: 5 consecutive runs** after fixing rapid filter updates.
- `npm.cmd run build` — **Pass**, 64 modules transformed.
- Local storefront HTTP readiness check — **Pass: HTTP 200**.
- `npm.cmd run demo:record` — **Pass**: all 18 walkthrough chapters completed. Media inspection verifies a **3 minute 36 second**, 1280 × 800 WebM recording; checkout/admin frames were visually reviewed. Captions are included; voice narration is not.

## PDF page 6 acceptance checks

| ID | Result | Check and evidence |
| --- | --- | --- |
| 01 | Pass | Combined case-insensitive name search, category and both price sorts; no-match state; inactive detail links blocked. Domain tests and browser browsing test. Rapid updates preserve the previous filters. |
| 02 | Pass | Repeated products merge, quantities and selection survive refresh, and integer-centavo arithmetic returns exactly **PHP 325.50** for 2 × 120.00 + 85.50. Domain and browser cart checks. |
| 03 | Pass | Empty/no-selection checkout, blank name/address/contact, malformed email/payment, zero/fractional/negative/excessive quantities are blocked. Keyboard typing from 5 to 12 keeps both digits and focus. Invalid drafts stay blocked even when an earlier quantity save finishes. |
| 04 | Pass | Inactive and out-of-stock products cannot be ordered. Price/stock changes from another admin tab are detected at submission; updated summary requires acknowledgement. Unavailable selected items can be deselected to purchase the others. |
| 05 | Pass | Successful order shows saved Pending confirmation, appears in admin with matching total/items, deducts stock and removes purchased cart lines. An injected LocalStorage write failure preserves the complete prior document and form; saving disables submission. |
| 06 | Pass | Category/product CRUD appears on the storefront after navigation/refresh. Duplicate categories and deletion of assigned categories are blocked. Referenced products offer deactivation instead of deletion. Eligible deletion requires confirmation. |
| 07 | Pass | Only each next status saves. Skipped/repeated/backward/final transitions fail. Pending and Confirmed cancellations restore stock once, including after a new store instance/refresh. Failed cancellation writes preserve the previous state. Customer and admin show the same saved status. |
| 08 | Pass | All product/order counts include inactive/cancelled records; unique normalized emails determine customers; only Completed totals count toward sales. Repeat email uses latest name/contact, including tied timestamps. Browser completion shows **PHP 4,900.00** sales for 2 × 2,450.00. |
| 09 | Pass | Purchased names and prices remain unchanged after admin edits. Cart/products/categories/orders survive reload. Stale admin forms cannot overwrite inventory deducted by a recent purchase. |
| 10 | Pass | Customer and admin routes checked at **375, 768, 1280 px**, including mobile menus, forms, cart controls and order details. No horizontal page overflow or clipped form controls. Tables scroll inside their own regions. No console/page errors during responsive route checks. **42 screenshots** saved and representative layouts visually inspected. |

## Refined shopping flow

| Check | Result | Evidence |
| --- | --- | --- |
| Selected-item checkout | Pass | Only selected lines are charged and removed; unselected items and their stock remain unchanged. Selection survives refresh. |
| Buy Now | Pass | Independent product/quantity checkout works with an empty or populated cart and leaves saved cart lines untouched. Edit items preserves the selected quantity, including after refresh. Invalid direct selections are blocked. |
| Checkout editing and recovery | Pass | Delivery/payment draft survives a trip back to edit items. Save failures preserve form and cart. Successful purchase clears the draft. |
| My Orders and current details | Pass | Purchases remain accessible through status filters; customer and admin progress use the same saved history. Revisited Completed/Cancelled orders do not show a new-order success message. |
| Product navigation | Pass | Quantity resets on related-product navigation; a previous high quantity does not disable a different low-stock product. |
| Concurrent inventory edits | Pass | Another-tab price/stock changes trigger review or conflict recovery instead of silently overwriting data. |
| Queued quantity updates | Pass | The field remains editable while storage writes wait. Checkout stays disabled until all pending saves finish. A failed older write cannot replace or invalidate the latest successful edit. |
| Malformed display data | Pass | Invalid category/product/order image and display fields are rejected before rendering. Recovery preserves the original stored document until reset is explicitly confirmed. Older records with missing optional fields still load. |

## Visual evidence and test boundaries

See [screenshots](screenshots/README.md) and [system flow](SYSTEM-FLOW.md). Responsive fixtures include Completed and Pending orders, two unique customers, a partially stocked catalog, and a populated cart. Tests are in `tests/store.test.js`, `tests/e2e/shopping.spec.js`, and `tests/e2e/responsive.spec.js`.

The verification caught and fixed rapid filter-state loss, off-screen table accessibility labels causing page overflow, a hidden mobile login heading, and empty error banners. The follow-up audit also exposed dropped keyboard quantity digits, lost Buy Now quantities on Edit items, and a blank page from malformed saved display data. New regression tests cover all three, and the final run above includes the fixes.

| Additional check | Result | Note |
| --- | --- | --- |
| Firefox / Safari | Not tested | Verification was performed in Chromium. |
| Physical phones / assistive technology audit | Not tested | Responsive emulation, semantic controls, labels and keyboard focus are covered; no separate device or screen-reader certification was performed. |
| Real payments, delivery, production access control | Not tested | Outside the PDF's demo scope; these services do not exist in this application. |
| GitHub reviewer access / hosted deployment | Not tested | Local Git is initialized on main. Publication and reviewer access require the destination repository URL; no hosting environment is configured. See PUBLISHING.md. |
