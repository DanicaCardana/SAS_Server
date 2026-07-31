-- ===================================================
-- Salon and Spa Management System (SAS)
-- Database Seed Data Script (`sas_db`)
-- ===================================================

USE `sas_db`;

-- 1. Insert Roles
INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'ADMIN', 'System administrator / Salon owner with full privileges'),
(2, 'CASHIER', 'Cashier with permissions for profiling, payments, and billing'),
(3, 'CLIENT', 'Registered salon/spa client');

-- 2. Insert Users
-- Passwords below are bcrypt hashes for "password123" ($2b$10$e.g.)
INSERT INTO `users` (`id`, `role_id`, `first_name`, `last_name`, `email`, `phone`, `password_hash`, `status`) VALUES
(1, 1, 'Owner', 'Admin', 'admin@sas.com', '09171234567', '$2b$10$r8Q8PzYmX7Q3kG.0G0.1g.d.y4tJ2R8Z9A0B1C2D3E4F5G6H7I8J9', 'APPROVED'),
(2, 2, 'Maria', 'Cashier', 'cashier@sas.com', '09181234567', '$2b$10$r8Q8PzYmX7Q3kG.0G0.1g.d.y4tJ2R8Z9A0B1C2D3E4F5G6H7I8J9', 'APPROVED'),
(3, 3, 'Jane', 'Doe', 'jane.doe@example.com', '09191234567', '$2b$10$r8Q8PzYmX7Q3kG.0G0.1g.d.y4tJ2R8Z9A0B1C2D3E4F5G6H7I8J9', 'APPROVED'),
(4, 3, 'John', 'Smith', 'john.smith@example.com', '09201234567', '$2b$10$r8Q8PzYmX7Q3kG.0G0.1g.d.y4tJ2R8Z9A0B1C2D3E4F5G6H7I8J9', 'PENDING');

-- 3. Insert Service Categories
INSERT INTO `service_categories` (`id`, `name`, `description`) VALUES
(1, 'Massage Services', 'Relaxing therapeutic body massages'),
(2, 'Nail Art & Care', 'Creative nail design and care treatments'),
(3, 'Pedicure', 'Comprehensive foot and toe care'),
(4, 'Manicure', 'Hand and fingernail care'),
(5, 'Hair Services', 'Hair cutting, styling, coloring, and treatments');

-- 4. Insert Services
INSERT INTO `services` (`id`, `category_id`, `name`, `description`, `price`, `duration_minutes`, `status`) VALUES
(1, 1, 'Swedish Massage', 'Full body relaxation massage using light to medium pressure', 850.00, 60, 'AVAILABLE'),
(2, 1, 'Deep Tissue Massage', 'Targets deep muscle layers and connective tissue to relieve chronic tension', 1100.00, 60, 'AVAILABLE'),
(3, 2, 'Gel Nail Polish', 'Long-lasting gel nail polish application with UV curing', 450.00, 45, 'AVAILABLE'),
(4, 2, 'Custom Nail Art Design', 'Hand-painted nail design per nail', 250.00, 30, 'AVAILABLE'),
(5, 3, 'Classic Pedicure', 'Foot soak, nail shaping, cuticle care, and polish', 400.00, 45, 'AVAILABLE'),
(6, 3, 'Spa Pedicure with Foot Scrub', 'Classic pedicure enhanced with organic foot scrub and massage', 650.00, 60, 'AVAILABLE'),
(7, 4, 'Classic Manicure', 'Nail shaping, cuticle care, hand massage, and polish', 350.00, 30, 'AVAILABLE'),
(8, 5, 'Haircut & Blowdry', 'Precision haircut tailored to client style including blowdry', 500.00, 45, 'AVAILABLE'),
(9, 5, 'Hair Rebonding & Treatment', 'Hair straightening treatment with nourishing hair spa mask', 2500.00, 180, 'AVAILABLE');

-- 5. Insert Sample Bookings
INSERT INTO `bookings` (`id`, `client_id`, `service_id`, `type`, `booking_date`, `time_slot`, `status`, `notes`) VALUES
(1, 3, 1, 'WALK_IN', CURRENT_DATE(), '10:00:00', 'COMPLETED', 'Walk-in client for Swedish Massage'),
(2, 3, 8, 'ONLINE_BOOKING', DATE_ADD(CURRENT_DATE(), INTERVAL 1 DAY), '14:00:00', 'CONFIRMED', 'Online reservation for haircut');

-- 6. Insert Sample Invoices
INSERT INTO `invoices` (`id`, `invoice_number`, `booking_id`, `client_id`, `cashier_id`, `subtotal`, `tax`, `discount`, `total_amount`, `status`) VALUES
(1, 'INV-20260731-0001', 1, 3, 2, 850.00, 0.00, 0.00, 850.00, 'PAID');

-- 7. Insert Sample Payments
INSERT INTO `payments` (`id`, `invoice_id`, `payment_method`, `amount_paid`, `change_amount`, `transaction_ref`, `paid_at`) VALUES
(1, 1, 'CASH', 1000.00, 150.00, 'CASH-REF-001', CURRENT_TIMESTAMP());
