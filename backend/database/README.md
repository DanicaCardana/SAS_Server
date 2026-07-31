# Database Setup Guide (`sas_db`)

This directory contains the SQL DDL schema and sample data scripts for the **Salon and Spa Management System**.

## Files
- [schema.sql](file:///c:/Users/User/Documents/SAS_Server/database/schema.sql) — Creates the database `sas_db` and all required tables (`roles`, `users`, `service_categories`, `services`, `bookings`, `invoices`, `payments`).
- [seed.sql](file:///c:/Users/User/Documents/SAS_Server/database/seed.sql) — Populates sample roles, default admin/cashier/client accounts, service categories, services, and sample transactions.

---

## 🛠️ How to Import into SQLyog Ultimate v9.62

1. Open **SQLyog Ultimate v9.62**.
2. Connect to your local MySQL instance:
   - **Host Address**: `localhost`
   - **Port**: `3306`
   - **Username**: `root` (or `sas_db`)
   - **Password**: `sas_db`
3. Click `Tools` > `Restore Database / Execute Batch script...` (or press `Ctrl+Shift+Q`).
4. Browse to and select [schema.sql](file:///c:/Users/User/Documents/SAS_Server/database/schema.sql). Click **Execute**.
5. Repeat for [seed.sql](file:///c:/Users/User/Documents/SAS_Server/database/seed.sql) to load initial sample data.
6. Refresh the Object Browser panel to confirm `sas_db` tables are present.

---

## 💻 Alternative: How to Import via MySQL Command Line

```bash
# Connect to MySQL and create database & tables
mysql -u root -p < database/schema.sql

# Seed initial test data
mysql -u root -p sas_db < database/seed.sql
```

---

## 🔑 Initial Accounts (Seed Data)

| Role | Email | Default Password | Status |
|---|---|---|---|
| **Admin** | `admin@sas.com` | `password123` | `APPROVED` |
| **Cashier** | `cashier@sas.com` | `password123` | `APPROVED` |
| **Client** | `jane.doe@example.com` | `password123` | `APPROVED` |
| **Client (Pending)** | `john.smith@example.com` | `password123` | `PENDING` |
