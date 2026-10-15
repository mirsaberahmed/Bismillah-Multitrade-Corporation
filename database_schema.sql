-- =====================================================================
-- BISMILLAH MULTITRADE CORPORATION - ENTERPRISE BUSINESS MANAGEMENT SYSTEM
-- Relational Database Schema (MySQL / MariaDB 8.0+)
-- Architecture: Multi-Tenant Data Isolation, RBAC & Biometric Security
-- =====================================================================

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS `user_sessions`;
DROP TABLE IF EXISTS `biometric_credentials`;
DROP TABLE IF EXISTS `password_reset_tokens`;
DROP TABLE IF EXISTS `stock_movements`;
DROP TABLE IF EXISTS `expense_items`;
DROP TABLE IF EXISTS `expenses`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `delivery_slips`;
DROP TABLE IF EXISTS `invoice_items`;
DROP TABLE IF EXISTS `invoices`;
DROP TABLE IF EXISTS `products`;
DROP TABLE IF EXISTS `suppliers`;
DROP TABLE IF EXISTS `customers`;
DROP TABLE IF EXISTS `categories`;
DROP TABLE IF EXISTS `company_settings`;
DROP TABLE IF EXISTS `users`;
SET FOREIGN_KEY_CHECKS = 1;

-- ---------------------------------------------------------------------
-- 1. USERS & AUTHENTICATION TABLE (Strict Unique Email & Credentials)
-- ---------------------------------------------------------------------
CREATE TABLE `users` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `full_name` VARCHAR(150) NOT NULL,
  `username` VARCHAR(60) NOT NULL UNIQUE,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `phone` VARCHAR(30) NULL,
  `employee_id` VARCHAR(50) NULL,
  `department` VARCHAR(80) NOT NULL DEFAULT 'Administration',
  `designation` VARCHAR(80) NULL DEFAULT 'Executive',
  `role` ENUM('Super Admin', 'Managing Director', 'Accounts Officer', 'Sales Executive', 'Delivery Executive', 'Viewer') NOT NULL DEFAULT 'Sales Executive',
  `password_hash` VARCHAR(255) NOT NULL,
  `password_salt` VARCHAR(64) NOT NULL,
  `biometric_enrolled` TINYINT(1) NOT NULL DEFAULT 0,
  `status` ENUM('Active', 'Pending', 'Suspended') NOT NULL DEFAULT 'Active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `last_login_at` DATETIME NULL,
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 2. USER SESSIONS (Stateful Token & Device Fingerprint Tracking)
-- ---------------------------------------------------------------------
CREATE TABLE `user_sessions` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `session_token` VARCHAR(255) NOT NULL UNIQUE,
  `ip_address` VARCHAR(45) NULL,
  `user_agent` TEXT NULL,
  `device_type` VARCHAR(50) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME NOT NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_sessions_token` (`session_token`),
  INDEX `idx_sessions_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 3. BIOMETRIC / WEBAUTHN CREDENTIALS TABLE
-- (Guards: Only registered users can enroll fingerprint credentials)
-- ---------------------------------------------------------------------
CREATE TABLE `biometric_credentials` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `credential_id` VARCHAR(255) NOT NULL UNIQUE,
  `public_key` TEXT NOT NULL,
  `counter` INT UNSIGNED NOT NULL DEFAULT 0,
  `device_label` VARCHAR(100) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_used_at` DATETIME NULL,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_bio_cred_id` (`credential_id`),
  INDEX `idx_bio_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 4. RESTRICTED PASSWORD RESET TOKENS (Strict Registered Email Verification)
-- ---------------------------------------------------------------------
CREATE TABLE `password_reset_tokens` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `email` VARCHAR(191) NOT NULL,
  `otp_code` VARCHAR(10) NOT NULL,
  `token_hash` VARCHAR(255) NOT NULL,
  `is_used` TINYINT(1) NOT NULL DEFAULT 0,
  `expires_at` DATETIME NOT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_reset_email` (`email`),
  INDEX `idx_reset_otp` (`otp_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 5. COMPANY SETTINGS (Isolated by Tenant user_id)
-- ---------------------------------------------------------------------
CREATE TABLE `company_settings` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL UNIQUE,
  `company_name` VARCHAR(200) NOT NULL DEFAULT 'Bismillah Multitrade Corporation',
  `company_address` TEXT NULL,
  `company_phone` VARCHAR(50) NULL,
  `company_email` VARCHAR(100) NULL,
  `tax_id` VARCHAR(50) NULL,
  `currency` VARCHAR(10) NOT NULL DEFAULT 'BDT',
  `currency_symbol` VARCHAR(10) NOT NULL DEFAULT '৳',
  `invoice_prefix` VARCHAR(20) NOT NULL DEFAULT 'INV-',
  `expense_prefix` VARCHAR(20) NOT NULL DEFAULT 'EXP-',
  `delivery_prefix` VARCHAR(20) NOT NULL DEFAULT 'DC-',
  `terms_and_conditions` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 6. PRODUCT CATEGORIES (Isolated by Tenant user_id)
-- ---------------------------------------------------------------------
CREATE TABLE `categories` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `name` VARCHAR(100) NOT NULL,
  `description` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_categories_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 7. PRODUCTS & INVENTORY (Isolated by Tenant user_id)
-- ---------------------------------------------------------------------
CREATE TABLE `products` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `sku` VARCHAR(100) NULL,
  `category_id` VARCHAR(64) NULL,
  `unit` VARCHAR(30) NOT NULL DEFAULT 'Pcs',
  `purchase_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `selling_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `stock_quantity` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `minimum_stock` DECIMAL(15,2) NOT NULL DEFAULT 10.00,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_products_user` (`user_id`),
  INDEX `idx_products_sku` (`sku`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 8. CUSTOMERS (Isolated by Tenant user_id)
-- ---------------------------------------------------------------------
CREATE TABLE `customers` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `company_name` VARCHAR(150) NULL,
  `phone` VARCHAR(40) NULL,
  `email` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `city` VARCHAR(80) NULL,
  `opening_balance` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `current_balance` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_customers_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 9. SUPPLIERS (Isolated by Tenant user_id)
-- ---------------------------------------------------------------------
CREATE TABLE `suppliers` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `supplier_name` VARCHAR(150) NOT NULL,
  `company_name` VARCHAR(150) NULL,
  `phone` VARCHAR(40) NULL,
  `email` VARCHAR(100) NULL,
  `address` TEXT NULL,
  `balance_due` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `status` ENUM('Active', 'Inactive') NOT NULL DEFAULT 'Active',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_suppliers_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 10. SALES INVOICES (Isolated by Tenant user_id)
-- ---------------------------------------------------------------------
CREATE TABLE `invoices` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `invoice_number` VARCHAR(50) NOT NULL,
  `customer_id` VARCHAR(64) NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `customer_phone` VARCHAR(40) NULL,
  `customer_address` TEXT NULL,
  `invoice_date` DATE NOT NULL,
  `due_date` DATE NULL,
  `subtotal` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `discount_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `tax_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `grand_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `balance_due` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `payment_status` ENUM('Paid', 'Partial', 'Unpaid', 'Overdue') NOT NULL DEFAULT 'Unpaid',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_invoices_user` (`user_id`),
  INDEX `idx_invoices_num` (`invoice_number`),
  INDEX `idx_invoices_date` (`invoice_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 11. INVOICE LINE ITEMS (Children of Invoices)
-- ---------------------------------------------------------------------
CREATE TABLE `invoice_items` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `invoice_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NULL,
  `product_name` VARCHAR(200) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 1.00,
  `unit_price` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `line_total` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 12. EXPENSES & EXPENSE BREAKDOWN (Isolated by Tenant user_id)
-- ---------------------------------------------------------------------
CREATE TABLE `expenses` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `expense_number` VARCHAR(50) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `paid_to` VARCHAR(150) NOT NULL,
  `expense_details` TEXT NULL,
  `date` DATE NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `payment_method` ENUM('Cash', 'Bank Transfer', 'Cheque', 'Mobile Banking') NOT NULL DEFAULT 'Cash',
  `status` ENUM('Paid', 'Pending', 'Cancelled') NOT NULL DEFAULT 'Paid',
  `approved_by` VARCHAR(150) NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_expenses_user` (`user_id`),
  INDEX `idx_expenses_date` (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `expense_items` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `expense_id` VARCHAR(64) NOT NULL,
  `description` VARCHAR(255) NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL DEFAULT 1.00,
  `rate` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  FOREIGN KEY (`expense_id`) REFERENCES `expenses` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 13. PAYMENTS & MONEY RECEIPTS (Isolated by Tenant user_id)
-- ---------------------------------------------------------------------
CREATE TABLE `payments` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `receipt_number` VARCHAR(50) NOT NULL,
  `invoice_id` VARCHAR(64) NULL,
  `type` ENUM('Customer Collection', 'Supplier Payment', 'General Receipt') NOT NULL DEFAULT 'Customer Collection',
  `party_name` VARCHAR(150) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  `payment_method` VARCHAR(50) NOT NULL DEFAULT 'Cash',
  `reference_no` VARCHAR(100) NULL,
  `payment_date` DATE NOT NULL,
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_payments_user` (`user_id`),
  INDEX `idx_payments_date` (`payment_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 14. DELIVERY CHALLANS / SLIPS (Isolated by Tenant user_id)
-- ---------------------------------------------------------------------
CREATE TABLE `delivery_slips` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `delivery_slip_number` VARCHAR(50) NOT NULL,
  `invoice_id` VARCHAR(64) NULL,
  `customer_name` VARCHAR(150) NOT NULL,
  `delivery_date` DATE NOT NULL,
  `delivery_status` ENUM('Scheduled', 'In Transit', 'Delivered', 'Cancelled') NOT NULL DEFAULT 'Delivered',
  `notes` TEXT NULL,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_slips_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ---------------------------------------------------------------------
-- 15. STOCK MOVEMENTS AUDIT LOG (Isolated by Tenant user_id)
-- ---------------------------------------------------------------------
CREATE TABLE `stock_movements` (
  `id` VARCHAR(64) NOT NULL PRIMARY KEY,
  `user_id` VARCHAR(64) NOT NULL,
  `product_id` VARCHAR(64) NOT NULL,
  `movement_type` ENUM('In', 'Out', 'Adjustment') NOT NULL,
  `quantity` DECIMAL(15,2) NOT NULL,
  `reference_id` VARCHAR(64) NULL,
  `reason` VARCHAR(255) NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_movements_user` (`user_id`),
  INDEX `idx_movements_product` (`product_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
