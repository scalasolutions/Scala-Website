# Vercel Environment Variables Guide - Scala Solutions

This guide outlines the environment variables required to deploy and run the **Scala Solutions** Admin & Client Portal monorepo (`apps/web`) on Vercel.

---

## 🔑 Required Environment Variables

Add these key-value pairs in the **Environment Variables** section of your Vercel Project Settings before clicking **Deploy**.

### 1. `DATABASE_URL` (Required for persistent production)
* **Description:** The PostgreSQL connection string used by Drizzle ORM to connect to your live database.
* **Recommended Service:** [Neon Postgres](https://neon.tech) (Serverless PostgreSQL).
* **Format Example:**
  ```env
  DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-royal-butterfly-ao1z6mep.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require"
  ```
* **Behavior if missing:** If left blank, the application will run in **In-Memory Mock Fallback Mode** with mock clients, invoices, and ticket logs. **Any data changes will reset when the serverless function spins down or restarts.**

### 2. `AUTH_SECRET` (Required for NextAuth v5)
* **Description:** A secure, cryptographically random key used by NextAuth / Auth.js to sign and encrypt cookies and session tokens. NextAuth will throw a runtime error in production if this is missing.
* **How to generate:** Open your terminal and run:
  ```bash
  openssl rand -base64 32
  ```
* **Format Example:**
  ```env
  AUTH_SECRET="your-generated-base64-string-here"
  ```
* **Note:** Ensure it is named exactly `AUTH_SECRET` (not `NEXTAUTH_SECRET` which was used in older NextAuth v4).

### 3. `ADMIN_PASSWORD` (Highly Recommended)
* **Description:** The master passkey used alongside the whitelisted admin email (`scalasolutions.dev@gmail.com`) to log into the main Admin Dashboard at `/login`.
* **Default Value:** If not specified, it falls back to `"scala-admin-2026"`.
* **Format Example:**
  ```env
  ADMIN_PASSWORD="your-secure-custom-admin-password"
  ```

---

## ⚡ Deployment Checklist

1. **Root Directory:** Ensure `apps/web` is selected as the Root Directory in Vercel.
2. **Framework Preset:** `Next.js` (Vercel will auto-detect).
3. **Database Schema Sync:** After Vercel successfully builds and deploys your site, sync the database schema to your live database by running the following command locally in your terminal:
   ```bash
   npm run db:push --workspace=apps/web
   ```
