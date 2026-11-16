# Test log - OUD & AURA

Date: **16 November 2026**. App commit: `2e9cd91`. Evidence files were added after the run.

Automated checks ran on Windows with Node.js v24.14.0 and headless Chromium 158.0.8127.18. Browser tests and screenshots used isolated fictional data, preserving the working browser profile.

## Results

| Command | Result |
| --- | --- |
| `npm.cmd test` | Pass - 36 data tests, 0 failures |
| `npm.cmd run test:e2e` | Pass - 32 browser tests, 0 failures or skipped tests |
| `npm.cmd run build` | Pass - 71 modules transformed |
| Desktop/mobile capture checks | Pass - 45 compact PNGs, loaded images and labeled inputs, no page overflow or runtime errors |

## Assessment acceptance checks

| ID | Result | What was checked |
| --- | --- | --- |
| 01 | Pass | Search, category and both price sorts work together; no-match and invalid-product pages are handled. |
| 02 | Pass | Duplicate additions merge, the cart survives refresh, and 2 x PHP 120.00 + PHP 85.50 equals PHP 325.50. |
| 03 | Pass | Empty/invalid checkout fields and invalid, fractional or excessive quantities are rejected. |
| 04 | Pass | Inactive/zero-stock items cannot be ordered. Price or availability changes require review before saving. |
| 05 | Pass | A saved Pending order appears in admin with matching items/total; stock decreases and purchased cart items clear. Failed writes preserve the cart. |
| 06 | Pass | Admin product/category changes reach the shop after refresh. Referenced products and assigned categories cannot be deleted. |
| 07 | Pass | Only allowed status transitions save. Eligible cancellation restores stock once, including after reload; failed writes do not change stock. |
| 08 | Pass | Sales include Completed orders only. Customers group normalized emails and use the latest submitted contact details. |
| 09 | Pass | Saved order names, unit prices and images survive catalog edits and reload. Browser data persists for the chosen LocalStorage approach. |
| 10 | Pass | Customer/admin layouts pass at 375, 768 and 1280 px. All 45 replacement captures have loaded images, labeled form inputs and no page overflow or clipped controls outside scrollable tables. |

The capture purchase used two bottles at PHP 120.00 and one at PHP 85.50. The saved total and Completed sales were PHP 325.50. Stock changed from 18 to 16 and from 20 to 19. The order number was **OA-20261116-BDE228E6**. Original seed prices were not changed in the project.

## Run the checks again

Install dependencies with `npm.cmd install`, then run:

```powershell
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

If Chromium is missing, run `npx.cmd playwright install chromium`. The browser test configuration starts Vite on `127.0.0.1:5173` when needed.

## Evidence and limits

[Screenshot gallery](screenshots/README.md) - [Detailed browser results](screenshots/browser-results.json) - [System explanation](SYSTEM-EXPLANATION.md)

Layout checks include 375, 768 and 1280 px viewports. The replacement screenshots use 375 x 900 and 1280 x 900 px viewports. There are 17 desktop views and 28 mobile views, including 11 focused mobile detail shots. Narrow admin tables have their own horizontal scrolling region; no horizontal page scrolling was detected.

Not tested: physical phones, Firefox/WebKit, screen readers, complete keyboard traversal, deployed hosting, repository access and the demo video. Persistence means the same browser profile and origin; there is no backend/database to test. No applicant-performed manual run is claimed here.

Screenshot refinement: the previous long captures were replaced with native viewport images. Capture checks were rerun; the automated test/build results above are from the earlier run on unchanged application code.
