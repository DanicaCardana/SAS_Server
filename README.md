# Salon and Spa Management System (SAS) - Backend Server

This directory contains the Node.js / Express.js backend server and database setup scripts for the **Salon and Spa Management System**.

---

## 📁 Directory Structure

```
SAS_Server/
└── backend/
    ├── config/          # MySQL database connection pool (db.js)
    ├── controllers/     # API controllers (auth, users, services, bookings, invoices, payments, reports)
    ├── database/        # MySQL DDL schema & seed scripts (schema.sql, seed.sql, README.md)
    ├── middleware/      # JWT authentication & Role-Based Access Control (RBAC)
    ├── routes/          # Express API endpoints
    ├── .env             # Environment variables
    ├── package.json     # Node.js dependencies
    └── server.js        # Main Express server application
```

---

## ⚙️ Prerequisites

- **Node.js** (v16.0 or higher)
- **MySQL Server** (v5.5, 5.6, 5.7, 8.0, or MariaDB)
- **SQLyog Ultimate** (v9.62 or any MySQL client)

---

## 🗄️ Database Setup (`sas_db`)

1. Open **SQLyog Ultimate v9.62** (or MySQL CLI / Workbench).
2. Connect to your local MySQL database server (`localhost:3306`).
3. Execute `backend/database/schema.sql` to create the `sas_db` database and required tables.
4. Execute `backend/database/seed.sql` to populate test accounts, service categories, sample services, and transactions.

### Initial Seed Accounts:
- **Admin**: `admin@sas.com` (Password: `password123`)
- **Cashier**: `cashier@sas.com` (Password: `password123`)
- **Client**: `jane.doe@example.com` (Password: `password123`)

---

## 💻 How to Run in Terminal

Open your terminal or command prompt and execute the following commands:

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Install dependencies (if not already installed)
npm install

# 3. Start the development backend server
npm run dev

# OR start using standard Node.js
node server.js
```

---

## 🌐 API Base Endpoints

- **Server URL**: `http://localhost:5000`
- **API Base Route**: `http://localhost:5000/api`
- **Health Check**: `http://localhost:5000/api/health`

| Module | Endpoint | Method | Role Access |
|---|---|---|---|
| **Auth** | `/api/auth/login` | `POST` | Public |
| **Auth** | `/api/auth/register` | `POST` | Public |
| **Users** | `/api/users` | `GET` | Admin |
| **Users** | `/api/users/:id/status` | `PUT` | Admin |
| **Services** | `/api/services` | `GET` | Public / All |
| **Services** | `/api/services` | `POST` | Admin |
| **Bookings** | `/api/bookings` | `POST` | Client / Cashier |
| **Invoices** | `/api/invoices` | `POST` | Cashier / Admin |
| **Payments** | `/api/payments` | `POST` | Cashier / Admin / Client |
| **Reports** | `/api/reports/overview` | `GET` | Admin / Cashier |
| **Reports** | `/api/reports/sales` | `GET` | Admin |
