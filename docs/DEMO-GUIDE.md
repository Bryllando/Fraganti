# 3–5 minute assessment walkthrough

Use fictional customer details. Run the app, use one browser profile and the same origin for all routes, and reset demo data from the admin overview if you want a clean starting point.

An [automated captioned recording](demo/oud-aura-walkthrough.webm) is included. It shows the actual app with an isolated fictional order, completion through the admin workflow, and cancellation of another order. There is no voice narration. Chapter timings are saved in `demo/chapters.json`. Regenerate it with `npm.cmd run demo:record` while the development server is running; `-- --quick` checks the recording script without producing a submission-length video.

| Time | Demonstration |
| --- | --- |
| 0:00–0:30 | Home, brand, categories, demo disclosure; open Shop |
| 0:30–1:00 | Combine search, category, both price sorts; show no-match and Out of Stock states |
| 1:00–1:40 | Product quantity, Add to Cart, merged cart and refresh; select items; briefly explain Buy Now |
| 1:40–2:20 | Guest checkout, required-field errors, fictional details, payment selection, item summary and Place Order |
| 2:20–2:50 | Saved Pending order, stock deduction, purchased cart lines removed; My Orders/current status |
| 2:50–3:30 | Demo admin login; matching order and snapshots; advance through each allowed status to Completed |
| 3:30–4:00 | Dashboard completed sales and customer summary; product edit reflected on storefront |
| 4:00–4:30 | Second Pending order cancellation and restored stock; reference/deletion safeguards; mobile layout |
| 4:30–4:50 | Explain single browser-local document, integer centavos, snapshots, tests, limitations and AI assistance |

Record this walkthrough with a screen recorder if a narrated submission is required. Keep customer and admin links, repository access, README, screenshots, and test log together. Follow the deadline in your assessment email. No message or submission is sent by the application.
