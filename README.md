# Scala Admin Control Portal

Welcome to the admin control panel for **Scala Solutions**. This portal is designed to manage client accounts, generate professional invoices, view interactive invoice previews, and handle support tickets.

---

## ⚡ What We Used (Tech Stack)

* **Framework**: **Next.js 15 (React 19)** using the App Router for smooth, modern web performance.
* **Database & ORM**: **Drizzle ORM** with **PostgreSQL** (integrated with a live Neon serverless database).
* **Styling**: **Tailwind CSS** with custom dark and light modes.
* **Icons**: **Lucide React** for clean and consistent visual primitives.

---

## 🚀 What Has Been Achieved & Core Capabilities

This project has evolved into a comprehensive, enterprise-ready administration and customer portal monorepo, featuring role-based segregation, strict tenancy-isolation, and dynamic layout generation.

### 1. Covert Client Portal & Secure Routing Gate (`/login` ➡️ `/portal`)
* **Stealth Administration Cover**: The main login gateway is fully rebranded as the **Scala Client Workspace**. External visitors see a standard portal for clients to check invoices and SLAs, completely obscuring internal administrative tools.
* **Intelligent Routing Dispatcher**: Entering the admin email (`scalasolutions.dev@gmail.com`) automatically routes to the Admin Dashboard, while entering client credentials redirects instantly to the custom **Client Portal**.
* **Zero-Flash Theme Sync (FART Free)**: Integrated a lightweight inline script in the layout head to check `localStorage` and toggle the root `dark` class before the first paint, preventing flashing. Includes a sleek floating theme selector.

### 2. Client CRM Directory (`/admin/clients`)
* **Live CRM Tracker**: Manage static and dynamic hosting SLA lifecycles, active/pending metrics, and subscription timers.
* **Premium slide-drawer forms**: Add or update client directories using sleek transition drawers.
* **Secure Deletion Cascades**: Supports clean cascading deletion of clients, automatically purging all historical invoices, support tickets, and chat threads.
* **Double-Verification Warning**: Client account purging requires co-founders to enter the **Client Name** AND the uppercase confirmation token **`CONFIRM`** in separate fields.

### 3. Dynamic Custom Invoices Engine (`/admin/invoices`)
* **Interactive Inclusion Checklist**: Choose exactly which pages to include or exclude (e.g., Cover, Billing, Terms & Conditions, specialized SLAs) on a per-invoice basis via simple modal checkboxes.
* **Stepped 10% Zoom Controllers**: Viewport-anchored scaling with clean, round 10% zooms (e.g. 90% ➡️ 100% ➡️ 110%).
* **Flexible Pages Composition & Navigator**: Trailing page navigation, titles, and layout margins adjust programmatically. Page number footers compute and increment sequentially (e.g. page "2 of 3") regardless of included selections.
* **A4 Print Sheet Preview**: Click the `Eye` button to preview invoice documents in full size, optimized for `Ctrl + P` to automatically hide menus, sidebars, and top navigation.

### 4. Custom Page CRUD & Docs Editor (`/admin/invoices/presets`)
* **Google Docs-Style Rich Text Editor**: Create and format an arbitrary number of custom document pages (e.g. specialized SLAs, timeline agreements, milestones) directly inside the browser.
* **Right-Click Tab Management Context Menu**: Right-click page tabs to trigger glassmorphic dropdowns allowing instant **Rename** and **Delete** actions.

### 5. Interactive Client Hub Portal (`/portal`)
* **B2B Tenancy Isolation**: Secure client dashboard at `/portal` restricts client accounts to viewing strictly their own files, preventing cross-client document access.
* **SLA Billing Invoices**: Clients can browse billed invoice histories, see outstanding balances, and click to view and print their own invoices via `/portal/invoices/[id]`.
* **Technical Support Center**: Clients can create support tickets (specifying categories and urgency) and select any active ticket to converse in real-time with Scala developers directly inside an immersive chat thread!

### 6. Developer Support & Core Chat (`/admin/tickets`)
* **Unified Admin Ticketing Desk**: Chat-style support message log for admin staff to track customer requests.
* **Bidirectional Developer Messaging**: Send updates to client portals instantly with auto-scrolling log synchronization.

---

## 💻 Guide to Run & Use the Admin Portal

### 1. Install Dependencies
Open your terminal in the project root folder and run:
```bash
npm install
```

### 2. Set Up Environment Variables (Optional)
Create an environment file inside the `apps/web/` folder:
```bash
cp apps/web/.env.example apps/web/.env.local
```
*(If no `DATABASE_URL` is set, the portal will automatically launch in **in-memory Fallback Mode** with pre-seeded clients, billing logs, and ticket threads so you can test all features instantly!)*

### 3. Start the Development Server
Launch the local server:
```bash
npm run dev
```

### 4. Access the Dashboard
Open your browser and navigate to:
👉 **[http://localhost:3000/admin](http://localhost:3000/admin)**
*(It will automatically redirect to the admin panel dashboard home)*
