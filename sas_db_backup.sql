/*
SQLyog Ultimate v9.62 
MySQL - 5.5.9 : Database - sas_db
*********************************************************************
*/

/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`sas_db` /*!40100 DEFAULT CHARACTER SET latin1 */;

USE `sas_db`;

/*Table structure for table `bookings` */

DROP TABLE IF EXISTS `bookings`;

CREATE TABLE `bookings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `client_id` int(11) NOT NULL,
  `service_id` int(11) NOT NULL,
  `type` enum('WALK_IN','ONLINE_BOOKING') NOT NULL DEFAULT 'ONLINE_BOOKING',
  `booking_date` date NOT NULL,
  `time_slot` time NOT NULL,
  `status` enum('PENDING','CONFIRMED','COMPLETED','CANCELLED') NOT NULL DEFAULT 'PENDING',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_bookings_client` (`client_id`),
  KEY `idx_bookings_service` (`service_id`),
  KEY `idx_bookings_date` (`booking_date`),
  KEY `idx_bookings_status` (`status`),
  CONSTRAINT `fk_bookings_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_service` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4;

/*Data for the table `bookings` */

insert  into `bookings`(`id`,`client_id`,`service_id`,`type`,`booking_date`,`time_slot`,`status`,`notes`,`created_at`,`updated_at`) values (1,3,1,'WALK_IN','2026-07-31','10:00:00','COMPLETED','Walk-in client for Swedish Massage','2026-07-31 11:12:56',NULL),(2,3,8,'ONLINE_BOOKING','2026-08-01','14:00:00','CONFIRMED','Online reservation for haircut','2026-07-31 11:12:56',NULL),(3,3,9,'ONLINE_BOOKING','2026-07-31','10:00:00','PENDING','ginahan ko ani','2026-07-31 12:45:49',NULL),(4,9,9,'ONLINE_BOOKING','2026-08-03','10:00:00','PENDING','suki nako ani','2026-07-31 14:24:57',NULL);

/*Table structure for table `invoices` */

DROP TABLE IF EXISTS `invoices`;

CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_number` varchar(30) NOT NULL,
  `booking_id` int(11) NOT NULL,
  `client_id` int(11) NOT NULL,
  `cashier_id` int(11) DEFAULT NULL,
  `subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
  `tax` decimal(10,2) NOT NULL DEFAULT '0.00',
  `discount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `total_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `status` enum('UNPAID','PAID','CANCELLED') NOT NULL DEFAULT 'UNPAID',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `invoice_number` (`invoice_number`),
  KEY `idx_invoices_booking` (`booking_id`),
  KEY `idx_invoices_client` (`client_id`),
  KEY `idx_invoices_cashier` (`cashier_id`),
  KEY `idx_invoices_status` (`status`),
  CONSTRAINT `fk_invoices_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_invoices_client` FOREIGN KEY (`client_id`) REFERENCES `users` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_invoices_cashier` FOREIGN KEY (`cashier_id`) REFERENCES `users` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

/*Data for the table `invoices` */

insert  into `invoices`(`id`,`invoice_number`,`booking_id`,`client_id`,`cashier_id`,`subtotal`,`tax`,`discount`,`total_amount`,`status`,`created_at`,`updated_at`) values (1,'INV-20260731-0001',1,3,2,'850.00','0.00','0.00','850.00','PAID','2026-07-31 11:12:56',NULL);

/*Table structure for table `payments` */

DROP TABLE IF EXISTS `payments`;

CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `invoice_id` int(11) NOT NULL,
  `payment_method` enum('CASH','CARD','ONLINE') NOT NULL DEFAULT 'CASH',
  `amount_paid` decimal(10,2) NOT NULL DEFAULT '0.00',
  `change_amount` decimal(10,2) NOT NULL DEFAULT '0.00',
  `transaction_ref` varchar(100) DEFAULT NULL,
  `paid_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_payments_invoice` (`invoice_id`),
  CONSTRAINT `fk_payments_invoice` FOREIGN KEY (`invoice_id`) REFERENCES `invoices` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4;

/*Data for the table `payments` */

insert  into `payments`(`id`,`invoice_id`,`payment_method`,`amount_paid`,`change_amount`,`transaction_ref`,`paid_at`) values (1,1,'CASH','1000.00','150.00','CASH-REF-001','2026-07-31 11:12:56');

/*Table structure for table `roles` */

DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(30) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4;

/*Data for the table `roles` */

insert  into `roles`(`id`,`name`,`description`,`created_at`) values (1,'ADMIN','System administrator / Salon owner with full privileges','2026-07-31 11:12:56'),(2,'CASHIER','Cashier with permissions for profiling, payments, and billing','2026-07-31 11:12:56'),(3,'CLIENT','Registered salon/spa client','2026-07-31 11:12:56');

/*Table structure for table `service_categories` */

DROP TABLE IF EXISTS `service_categories`;

CREATE TABLE `service_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(50) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `name` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4;

/*Data for the table `service_categories` */

insert  into `service_categories`(`id`,`name`,`description`,`created_at`) values (1,'Massage Services','Relaxing therapeutic body massages','2026-07-31 11:12:56'),(2,'Nail Art & Care','Creative nail design and care treatments','2026-07-31 11:12:56'),(3,'Pedicure','Comprehensive foot and toe care','2026-07-31 11:12:56'),(4,'Manicure','Hand and fingernail care','2026-07-31 11:12:56'),(5,'Hair Services','Hair cutting, styling, coloring, and treatments','2026-07-31 11:12:56');

/*Table structure for table `services` */

DROP TABLE IF EXISTS `services`;

CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `duration_minutes` int(11) NOT NULL DEFAULT '30',
  `status` enum('AVAILABLE','UNAVAILABLE') NOT NULL DEFAULT 'AVAILABLE',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_services_category` (`category_id`),
  KEY `idx_services_status` (`status`),
  CONSTRAINT `fk_services_category` FOREIGN KEY (`category_id`) REFERENCES `service_categories` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4;

/*Data for the table `services` */

insert  into `services`(`id`,`category_id`,`name`,`description`,`price`,`duration_minutes`,`status`,`created_at`,`updated_at`) values (1,1,'Swedish Massage','Full body relaxation massage using light to medium pressure','850.00',60,'AVAILABLE','2026-07-31 11:12:56',NULL),(2,1,'Deep Tissue Massage','Targets deep muscle layers and connective tissue to relieve chronic tension','1100.00',60,'AVAILABLE','2026-07-31 11:12:56',NULL),(3,2,'Gel Nail Polish','Long-lasting gel nail polish application with UV curing','450.00',45,'AVAILABLE','2026-07-31 11:12:56',NULL),(4,2,'Custom Nail Art Design','Hand-painted nail design per nail','250.00',30,'AVAILABLE','2026-07-31 11:12:56',NULL),(5,3,'Classic Pedicure','Foot soak, nail shaping, cuticle care, and polish','400.00',45,'AVAILABLE','2026-07-31 11:12:56',NULL),(6,3,'Spa Pedicure with Foot Scrub','Classic pedicure enhanced with organic foot scrub and massage','650.00',60,'AVAILABLE','2026-07-31 11:12:56',NULL),(7,4,'Classic Manicure','Nail shaping, cuticle care, hand massage, and polish','350.00',30,'AVAILABLE','2026-07-31 11:12:56',NULL),(8,5,'Haircut & Blowdry','Precision haircut tailored to client style including blowdry','500.00',45,'AVAILABLE','2026-07-31 11:12:56',NULL),(9,5,'Hair Rebonding & Treatment','Hair straightening treatment with nourishing hair spa mask','2500.00',180,'UNAVAILABLE','2026-07-31 11:12:56','2026-07-31 14:26:07');

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(20) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `home_address` text DEFAULT NULL,
  `password_hash` varchar(255) NOT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_status` (`status`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4;

/*Data for the table `users` */

insert  into `users`(`id`,`role_id`,`first_name`,`last_name`,`email`,`phone`,`gender`,`home_address`,`password_hash`,`status`,`created_at`,`updated_at`) values (1,1,'Owner','Admin','admin@sas.com','09171234567',NULL,NULL,'$2a$12$XIdyUyZhdlz3LdTE.BOXNe9pyi1s5qULTPZTb8Gh5ISVmEwLT4HcS','APPROVED','2026-07-31 11:12:56',NULL),(2,2,'Maria','Cashier','cashier@sas.com','09181234567',NULL,NULL,'$2a$12$XIdyUyZhdlz3LdTE.BOXNe9pyi1s5qULTPZTb8Gh5ISVmEwLT4HcS','APPROVED','2026-07-31 11:12:56',NULL),(3,3,'Jane','Doe','jane.doe@example.com','09191234567',NULL,NULL,'$2a$12$XIdyUyZhdlz3LdTE.BOXNe9pyi1s5qULTPZTb8Gh5ISVmEwLT4HcS','APPROVED','2026-07-31 11:12:56',NULL),(4,3,'John','Smith','john.smith@example.com','09201234567',NULL,NULL,'$2a$12$XIdyUyZhdlz3LdTE.BOXNe9pyi1s5qULTPZTb8Gh5ISVmEwLT4HcS','PENDING','2026-07-31 11:12:56',NULL),(5,3,'James','Ronolo','james@sas.com','09754533889',NULL,NULL,'$2a$10$3yXsVd0Esj0b2e/F9EBE4unEyAnGm4PlFg4XXbMbbw3vpax8kWcMe','APPROVED','2026-07-31 12:43:25','2026-07-31 12:44:12'),(6,3,'Kevin','Esto','kevin@sas.com',NULL,NULL,NULL,'$2a$10$t044BO41koUC0pfKm1HYkujO4DRnVaqzHx2zqpiqPJEpHVBxa.2QS','APPROVED','2026-07-31 12:51:21','2026-07-31 12:53:15'),(7,3,'Mark Allene','Cayda','markallenecayda@sas.com',NULL,NULL,NULL,'$2a$10$8IUvqPilVUJoF9nsIIleVOYesA42S9QvqVq8dQJn625erbAdh9BE6','APPROVED','2026-07-31 13:57:10','2026-07-31 13:58:24'),(8,3,'John Lloyd','Gador','jg@sas.com',NULL,NULL,NULL,'$2a$10$/dHYzlwaCapV/c30OjnU1uvp1JLzakJY3jPwiSbrvSMQ4Z8wkXfE.','PENDING','2026-07-31 14:04:50',NULL),(9,3,'Danica','Cardana','danicacardana@sas.com','09676235602',NULL,NULL,'$2a$10$SkfcUk3zTJ8y/bDr6XcYXuikwzAMDfgudN2/80mkvIVKbD7Jv9ywe','APPROVED','2026-07-31 14:23:06','2026-07-31 14:23:48');

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
