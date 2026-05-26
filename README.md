# Scala Admin Control Portal

Welcome to the admin control panel for **Scala Solutions**. This portal is designed to manage client accounts, generate professional invoices, view interactive invoice previews, and handle support tickets.

---

## ⚡ What We Used (Tech Stack)

* **Framework**: **Next.js 15 (React 19)** using the App Router for smooth, modern web performance.
* **Database & ORM**: **Drizzle ORM** with **PostgreSQL** (integrated with a live Neon serverless database).
* **Styling**: **Tailwind CSS** with custom dark and light modes.
* **Icons**: **Lucide React** for clean and consistent visual primitives.

---

## 🚀 What Has Been Achieved

### 1. Client CRM Directory (`/admin/clients`)
* Track active and pending client accounts.
* Add new clients using a premium slide-over drawer form.
* Quick-search client databases by name or status tabs.

### 2. Billing & Invoices Hub (`/admin/invoices`)
* **Generate Invoices**: Create new client invoices with dynamic line items, quantity/rate calculators, and custom discounts.
* **Perfect Alignment Actions**: Compact circular action buttons (`Preview`, `Mark Paid`, `Delete`) aligned in a grid that stays vertically consistent row-by-row.
* **Sleek Tooltips**: Micro-tooltips fade in above each button on hover and are absolutely isolated, ensuring no layout shifting.
* **A4 Print Sheet Preview**: Click the `Eye` button to preview full, professional 4-page invoice documents:
  - **Auto-Scale viewport**: Fits pages seamlessly on any screen height without awkward scrollbars.
  - **Default Zoom**: Set to a crisp **200% default zoom level** for high fidelity viewing.
  - **Sticky Navigator**: A floating page-navigator sticks at the bottom-right of the scroll area to switch between Billing, Cover, T&C I, and T&C II pages instantly.
  - **Print Layout**: Completely styled print overlay (`Ctrl + P`) that hides all admin sidebars, menus, and headers automatically.

### 3. Multi-Level Delete Protection
* **Standard Invoices**: Prompts a clean confirmation dialog before deleting draft or unpaid invoices.
* **Paid Invoices**: Enforces strict financial security by prompting an audit warning and requiring the admin to type **`CONFIRM`** (case-sensitive) to enable deletion.

### 4. Support Tickets Hub (`/admin/tickets`)
* Chat-style support message log.
* Message clients directly inside active threads with a real-time message append.

---

## 💻 Guide to Run & Use the Admin Portal

### 1. Install Dependencies
Open your terminal in the project root folder and run:
```bash
npm install
```

### 2. Set Up Environment Variables (Optional)
Create an environment file inside the `apps/admin/` folder:
```bash
cp apps/admin/.env.example apps/admin/.env.local
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
