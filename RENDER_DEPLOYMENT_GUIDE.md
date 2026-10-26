# SAS Backend Deployment Guide for Render

This guide walks you through deploying the **SAS (Salon and Spa Management System) Backend** to [Render](https://render.com).

---

## 📋 What Has Been Prepared in the Codebase

1. **Cloud Database Support (`backend/config/db.js`)**:
   - Added support for cloud MySQL providers requiring SSL (`DB_SSL=true`).
   - Added support for full connection strings (`DATABASE_URL`).
   - Retained 100% local development compatibility.

2. **Render Configuration (`render.yaml`)**:
   - Blueprint configuration defining build commands, start commands, health checks (`/api/health`), and required environment variables.

3. **Root Fallback (`package.json`)**:
   - Added a root `package.json` so that Render installs and starts the backend correctly regardless of whether the `Root Directory` is set to `backend` or left at repo root.

4. **Updated Environment Template (`backend/.env.example`)**:
   - Documented all production environment variables needed on Render.

---

## 🗄️ Step 1: Set Up a Cloud MySQL Database

> **Note:** Render natively offers managed PostgreSQL, but **not MySQL**. Since the SAS backend uses MySQL (`mysql2`), you need a free cloud MySQL instance to store your data.

### Recommended Free MySQL Providers:
- **[Aiven for MySQL](https://aiven.io)**: Free MySQL database (reliable, free tier, includes SSL).
- **[TiDB Cloud](https://tidbcloud.com)**: Free Serverless MySQL-compatible cluster (5 GB free storage).
- **[Clever Cloud](https://www.clever-cloud.com)**: Free 10 MB MySQL add-on for testing.

### After Creating Your Cloud Database:
1. Obtain the **Host**, **Port**, **User**, **Password**, and **Database Name** from your cloud provider dashboard.
2. Open **SQLyog** (or MySQL Workbench / CLI) and connect to your cloud database.
3. Import the backup file located at:
   `sas_db_backup.sql`
   *(This creates all tables: users, roles, services, bookings, invoices, payments, and populates seed data).*

---

## 🚀 Step 2: Push Your Code to GitHub

Open a terminal in the `SAS_Server` directory and run:

```bash
git add .
git commit -m "Configure backend for Render deployment with cloud MySQL and SSL support"
git push origin main
```

---

## 🌐 Step 3: Deploy on Render

1. Go to **[dashboard.render.com](https://dashboard.render.com/)** and sign in with GitHub.
2. Click **New +** > **Web Service**.
3. Select **Build and deploy from a Git repository**, click **Next**, and choose your repository:
   - `DanicaCardana/SAS_Server`
4. Configure the service settings:
   - **Name**: `sas-backend` (or your preferred name)
   - **Region**: `Singapore` (closest to Philippines / Asia)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

5. Expand **Advanced** > **Environment Variables** and add the following keys:

| Key | Example Value | Description |
|---|---|---|
| `NODE_ENV` | `production` | Enables production mode |
| `PORT` | `5000` | Render sets this automatically, but safe to specify |
| `JWT_SECRET` | `sas_jwt_secret_2026_secure_key` | Secret key for JWT authentication |
| `JWT_EXPIRES_IN` | `7d` | Token expiration period |
| `DB_HOST` | `mysql-xxxx.aivencloud.com` | Hostname of your cloud MySQL instance |
| `DB_PORT` | `3306` (or provider's port) | Port of your cloud MySQL instance |
| `DB_USER` | `avnadmin` | MySQL username |
| `DB_PASSWORD` | `your_cloud_db_password` | MySQL password |
| `DB_NAME` | `sas_db` (or `defaultdb`) | Target database name |
| `DB_SSL` | `true` | Enables secure SSL connection to cloud DB |

6. Click **Create Web Service**.
7. Render will install dependencies and start your server. Look for:
   ```
   [Database] Successfully connected to MySQL database: ...
   [SAS Backend Server] Listening on http://localhost:5000
   ```
8. Once deployed, Render will provide a public URL like:
   `https://sas-backend-xxxx.onrender.com`

9. Test the health check by opening:
   `https://sas-backend-xxxx.onrender.com/api/health`

---

## 🔗 Step 4: Connect Frontend to Deployed Backend

Once your backend is live on Render:
1. In your frontend repository (`SAS/frontend`), create or update `.env.production`:
   ```env
   VITE_API_BASE_URL=https://sas-backend-xxxx.onrender.com/api
   ```
2. When deploying your frontend (e.g. to Vercel, Netlify, or Render Static Site), set the environment variable:
   - `VITE_API_BASE_URL` = `https://sas-backend-xxxx.onrender.com/api`
