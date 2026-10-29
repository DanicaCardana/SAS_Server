/*
SQLyog Ultimate v9.62 
MySQL - 5.5.9 : Database - u463580331_salon
*********************************************************************
*/


/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
CREATE DATABASE /*!32312 IF NOT EXISTS*/`u463580331_salon` /*!40100 DEFAULT CHARACTER SET latin1 */;

USE `u463580331_salon`;

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
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4;

/*Data for the table `bookings` */

insert  into `bookings`(`id`,`client_id`,`service_id`,`type`,`booking_date`,`time_slot`,`status`,`notes`,`created_at`,`updated_at`) values (1,3,1,'WALK_IN','2026-07-31','10:00:00','COMPLETED','Walk-in client for Swedish Massage','2026-07-31 11:12:56',NULL),(2,3,8,'ONLINE_BOOKING','2026-08-01','14:00:00','COMPLETED','Online reservation for haircut','2026-07-31 11:12:56','2026-10-21 09:35:42'),(3,3,9,'ONLINE_BOOKING','2026-07-31','10:00:00','CONFIRMED','ginahan ko ani','2026-07-31 12:45:49','2026-10-21 10:00:14'),(4,9,9,'ONLINE_BOOKING','2026-08-03','10:00:00','CANCELLED','suki nako ani','2026-07-31 14:24:57','2026-09-08 16:41:58'),(5,3,7,'WALK_IN','2026-09-16','10:00:00','COMPLETED','kanaghejjj','2026-09-16 14:20:51','2026-10-21 09:35:38'),(6,3,9,'WALK_IN','2026-09-16','08:00:00','COMPLETED','','2026-09-16 15:34:03','2026-10-21 09:51:40'),(7,3,6,'ONLINE_BOOKING','2026-09-30','13:00:00','CONFIRMED','ganahan ko si maria ang mo handle nako sa service\n','2026-09-30 14:02:49','2026-10-21 10:00:12'),(8,4,9,'WALK_IN','2026-10-21','08:00:00','COMPLETED','','2026-10-21 09:43:04','2026-10-21 09:51:39'),(9,4,8,'ONLINE_BOOKING','2026-10-21','10:00:00','COMPLETED','','2026-10-21 09:43:32','2026-10-21 09:51:38'),(10,8,8,'WALK_IN','2026-10-21','13:00:00','COMPLETED','','2026-10-21 09:46:21','2026-10-21 09:51:27'),(11,11,9,'WALK_IN','2026-10-21','11:00:00','COMPLETED','','2026-10-21 09:50:21','2026-10-21 09:51:37'),(12,11,8,'WALK_IN','2026-10-21','11:00:00','COMPLETED','','2026-10-21 09:50:34','2026-10-21 09:51:36'),(13,11,9,'WALK_IN','2026-10-21','08:00:00','COMPLETED','','2026-10-21 09:53:44','2026-10-21 13:09:46'),(14,11,8,'WALK_IN','2026-10-21','08:00:00','CONFIRMED','','2026-10-21 09:53:53',NULL),(15,4,9,'WALK_IN','2026-10-21','11:00:00','CONFIRMED','','2026-10-21 09:54:15',NULL),(16,4,8,'WALK_IN','2026-10-21','09:00:00','CONFIRMED','','2026-10-21 09:54:23',NULL),(17,8,9,'WALK_IN','2026-10-21','14:00:00','COMPLETED','','2026-10-21 09:54:42','2026-10-21 10:04:15'),(18,8,8,'WALK_IN','2026-10-21','10:00:00','COMPLETED','','2026-10-21 09:54:49','2026-10-21 10:04:02'),(19,8,9,'ONLINE_BOOKING','2026-10-21','17:00:00','CONFIRMED','','2026-10-21 09:55:17','2026-10-21 10:00:06'),(20,8,7,'WALK_IN','2026-10-21','08:00:00','COMPLETED','','2026-10-21 09:55:30','2026-10-21 10:03:44'),(21,4,7,'ONLINE_BOOKING','2026-10-21','08:30:00','CONFIRMED','','2026-10-21 09:55:49','2026-10-21 10:00:13'),(22,4,8,'ONLINE_BOOKING','2026-10-21','11:00:00','COMPLETED','','2026-10-21 09:55:57','2026-10-21 10:04:21');

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
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4;

/*Data for the table `invoices` */

insert  into `invoices`(`id`,`invoice_number`,`booking_id`,`client_id`,`cashier_id`,`subtotal`,`tax`,`discount`,`total_amount`,`status`,`created_at`,`updated_at`) values (1,'INV-20260731-0001',1,3,2,'850.00','0.00','0.00','850.00','PAID','2026-07-31 11:12:56',NULL),(2,'INV-20260805-4606',2,3,2,'500.00','0.00','0.00','500.00','PAID','2026-08-05 09:52:29','2026-10-21 09:35:42'),(3,'INV-20261021-2178',5,3,2,'350.00','0.00','0.00','350.00','PAID','2026-10-21 09:35:12','2026-10-21 09:35:38'),(4,'INV-20261021-8147',17,8,2,'2500.00','0.00','0.00','2500.00','PAID','2026-10-21 09:56:37','2026-10-21 10:04:15'),(5,'INV-20261021-2539',18,8,2,'500.00','0.00','0.00','500.00','PAID','2026-10-21 09:56:51','2026-10-21 10:04:02'),(6,'INV-20261021-4612',20,8,2,'350.00','0.00','0.00','350.00','PAID','2026-10-21 09:56:57','2026-10-21 10:03:44'),(7,'INV-20261021-3670',22,4,2,'500.00','0.00','0.00','500.00','PAID','2026-10-21 10:00:31','2026-10-21 10:04:21'),(8,'INV-20261021-9478',14,11,2,'500.00','0.00','0.00','500.00','UNPAID','2026-10-21 10:17:47',NULL),(9,'INV-20261021-5934',13,11,2,'2500.00','0.00','0.00','2500.00','PAID','2026-10-21 10:17:55','2026-10-21 13:09:46'),(10,'INV-20261025-3014',15,4,2,'2500.00','0.00','0.00','2500.00','UNPAID','2026-10-26 04:33:54',NULL),(11,'INV-20261025-8584',19,8,2,'2500.00','0.00','0.00','2500.00','UNPAID','2026-10-26 04:34:02',NULL),(12,'INV-20261025-5127',7,3,2,'650.00','0.00','0.00','650.00','UNPAID','2026-10-26 04:34:10',NULL);

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
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4;

/*Data for the table `payments` */

insert  into `payments`(`id`,`invoice_id`,`payment_method`,`amount_paid`,`change_amount`,`transaction_ref`,`paid_at`) values (1,1,'CASH','1000.00','150.00','CASH-REF-001','2026-07-31 11:12:56'),(2,3,'CASH','350.00','0.00','CASH-REF-1792546538088','2026-10-21 09:35:38'),(3,2,'CASH','500.00','0.00','CASH-REF-1792546542688','2026-10-21 09:35:42'),(4,6,'CASH','500.00','150.00','CASH-REF-1792548224383','2026-10-21 10:03:44'),(5,5,'CASH','1000.00','500.00','CASH-REF-1792548242237','2026-10-21 10:04:02'),(6,4,'CASH','3000.00','500.00','CASH-REF-1792548255255','2026-10-21 10:04:15'),(7,7,'CASH','500.00','0.00','CASH-REF-1792548261187','2026-10-21 10:04:21'),(8,9,'CASH','3000.00','500.00','CASH-REF-1792559386895','2026-10-21 13:09:46');

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

insert  into `services`(`id`,`category_id`,`name`,`description`,`price`,`duration_minutes`,`status`,`created_at`,`updated_at`) values (1,1,'Swedish Massage','Full body relaxation massage using light to medium pressure','850.00',60,'AVAILABLE','2026-07-31 11:12:56',NULL),(2,1,'Deep Tissue Massage','Targets deep muscle layers and connective tissue to relieve chronic tension','1100.00',60,'AVAILABLE','2026-07-31 11:12:56',NULL),(3,2,'Gel Nail Polish','Long-lasting gel nail polish application with UV curing','450.00',45,'AVAILABLE','2026-07-31 11:12:56',NULL),(4,2,'Custom Nail Art Design','Hand-painted nail design per nail','250.00',30,'AVAILABLE','2026-07-31 11:12:56',NULL),(5,3,'Classic Pedicure','Foot soak, nail shaping, cuticle care, and polish','400.00',45,'AVAILABLE','2026-07-31 11:12:56',NULL),(6,3,'Spa Pedicure with Foot Scrub','Classic pedicure enhanced with organic foot scrub and massage','650.00',60,'AVAILABLE','2026-07-31 11:12:56',NULL),(7,4,'Classic Manicure','Nail shaping, cuticle care, hand massage, and polish','350.00',30,'AVAILABLE','2026-07-31 11:12:56',NULL),(8,5,'Haircut & Blowdry','Precision haircut tailored to client style including blowdry','500.00',45,'AVAILABLE','2026-07-31 11:12:56',NULL),(9,5,'Hair Rebonding & Treatment','Hair straightening treatment with nourishing hair spa mask','2500.00',180,'AVAILABLE','2026-07-31 11:12:56','2026-08-04 09:46:16');

/*Table structure for table `users` */

DROP TABLE IF EXISTS `users`;

CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `role_id` int(11) NOT NULL,
  `client_number` varchar(30) DEFAULT NULL,
  `first_name` varchar(20) NOT NULL,
  `last_name` varchar(20) NOT NULL,
  `middle_name` varchar(20) DEFAULT NULL,
  `email` varchar(50) NOT NULL,
  `phone` varchar(11) DEFAULT NULL,
  `gender` enum('MALE','FEMALE','OTHER') DEFAULT NULL,
  `civil_status` enum('SINGLE','MARRIED','WIDOWED','SEPARATED','OTHER') DEFAULT NULL,
  `birthdate` date DEFAULT NULL,
  `home_address` text,
  `password_hash` varchar(255) DEFAULT NULL,
  `plain_password` varchar(255) DEFAULT NULL,
  `status` enum('PENDING','APPROVED','REJECTED') NOT NULL DEFAULT 'PENDING',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `idx_users_client_number` (`client_number`),
  KEY `idx_users_role` (`role_id`),
  KEY `idx_users_status` (`status`),
  CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4;

/*Data for the table `users` */

insert  into `users`(`id`,`role_id`,`client_number`,`first_name`,`last_name`,`middle_name`,`email`,`phone`,`gender`,`civil_status`,`birthdate`,`home_address`,`password_hash`,`plain_password`,`status`,`created_at`,`updated_at`) values (1,1,'STF-2026-0001','Owner','Admin',NULL,'admin@sas.com','09171234567',NULL,NULL,NULL,NULL,'$2a$12$XIdyUyZhdlz3LdTE.BOXNe9pyi1s5qULTPZTb8Gh5ISVmEwLT4HcS','owneradmin123','APPROVED','2026-07-31 11:12:56',NULL),(2,2,'STF-2026-0002','Maria','Cashier',NULL,'cashier@sas.com','09181234567',NULL,NULL,NULL,NULL,'$2a$12$XIdyUyZhdlz3LdTE.BOXNe9pyi1s5qULTPZTb8Gh5ISVmEwLT4HcS','mariacashier123','APPROVED','2026-07-31 11:12:56',NULL),(3,3,'CLI-2026-0003','Jane','Doe',NULL,'jane.doe@example.com','09191234567',NULL,NULL,NULL,NULL,'$2a$12$XIdyUyZhdlz3LdTE.BOXNe9pyi1s5qULTPZTb8Gh5ISVmEwLT4HcS','janedoe123','APPROVED','2026-07-31 11:12:56',NULL),(4,3,'CLI-2026-0004','John','Smith',NULL,'john.smith@example.com','09201234567',NULL,NULL,NULL,NULL,'$2a$10$DUh0MgbehRtbotAl5H6lUO0qXhjYSoZTNHBlmZbYnRX0iPaTaW4UK','johnsmith123','APPROVED','2026-07-31 11:12:56','2026-10-21 09:40:59'),(5,3,'CLI-2026-0005','James','Ronolo',NULL,'james@sas.com','09754533889',NULL,NULL,NULL,NULL,'$2a$10$3yXsVd0Esj0b2e/F9EBE4unEyAnGm4PlFg4XXbMbbw3vpax8kWcMe','jamesronolo123','APPROVED','2026-07-31 12:43:25','2026-07-31 12:44:12'),(6,3,'CLI-2026-0006','Kevin','Esto',NULL,'kevin@sas.com',NULL,NULL,NULL,NULL,NULL,'$2a$10$t044BO41koUC0pfKm1HYkujO4DRnVaqzHx2zqpiqPJEpHVBxa.2QS','kevinesto123','APPROVED','2026-07-31 12:51:21','2026-07-31 12:53:15'),(7,3,'CLI-2026-0007','Mark Allene','Cayda',NULL,'markallenecayda@sas.com',NULL,NULL,NULL,NULL,NULL,'$2a$10$8IUvqPilVUJoF9nsIIleVOYesA42S9QvqVq8dQJn625erbAdh9BE6','markallenecayda123','APPROVED','2026-07-31 13:57:10','2026-07-31 13:58:24'),(8,3,'CLI-2026-0008','John Lloyd','Gador',NULL,'jg@sas.com',NULL,NULL,NULL,NULL,NULL,'$2a$10$E/x1b6k3w1SWXH0EuoZYTeMpn0ONBbGlu3EKymq93wjQrSL0pyIUe','johnlloydgador123','APPROVED','2026-07-31 14:04:50','2026-10-21 09:40:43'),(9,3,'CLI-2026-0009','Danica','Cardana',NULL,'danicacardana@sas.com','09676235602',NULL,NULL,NULL,NULL,'$2a$10$SkfcUk3zTJ8y/bDr6XcYXuikwzAMDfgudN2/80mkvIVKbD7Jv9ywe','danicacardana123','APPROVED','2026-07-31 14:23:06','2026-07-31 14:23:48'),(10,3,'CLI-2026-0010','angelic','cardana',NULL,'angelic.cardana@sas.com','0957388','FEMALE',NULL,NULL,'totolan','$2a$10$KPNoRYT3l0uLbSpcPXzOIetGGBDnrl8LTefptCdirM09O8aio/Ye.','angeliccardana123','APPROVED','2026-08-04 10:07:01','2026-09-16 15:35:08'),(11,3,'CLI-2026-0011','Kevin','Esto',NULL,'kevin.esto@sas.com','09537629169','MALE',NULL,NULL,'Purok 2 Bihol','$2a$10$BJYT8zEDV7CygB0IxgHqkOzml3/YryZ9CKhfwj3suLSGNjnzMuR3S','kevinesto123','APPROVED','2026-08-05 10:24:11','2026-10-26 11:19:42'),(13,3,'CLI-2026-0013','asdasd','asdasd','asdasd','asdasd.asdasd@sas.com','09225032227','MALE','SINGLE','2026-09-17','asdasdas','$2a$10$wubPAKWS5JF.p2J5G9i7Uu..p86LrMLXsLk6mjWiU05.w7Ntc/iKm','asdasdasdasd123','APPROVED','2026-09-08 15:51:50','2026-10-26 10:48:50'),(15,3,'CLI-2026-0014','TestClient','NumberGen',NULL,'testclient.numbergen@sas.com','09123456789',NULL,NULL,NULL,NULL,'$2a$10$oLLhC27wo0Gs0YR0OHPVV.877wngWDEU1i19bB4W4YLF4EwWleas6','newclient1234','APPROVED','2026-10-21 14:42:50','2026-10-26 10:52:50'),(16,2,'STF-2026-0003','Karen','Barro','Lumbay','karen.barro@sas.com','08575937895','FEMALE','SINGLE','2004-02-06','hfjhweiior','$2a$10$OVYtsyPJ4.V9UKED04t62uFOrV/81BrA0h2pAyluReuZ5OWqaPDBa','karenbarro123','APPROVED','2026-10-21 15:06:57',NULL);

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;
