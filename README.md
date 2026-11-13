# OUD & AURA

A perfume shop demo for the CubeTech internship assessment. Customers can browse perfumes and place guest orders. The admin dashboard manages products, categories, and orders.

## Technologies

React, Vite, JavaScript (JSX), Bootstrap 5, Bootstrap Icons, React Router, and CSS.

## Install and run

Install Node.js 22.12 or newer, then open a terminal in the project folder:

```bash
npm install
npm run dev
```

Open the Local URL shown in the terminal, usually http://127.0.0.1:5173/.

Keep the terminal open while using the app. Press Ctrl+C to stop it. If PowerShell blocks `npm`, use `npm.cmd` instead.

To build and preview:

```bash
npm run build
npm run preview
```

## Environment

No `.env` file, API keys, or environment variables are required.

## Demo admin login

- Page: `/admin/login`
- Email: `admin@oudandaura.demo`
- Password: `AuraDemo2026!`

Click **Login** at the top of the shop, then **Use demo credentials** on the login page. Customers can continue as guests and do not need an account to check out.

## Storage

LocalStorage saves products, categories, cart items, and orders. SessionStorage keeps the demo admin login and checkout draft.

Use the same browser, profile, and site URL for the shop and admin. Data is not shared across devices, and clearing browser data removes it. The data is editable and the login is simulated, so this setup is for demonstration only. Payments are also simulated.

## Sample data and reset

The app starts with 12 sample perfumes in 3 categories, including an inactive product and an out-of-stock product.

To start again, open **Admin → Overview → Reset demo data** and confirm. This restores the sample catalog and clears saved orders and cart items. Use fictional customer details for demo orders.

## Customer routes

| Route | Page |
| --- | --- |
| `/` | Home |
| `/shop` | All perfumes, search, filters, and sorting |
| `/collections` | Categories |
| `/our-story` | About the store |
| `/product/:id` | Product details |
| `/cart` | Shopping cart |
| `/checkout` | Guest checkout |
| `/orders` | My Orders |
| `/order/:id` | Order details |

## Admin routes

| Route | Page |
| --- | --- |
| `/admin/login` | Login |
| `/admin` | Overview |
| `/admin/products` | Products |
| `/admin/products/new` | Add product |
| `/admin/products/:id/edit` | Edit product |
| `/admin/categories` | Categories |
| `/admin/orders` | Orders |
| `/admin/orders/:id` | Order details and status |
| `/admin/customers` | Customer summary |
