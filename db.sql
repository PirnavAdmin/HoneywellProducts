-- MySQL dump 10.13  Distrib 8.0.46, for Win64 (x86_64)
--
-- Host: localhost    Database: u819242402_honeywell_db
-- ------------------------------------------------------
-- Server version	9.5.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
SET @MYSQLDUMP_TEMP_LOG_BIN = @@SESSION.SQL_LOG_BIN;
SET @@SESSION.SQL_LOG_BIN= 0;

--
-- GTID state at the beginning of the backup 
--

SET @@GLOBAL.GTID_PURGED=/*!80000 '+'*/ '74c7f71e-f5de-11f0-8d95-70b5e8c375ea:1-4122';

--
-- Table structure for table `admin_user`
--

DROP TABLE IF EXISTS `admin_user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `admin_user` (
  `Email` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Password` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Role` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Otp` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsActive` tinyint(1) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `FullName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MobileNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EmployeeId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PermissionsJson` text,
  PRIMARY KEY (`Email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_user`
--

LOCK TABLES `admin_user` WRITE;
/*!40000 ALTER TABLE `admin_user` DISABLE KEYS */;
INSERT INTO `admin_user` VALUES ('bhargavakurapati49@gmail.com','Bhargava@123','SuperAdmin',NULL,1,'2026-09-11 09:33:03.000000','Bhargava Admin',NULL,NULL,NULL);
/*!40000 ALTER TABLE `admin_user` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bankdetailsconfigs`
--

DROP TABLE IF EXISTS `bankdetailsconfigs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bankdetailsconfigs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `IfscCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `BankName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Branch` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AccountNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AccountHolderName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bankdetailsconfigs`
--

LOCK TABLES `bankdetailsconfigs` WRITE;
/*!40000 ALTER TABLE `bankdetailsconfigs` DISABLE KEYS */;
INSERT INTO `bankdetailsconfigs` VALUES (1,'HDFC0000123','HDFC Bank','Main Branch','50200088991122','Honeywell Products & Solutions Pvt Ltd','2026-09-21 11:37:39.974161');
/*!40000 ALTER TABLE `bankdetailsconfigs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `banners` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Subtitle` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ImageUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TargetUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `DisplayOrder` int NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `blogs`
--

DROP TABLE IF EXISTS `blogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `blogs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Category` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AuthorName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PublishDate` datetime(6) NOT NULL,
  `CoverImage` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Summary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `blogs`
--

LOCK TABLES `blogs` WRITE;
/*!40000 ALTER TABLE `blogs` DISABLE KEYS */;
INSERT INTO `blogs` VALUES (2,'Upcoming Solar Panel Solutions for a Brighter Tomorrow','General','Bhargava','2026-09-11 00:00:00.000000','/uploads/blogs/b56188fd-c16e-410c-9a13-2f2d185a133e.png','Explore our upcoming solar panel solutions focused on reliable renewable energy, improved efficiency, long-term performance, and sustainable power for homes and businesses.','Solar energy continues to become an important choice for customers looking for cleaner and more sustainable ways to generate electricity. Our upcoming solar solutions are intended to help homes and businesses take advantage of dependable renewable energy technology.\r\n\r\nThe upcoming product range will focus on efficient solar panels designed for long-term energy generation and dependable everyday use. Solar installations can help customers make better use of available sunlight while supporting their transition toward cleaner energy.\r\n\r\nWhether the requirement is residential rooftop solar, commercial installations, or larger solar projects, selecting suitable panels and supporting equipment is essential for building an effective solar power system.\r\n\r\nKey Highlights: Efficient solar energy generation, durable panel construction, solutions for residential and commercial applications, long-term energy potential, and environmentally responsible power generation.\r\n\r\nFollow Honeywell Products for upcoming announcements about solar panels, specifications, installation solutions, supporting equipment, and new product availability.','2026-09-04 14:51:39.470886','2026-09-11 13:16:12.438973'),(3,'Next-Gen CCTV Surveillance Solutions: Smarter Security for a Safer Tomorrow','General','Honeywell Products Team','2026-09-11 00:00:00.000000','/uploads/blogs/1c82907e-a307-4e01-ac5e-3868ccaa10ac.png','Discover the upcoming generation of smart CCTV surveillance solutions designed to deliver high-definition monitoring, enhanced night vision, intelligent motion detection, and convenient remote access for homes and businesses.','Security technology is evolving rapidly, and the next generation of CCTV surveillance solutions is designed to provide smarter, clearer, and more convenient protection.\r\n\r\nOur upcoming CCTV range focuses on advanced surveillance capabilities for residential, commercial, retail, office, warehouse, and other security environments. With high-definition video, improved night monitoring, intelligent motion detection, and remote viewing capabilities, modern CCTV systems can help users stay connected to their property from virtually anywhere.\r\n\r\nThe upcoming range is designed with ease of use, dependable monitoring, and modern security requirements in mind. From compact cameras for homes to more comprehensive surveillance solutions for businesses, customers will be able to choose products according to their security needs.\r\n\r\nKey Highlights: High-definition video monitoring, enhanced night vision, smart motion detection, remote monitoring, modern camera designs, and solutions suitable for both residential and commercial applications.\r\n\r\nStay connected with Honeywell Products for updates about upcoming CCTV cameras, surveillance equipment, specifications, availability, and product launches.','2026-09-11 13:14:09.727307','2026-09-11 13:14:09.728138'),(4,'Complete Solar Power Equipment: Building a Smarter Sustainable Energy System','General','Honeywell Products Team','2026-09-11 00:00:00.000000','/uploads/blogs/7dcde238-3ea9-4839-b821-e9a0c3783ceb.png','A solar installation needs more than panels. Discover upcoming solar inverters, batteries, charge controllers, mounting systems, and related equipment designed to create complete solar energy solutions.','Full Content Description *\r\nA complete solar power system is made up of several important components working together. While solar panels capture energy from sunlight, additional equipment is required to convert, control, store, and safely use that energy.\r\n\r\nOur upcoming solar equipment range is planned to provide customers with the essential components required for complete solar power solutions.\r\n\r\nSolar Inverters convert the electricity generated by solar panels into usable power for compatible electrical applications.\r\n\r\nSolar Batteries can store energy for later use, depending on the design of the solar installation.\r\n\r\nCharge Controllers help regulate energy flow between solar panels and battery systems in compatible setups.\r\n\r\nMounting Systems provide the physical structure required to position and securely install solar panels.\r\n\r\nTogether with suitable solar panels and electrical components, these products can form an integrated solar solution for residential and commercial requirements.\r\n\r\nHoneywell Products will continue expanding its solar portfolio with products focused on practical performance, compatibility, durability, and modern renewable-energy requirements.\r\n\r\nWatch this space for upcoming solar equipment launches, technical specifications, product guides, and availability information.','2026-09-11 13:17:24.217299','2026-09-11 13:17:24.217300'),(5,'Smart CCTV Products for Every Need: Advanced Technology for Complete Protection','General','Honeywell Products Team','2026-09-11 00:00:00.000000','/uploads/blogs/2bc01b2c-90e4-499e-833b-23a59326db15.png','From home security to business surveillance, explore the upcoming smart CCTV product range designed around modern monitoring, remote access, flexible deployment, and dependable security.','Different locations have different security requirements. A home may need a simple camera setup, while offices, shops, warehouses, and larger commercial properties may require broader surveillance coverage.\r\n\r\nOur upcoming smart CCTV portfolio is intended to provide flexible surveillance options for different environments.\r\n\r\nFor home security, modern CCTV cameras can help users monitor entrances, outdoor spaces, parking areas, and other important locations.\r\n\r\nFor business surveillance, CCTV solutions can support monitoring across offices, retail stores, warehouses, reception areas, and commercial facilities.\r\n\r\nWith remote and mobile access, compatible surveillance systems can provide convenient ways to view cameras and monitor locations without always being physically present.\r\n\r\nThe upcoming range will include different camera designs and supporting surveillance products so customers can select solutions according to their installation and monitoring requirements.\r\n\r\nKey Highlights: Home security, business surveillance, smart monitoring, remote access, mobile viewing, modern camera options, and scalable surveillance solutions.\r\n\r\nStay tuned to Honeywell Products for upcoming CCTV product announcements, specifications, installation information, and security technology updates.','2026-09-11 13:18:16.389653','2026-09-11 13:18:16.389653');
/*!40000 ALTER TABLE `blogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `brands`
--

DROP TABLE IF EXISTS `brands`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `brands` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `LogoImage` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `brands`
--

LOCK TABLES `brands` WRITE;
/*!40000 ALTER TABLE `brands` DISABLE KEYS */;
INSERT INTO `brands` VALUES (3,'HoneyWell','HoneyWell','/uploads/0446bd7b-76da-405a-9082-1c9822be3f3e.png',1);
/*!40000 ALTER TABLE `brands` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bulkquoterequests`
--

DROP TABLE IF EXISTS `bulkquoterequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bulkquoterequests` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `CompanyName` varchar(255) NOT NULL,
  `GstinNumber` varchar(100) DEFAULT NULL,
  `Mobile` varchar(50) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Location` varchar(255) NOT NULL,
  `Product` varchar(255) NOT NULL DEFAULT 'General bulk requirement',
  `Quantity` int NOT NULL DEFAULT '1',
  `Requirement` text NOT NULL,
  `Status` varchar(50) NOT NULL DEFAULT 'Pending',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bulkquoterequests`
--

LOCK TABLES `bulkquoterequests` WRITE;
/*!40000 ALTER TABLE `bulkquoterequests` DISABLE KEYS */;
INSERT INTO `bulkquoterequests` VALUES (1,'Suresh Nuthangi','TechCorp Solutions','36AAACG1234F1Z5','9876543210','sureshnuthangi999@gmail.com','Hyderabad, Telangana','Waaree Radiance 3 kW Hybrid Solar Kit',5,'We need 5 units for our commercial project with installation timeline within 2 weeks.','Pending','2026-09-15 06:18:41'),(2,'Test Customer','Test Solar Pvt Ltd','36ABCDE1234F1Z5','9988776655','testcustomer@example.com','Bengaluru','Honeywell Solar Panel 400W',10,'Bulk project requirement test','Pending','2026-09-15 07:22:27'),(3,'Suresh Nuthangi','TechCorp Solutions','36AAACG1234F1Z5','9876543210','sureshnuthangi999@gmail.com','Hyderabad, Telangana','Waaree Radiance 3 kW Hybrid Solar Kit',5,'We need 5 units for our commercial project with installation timeline within 2 weeks.','Pending','2026-09-15 08:55:39'),(4,'Suresh Nuthangi','TechCorp Solutions','36AAACG1234F1Z5','9876543210','sureshnuthangi999@gmail.com','Hyderabad, Telangana','Waaree Radiance 3 kW Hybrid Solar Kit',5,'We need 5 units for our commercial project with installation timeline within 2 weeks.','Pending','2026-09-15 08:56:01'),(5,'rajesh','rajesh',NULL,'9857687574','rajesh@gmail.com','hyderabad','12MP Acusense Strobe Light and Audible Warning Motorized Varifocal Turret Network Camera',1,'i need 12 pieces','Pending','2026-09-15 09:30:40'),(6,'bhargava','bhargava',NULL,'7386999881','bhargava@gmail.com','hyderabad','12MP Acusense Strobe Light and Audible Warning Motorized Varifocal Turret Network Camera',1,'i need the details','Pending','2026-09-15 12:32:51'),(7,'Test User','Test Co',NULL,'9999999999','test@example.com','Mumbai','CCTV Camera',5,'Need quote for 5 units','Pending','2026-09-16 07:53:31'),(8,'Alex Verification','Verify Co',NULL,'9876543210','quote.verify@example.com','Bangalore','CCTV Cameras & NVR',10,'Bulk installation requirement','Pending','2026-09-16 08:12:31');
/*!40000 ALTER TABLE `bulkquoterequests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `calllogs`
--

DROP TABLE IF EXISTS `calllogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `calllogs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CustomerName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CustomerPhone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CustomerEmail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CalledByRep` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Priority` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `NotesSummary` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `LastCallTime` datetime(6) NOT NULL,
  `CallbackTime` datetime(6) DEFAULT NULL,
  `IsQualifiedLead` tinyint(1) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `calllogs`
--

LOCK TABLES `calllogs` WRITE;
/*!40000 ALTER TABLE `calllogs` DISABLE KEYS */;
INSERT INTO `calllogs` VALUES (1,'nandhitha','9491755559','nandhithachebattina@gmail.com','Admin Representative','Completed','LOW','','2026-08-30 23:00:00.000000','2026-08-31 17:30:00.000000',1),(2,'rajesh','9876456786','rajesh@gmail.com','Admin','Completed','Medium','','2026-09-18 11:08:42.114000',NULL,0);
/*!40000 ALTER TABLE `calllogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cartitems`
--

DROP TABLE IF EXISTS `cartitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cartitems` (
  `CartId` int NOT NULL AUTO_INCREMENT,
  `ProductId` int NOT NULL,
  `Quantity` int NOT NULL,
  `Price` decimal(65,30) NOT NULL,
  `TotalAmount` decimal(65,30) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `TotalPrice` decimal(65,30) NOT NULL,
  `UserEmail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`CartId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cartitems`
--

LOCK TABLES `cartitems` WRITE;
/*!40000 ALTER TABLE `cartitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `cartitems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categories` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ImageUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (8,'Network Cameras','Designed for diverse needs from video security to business intelligence','https://wildlife-unwieldy-devotee.ngrok-free.dev/uploads/categories/cat_02a436cd-0079-477d-b49d-3ba5ed93817c.png',1),(9,'Turbo HD Cameras','Bring superior picture quality and more smart features to the analog world.','https://wildlife-unwieldy-devotee.ngrok-free.dev/uploads/categories/cat_d6b80e4e-e53b-41d0-9c89-09c28d24c061.png',1),(10,'Solar panels','Explore versatile solar solutions designed for every need — from portable Foldable Panels and compact Small Solar Modules to lightweight Flexible Solar Modules. Built for reliable, efficient, and sustainable power wherever energy is needed.','https://wildlife-unwieldy-devotee.ngrok-free.dev/uploads/categories/cat_da625d08-3f05-4f8d-88f1-a22e666b54e6.png',1),(11,'Solar kit','The Solar Kit category includes complete, all-in-one solar power setups designed for easy installation and reliable energy production. These kits typically bundle essential components—such as solar panels, a power inverter, a charge controller, battery storage, and mounting hardware—to provide off-grid, hybrid, or backup power solutions for homes, farms, and businesses.','https://wildlife-unwieldy-devotee.ngrok-free.dev/uploads/categories/cat_1dbccda7-8bbe-4bad-a5cf-ee0c5cec77b8.png',1);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coinssettings`
--

DROP TABLE IF EXISTS `coinssettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coinssettings` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ConversionRate` decimal(18,4) NOT NULL,
  `EarnRate` decimal(18,4) NOT NULL,
  `MinRedeemableCoins` int NOT NULL,
  `MaxRedeemableCoins` int NOT NULL,
  `RupeesRequiredForOneCoin` int NOT NULL,
  `MinimumOrderValue` decimal(65,30) NOT NULL,
  `MaxCartRedeemPercent` decimal(65,30) NOT NULL,
  `WelcomeBonusCoins` int NOT NULL,
  `CoinValidityDays` int NOT NULL,
  `IsWelcomeBonusEnabled` tinyint(1) NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coinssettings`
--

LOCK TABLES `coinssettings` WRITE;
/*!40000 ALTER TABLE `coinssettings` DISABLE KEYS */;
INSERT INTO `coinssettings` VALUES (1,1.0000,0.0500,100,5000,20,100.000000000000000000000000000000,20.000000000000000000000000000000,25,180,1,1);
/*!40000 ALTER TABLE `coinssettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `contactusrequests`
--

DROP TABLE IF EXISTS `contactusrequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `contactusrequests` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Mobile` varchar(50) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `Company` varchar(255) DEFAULT NULL,
  `EnquiryType` varchar(100) NOT NULL DEFAULT 'General',
  `Message` text NOT NULL,
  `Status` varchar(50) NOT NULL DEFAULT 'Pending',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `contactusrequests`
--

LOCK TABLES `contactusrequests` WRITE;
/*!40000 ALTER TABLE `contactusrequests` DISABLE KEYS */;
INSERT INTO `contactusrequests` VALUES (1,'Bhargava Kurapati','9876543210','bhargavakurapati49@gmail.com','Honeywell Partner Solutions','Business Enquiry','Interested in distributor partnership for security CCTV equipment in Hyderabad region.','Pending','2026-09-15 06:19:08'),(2,'Test Contact User','9876500000','contacttest@example.com','Acme Systems','General Inquiry','Hello, testing contact form integration','Pending','2026-09-15 07:22:28'),(3,'rithvik','9856987345','rithvik@gmail.com','','Product Enquiry','i need  your product details','Pending','2026-09-15 07:24:04'),(4,'jagadesh','9834876266','jagadesh@gmail.com','','Sales Enquiry','i need the sales details of your company to join as  distributer','Pending','2026-09-15 07:26:12'),(5,'bharath','7309845678','bharath@gmail.com','bharath enterprise','Distributor Enquiry','i  want to join as a distributer','Pending','2026-09-15 08:45:29'),(6,'raju','9986567547','raju@gmail.com','','Product Enquiry','i want detailes about the products','Pending','2026-09-15 09:15:03'),(7,'Rajesh','9567895438','Rajesh@gmail.com','','Dealer Enquiry','iam intresten on delarship with your company','Pending','2026-09-15 09:23:03'),(8,'rajesh','9825748793','rajesh@gmail.com','rajesh','Product Enquiry','Make Your Next Security Decision With Clarity.','Pending','2026-09-15 09:40:35'),(9,'BHARGAVA','7386999881','BHARGAVA@GMAIL.COM','BHARGAVA','Sales Enquiry','I NEED SALES INFORMATION','Pending','2026-09-16 05:49:52'),(10,'Test Contact','9999999999','contact@example.com','Test Corp','General Enquiry','Test message','Pending','2026-09-16 07:52:55'),(11,'Alex Verification','9876543210','contact.verify@example.com','Honeywell Partner Verification','General Enquiry','Automated verification contact message.','Pending','2026-09-16 08:12:28');
/*!40000 ALTER TABLE `contactusrequests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `coupons` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Code` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DiscountType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DiscountValue` decimal(18,2) NOT NULL,
  `MinCartValue` decimal(18,2) NOT NULL,
  `UsageLimit` int NOT NULL,
  `UsedCount` int NOT NULL,
  `StartDate` datetime(6) NOT NULL,
  `EndDate` datetime(6) NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `TermsAndConditions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BackgroundImageUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BannerImageUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ThumbnailImageUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `MaxDiscountAmount` decimal(65,30) DEFAULT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `UpdatedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (2,'MONSOON30','Percentage',30.00,1500.00,500,0,'2026-09-17 00:00:00.000000','2026-09-30 23:59:59.000000',1,NULL,'20% off on all solar panels',NULL,NULL,NULL,NULL,500.000000000000000000000000000000,'2026-09-17 05:17:35.858490',NULL),(3,'NEWUSER40','Percentage',40.00,3000.00,200,0,'2026-09-17 00:00:00.000000','2026-11-24 23:59:59.000000',1,NULL,'40% off on all cctv products',NULL,NULL,NULL,NULL,500.000000000000000000000000000000,'2026-09-17 08:36:15.359385',NULL);
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customeraddresses`
--

DROP TABLE IF EXISTS `customeraddresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customeraddresses` (
  `AddressId` int NOT NULL AUTO_INCREMENT,
  `FirstName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `LastName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PhoneNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AlternatePhoneNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FullAddress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `City` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `State` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Pincode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AddressType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  PRIMARY KEY (`AddressId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customeraddresses`
--

LOCK TABLES `customeraddresses` WRITE;
/*!40000 ALTER TABLE `customeraddresses` DISABLE KEYS */;
/*!40000 ALTER TABLE `customeraddresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customeradvisories`
--

DROP TABLE IF EXISTS `customeradvisories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customeradvisories` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CustomerId` int NOT NULL,
  `AdvisoryText` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Recommendation` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `StaffId` int NOT NULL,
  `DateCreated` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_CustomerAdvisories_CustomerId` (`CustomerId`),
  KEY `IX_CustomerAdvisories_StaffId` (`StaffId`),
  CONSTRAINT `FK_CustomerAdvisories_Customers_CustomerId` FOREIGN KEY (`CustomerId`) REFERENCES `customers` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_CustomerAdvisories_Staff_StaffId` FOREIGN KEY (`StaffId`) REFERENCES `staff` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customeradvisories`
--

LOCK TABLES `customeradvisories` WRITE;
/*!40000 ALTER TABLE `customeradvisories` DISABLE KEYS */;
/*!40000 ALTER TABLE `customeradvisories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customeragrarians`
--

DROP TABLE IF EXISTS `customeragrarians`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customeragrarians` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CustomerId` int NOT NULL,
  `SoilType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CropType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FarmSizeAcres` double NOT NULL,
  `IrrigationSource` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_CustomerAgrarians_CustomerId` (`CustomerId`),
  CONSTRAINT `FK_CustomerAgrarians_Customers_CustomerId` FOREIGN KEY (`CustomerId`) REFERENCES `customers` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customeragrarians`
--

LOCK TABLES `customeragrarians` WRITE;
/*!40000 ALTER TABLE `customeragrarians` DISABLE KEYS */;
/*!40000 ALTER TABLE `customeragrarians` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `customers` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `UserId` int DEFAULT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Phone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `JoinDate` datetime(6) NOT NULL,
  `CoinsBalance` int NOT NULL,
  `Address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `District` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `State` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProfilePicture` varchar(500) DEFAULT NULL,
  `FirstName` varchar(100) DEFAULT NULL,
  `LastName` varchar(100) DEFAULT NULL,
  `Password` varchar(255) DEFAULT NULL,
  `Role` varchar(100) NOT NULL DEFAULT 'CUSTOMER ACCOUNT',
  `Gender` varchar(50) NOT NULL DEFAULT 'Male',
  `CompanyOrganization` varchar(200) NOT NULL DEFAULT 'Individual Account',
  `AccountHolderName` varchar(200) DEFAULT NULL,
  `BankName` varchar(200) DEFAULT NULL,
  `AccountNumber` varchar(100) DEFAULT NULL,
  `IfscCode` varchar(50) DEFAULT NULL,
  `UpiId` varchar(100) DEFAULT NULL,
  `ShippingAddressJson` text,
  `BillingAddressJson` text,
  PRIMARY KEY (`Id`),
  KEY `IX_Customers_UserId` (`UserId`),
  CONSTRAINT `FK_Customers_Users_UserId` FOREIGN KEY (`UserId`) REFERENCES `users` (`Id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (1,NULL,'nandhitha','9491755559','nandhithachebattina@gmail.com','Active','2026-08-31 09:28:02.440377',0,'ratnalakunta , pedavegi mandal , eluru district , 534475','','','',NULL,NULL,'Bhargava@123','CUSTOMER ACCOUNT','Male','Individual Account','','','','','',NULL,NULL),(3,NULL,'Suresh Suresh','7981882513','sureshnuthangi999@gmail.com','Active','2026-09-11 08:09:53.967237',662,'','','','','Suresh','Suresh','Suresh@123','CUSTOMER ACCOUNT','Male','Individual Account','-','-','-','-','-','\"Ratnalakunta, Pedavegi Mandal, Eluru District, Andhra Pradesh, 534475, Pedavegi Mandal, Eluru District, 534475, India\"','\"Ratnalakunta, Pedavegi Mandal, Eluru District, Andhra Pradesh, 534475, Pedavegi Mandal, Eluru District, 534475, India\"'),(4,NULL,'Kurapati Bhargava','7386999881','bhargavakurapati49@gmail.com','Active','2026-09-11 11:32:13.565289',2855,'','','','','Kurapati','Bhargava','Bhargava@1236','CUSTOMER ACCOUNT','Male','Individual Account','','','','','','\"sai nagar colony, kushaiguda, hyderabad, telangana, 500062, India\"','\"sai nagar colony, kushaiguda, hyderabad, telangana, 500062, India\"'),(5,NULL,'suresh','98763458798','suresh@gmail.com','Active','2026-09-18 08:16:00.541255',0,'rodeno 5,kphp,hyderabad','','','','suresh','','','CUSTOMER ACCOUNT','Male','Individual Account','','','','','','',''),(6,NULL,'ramesh','9856784567','ramesh@gmail.com','Active','2026-09-18 08:30:54.777990',0,'prasanth nagar,yadagirigutta,telangana','','','','ramesh','','','CUSTOMER ACCOUNT','Male','Individual Account','','','','','','','');
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `growthjourneys`
--

DROP TABLE IF EXISTS `growthjourneys`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `growthjourneys` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Year` varchar(20) NOT NULL,
  `Business` double NOT NULL DEFAULT '0',
  `Products` double NOT NULL DEFAULT '0',
  `Customers` double NOT NULL DEFAULT '0',
  `Sales` double NOT NULL DEFAULT '0',
  `UpdatedAt` datetime NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `Year` (`Year`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `growthjourneys`
--

LOCK TABLES `growthjourneys` WRITE;
/*!40000 ALTER TABLE `growthjourneys` DISABLE KEYS */;
INSERT INTO `growthjourneys` VALUES (1,'2022',20,15,24,18,'2026-09-15 04:34:53'),(2,'2023',30,28,34,29,'2026-09-15 04:34:53'),(3,'2024',45,43,47,42,'2026-09-15 04:34:53'),(4,'2025',60,59,63,58,'2026-09-15 04:34:53'),(5,'2026',80,78,82,76,'2026-09-15 04:34:53');
/*!40000 ALTER TABLE `growthjourneys` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `manualpayments`
--

DROP TABLE IF EXISTS `manualpayments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `manualpayments` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `OrderId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `UtrNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AmountPaid` decimal(65,30) NOT NULL,
  `PaymentDate` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PaymentTime` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CustomerName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `MobileNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ScreenshotUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `VerificationStatus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SubmittedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `manualpayments`
--

LOCK TABLES `manualpayments` WRITE;
/*!40000 ALTER TABLE `manualpayments` DISABLE KEYS */;
/*!40000 ALTER TABLE `manualpayments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notifications` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `IsRead` tinyint(1) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=227 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (197,'Coupon Created','New coupon \'MONSOON20\' created.','CouponCreated','2026-09-17 05:14:31.838198',1),(198,'Coupon Created','New coupon \'MONSOON30\' created.','CouponCreated','2026-09-17 05:17:35.858813',1),(199,'New Product Added','Product \'Honeywell High-Efficiency Mono Solar Panel 200W\' added in Solar panels & Flexible Solar Panels.','NewProduct','2026-09-17 06:37:53.701596',1),(200,'New Order Placed','Order #ORD-1789627346927 placed by customer Kurapati Bhargava (Total: INR 12,499.00).','NewOrder','2026-09-17 06:42:28.905425',1),(201,'Coupon Created','New coupon \'NEWUSER40\' created.','CouponCreated','2026-09-17 08:36:15.362710',1),(202,'New Order Placed','Order #ORD-1789634265251 placed by customer Kurapati Bhargava (Total: INR 16,499.00).','NewOrder','2026-09-17 08:37:46.832009',1),(203,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 04:15:58.982438',1),(204,'Supplier removed','Supplier \'harish\' removed from catalog.','SupplierDeleted','2026-09-21 04:21:08.440844',1),(205,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 04:21:46.867463',1),(206,'New Supplier Category Added','Supplier category \'Testing Category\' was created.','SupplierCategoryCreated','2026-09-21 04:53:16.325200',1),(207,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 04:53:18.950700',1),(208,'Supplier Category Deleted','Supplier category \'Testing Category\' was deleted.','SupplierCategoryDeleted','2026-09-21 04:53:27.217081',1),(209,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 05:04:49.485478',1),(210,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 05:49:12.144395',1),(211,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 05:49:41.542413',1),(212,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 05:49:51.888448',1),(213,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 05:53:37.414267',1),(214,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 06:31:03.451061',1),(215,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 07:43:21.385873',1),(216,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 07:44:46.554121',1),(217,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 07:51:14.773307',1),(218,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 07:51:34.223989',1),(219,'New Supplier added','Supplier \'Suresh Enterprise\' added by administrator.','NewSupplier','2026-09-21 07:53:28.713637',1),(220,'Supplier Profile updated','Supplier \'Suresh Enterprise\' profile details updated.','SupplierUpdated','2026-09-21 07:53:44.582382',1),(221,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 08:20:41.000215',1),(222,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 08:26:35.815415',1),(223,'Supplier Profile updated','Supplier \'nandhitha\' profile details updated.','SupplierUpdated','2026-09-21 09:28:15.695962',0),(224,'Supplier Profile updated','Supplier \'Suresh Enterprise\' profile details updated.','SupplierUpdated','2026-09-21 11:52:35.801158',0),(225,'Supplier Profile updated','Supplier \'Suresh Enterprise\' profile details updated.','SupplierUpdated','2026-09-21 11:53:18.243173',0),(226,'Staff Added','Suresh nuthangi has been registered as manager.','StaffAdded','2026-09-21 12:00:16.178127',0);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offers`
--

DROP TABLE IF EXISTS `offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `offers` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Title` varchar(255) NOT NULL,
  `Category` varchar(100) NOT NULL,
  `BadgeTag` varchar(50) NOT NULL DEFAULT 'SPECIAL PRICE',
  `OriginalPrice` decimal(18,2) NOT NULL DEFAULT '0.00',
  `DealPrice` decimal(18,2) NOT NULL DEFAULT '0.00',
  `DiscountPercentage` int NOT NULL DEFAULT '0',
  `Description` text,
  `ImageUrl` varchar(500) DEFAULT NULL,
  `EndDate` datetime NOT NULL,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `DisplayOrder` int NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL,
  `ProductId` int DEFAULT NULL,
  `DealType` varchar(50) NOT NULL DEFAULT 'ProductOffer',
  `CategoryId` int DEFAULT NULL,
  `SubcategoryId` int DEFAULT NULL,
  `DiscountType` varchar(50) NOT NULL DEFAULT 'Percentage',
  `DiscountValue` decimal(18,2) NOT NULL DEFAULT '0.00',
  `StartDate` datetime DEFAULT NULL,
  `ImageSource` varchar(50) NOT NULL DEFAULT 'CustomBanner',
  `IsFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `ShowDiscountBadge` tinyint(1) NOT NULL DEFAULT '1',
  `ShowCountdownTimer` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=37 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offers`
--

LOCK TABLES `offers` WRITE;
/*!40000 ALTER TABLE `offers` DISABLE KEYS */;
INSERT INTO `offers` VALUES (34,'Commercial & Industrial Solar Kits 50.31 kW 3 Phase Commercial Solar Kit','Solar kit','SPECIAL PRICE',1224999.00,734999.00,40,'The WAAREE 50.31 kW 3-Phase Commercial Solar Kit is a high-capacity rooftop solar solution designed for commercial and industrial applications. It uses advanced TOPCon Non-DCR solar technology to provide efficient and reliable power generation for businesses, offices, factories, and institutions while helping reduce dependence on grid electricity and long-term energy costs','/uploads/images/bb1b7a39-415c-4879-b491-88644344776f.png','2026-10-19 23:59:00',1,1,'2026-09-16 17:01:10',40,'ProductOffer',NULL,NULL,'Percentage',40.00,NULL,'CustomBanner',0,1,1),(35,'12MP Acusense Powered by Darkfighter Fixed Bullet Network Camera','Network Cameras','25% OFF',4300.00,3225.00,25,'UHD: Ultra High Definition delivers lifelike immersion\r\nExcellent low-light performance via Powered by DarkFighter','/uploads/images/116249af-0b8b-4f96-af80-9c012839d7fb.png?v=1789621775900','2026-10-17 23:59:00',1,1,'2026-09-17 05:10:06',11,'ProductOffer',NULL,NULL,'Percentage',25.00,NULL,'CustomBanner',0,1,1),(36,'Honeywell 5W Small Solar Panel','Solar panels','LIMITED TIME',799.00,400.00,50,'Compact 5W solar panel designed for small electronic devices, lighting and low-power applications.','/uploads/images/42da077e-e080-4251-8ee8-da43337794c5.png?v=1789621775898','2026-10-18 23:59:00',1,1,'2026-09-17 05:11:10',38,'ProductOffer',NULL,NULL,'Percentage',50.00,NULL,'CustomBanner',0,1,1);
/*!40000 ALTER TABLE `offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_success`
--

DROP TABLE IF EXISTS `order_success`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `order_success` (
  `OrderId` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CustomerAddressId` int NOT NULL,
  `TotalAmount` decimal(65,30) NOT NULL,
  `PaymentMethod` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `OrderStatus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `OrderDate` datetime(6) NOT NULL,
  `IsTrackEnabled` tinyint(1) NOT NULL,
  `UpiId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CardNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `NameOnCard` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ExpiryDate` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `BankName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `TransactionId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PaymentStatus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`OrderId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_success`
--

LOCK TABLES `order_success` WRITE;
/*!40000 ALTER TABLE `order_success` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_success` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orderitems`
--

DROP TABLE IF EXISTS `orderitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orderitems` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `OrderId` int NOT NULL,
  `ProductId` int NOT NULL,
  `ProductName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProductCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CategoryName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `UnitPrice` decimal(18,2) NOT NULL,
  `Quantity` int NOT NULL,
  `LineTotal` decimal(18,2) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_orderitems_OrderId` (`OrderId`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orderitems`
--

LOCK TABLES `orderitems` WRITE;
/*!40000 ALTER TABLE `orderitems` DISABLE KEYS */;
INSERT INTO `orderitems` VALUES (1,1,1,'Manual Invoice Charges','SERV-001','Services',2450.00,1,2450.00),(2,2,8,'2MP ColorVu 3.0 Fixed PT Camera','HW-CCTV-TUR-2MP-001','Turbo HD Cameras',4000.00,1,4000.00),(3,2,9,'12MP Acusense Powered by Darkfighter Fixed Bullet Network Camera','HW-CCTV-PRO-12MP-001','Network Cameras',3000.00,1,3000.00),(4,3,1,'Honeywell CCTV Camera','SKU-1','General',2499.50,2,4999.00),(5,4,39,'Honeywell 20W Small Solar Panel','HW-SOL-SMA-20W-001','Solar panels',2199.00,1,2199.00),(6,5,44,'Honeywell 100W Flexible Solar Panel','HW-SOL-PNL-100W-002','Solar panels',8999.00,1,8999.00),(7,6,45,'Honeywell 200W Flexible Solar Panel','HW-SOL-PNL-200W-002','Solar panels',16999.00,1,16999.00),(8,7,47,'Honeywell High-Efficiency Mono Solar Panel 200W','HW-SOL-PNL-200W-003','Solar panels',12999.00,1,12999.00),(9,8,45,'Honeywell 200W Flexible Solar Panel','HW-SOL-PNL-200W-002','Solar panels',16999.00,1,16999.00),(10,9,1,'Manual Invoice Charges','SERV-001','Services',16999.00,1,16999.00),(11,10,1,'Manual Invoice Charges','SERV-001','Services',1000.00,1,1000.00),(12,11,1,'Manual Invoice Charges','SERV-001','Services',1000.00,1,1000.00),(13,12,1,'Manual Invoice Charges','SERV-001','Services',326999.00,1,326999.00),(14,13,1,'Manual Invoice Charges','SERV-001','Services',326999.00,1,326999.00);
/*!40000 ALTER TABLE `orderitems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CustomerId` int NOT NULL,
  `OrderNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `OrderDate` datetime(6) NOT NULL,
  `TotalAmount` decimal(18,2) NOT NULL,
  `DiscountAmount` decimal(18,2) NOT NULL,
  `ShippingFee` decimal(18,2) NOT NULL,
  `GstAmount` decimal(18,2) NOT NULL,
  `FinalAmount` decimal(18,2) NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PaymentStatus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PaymentMethod` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ShippingAddress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `TrackingNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CarrierName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PackerName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PackerPhotoUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PackagePhotoUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`Id`),
  KEY `IX_Orders_CustomerId` (`CustomerId`),
  CONSTRAINT `FK_Orders_Customers_CustomerId` FOREIGN KEY (`CustomerId`) REFERENCES `customers` (`Id`) ON DELETE RESTRICT
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,1,'ORD-211406','2026-08-31 00:00:00.000000',2450.00,0.00,0.00,441.00,2891.00,'Cancelled','Paid','Net Banking / NEFT / RTGS','ratnalakunta , pedavegi mandal , eluru district , 534475','','','Official tax invoice issued by Shyam Agro Tools for high-quality agricultural equipment, machinery, and farm supplies. Subject to standard commercial warranty and sales terms.',NULL,NULL),(2,3,'ORD-20260911-49019','2026-09-11 12:54:03.421023',7000.00,0.00,0.00,1260.00,8260.00,'Cancelled','Pending','Cash on Delivery','\"Ratnalakunta, Pedavegi Mandal, Eluru District, Andhra Pradesh, 534475, Pedavegi Mandal, Eluru District, 534475, India\", Pedavegi Mandal, Eluru District, 534475','','',NULL,NULL,NULL),(3,3,'ORD-1726059899','2026-09-11 13:12:05.327458',4999.00,0.00,0.00,899.82,4999.00,'Cancelled','Pending','Cash on Delivery','101, Hitech City, Madhapur, Hyderabad, 500081','','',NULL,NULL,NULL),(4,4,'ORD-1789466167753','2026-09-15 09:56:12.883940',2199.00,0.00,0.00,395.82,2199.00,'Cancelled','Pending','Cash on Delivery','\"India\", yadagirigutta, telangana, 508115','','',NULL,NULL,NULL),(5,4,'ORD-1789466468576','2026-09-15 10:01:13.886886',8999.00,0.00,0.00,1619.82,8999.00,'Cancelled','Pending','Cash on Delivery','\"India\", yadagirigutta, telangana, 508115','','',NULL,NULL,NULL),(6,4,'ORD-1789535025727','2026-09-16 05:04:00.831210',16999.00,0.00,0.00,3059.82,16999.00,'Cancelled','Pending','Cash on Delivery','\"India\", yadagirigutta, telangana, 508115','','',NULL,NULL,NULL),(7,4,'ORD-1789627346927','2026-09-17 06:42:28.760892',12499.00,0.00,0.00,2249.82,12499.00,'Cancelled','Pending','Cash on Delivery','\"India\", hyderabad, telangana, 500062','','',NULL,NULL,NULL),(8,4,'ORD-1789634265251','2026-09-17 08:37:46.830166',16499.00,0.00,0.00,2969.82,16499.00,'Cancelled','Pending','Cash on Delivery','\"India\", yadagirigutta, telangana, 508115','','',NULL,NULL,NULL),(9,1,'ORD-203641','2026-09-18 00:00:00.000000',16999.00,0.00,0.00,3059.82,20058.82,'Cancelled','Paid','Net Banking / NEFT / RTGS','kphb,hyderabad , telangana,500072','','','Official tax invoice issued by Honeywell for high-quality security, surveillance, and electronic equipment. Subject to standard commercial warranty and sales terms.',NULL,NULL),(10,5,'ORD-457894','2026-09-18 08:16:00.969042',1000.00,0.00,50.00,180.00,1230.00,'Pending','Pending','COD','rodeno 5,kphp,hyderabad','','',NULL,NULL,NULL),(11,5,'ORD-336886','2026-09-18 08:16:11.344096',1000.00,0.00,50.00,180.00,1230.00,'Pending','Pending','COD','rodeno 5,kphp,hyderabad','','',NULL,NULL,NULL),(12,6,'ORD-714527','2026-09-18 00:00:00.000000',326999.00,0.00,0.00,58859.82,385858.82,'Pending','Pending','UPI / Bank Transfer','prasanth nagar,yadagirigutta,telangana','','','Official tax invoice issued by Honeywell for high-quality security, surveillance, and electronic equipment. Subject to standard commercial warranty and sales terms.',NULL,NULL),(13,6,'ORD-291484','2026-09-18 00:00:00.000000',326999.00,0.00,0.00,58859.82,385858.82,'Pending','Pending','UPI / Bank Transfer','prashanth nagar ,yadagirigutta','','','Official tax invoice issued by Honeywell for high-quality security, surveillance, and electronic equipment. Subject to standard commercial warranty and sales terms.',NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordertrackinglogs`
--

DROP TABLE IF EXISTS `ordertrackinglogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ordertrackinglogs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `OrderId` int NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordertrackinglogs`
--

LOCK TABLES `ordertrackinglogs` WRITE;
/*!40000 ALTER TABLE `ordertrackinglogs` DISABLE KEYS */;
INSERT INTO `ordertrackinglogs` VALUES (1,0,'Processing','Order #ORD-1726059899 placed successfully via Cash on Delivery.','2026-09-11 13:12:05.612620'),(2,0,'Processing','Order #ORD-1789466167753 placed successfully via Cash on Delivery.','2026-09-15 09:56:13.048702'),(3,4,'Cancelled','Order cancelled. Reverting stock allocation.','2026-09-15 09:59:07.334882'),(4,0,'Processing','Order #ORD-1789466468576 placed successfully via Cash on Delivery.','2026-09-15 10:01:13.913141'),(5,5,'Packed','Order items are packed, labeled, and prepared for carrier pickup.','2026-09-15 10:01:57.765301'),(6,5,'Shipped','Package has been handed over to logistics provider and is in transit.','2026-09-15 10:02:18.208019'),(7,0,'Processing','Order #ORD-1789535025727 placed successfully via Cash on Delivery.','2026-09-16 05:04:01.038438'),(8,0,'Processing','Order #ORD-1789627346927 placed successfully via Cash on Delivery.','2026-09-17 06:42:28.890917'),(9,0,'Processing','Order #ORD-1789634265251 placed successfully via Cash on Delivery.','2026-09-17 08:37:46.831989');
/*!40000 ALTER TABLE `ordertrackinglogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partnerapplications`
--

DROP TABLE IF EXISTS `partnerapplications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partnerapplications` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CompanyName` varchar(255) NOT NULL,
  `GstinNumber` varchar(100) DEFAULT NULL,
  `ContactPerson` varchar(255) NOT NULL,
  `BusinessType` varchar(100) NOT NULL DEFAULT 'Distributor',
  `Mobile` varchar(50) NOT NULL,
  `Email` varchar(255) NOT NULL,
  `City` varchar(100) NOT NULL,
  `State` varchar(100) NOT NULL,
  `YearsInBusiness` varchar(50) DEFAULT NULL,
  `Address` text NOT NULL,
  `Description` text,
  `AgreedToTerms` tinyint(1) NOT NULL DEFAULT '1',
  `Status` varchar(50) NOT NULL DEFAULT 'Pending',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partnerapplications`
--

LOCK TABLES `partnerapplications` WRITE;
/*!40000 ALTER TABLE `partnerapplications` DISABLE KEYS */;
INSERT INTO `partnerapplications` VALUES (1,'Apex Security Systems','36AAACG9876F1Z2','Charan Bhaskar','System Integrator','9876543210','charanbhaskar4455@gmail.com','Hyderabad','Telangana','5 Years','101, Hitech City, Madhapur','System Integrator offering enterprise CCTV camera solutions and commercial solar kit installations.',1,'Pending','2026-09-15 06:19:29'),(2,'Apex Partner Solutions','36AAACG5555F1Z9','Rahul Kumar','Distributor','9123456789','rahul.partner@example.com','Chennai','Tamil Nadu','4 Years','45 Anna Salai','Security & Solar Equipment distribution partner',1,'Pending','2026-09-15 07:22:28'),(3,'Apex Security Systems','36AAACG9876F1Z2','Charan Bhaskar','System Integrator','9876543210','charanbhaskar4455@gmail.com','Hyderabad','Telangana','5 Years','101, Hitech City, Madhapur','System Integrator offering enterprise CCTV camera solutions and commercial solar kit installations.',1,'Pending','2026-09-15 08:56:30'),(4,'Sri Sai CCTV & Security Integrators','36AAACG9876F1Z2','Ramesh Varma','CCTV Installer','9876543210','charanbhaskar4455@gmail.com','Hyderabad','Telangana','6 Years','204, Madhapur Main Road, Hitech City, Hyderabad','Looking for official partnership as CCTV Installer and System Integrator for Honeywell surveillance range.',1,'Pending','2026-09-15 09:48:03'),(5,'Distributor Test Co','36AAACG1234F1Z5','Bhargava Kurapati','Distributor','9876543210','bhargavakurapati49@gmail.com','Hyderabad','Telangana','5 Years','Hitech City, Hyderabad','Distributor partnership application',1,'Pending','2026-09-16 04:33:38'),(6,'Distributor Test Co','36AAACG1234F1Z5','Bhargava Kurapati','Distributor','9876543210','bhargavakurapati49@gmail.com','Hyderabad','Telangana','5 Years','Hitech City, Hyderabad','Distributor partnership application',1,'Pending','2026-09-16 04:40:51'),(7,'Reseller Tech Pvt Ltd','36AAACG5555F1Z9','Bhargava Kurapati','Reseller','9876543210','bhargavakurapati49@gmail.com','Hyderabad','Telangana','4 Years','Banjarahills, Hyderabad','Reseller application for security products',1,'Pending','2026-09-16 04:41:03'),(8,'Smart CCTV Installers','36AAACG6666F1Z8','Bhargava Kurapati','CCTV Installer','9876543210','bhargavakurapati49@gmail.com','Hyderabad','Telangana','3 Years','Madhapur, Hyderabad','CCTV Installer application for Honeywell products',1,'Pending','2026-09-16 04:41:15'),(9,'Enterprise Integrators India','36AAACG7777F1Z7','Bhargava Kurapati','System Integrator','9876543210','bhargavakurapati49@gmail.com','Hyderabad','Telangana','8 Years','Gachibowli, Hyderabad','System Integrator application for Honeywell enterprise solutions',1,'Pending','2026-09-16 04:41:26'),(10,'Channel Alliance Group','36AAACG8888F1Z6','Bhargava Kurapati','Channel Partner','9876543210','bhargavakurapati49@gmail.com','Hyderabad','Telangana','5 Years','Kondapur, Hyderabad','Channel Partner application',1,'Pending','2026-09-16 04:41:36'),(11,'Distributor Test Co','36AAACG1234F1Z5','Bhargava Kurapati','Distributor','9876543210','bhargavakurapati49@gmail.com','Hyderabad','Telangana','5 Years','Hitech City, Hyderabad','Distributor partnership application',1,'Pending','2026-09-16 04:44:49'),(12,'Test Dealer Company','36AAACG1234F1Z5','Test Person','Dealer','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Dealer',1,'Pending','2026-09-16 05:20:31'),(13,'Test Distributor Company','36AAACG1234F1Z5','Test Person','Distributor','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Distributor',1,'Pending','2026-09-16 05:20:35'),(14,'Test Reseller Company','36AAACG1234F1Z5','Test Person','Reseller','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Reseller',1,'Pending','2026-09-16 05:20:38'),(15,'Test CCTV Installer Company','36AAACG1234F1Z5','Test Person','CCTV Installer','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: CCTV Installer',1,'Pending','2026-09-16 05:20:42'),(16,'Test System Integrator Company','36AAACG1234F1Z5','Test Person','System Integrator','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: System Integrator',1,'Pending','2026-09-16 05:20:45'),(17,'Test Channel Partner Company','36AAACG1234F1Z5','Test Person','Channel Partner','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Channel Partner',1,'Pending','2026-09-16 05:20:49'),(18,'Test Franchise / Business Opportunity Company','36AAACG1234F1Z5','Test Person','Franchise / Business Opportunity','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Franchise / Business Opportunity',1,'Pending','2026-09-16 05:20:53'),(19,'Test Other Company','36AAACG1234F1Z5','Test Person','Other','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Other',1,'Pending','2026-09-16 05:20:56'),(20,'Test Dealer Company','36AAACG1234F1Z5','Test Person','Dealer','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Dealer',1,'Pending','2026-09-16 05:21:00'),(21,'Test Distributor Company','36AAACG1234F1Z5','Test Person','Distributor','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Distributor',1,'Pending','2026-09-16 05:21:03'),(22,'Test Reseller Company','36AAACG1234F1Z5','Test Person','Reseller','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Reseller',1,'Pending','2026-09-16 05:21:07'),(23,'Test CCTV Installer Company','36AAACG1234F1Z5','Test Person','CCTV Installer','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: CCTV Installer',1,'Pending','2026-09-16 05:21:10'),(24,'Test System Integrator Company','36AAACG1234F1Z5','Test Person','System Integrator','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: System Integrator',1,'Pending','2026-09-16 05:21:13'),(25,'Test Channel Partner Company','36AAACG1234F1Z5','Test Person','Channel Partner','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Channel Partner',1,'Pending','2026-09-16 05:21:17'),(26,'Test Franchise / Business Opportunity Company','36AAACG1234F1Z5','Test Person','Franchise / Business Opportunity','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Franchise / Business Opportunity',1,'Pending','2026-09-16 05:21:20'),(27,'Test Other Company','36AAACG1234F1Z5','Test Person','Other','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Other',1,'Pending','2026-09-16 05:21:24'),(28,'Test Dealer Company','36AAACG1234F1Z5','Test Person','Dealer','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Dealer',1,'Pending','2026-09-16 05:21:27'),(29,'Test Distributor Company','36AAACG1234F1Z5','Test Person','Distributor','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Distributor',1,'Pending','2026-09-16 05:21:30'),(30,'Test Reseller Company','36AAACG1234F1Z5','Test Person','Reseller','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Reseller',1,'Pending','2026-09-16 05:21:34'),(31,'Test CCTV Installer Company','36AAACG1234F1Z5','Test Person','CCTV Installer','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: CCTV Installer',1,'Pending','2026-09-16 05:21:37'),(32,'Test System Integrator Company','36AAACG1234F1Z5','Test Person','System Integrator','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: System Integrator',1,'Pending','2026-09-16 05:21:41'),(33,'Test Channel Partner Company','36AAACG1234F1Z5','Test Person','Channel Partner','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Channel Partner',1,'Pending','2026-09-16 05:21:44'),(34,'Test Franchise / Business Opportunity Company','36AAACG1234F1Z5','Test Person','Franchise / Business Opportunity','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Franchise / Business Opportunity',1,'Pending','2026-09-16 05:21:47'),(35,'Test Other Company','36AAACG1234F1Z5','Test Person','Other','9876543210','test@example.com','Hyderabad','Telangana','3 Years','Test Address 123','Testing application submission for partner type: Other',1,'Pending','2026-09-16 05:21:51'),(36,'Nandhitha  Enterprise',NULL,'Nandhitha','Distributor','9845678678','Nandhitha@gmail.com','Hyderabad','Telangana','5','Hyderabad','iam intrestend ,Tell Us About Your Business',1,'Pending','2026-09-16 05:45:06'),(37,'Bhargava Enrprise',NULL,'Bhargava','Reseller','7345679876','Bhargava@gmail.com','hyderabad','telangana','3','hyderabad','Tell Us About Your Business',1,'Pending','2026-09-16 05:47:34'),(38,'BHARGAVA',NULL,'BHARGAVA','Franchise / Business Opportunity','7336837748','BHARGAVA@GMAIL.COM','YGT','TS','2','YGT','',1,'Pending','2026-09-16 05:48:45'),(39,'Test Partner Inc',NULL,'Jane Doe','Distributor','9876543210','partner@example.com','Delhi','Delhi',NULL,'123 Business St',NULL,1,'Pending','2026-09-16 07:53:03'),(40,'Verify Partner Co',NULL,'Alex Verification','Distributor','9876543210','partner.verify@example.com','Mumbai','Maharashtra',NULL,'123 Main Street, Suite 100',NULL,1,'Pending','2026-09-16 08:13:12'),(41,'bhargava',NULL,'bhargava','Distributor','9845865678','bhargava@gmail.com','ygt','ts','1','ygt','',1,'Pending','2026-09-16 12:39:23');
/*!40000 ALTER TABLE `partnerapplications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partnerusers`
--

DROP TABLE IF EXISTS `partnerusers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `partnerusers` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CompanyName` varchar(200) NOT NULL,
  `ContactPerson` varchar(200) NOT NULL,
  `Email` varchar(200) NOT NULL,
  `Phone` varchar(50) NOT NULL,
  `Password` varchar(255) NOT NULL,
  `Gstin` varchar(100) NOT NULL,
  `PartnerType` varchar(100) NOT NULL DEFAULT 'Distributor',
  `Status` varchar(50) NOT NULL DEFAULT 'Active',
  `TotalCommissionEarned` decimal(18,2) NOT NULL DEFAULT '0.00',
  `TotalOrdersPlaced` int NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partnerusers`
--

LOCK TABLES `partnerusers` WRITE;
/*!40000 ALTER TABLE `partnerusers` DISABLE KEYS */;
/*!40000 ALTER TABLE `partnerusers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productenquiries`
--

DROP TABLE IF EXISTS `productenquiries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productenquiries` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Product` varchar(255) NOT NULL,
  `Name` varchar(255) NOT NULL,
  `MobileNumber` varchar(50) NOT NULL,
  `Email` varchar(255) DEFAULT NULL,
  `Status` varchar(50) NOT NULL DEFAULT 'Pending',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productenquiries`
--

LOCK TABLES `productenquiries` WRITE;
/*!40000 ALTER TABLE `productenquiries` DISABLE KEYS */;
INSERT INTO `productenquiries` VALUES (1,'Waaree Radiance-Lite 3 kW Hybrid Solar Kit (3.075 kW)','Venkatesh Rao','9876543210','venkatesh.rao@gmail.com','Pending','2026-09-15 06:20:07'),(2,'Honeywell IP Bullet Camera 4MP','Priya Sharma','9888877777','priya.sharma@example.com','Pending','2026-09-15 07:22:29'),(3,'Waaree Radiance-Lite 3 kW Hybrid Solar Kit (3.075 kW)','Venkatesh Rao','9876543210','venkatesh.rao@gmail.com','Pending','2026-09-15 08:56:42'),(4,'Honeywell 100W Flexible Solar Panel','rajesh','9834687656','rajesh@gmail.com','Pending','2026-09-15 09:31:20'),(5,'Honeywell 200W Flexible Solar Panel','BHARGAVA','8765497865','','Pending','2026-09-16 05:50:47');
/*!40000 ALTER TABLE `productenquiries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productfeatures`
--

DROP TABLE IF EXISTS `productfeatures`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productfeatures` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ProductId` int NOT NULL,
  `Feature` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_ProductFeatures_ProductId` (`ProductId`),
  CONSTRAINT `FK_ProductFeatures_Products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productfeatures`
--

LOCK TABLES `productfeatures` WRITE;
/*!40000 ALTER TABLE `productfeatures` DISABLE KEYS */;
/*!40000 ALTER TABLE `productfeatures` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productimages`
--

DROP TABLE IF EXISTS `productimages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productimages` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ProductId` int NOT NULL,
  `ImageUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_ProductImages_ProductId` (`ProductId`),
  CONSTRAINT `FK_ProductImages_Products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=561 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productimages`
--

LOCK TABLES `productimages` WRITE;
/*!40000 ALTER TABLE `productimages` DISABLE KEYS */;
INSERT INTO `productimages` VALUES (35,8,'https://wildlife-unwieldy-devotee.ngrok-free.dev/uploads/images/0a018f4c-70ac-47f6-9774-bce991d77e46.jpg'),(36,8,'https://wildlife-unwieldy-devotee.ngrok-free.dev/uploads/images/fcd51f3b-b033-4dd3-8c6f-3cacc1b56522.jpg'),(37,8,'https://wildlife-unwieldy-devotee.ngrok-free.dev/uploads/images/1f188220-52f3-40a5-af37-aac95179e0c4.png'),(38,8,'https://wildlife-unwieldy-devotee.ngrok-free.dev/uploads/images/23227e14-254a-4c06-8ba8-b41c57c9dc1e.jpg'),(149,16,'/uploads/images/aec7029b-4cb5-416b-b96f-9d7bc133b620.png'),(150,16,'/uploads/images/1598927e-bdbf-481e-9457-ee8866268444.png'),(151,16,'/uploads/images/2c6572f9-ecba-4376-bac6-087b8433164c.png'),(152,16,'/uploads/images/e70ffb38-5ed8-4ffe-b471-0215d67d9960.png'),(153,16,'/uploads/images/018df6b1-3b3f-4489-8261-38233f27ddfa.png'),(154,16,'/uploads/images/3ccf5d89-e0b4-4dde-8be9-111ff75dc63e.png'),(155,16,'/uploads/images/9b6530ad-c4b7-4c19-84de-04193453327c.png'),(239,24,'/uploads/images/a1f1d795-ceca-405d-b804-7ab6faa6b76d.jpg'),(240,24,'/uploads/images/bdc93327-0b1a-4333-90e6-8b9b69b18ada.jpg'),(241,24,'/uploads/images/bd1a1404-eb7c-42a4-9dfe-bbec26ce3133.jpg'),(242,24,'/uploads/images/8ba60cd1-b785-4d82-ba56-0621bd595192.jpg'),(243,24,'/uploads/images/10eabd8e-c538-4f1b-ae48-f49f2638a7e0.jpg'),(244,24,'/uploads/images/1fc97d8a-915a-4b17-bc0c-6784db1cb190.jpg'),(245,24,'/uploads/images/d8298a91-a70a-4c45-8435-c79dec28f413.jpg'),(246,24,'/uploads/images/262e3ed8-1df8-49ef-9685-ee931afdc431.jpg'),(247,24,'/uploads/images/57cb5eab-51d9-4e39-95e5-919b663826fb.jpg'),(248,24,'/uploads/images/d0bc8bf4-3a72-40dc-b080-7e322098ffd6.jpg'),(249,24,'/uploads/images/1ed02061-9823-4419-83a1-12418c849b2f.jpg'),(250,24,'/uploads/images/15f02288-f3ee-4101-8657-afd249c22596.jpg'),(251,24,'/uploads/images/fed877ab-38e1-4abb-a114-d86bcf52538e.jpg'),(252,25,'/uploads/images/20395f5d-bb0b-418c-bde5-ffb724bb99a1.png'),(253,25,'/uploads/images/6f34683b-1e4d-4744-ad07-c7aea1e099c9.png'),(254,25,'/uploads/images/d37cb761-725a-439e-81d9-599a7e2a270a.png'),(255,25,'/uploads/images/32f5f90c-4418-42c1-9313-301cac66c588.png'),(256,25,'/uploads/images/58863f9b-fbec-4b8e-b3c1-1332d31a62b5.png'),(257,25,'/uploads/images/474d6470-a968-4846-b254-eed07e0d8c70.png'),(258,25,'/uploads/images/46985a76-b25c-4400-88bd-bf8908605ac5.png'),(259,25,'/uploads/images/5176865b-5b68-4aa0-98a3-2ea0ae0fd345.png'),(260,25,'/uploads/images/d846da54-8913-4bd1-82d8-5b41c9c04498.png'),(261,25,'/uploads/images/5646ef38-ccd3-4f18-a5f7-adfbe2de0fd7.png'),(262,25,'/uploads/images/19067bb2-26ba-4ec6-9a27-7d911cead137.png'),(263,25,'/uploads/images/e2d28b80-3e4a-4282-8ab4-14a93848533c.png'),(264,25,'/uploads/images/5ab3b1c7-ec51-4a44-b3ae-ba306f735022.png'),(373,35,'/uploads/images/54e82fb2-42fb-4c83-a708-4dc38bc81929.png'),(374,35,'/uploads/images/b2118812-6c86-4b1b-93ee-18e41b29c726.png'),(375,35,'/uploads/images/2cc4763b-45ba-455a-9108-090ea98f3aae.png'),(376,35,'/uploads/images/f12aef8f-74b7-407e-8832-1fd8049d3bcd.png'),(377,34,'/uploads/images/0f9be2e7-3d7e-415c-9802-e6c900d4bb1d.png'),(378,34,'/uploads/images/d6740fdb-4cd8-4025-873e-6ed087c1faf9.png'),(379,34,'/uploads/images/fee273a8-fd6b-4204-badd-30a9bb05c351.png'),(380,34,'/uploads/images/50805d78-6c4b-4828-933e-cfcf970acedd.png'),(381,36,'/uploads/images/21483ee0-a0b8-452e-b1ba-5d743d55e79c.png'),(382,36,'/uploads/images/940853c4-3b34-4d31-9637-b39d2f738843.png'),(383,36,'/uploads/images/c27dada6-e7c9-4034-b4a3-1e47add543a3.png'),(384,36,'/uploads/images/f170a55e-edf0-448c-8efe-1969e728c2b9.png'),(385,37,'/uploads/images/997c066b-9a42-4daa-b2c2-216b3bc5bb2f.png'),(386,37,'/uploads/images/52a14eaa-81cf-41a0-8bf8-198793eaca82.png'),(387,37,'/uploads/images/cd5d1922-de6f-4615-a1b7-f79e5d108824.png'),(388,37,'/uploads/images/f6bbe8a7-e809-4e21-8e75-e969585ceeb5.png'),(389,38,'/uploads/images/42da077e-e080-4251-8ee8-da43337794c5.png'),(390,38,'/uploads/images/1d098379-4777-4f3c-a68b-63a43e0a1079.png'),(391,38,'/uploads/images/edc79645-0dfa-4f64-9ff4-5258632c5bd3.png'),(392,38,'/uploads/images/702b9c9a-1aac-4808-9759-4320f196db30.png'),(393,39,'/uploads/images/d1f3b852-f921-4ee9-949a-1b8c85cb8877.png'),(394,39,'/uploads/images/8443e44f-3f41-466d-8711-a4df1f76b075.png'),(395,39,'/uploads/images/e598191c-01f4-4e39-bd87-418e3d8ea15d.png'),(396,39,'/uploads/images/e2171e1e-6681-448e-8ba3-f75229b3336f.png'),(397,40,'/uploads/images/bb1b7a39-415c-4879-b491-88644344776f.png'),(398,40,'/uploads/images/19514b7c-22fb-41fd-9179-65b51d172e15.png'),(399,40,'/uploads/images/032cf167-337b-4262-b002-d5db98e59d04.png'),(400,40,'/uploads/images/80957f25-15c8-434f-8947-56b4d03df44f.png'),(401,41,'/uploads/images/04e9483b-5bf0-46c7-ad84-eb2ddf3802fe.png'),(402,41,'/uploads/images/fa0a2d90-5672-40d3-9f6b-f2bcf26409a3.png'),(403,41,'/uploads/images/29242e44-3990-4a9d-962d-f9f28eb828c5.png'),(404,41,'/uploads/images/22222e27-37f4-4e8a-8e55-0093f3469f0e.png'),(405,42,'/uploads/images/463d05e6-dcad-4082-a60d-2510144fe273.png'),(406,42,'/uploads/images/61204a30-49e5-4091-9e09-285150184515.png'),(407,42,'/uploads/images/d0afdec5-54fd-44b8-a9cd-8b1b169f9813.png'),(408,42,'/uploads/images/0e0e17a8-e340-4620-9b37-c82044d8a906.png'),(409,10,'/uploads/images/3fdf5714-2bcb-4f81-af09-6905920f3261.png'),(410,10,'/uploads/images/0e5d5fc0-4e2d-4028-8c25-61f68898a58a.png'),(411,10,'/uploads/images/64336e21-af93-4a25-b5ac-cd3694d8ed29.png'),(412,10,'/uploads/images/03f2d7d1-757e-4084-be8e-d547081c7834.png'),(413,11,'/uploads/images/116249af-0b8b-4f96-af80-9c012839d7fb.png'),(414,11,'/uploads/images/000a79d9-5076-4816-abaa-9fcdb3a0b885.png'),(415,11,'/uploads/images/1606e116-dd43-40d9-bc64-29b6469445f2.png'),(416,11,'/uploads/images/945f8ab4-540b-414c-8eef-5f6ddad42a6a.png'),(417,12,'/uploads/images/26030e0a-697a-4507-b4f8-78e1c8c2c3ea.png'),(418,12,'/uploads/images/43951404-db0f-4878-8f95-f8a8a16edf20.png'),(419,12,'/uploads/images/7cf33763-2ba7-4f2c-8112-944fbc682c11.png'),(420,12,'/uploads/images/c5b9519b-738e-4857-85f3-af5a47db27f1.png'),(421,22,'/uploads/images/1023aa2c-5f0c-4d60-9bec-056205ff3354.png'),(422,22,'/uploads/images/28182df2-788b-4a09-98a7-52e624deff51.png'),(423,22,'/uploads/images/1edeebc3-f466-4ce9-a437-ccdc1cfb10df.png'),(424,22,'/uploads/images/06e66e99-6989-4f20-aa5b-75940f1d6976.png'),(425,21,'/uploads/images/2f4c92bf-bde7-468c-9d5b-1259bcf60ccd.png'),(426,21,'/uploads/images/a596b2dc-4887-4134-a825-f4da98e482aa.png'),(427,21,'/uploads/images/51d3771d-6017-4aa6-8038-7f4477e959c7.png'),(428,21,'/uploads/images/0120b700-8459-43f7-98fb-e5426b020304.png'),(429,19,'/uploads/images/4f50a0e5-0b71-4a24-8520-d392010cd0e6.png'),(430,19,'/uploads/images/bba657a5-d880-41fc-b2c8-2f1265350d80.png'),(431,19,'/uploads/images/80135cba-f28d-49f8-be5a-5fc5875b3551.png'),(432,19,'/uploads/images/c9b6b224-243f-43d0-8c6a-6b47c064e68a.png'),(433,18,'/uploads/images/36c9e6fb-f827-480a-9551-c81a91c5bb50.png'),(434,18,'/uploads/images/0d82145b-31bd-4606-90cf-a9963152ef5b.png'),(435,18,'/uploads/images/2aeb12ea-0db6-4ff6-8e26-e5c60cf09024.png'),(436,18,'/uploads/images/18355aaf-7951-4534-9d12-89fbe9d94cc3.png'),(437,17,'/uploads/images/2d08983c-bae5-447e-9b7d-42600948aa5a.png'),(438,17,'/uploads/images/17699808-6837-40de-9629-30f025ce3868.png'),(439,17,'/uploads/images/c6a66785-93d5-4719-95d7-063550527cb8.png'),(440,17,'/uploads/images/3f21bafd-5176-426e-8508-12f1cba4031a.png'),(441,15,'/uploads/images/66ae1218-281b-44e9-99c2-e5c08e665ed1.png'),(442,15,'/uploads/images/bc8e0116-9b35-43db-9787-0f6648f4e8a0.png'),(443,15,'/uploads/images/0c6baa67-bbfc-43bc-b2f5-c12146d62f0a.png'),(444,15,'/uploads/images/df52436d-e880-49ee-af8d-7d7043e89629.png'),(445,14,'/uploads/images/8a833eb8-e7b1-4b61-a8df-02533c4a1265.png'),(446,14,'/uploads/images/bc2f6bc2-0dee-41c5-82b7-0edac25601a6.png'),(447,14,'/uploads/images/c3a05a1e-cc5a-4145-95c5-f62877cbb9c4.png'),(448,14,'/uploads/images/b8949339-0003-47b6-a0bc-d359c3204cdf.png'),(449,13,'/uploads/images/7f193f05-596c-49fc-a702-fa3538d1b6f6.png'),(450,13,'/uploads/images/975e7247-88eb-4c70-b853-b4e5535ac964.png'),(451,13,'/uploads/images/e2d01281-206f-45eb-b76c-e1b4741bcfe0.png'),(452,13,'/uploads/images/de5725d8-b65b-4840-9487-35ae5395249b.png'),(469,28,'/uploads/images/267db683-6062-471d-b606-db89c3e3140c.png'),(470,28,'/uploads/images/e1363a49-95f9-4d7f-ae0f-77a178715bef.png'),(471,28,'/uploads/images/25761b38-3250-4476-b60c-9a35b411a64c.png'),(472,28,'/uploads/images/8fc041e3-0a91-47a0-bba9-8bfd2116e0ce.png'),(477,26,'/uploads/images/74c93e9e-f23e-4b26-912e-f54d8bc78397.png'),(478,26,'/uploads/images/ef65e359-3195-442b-88c4-6d7b5eff01b2.png'),(479,26,'/uploads/images/6dbc3338-6e5e-485b-90d7-07d699174e61.png'),(480,26,'/uploads/images/a6f94106-b2fa-4897-acbc-6ce2d6f99a78.png'),(481,23,'/uploads/images/587e4d5b-daf4-4eb5-811f-ed9fba007987.png'),(482,23,'/uploads/images/9da347ae-20a0-44c8-a0f9-5374ab46f874.png'),(483,23,'/uploads/images/a20a30ea-b7bd-4814-b620-513b2b83eb86.png'),(484,23,'/uploads/images/43b38d55-f715-4afe-afee-5d59c3b94051.png'),(489,43,'/uploads/images/801aa6bb-d0d0-4d7c-8b9b-9e490baefdc6.png'),(490,43,'/uploads/images/d7d6d752-95ed-4674-9e4e-af7dbac3d2cf.png'),(491,43,'/uploads/images/930d2588-b16c-495d-9b3c-13037e3c02ed.png'),(492,43,'/uploads/images/59434827-8e75-4aaa-919e-f1f16d7917a3.png'),(497,45,'/uploads/images/b8dac9fc-8096-4921-ac57-511601404ee2.png'),(498,45,'/uploads/images/75c7e88a-5a71-4976-826a-162de1e645bd.png'),(499,45,'/uploads/images/f838557d-5355-48a0-8be7-12a37303bf6d.png'),(500,45,'/uploads/images/17524dd8-a04a-4b46-afb4-be75a8d93b1f.png'),(501,9,'/uploads/images/0196cd8f-cde1-4bf3-b46a-54ea4c1265c4.png'),(502,9,'/uploads/images/3b71a27d-7de5-4174-a423-7d3466b81c24.png'),(503,9,'/uploads/images/782ec64d-e34c-4342-af53-32519cf55ea7.png'),(504,9,'/uploads/images/1835b81e-75d5-477a-ae87-ae0965e5fe49.png'),(521,47,'/uploads/images/4f1e1044-d36d-4721-bf38-53c0e5cb1691.png?v=1789627654057&v=1789628097022'),(522,47,'/uploads/images/39384c9a-e686-422a-b8dd-33881c0e9769.png?v=1789627654057&v=1789628097022'),(523,47,'/uploads/images/33aa7aaf-0077-4a6c-b5cc-e29071915a37.png?v=1789627654057&v=1789628097022'),(524,47,'/uploads/images/09f0e075-1824-47ad-94c7-e79887fc889e.png?v=1789627654057&v=1789628097022'),(525,32,'/uploads/images/3752e800-61ab-4307-9bf5-46054f9251a2.png?v=1789629751622'),(526,32,'/uploads/images/e86486d4-5d7f-4526-9e6e-6ba81e0ebab2.png?v=1789629751622'),(527,32,'/uploads/images/01f250f1-7f0b-4ef4-9e4d-e22a21d49445.png?v=1789629751622'),(528,32,'/uploads/images/d1dc4dfa-346b-4772-aee6-235662b52bc4.png?v=1789629751622'),(533,33,'/uploads/images/1dd51af8-d819-4dc1-840a-f4cbd19fd69c.png?v=1789629872247'),(534,33,'/uploads/images/0210c498-6e14-4cfa-b4e5-1cc60a23533e.png?v=1789629872247'),(535,33,'/uploads/images/257a49f9-a4e5-4ddb-ac2b-f1eac060d722.png?v=1789629872247'),(536,33,'/uploads/images/78e97d0f-dd39-4683-865d-f92f28041a90.png?v=1789629872247'),(541,44,'/uploads/images/caa19437-d0e0-4321-95b1-4a07c9cd879d.png?v=1789641298712'),(542,44,'/uploads/images/454e5510-50e3-42b8-8f1d-5fb5ea155ef7.png?v=1789641298712'),(543,44,'/uploads/images/b77748e0-d0e2-49e8-adf7-b8fa82b02c87.png?v=1789641298712'),(544,44,'/uploads/images/cccaa5a1-e1d9-4162-846e-ed0884b36462.png?v=1789641298712'),(545,30,'/uploads/images/b8166463-4595-415a-8a6a-5d378c136a48.png?v=1789644178683'),(546,30,'/uploads/images/f6a05cf1-77bd-4d7c-afb7-b2859de7ed1c.png?v=1789644178683'),(547,30,'/uploads/images/f61ae5fc-e74b-4ade-9f14-ec22faf60186.png?v=1789644178683'),(548,30,'/uploads/images/5d748c13-b830-432e-8596-201eb927add5.png?v=1789644178683'),(549,29,'/uploads/images/e00cb5a7-ec2a-48f6-bf5c-e3fe79cb041c.png?v=1789644210586'),(550,29,'/uploads/images/326e292b-0764-466e-a6b5-290d82eedcfa.png?v=1789644210586'),(551,29,'/uploads/images/afe54b9e-dd57-47ab-9167-0fa32981f654.png?v=1789644210586'),(552,29,'/uploads/images/e14a9531-fe01-4de8-bbd5-fde3080a3d1b.png?v=1789644210586'),(553,31,'/uploads/images/5e8a7772-0fd3-43cb-b7ef-bcb3cf9bdc9b.png?v=1789644237773'),(554,31,'/uploads/images/c08ea7a3-3b46-41be-80a6-50f0bb9d86e8.png?v=1789644237773'),(555,31,'/uploads/images/250256cc-25c1-4278-b5d7-8fd11d43b911.png?v=1789644237773'),(556,31,'/uploads/images/ba84ed74-bf37-4697-9fb0-62530dbfc8c4.png?v=1789644237773'),(557,27,'/uploads/images/7f0cbbe6-74c0-4bd4-8ad8-169f7c4acb2f.png?v=1789644264338'),(558,27,'/uploads/images/d82cb8e0-d4da-4d12-9c0f-814dcc0b40b6.png?v=1789644264338'),(559,27,'/uploads/images/1eac90c4-f451-4481-a049-6545e8e9b464.png?v=1789644264338'),(560,27,'/uploads/images/467add86-6692-470b-a5f5-d828a9a830c3.png?v=1789644264338');
/*!40000 ALTER TABLE `productimages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productreviews`
--

DROP TABLE IF EXISTS `productreviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productreviews` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ProductId` int NOT NULL,
  `CustomerName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Rating` decimal(5,2) NOT NULL DEFAULT '5.00',
  `ReviewDate` datetime(6) NOT NULL,
  `ReviewComment` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `VerifiedPurchase` tinyint(1) NOT NULL,
  `Status` varchar(50) NOT NULL DEFAULT 'Approved',
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_ProductReviews_ProductId` (`ProductId`),
  CONSTRAINT `FK_ProductReviews_Products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productreviews`
--

LOCK TABLES `productreviews` WRITE;
/*!40000 ALTER TABLE `productreviews` DISABLE KEYS */;
INSERT INTO `productreviews` VALUES (2,8,'Siddharth Verma',5.00,'2026-09-11 11:36:07.575285','Exceptional camera quality and IR night vision.',1,'Approved','2026-09-11 11:36:08',NULL),(4,8,'bhargava',4.00,'2026-09-11 11:39:24.895000','nice product',1,'Approved','2026-09-11 11:39:24',NULL),(5,8,'rithvik',4.00,'2026-09-15 05:11:15.925000','Nice Product',1,'Approved','2026-09-15 05:11:12',NULL),(6,8,'bhargav',4.00,'2026-09-17 06:54:24.669000','nice product',1,'Approved','2026-09-17 06:54:24',NULL),(7,8,'bhargava',5.00,'2026-09-17 07:10:41.224000','nice product',1,'Approved','2026-09-17 07:10:40',NULL),(9,33,'nandhitha',4.00,'2026-09-17 07:30:58.396000','good product i never seen such a product',1,'Approved','2026-09-17 07:30:58','2026-09-17 07:45:43'),(10,47,'nandhu',5.00,'2026-09-17 00:00:00.000000','good build quality it is very useful',1,'Approved','2026-09-17 07:42:33',NULL),(11,8,'raj',5.00,'2026-09-17 07:42:45.391000','nice',1,'Approved','2026-09-17 07:42:44',NULL),(12,45,'bhargava',4.06,'2026-09-17 00:00:00.000000','product was too good',1,'Approved','2026-09-17 07:43:35','2026-09-17 08:53:39'),(13,8,'ravi',5.00,'2026-09-17 07:45:09.177000','good',1,'Approved','2026-09-17 07:45:08',NULL),(14,8,'hari',5.00,'2026-09-17 07:46:19.857000','good',1,'Approved','2026-09-17 07:46:19',NULL),(15,11,'Bhargava',5.00,'2026-09-17 08:55:39.168000','good poduct',1,'Approved','2026-09-17 08:55:39',NULL),(16,44,'Customer',3.90,'2026-09-17 10:57:16.065000','Verified Rating',1,'Approved','2026-09-17 10:57:14',NULL),(17,38,'Bharath',5.00,'2026-09-17 11:04:07.543000','good product',1,'Approved','2026-09-17 11:04:08',NULL),(18,40,'bhagava',5.00,'2026-09-17 11:07:01.076000','this Powerful 3-phase high-capacity setup that easily handles heavy industrial machinery loads and drastically cuts our monthly commercial power bills!',1,'Approved','2026-09-17 11:07:02',NULL),(19,30,'Customer Rating',3.24,'2026-09-17 11:23:15.799000','Verified Customer Rating',1,'Approved','2026-09-17 11:23:14',NULL),(20,29,'Customer Rating',4.90,'2026-09-17 11:23:43.657000','Verified Customer Rating',1,'Approved','2026-09-17 11:23:42',NULL),(21,31,'Customer Rating',4.08,'2026-09-17 11:24:10.612000','Verified Customer Rating',1,'Approved','2026-09-17 11:24:09',NULL),(22,27,'Customer Rating',4.64,'2026-09-17 11:24:37.320000','Verified Customer Rating',1,'Approved','2026-09-17 11:24:36',NULL),(23,47,'Bhargava',5.00,'2026-09-18 04:40:00.443000','good build quality it is very useful',1,'Approved','2026-09-18 04:40:00',NULL);
/*!40000 ALTER TABLE `productreviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ProductName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CategoryId` int NOT NULL,
  `SKU` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Brand` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Manufacturer` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SubcategoryId` int NOT NULL,
  `ShortDescription` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ProductDetails` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PackageIncludes` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Weight` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Dimensions` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PowerSource` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Material` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CoverageUsage` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AverageRating` decimal(5,2) NOT NULL,
  `TotalReviews` int NOT NULL,
  `FiveStar` int NOT NULL,
  `FourStar` int NOT NULL,
  `ThreeStar` int NOT NULL,
  `TwoStar` int NOT NULL,
  `OneStar` int NOT NULL,
  `MRP` decimal(18,2) NOT NULL,
  `Stock` int NOT NULL,
  `DiscountType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `DiscountAmount` decimal(18,2) NOT NULL,
  `SellingPrice` decimal(18,2) DEFAULT NULL,
  `StockStatus` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ReorderLevel` int NOT NULL,
  `CostPrice` decimal(65,30) NOT NULL,
  `SupplierName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Trend30Day` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `LastUpdated` datetime(6) NOT NULL,
  `CountryOfOrigin` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CODAvailability` tinyint(1) NOT NULL,
  `EstimatedDelivery` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `DeliveryReturn` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `IsActive` tinyint(1) NOT NULL,
  `Specifications` text,
  PRIMARY KEY (`Id`),
  KEY `IX_Products_CategoryId` (`CategoryId`),
  KEY `IX_Products_SubcategoryId` (`SubcategoryId`),
  KEY `IX_Products_IsActive_Id` (`IsActive`,`Id` DESC),
  CONSTRAINT `FK_Products_Categories_CategoryId` FOREIGN KEY (`CategoryId`) REFERENCES `categories` (`Id`) ON DELETE CASCADE,
  CONSTRAINT `FK_Products_Subcategories_SubcategoryId` FOREIGN KEY (`SubcategoryId`) REFERENCES `subcategories` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (8,'2MP ColorVu 3.0 Fixed PT Camera',9,'HW-CCTV-TUR-2MP-001','Honeywell','harish',5,'HikAI-ISP for excellent noise reduction effect\nSuper clear 24/7 colorful imaging with ColorVu 3.0 technology','High quality imaging with 2 MP, 1920 × 1080 resolution\n24/7 color imaging with F1.0 aperture','Smart-Hybrid light, optimize your security with flexible lighting options\nClear imaging against strong back light due to 130 dB true WDR technology','it may vary','','','it may vary','Up to 30 m white light and 30 m IR distance for bright night imagin',4.62,8,5,3,0,0,0,4000.00,8,'none',0.00,4000.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-09 06:48:16.668185','',0,'','',1,NULL),(9,'12MP Acusense Powered by Darkfighter Fixed Bullet Network Camera',8,'HW-CCTV-PRO-12MP-001','Honeywell','harish',4,'UHD: Ultra High Definition delivers lifelike immersion\r\nExcellent low-light performance via Powered by DarkFighter','Person and vehicle classification based on deep learning\r\nClear imaging against strong back light due to 130 dB true WDR technology','Anti-corrosion design, providing reliability and longevity compared to standard (NEMA 4X)\r\nTamper-free & eco-friendly packaging','Approx. 1.5 kg','Approx. 300 × 100 × 100 mm','12 VDC / PoE','Metal housing','Indoor and outdoor security surveillance',0.00,0,0,0,0,0,0,3000.00,9,'none',0.00,3000.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 05:43:48.874682','India',0,'3-7 business days','Easy Returns',1,NULL),(10,'16MP Acusense Powered by Darkfighter Fixed Bullet Network Camera',8,'HW-CCTV-PRO-16MP-001','Honeywell','harish',4,'UHD: Ultra High Definition delivers lifelike immersion\nExcellent low-light performance via Powered by DarkFighter','Person and vehicle classification based on deep learning\nClear imaging against strong back light due to 130 dB true WDR technology','Water and dust resistant (IP67)\nAnti-corrosion design, providing reliability and longevity compared to standard (NEMA 4X)\nTamper-free & eco-friendly packaging','','','','','',0.00,0,0,0,0,0,0,3200.00,10,'none',0.00,3200.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 06:25:44.655308','',0,'','',1,NULL),(11,'4 MP AcuSense PTRZ Dome Network Camera',8,'HW-CCTV-PRO-4MP-001','Honeywell','harish',4,'Motorized Pan, Tilt, Rotate, Zoom for easy installation and monitoring\n2.8/4 mm in one lens, point varifocal\nExcellent low illumination performance via Powered by DarkFighter\nPerson and vehicle classification based on deep learning','Crystal-clear audio with Arrayed Dual-Mic (only -2U)\nClear imaging against strong back light due to 130 dB true WDR technology\nEfficient H.265+ compression technology','Water and dust resistant (IP67), and vandal resistant (IK10)\nAnti-corrosion design (NEMA 4X), more reliable\nAudio and alarm interface available (only –S)\nEco-friendly and tamper-free packaging','','','','','',5.00,1,1,0,0,0,0,4300.00,10,'none',0.00,4300.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 06:40:29.264349','',0,'','',1,NULL),(12,'12MP Acusense Powered by Darkfighter Fixed Turret Network Camera',8,'HW-CCTV-PRO-12MP-002','Honeywell','harish',4,'UHD: Ultra High Definition delivers lifelike immersion\nExcellent low-light performance via Powered by DarkFighter','Person and vehicle classification based on deep learning\nCrystal-clear audio with Built-in Arrayed Dual-Mic (-2U models）','Anti-corrosion design, providing reliability and longevity compared to standard (NEMA 4X)\nTamper-free & eco-friendly packaging','','','','','',0.00,0,0,0,0,0,0,4500.00,10,'none',0.00,4500.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 06:47:31.240315','',0,'','',1,NULL),(13,'12MP Acusense Strobe Light and Audible Warning Motorized Varifocal Turret Network Camera',8,'HW-CCTV-PRO-12MP-003','Honeywell','harish',4,'UHD: Ultra High Definition delivers lifelike immersion\nMotorized varifocal lens for easy installation and monitoring','Active strobe light and audio alarm (/SL: white light, /SRB: red & blue light)\nExcellent low-light performance via Powered by DarkFighter\n','Clear imaging against strong back light due to 130 dB true WDR technology\nWater and dust resistant (IP67) and vandal resistant (IK10)','','','','','',0.00,0,0,0,0,0,0,4700.00,10,'none',0.00,4700.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 06:52:51.831058','',0,'','',1,NULL),(14,'2 MP Smart Hybrid Light 3.0 Fixed Bullet Network Camera',8,'HW-CCTV-VAL-2MP-001','Honeywell','harish',6,'HikAI-ISP for well noise reduction, color correction and image quality improvement\nMotion Detection 3.0 detects persons and vehicles more accurately, reducing false alarms','Smart Hybrid Light: integrates IR and white lights, 3 supplemental lighting modes\n','Built-in microphone for real-time audio security\nDust and water resistant (IP67)','','','','','',0.00,0,0,0,0,0,0,3000.00,10,'none',0.00,3000.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 07:01:36.429519','',0,'','',1,NULL),(15,'2 MP Smart Hybrid Light 3.0 Fixed Dome Network Camera',8,'HW-CCTV-VAL-2MP-002','Honeywell','harish',6,'HikAI-ISP for well noise reduction, color correction and image quality improvement\nMotion Detection 3.0 detects persons and vehicles more accurately, reducing false alarms','Smart Hybrid Light: integrates IR and white lights, 3 supplemental lighting modes\nBuilt-in microphone for real-time audio security','-F: Support on-board storage up to 512 GB (SD card slot)\nDust and water resistant (IP67)','','','','','',0.00,0,0,0,0,0,0,3200.00,10,'none',0.00,3200.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 07:05:19.619220','',0,'','',1,NULL),(16,'2 MP Smart Hybrid Light 3.0 Fixed Turret Network Camera',8,'HW-CCTV-VAL-2MP-003','Honeywell','harish',6,'HikAI-ISP for well noise reduction, color correction and image quality improvement\nMotion Detection 3.0 detects persons and vehicles more accurately, reducing false alarms','Smart Hybrid Light: integrates IR and white lights, 3 supplemental lighting modes\nBuilt-in microphone for real-time audio security','-F: Support on-board storage up to 512 GB (SD card slot)\nDust and water resistant (IP67)','','','','','',0.00,0,0,0,0,0,0,3300.00,10,'none',0.00,3300.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 07:12:04.295016','',0,'','',1,NULL),(17,'2 MP Human Detection Varifocal Bullet Network Camera',8,'HW-CCTV-VAL-2MP-004','Honeywell','harish',6,'High quality imaging with 2 MP resolution\nSupport Human and Vehicle Detection','2.8 to 12 mm motorized varifocal lens for easy installation and monitoring\nUp to 256 GB SD card slot for storage','Efficient H.265+ compression technology\nClear imaging even with strong back lighting due to DWDR technology','','','','','',0.00,0,0,0,0,0,0,3500.00,10,'none',0.00,3500.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 07:30:56.587918','',0,'','',1,NULL),(18,'6 MP ColorVu MD2.0 Fixed Bullet Network Camera',8,'HW-CCTV-VAL-6MP-001','Honeywell','harish',6,'High quality imaging with 6 MP resolution\n24/7 colorful imaging','Support Human and Vehicle Detection\nWater and dust resistant (IP67)\nClear imaging even with strong back lighting due to 120 dB WDR','-F model: Support on-board storage up to 512GB (SD card slot)(Optional)\n-U model: Built-in microphone for real-time audio security (Optional)','','','','','',0.00,0,0,0,0,0,0,3600.00,10,'none',0.00,3600.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 07:35:56.608887','',0,'','',1,NULL),(19,'6 MP AcuSense Strobe Light and Audible Warning Fixed Mini Bullet Network Camera',8,'HW-CCTV-ULT-6MP-001','Honeywell','harish',7,'HikAI-ISP for excellent noise reduction effect\nHigh quality imaging with 6 MP resolution\nAcusense: Focus on human and vehicle classification based on deep learning','Built-in arrayed dual-microphone for real-time high quality audio security\n130 dB WDR, support Auto mode, clear imaging against strong back light','Active strobe light and audio alarm to warn intruders off','','','','','',0.00,0,0,0,0,0,0,4000.00,10,'none',0.00,4000.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 07:45:02.289398','',0,'','',1,NULL),(21,'6 MP Acusense Smart Hybrid Light Motorized Varifocal Bullet Network Camera',8,'HW-CCTV-ULT-6MP-002','Honeywell','harish',7,'HikAI-ISP for excellent noise reduction effect\nHigh quality imaging with 6 MP resolution','Acusense: Focus on human and vehicle classification based on deep learning\nSmart Hybrid Light: Integrates IR and White lights, 3 supplemental lighting modes','Motorized varifocal lens for easy installation and monitoring\nWater and dust resistant (IP67) and vandal-resistant (IK10)','','','','','',0.00,0,0,0,0,0,0,3900.00,10,'none',0.00,3900.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 07:54:33.220158','',0,'','',1,NULL),(22,'6 MP Acusense Smart Hybrid Light Motorized Varifocal Bullet Network Camera',8,'HW-CCTV-ULT-6MP-003','Honeywell','harish',7,'HikAI-ISP for excellent noise reduction effect\nHigh quality imaging with 6 MP resolution','Acusense: Focus on human and vehicle classification based on deep learning\nSmart Hybrid Light: Integrates IR and White lights, 3 supplemental lighting modes','Motorized varifocal lens for easy installation and monitoring\nWater and dust resistant (IP67) and vandal-resistant (IK10)','','','','','',0.00,0,0,0,0,0,0,2750.00,10,'none',0.00,2750.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 09:11:48.929840','',0,'','',1,NULL),(23,'6 MP Acusense Smart Hybrid Light Motorized Varifocal Turret Network Camera',8,'HW-CCTV-ULT-6MP-004','Honeywell','harish',7,'HikAI-ISP for excellent noise reduction effect\nHigh quality imaging with 6 MP resolution','Acusense: Focus on human and vehicle classification based on deep learning\nSmart Hybrid Light: Integrates IR and White lights, 3 supplemental lighting modes','Built-in arrayed dual-microphone for real-time high quality audio security\n130 dB WDR, support Auto mode, clear imaging against strong back light','','','','','',0.00,0,0,0,0,0,0,3050.00,10,'none',0.00,3050.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 09:14:50.431683','',0,'','',1,NULL),(24,'6 MP AcuSense Strobe Light and Audible Warning Fixed Bullet Network Camera',8,'HW-CCTV-ULT-6MP-005','Honeywell','harish',7,'HikAI-ISP for excellent noise reduction effect\nHigh quality imaging with 6 MP resolution','Acusense: Focus on human and vehicle classification based on deep learning\nSmart Hybrid Light: Integrates IR and White lights, 3 supplemental lighting modes','130 dB WDR, support Auto mode, clear imaging against strong back light\nWater and dust resistant (IP67) and vandal-resistant (IK10)','','','','','',0.00,0,0,0,0,0,0,3320.00,10,'none',0.00,3320.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 09:20:30.485240','',0,'','',1,NULL),(25,'Model SKU:HW-CCTV-ULT-6MP-005',8,'HW-CCTV-PTS-6MP-001','Honeywell','harish',8,'High quality imaging with 2 MP resolution\nClear imaging against strong back light due to DWDR technology','3D DNR technology delivers clean and sharp images\nHik-Connect cloud service and APP for remote management and views of devices','Built-in memory card slot, support microSD/SDHC/SDXC card, up to 256 GB\nWater and dust resistant IP66','','','','','',0.00,0,0,0,0,0,0,3910.00,10,'none',0.00,3910.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 09:31:07.562331','',0,'','',1,NULL),(26,'2 MP Fixed Outdoor Smart Hybrid-light PT Network Camera',8,'HW-CCTV-PTS-2MP-001','Honeywell','harish',8,'High quality imaging with 2 MP resolution\nSupport Human Detection and Auto-tracking Lite','Smart Hybrid Light: advanced technology with long range\nHik-Connect cloud service and APP for remote management and views of device','Built-in memory card slot, support microSD/SDHC/SDXC card, up to 512 GB\nWater and dust resistant (IP66)','','','','','',0.00,0,0,0,0,0,0,4099.00,10,'none',0.00,4099.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 09:36:20.684614','',0,'','',1,NULL),(27,'2 MP Fixed Outdoor ColorVu PT Network Camera',8,'HW-CCTV-PTS-2MP-002','Honeywell','harish',8,'High quality imaging with 2 MP resolution\nClear imaging against strong back light due to DWDR technology','3D DNR technology delivers clean and sharp images\nHik-Connect cloud service and APP for remote management and views of devices','Built-in memory card slot, support microSD/SDHC/SDXC card, up to 256 GB\nWater and dust resistant IP66','','','','','',4.64,1,1,0,0,0,0,3999.00,10,'none',0.00,3999.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 09:42:53.680267','',0,'','',1,'{\"weight\":\"\",\"dimensions\":\"\",\"powerSource\":\"\",\"material\":\"\",\"coverage\":\"\"}'),(28,'4 MP Fixed Outdoor ColorVu PT Network Camera',8,'HW-CCTV-PTS-4MP-001','Honeywell','harish',8,'High quality imaging with 4 MP resolution\nClear imaging against strong back light due to DWDR technology','3D DNR technology delivers clean and sharp images\nHik-Connect cloud service and APP for remote management and views of devices','Built-in memory card slot, support microSD/SDHC/SDXC card, up to 256 GB\nWater and dust resistant IP66','','','','','',0.00,0,0,0,0,0,0,3299.00,10,'none',0.00,3299.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 09:46:23.957778','',0,'','',1,NULL),(29,'6 MP Fixed Outdoor Smart Hybrid-light PT Network Camera',8,'HW-CCTV-PTS-6MP-002','Honeywell','harish',8,'High quality imaging with 6 MP resolution\nSupport Human Detection and Auto-tracking Lite','Smart Hybrid Light: advanced technology with long range\nHik-Connect cloud service and app for remote management and views of devices','Built-in microphone and speaker for real-time audio security\nBuilt-in memory card slot, support microSD/SDHC/SDXC card, up to 512 GB\nWater and dust resistant (IP66)','','','','','',4.90,1,1,0,0,0,0,4199.00,10,'none',0.00,4199.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 09:49:18.049074','',0,'','',1,'{\"weight\":\"\",\"dimensions\":\"\",\"powerSource\":\"\",\"material\":\"\",\"coverage\":\"\"}'),(30,'2MP ColorVu 3.0 Fixed PT Camera',9,'HW-CCTV-TUR-2MP-002','Honeywell','harish',5,'HikAI-ISP for excellent noise reduction effect\nSuper clear 24/7 colorful imaging with ColorVu 3.0 technology','High quality imaging with 2 MP, 1920 × 1080 resolution\n24/7 color imaging with F1.0 aperture','Clear imaging against strong back light due to 130 dB true WDR technology\nUp to 30 m white light and 30 m IR distance for bright night imaging','','','','','',3.24,1,0,0,1,0,0,4788.00,10,'none',0.00,4788.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 09:55:42.736618','',0,'','',1,'{\"weight\":\"\",\"dimensions\":\"\",\"powerSource\":\"\",\"material\":\"\",\"coverage\":\"\"}'),(31,'2MP ColorVu 3.0 Fixed Mini Bullet Camera',9,'HW-CCTV-TUR-2MP-003','Honeywell','harish',5,'HikAI-ISP for excellent noise reduction effect\nSuper clear 24/7 colorful imaging with ColorVu 3.0 technology','High quality imaging with 2 MP, 1920 × 1080 resolution\n24/7 color imaging with F1.0 aperture','Built-in mic, high quality audio with audio over coaxial cable\nWater and dust resistant (IP67)','','','','','',4.08,1,0,1,0,0,0,4566.00,10,'none',0.00,4566.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 10:00:58.046153','',0,'','',1,'{\"weight\":\"\",\"dimensions\":\"\",\"powerSource\":\"\",\"material\":\"\",\"coverage\":\"\"}'),(32,'4K ColorVu PIR Siren Fixed Bullet Camera High quality imaging with 8 MP, 3840 × 2160 resolution',9,'HW-CCTV-TUR-8MP-001','Honeywell','harish',5,'High quality imaging with 8 MP, 3840 × 2160 resolution\n24/7 color imaging','Clear imaging against strong back light due to 130 dB true WDR technology\n3D DNR technology delivers clean and sharp images','Active strobe light and audio alarm to warn intruders off\nWater and dust resistant (IP67)','','','','','',0.00,0,0,0,0,0,0,2999.00,10,'none',0.00,2999.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 10:09:40.697442','',0,'','',1,'{\"weight\":\"\",\"dimensions\":\"\",\"powerSource\":\"\",\"material\":\"\",\"coverage\":\"\"}'),(33,'4K ColorVu PoC Fixed Mini Bullet Camera High quality imaging with 8 MP, 3840 × 2160 resolution',9,'HW-CCTV-TUR-8MP-002','Honeywell','harish',5,'High quality imaging with 8 MP, 3840 × 2160 resolution\n24/7 color imaging','Clear imaging against strong back light due to 130 dB true WDR technology\n3D DNR technology delivers clean and sharp images','2.8 mm, 3.6 mm fixed focal lens\nUp to 20 m white light distance for bright night imaging\nWater and dust resistant (IP67)','','','','','',4.00,1,0,1,0,0,0,3659.00,10,'none',0.00,3659.00,'In Stock',30,0.000000000000000000000000000000,'','+10%','2026-09-11 10:12:32.263358','',0,'','',1,'{\"weight\":\"\",\"dimensions\":\"\",\"powerSource\":\"\",\"material\":\"\",\"coverageUsage\":\"\",\"coverage\":\"\"}'),(34,'Honeywell 60W Foldable Solar Panel',10,'HW-SOL-PNL-60W-001','Honeywell','harish',10,'Compact 60W foldable solar panel for portable charging and outdoor power needs.','he Honeywell 60W Foldable Solar Panel is a compact and portable solar charging solution designed for outdoor adventures, travel, camping and emergency backup power. Its high-efficiency monocrystalline solar cells provide reliable energy generation, while the foldable construction makes it convenient to carry, store and deploy.','1 × Honeywell 60W Foldable Solar Panel\r\n1 × DC-to-DC Charging Cable\r\n1 × Multi-Connector Adapter Set\r\n2 × Carabiner / Hanging Hooks\r\n1 × Carry/Storage Pouch\r\n1 × User Manual / Quick Start Guide\r\n1 × Warranty Card','Approx. 2.2 kg','Folded: 350 × 200 × 70 mm; Unfolded: 1270 × 350 × 25 mm','Solar Energy – 60W Monocrystalline Solar Cells','Monocrystalline Silicon with durable weather-resistant protective covering','Camping, travel, outdoor charging, emergency backup & portable power stations',0.00,0,0,0,0,0,0,5999.00,10,'none',0.00,5999.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 10:57:16.818964','India',1,'3-7 business days','Easy Returns',1,NULL),(35,'Honeywell 100W Foldable Solar Panel',10,'HW-SOL-PNL-100W-001','Honeywell','harish',10,'Portable 100W foldable solar panel delivering efficient renewable power anywhere.','The Honeywell 100W Foldable Solar Panel is designed to provide reliable portable renewable power for outdoor and off-grid applications. Its high-efficiency monocrystalline solar cells deliver strong charging performance, while the foldable construction makes the panel easy to carry, store and deploy.\r\n\r\nIt is suitable for camping, road trips, outdoor work, emergency backup and portable power stations.','1 × Honeywell 100W Foldable Solar Panel\r\n1 × DC-to-DC Charging Cable\r\n1 × Multi-Connector Adapter Set\r\n1 × DC/Power Station Connector Cable\r\n2 × Carabiner / Hanging Hooks\r\n1 × Carry / Storage Bag\r\n1 × User Manual\r\n1 × Warranty Card\r\n\r\nComparable 100W foldable-panel packages commonly include charging cables, interchangeable connectors and a user manual, although exact accessories vary by model.','Approx. 3.8 kg','Folded: 559 × 587 × 20 mm; Unfolded: 1050 × 587 × 3 mm','Solar Energy – 100W Monocrystalline Solar Cells','High-Efficiency Monocrystalline Silicon with ETFE Protective Lamination','Camping, travel, outdoor charging, portable power stations, emergency backup & off-grid applications',0.00,0,0,0,0,0,0,8999.00,10,'none',0.00,8999.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 11:21:13.823685','India',1,'3-7 business days','Easy Returns',1,NULL),(36,'Honeywell 200W Foldable Solar Panel',10,'HW-SOL-PNL-200W-001','Honeywell','harish',10,'Powerful 200W foldable solar solution for portable power stations and outdoor applications.','The Honeywell 200W Foldable Solar Panel is a powerful portable renewable-energy solution designed for users who need higher solar output away from the grid. Its high-efficiency monocrystalline solar cells provide dependable charging performance while maintaining a convenient foldable design.\r\n\r\nThe integrated portable construction makes it suitable for power stations, camping, RV travel, outdoor work, emergency backup and off-grid applications.','1 × Honeywell 200W Foldable Solar Panel\r\n1 × DC-to-DC Charging Cable\r\n1 × MC4 Solar Charging Cable\r\n1 × Portable Power Station Connector Cable\r\n1 × Multi-Connector Adapter Set\r\n2 × Carabiner / Hanging Hooks\r\n1 × Protective Carry / Storage Case\r\n1 × User Manual\r\n1 × Warranty Card\r\n\r\nFor reference, actual 200W foldable-panel bundles vary: Growatt includes the panel, protective case and manual, while other models provide MC4/Anderson connections and integrated carrying structures.','Approx. 7.0 kg','Folded: Approx. 600 × 540 × 50 mm; Unfolded: Approx. 2200 × 540 × 25 mm','Solar Energy – 200W Monocrystalline Solar Cells','High-Efficiency Monocrystalline Silicon with ETFE Protective Lamination','Portable power stations, camping, RVs, outdoor charging, emergency backup & off-grid applications',0.00,0,0,0,0,0,0,16999.00,10,'none',0.00,16999.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 11:33:25.965149','India',1,'3-7 business days','Easy Returns',1,NULL),(37,'WAAREE 2 kW On-Grid Single-Phase Bifacial DCR Complete Solar Kit.',11,'HW-SOL-RES-2KW-001','Honeywell','harish',13,'The WAAREE 2 kW On-Grid Single-Phase Bifacial DCR Solar System is a complete rooftop solar solution designed for residential applications. It combines high-efficiency DCR solar modules with a 2 KVA single-phase microinverter to provide reliable and efficient clean energy generation.','Capacity: 2 kW\r\nSystem Type: On-Grid, Single Phase\r\nSolar Modules: 4 × Mono PERC 550W DCR modules','The package includes 4 solar modules, 1 microinverter, ACDB with SPD and MCB, AC/DC cables, MC4 connectors, lightning arrester, earthing rods, earthing accessories, PPE chambers, cable ties, insulation tape, and DC cable dressing clips. Structure and installation charges are not included in the package.','255 kg','2272 × 1133 × 35 mm per module','Solar energy (sunlight)','Mono PERC bifacial solar cells with glass construction; copper cabling and electrical protection components','Residential rooftop applications, suitable for generating clean electricity for household consumption',0.00,0,0,0,0,0,0,91999.00,10,'none',0.00,91999.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 11:48:41.979499','India',1,'3-7 business days','Easy Returns',1,NULL),(38,'Honeywell 5W Small Solar Panel',10,'HW-SOL-SMA-5W-001','Honeywell','harish',11,'Compact 5W solar panel designed for small electronic devices, lighting and low-power applications.','The Honeywell 5W Small Solar Panel is a compact renewable-energy solution designed for small electronic and low-power applications. Its monocrystalline solar cells provide efficient solar-energy conversion in a lightweight and easy-to-install design.\r\n\r\nIt is suitable for solar lighting, small electronics, sensors, DIY projects, battery charging and other low-power outdoor applications.','1 × Honeywell 5W Small Solar Panel\r\n1 × DC Output Cable\r\n1 × Connector Cable\r\n1 × Mounting Hardware Set\r\n1 × User Manual\r\n1 × Warranty Card','Approx. 0.5 kg','Approx. 230 × 195 × 17 mm','Solar Energy – 5W Monocrystalline Solar Cells','Monocrystalline Silicon, Tempered Glass & Aluminium Alloy Frame','Small electronics, solar lighting, sensors, DIY projects & low-power applications',5.00,1,1,0,0,0,0,799.00,20,'none',0.00,799.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 11:55:10.266912','India',1,'3-7 business days','Easy Returns',1,NULL),(39,'Honeywell 20W Small Solar Panel',10,'HW-SOL-SMA-20W-001','Honeywell','nandhitha',11,'Reliable 20W solar panel delivering clean energy for compact off-grid and backup applications.','The Honeywell 20W Small Solar Panel provides dependable renewable power for compact off-grid and backup applications. Its high-efficiency monocrystalline cells deliver reliable energy generation while maintaining a compact and lightweight design.\r\n\r\nIt is ideal for solar lighting, CCTV/security cameras, IoT devices, sensors, small battery systems, outdoor electronics and DIY solar projects.','1 × Honeywell 20W Small Solar Panel\r\n1 × DC Output Cable\r\n1 × Connector Cable\r\n1 × Mounting Bracket / Hardware Set\r\n1 × User Manual\r\n1 × Warranty Card','Approx. 1.5 kg','Approx. 430 × 350 × 25 mm','Solar Energy – 20W Monocrystalline Solar Cells','Monocrystalline Silicon, Tempered Glass & Aluminium Alloy Frame','Solar lighting, CCTV cameras, sensors, small electronics, battery charging & compact off-grid systems',0.00,0,0,0,0,0,0,2199.00,19,'none',0.00,2199.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 12:03:21.304326','India',1,'3-7 business days','Easy Returns',1,NULL),(40,'Commercial & Industrial Solar Kits 50.31 kW 3 Phase Commercial Solar Kit',11,'HW-SOL-COM-50.31KW-001','Honeywell','harish',14,'The WAAREE 50.31 kW 3-Phase Commercial Solar Kit is a high-capacity rooftop solar solution designed for commercial and industrial applications. It uses advanced TOPCon Non-DCR solar technology to provide efficient and reliable power generation for businesses, offices, factories, and institutions while helping reduce dependence on grid electricity and long-term energy costs','The listed product weight is 1,625 kg. WAAREE does not currently publish an overall kit dimension on the product page, so I would not recommend entering an estimated dimension in your product database.','The commercial kit is designed as a complete solar solution and includes the major components required for installation, including TOPCon solar modules, solar inverter(s), mounting structures, electrical cables, connectors, junction/protection equipment, safety and protection accessories, and monitoring equipment. WAAREE notes that the exact BOM/component allocation can depend on stock availability at the time of order confirmation.','1,625 kg','2278 × 1134 × 33 mm','Solar Energy / Sunlight','TOPCon solar cells/modules with durable solar-module construction','Factories, offices, commercial buildings, institutions, warehouses and other industrial applications',5.00,1,1,0,0,0,0,1224999.00,10,'none',0.00,1224999.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 12:06:09.793332','India',1,'3-7 business days','Easy Returns',1,NULL),(41,'Honeywell 50W Small Solar Panel',10,'HW-SOL-SMA-50W-001','Honeywell','harish',11,'High-efficiency 50W compact solar panel for CCTV systems, battery charging and portable power applications.','The Honeywell 50W Small Solar Panel is a compact, high-efficiency renewable power solution designed for applications that require reliable solar charging without a large installation footprint.\r\n\r\nIts monocrystalline solar cells make it suitable for CCTV/security systems, battery charging, solar lighting, sensors, portable power systems, outdoor electronics and small off-grid installations.','1 × Honeywell 50W Small Solar Panel\r\n1 × DC Output Cable\r\n1 × Solar Connector Cable\r\n1 × Battery Charging Connector Cable\r\n1 × Mounting Bracket / Hardware Set\r\n1 × User Manual\r\n1 × Warranty Card','Approx. 3.0 kg','Approx. 670 × 540 × 30 mm','Solar Energy – 50W Monocrystalline Solar Cells','Monocrystalline Silicon, Tempered Glass & Aluminium Alloy Frame','CCTV systems, battery charging, solar lighting, portable power & compact off-grid applications',0.00,0,0,0,0,0,0,4499.00,20,'none',0.00,4499.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 12:13:44.016678','India',1,'3-7 business days','Easy Returns',1,NULL),(42,'Waaree Radiance-Lite 3 kW Hybrid Solar Kit (3.075 kW) | Complete Rooftop Solar Solution with 1 Battery 51.2 V 100 Ah LFP MS E MODULE',11,'HW-SOL-HYB-3KW-001','Honeywell','harish',15,'The Waaree Radiance-Lite 3 kW Hybrid Solar Kit (3.075 kW) is a complete residential rooftop solar solution that combines solar power generation with battery energy storage. It includes a 51.2 V 100 Ah LFP battery, allowing excess solar energy to be stored and used when required, providing greater energy independence and backup power for homes.','Waaree\'s publicly indexed listing does not expose a detailed item-by-item BOM for this particular kit, so I would not assign exact quantities to the mounting hardware, cables, connectors, etc. without the product BOM.','The complete kit is designed as a ready rooftop hybrid solution and includes the major system components:\r\n\r\nSolar PV modules totaling approximately 3.075 kW\r\n3 kW hybrid solar inverter\r\n1 × 51.2 V 100 Ah LFP battery\r\nSolar mounting/installation hardware',' 296.00 KGS','2500 × 1500 × 1500 mm','Solar energy + stored battery energy + grid, depending on system configuration','Solar Modules: Photovoltaic solar-cell modules with protective glass and structural frame.','Rooftop solar installations Homes requiring battery backup',0.00,0,0,0,0,0,0,326999.00,10,'none',0.00,326999.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-11 12:38:13.391492','India',1,'3-7 business days','Easy Returns',1,NULL),(43,'Honeywell 20W Flexible Solar Panel',10,'HW-SOL-PNL-20W-001','Honeywell','harish',16,'Lightweight 20W flexible solar panel for portable and curved-surface installations.','The Honeywell 20W Flexible Solar Panel is a lightweight and compact renewable-energy solution designed for locations where conventional rigid solar panels are difficult to install.\r\n\r\nIts flexible construction makes it suitable for curved and uneven surfaces, while high-efficiency monocrystalline solar cells provide dependable power generation. It is ideal for RVs, boats, camping setups, CCTV systems, solar lighting, battery maintenance and other compact off-grid applications.','1 × Honeywell 20W Flexible Solar Panel\r\n1 × Solar Output Cable\r\n1 × Connector Cable\r\n1 × Battery Charging Connector\r\n1 × Mounting Accessories Set\r\n1 × User Manual\r\n1 × Warranty Card','Approx. 0.6 kg','Approx. 480 × 350 × 3 mm','Solar Energy – 20W Monocrystalline Solar Cells','Monocrystalline Silicon with Lightweight ETFE Protective Surface','RVs, boats, curved roofs, CCTV systems, camping, battery charging & portable off-grid applications',0.00,0,0,0,0,0,0,2499.00,10,'none',0.00,2499.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-15 09:14:49.204565','India',1,'3-7 business days','Easy Returns',1,NULL),(44,'Honeywell 100W Flexible Solar Panel',10,'HW-SOL-PNL-100W-002','Honeywell','harish',16,'Durable 100W flexible solar panel suitable for rooftops, vehicles and off-grid power systems.','The Honeywell 100W Flexible Solar Panel is designed to provide reliable renewable power where traditional rigid solar panels may be difficult to install. Its thin and lightweight construction makes it suitable for rooftops, vehicles, RVs, caravans, boats and gently curved surfaces.\r\n\r\nHigh-efficiency monocrystalline solar cells provide dependable energy generation for battery charging, portable power systems, camping setups and other off-grid applications.','1 × Honeywell 100W Flexible Solar Panel\r\n1 × Solar Output Cable with Connectors\r\n1 × Battery Charging Connector Cable\r\n1 × DC Connector / Adapter Cable\r\n1 × Mounting Accessories Set\r\n1 × User Manual\r\n1 × Warranty Card','Approx. 2.2 kg','Approx. 1050 × 540 × 3 mm','Solar Energy – 100W Monocrystalline Solar Cells','Monocrystalline Silicon with Lightweight ETFE Protective Surface','Rooftops, RVs, caravans, boats, vehicles, battery charging & off-grid power systems',3.90,1,0,1,0,0,0,8999.00,9,'none',0.00,8999.00,'In Stock',30,0.000000000000000000000000000000,'','+10%','2026-09-15 09:22:19.878184','India',0,'3-7 business days','Easy Returns',1,'{\"weight\":\"Approx. 2.2 kg\",\"dimensions\":\"Approx. 1050 × 540 × 3 mm\",\"powerSource\":\"Solar Energy – 100W Monocrystalline Solar Cells\",\"material\":\"Monocrystalline Silicon with Lightweight ETFE Protective Surface\",\"coverageUsage\":\"Rooftops, RVs, caravans, boats, vehicles, battery charging & off-grid power systems\",\"coverage\":\"Rooftops, RVs, caravans, boats, vehicles, battery charging & off-grid power systems\"}'),(45,'Honeywell 200W Flexible Solar Panel',10,'HW-SOL-PNL-200W-002','Honeywell','nandhitha',16,'Powerful 200W flexible panel offering lightweight installation for demanding off-grid applications','The Honeywell 200W Flexible Solar Panel is a high-output renewable-energy solution designed for applications where lightweight construction and installation flexibility are important.\r\n\r\nIts flexible profile makes it suitable for vehicle roofs, RVs, caravans, boats, curved rooftops and other space-constrained surfaces. High-efficiency monocrystalline cells provide dependable power generation for battery charging, solar generators, portable power stations and demanding off-grid applications.','1 × Honeywell 200W Flexible Solar Panel\r\n1 × Solar Output Cable with Connectors\r\n1 × Battery Charging Connector Cable\r\n1 × DC Connector / Adapter Cable\r\n1 × Multi-Connector Adapter Set\r\n1 × Mounting Accessories Set\r\n1 × User Manual\r\n1 × Warranty Card','Approx. 4.0 kg','Approx. 1450 × 760 × 3 mm','Solar Energy – 200W Monocrystalline Solar Cells','High-Efficiency Monocrystalline Silicon with Lightweight ETFE Protective Surface','RVs, caravans, boats, vehicle rooftops, battery charging, portable power stations & demanding off-grid systems',4.06,1,0,1,0,0,0,16999.00,20,'none',0.00,16999.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-15 09:30:03.895625','India',1,'3-7 business days','Easy Returns',1,'{\"weight\":\"Approx. 4.0 kg\",\"dimensions\":\"Approx. 1450 × 760 × 3 mm\",\"powerSource\":\"Solar Energy – 200W Monocrystalline Solar Cells\",\"material\":\"High-Efficiency Monocrystalline Silicon with Lightweight ETFE Protective Surface\",\"coverage\":\"RVs, caravans, boats, vehicle rooftops, battery charging, portable power stations & demanding off-grid systems\"}'),(47,'Honeywell High-Efficiency Mono Solar Panel 200W',10,'HW-SOL-PNL-200W-003','Honeywell','nandhitha',16,'Description\r\nHigh-efficiency 200W monocrystalline solar panel designed for reliable renewable power generation in residential, commercial and off-grid applications.','A durable monocrystalline photovoltaic panel designed to provide efficient solar energy generation in a compact format. Suitable for rooftop systems, solar kits, battery charging, small commercial installations and off-grid applications.','1 × Solar Panel, 1 × Junction Box with Cables, MC4-Compatible Connectors, Installation/User Guide','Approx. 10.5 kg','Approx. 1480 × 670 × 30 mm','Solar Energy','Monocrystalline Silicon, Tempered Glass & Anodized Aluminium Frame','Homes, rooftops, small businesses, off-grid systems, solar kits and battery-charging applications',5.00,2,2,0,0,0,0,12999.00,29,'none',0.00,12999.00,'',30,0.000000000000000000000000000000,'','+10%','2026-09-17 06:37:53.430609','India',0,'3-7 business days','Easy Returns',1,'{\"weight\":\"Approx. 10.5 kg\",\"dimensions\":\"Approx. 1480 × 670 × 30 mm\",\"powerSource\":\"Solar Energy\",\"material\":\"Monocrystalline Silicon, Tempered Glass & Anodized Aluminium Frame\",\"coverage\":\"Homes, rooftops, small businesses, off-grid systems, solar kits and battery-charging applications\"}');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productsoftware`
--

DROP TABLE IF EXISTS `productsoftware`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productsoftware` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ProductId` int NOT NULL,
  `SoftwareName` varchar(200) NOT NULL,
  `Description` text NOT NULL,
  `SoftwareType` varchar(100) NOT NULL,
  `Version` varchar(50) NOT NULL,
  `Platform` varchar(100) NOT NULL,
  `Architecture` varchar(50) DEFAULT NULL,
  `FileUrl` varchar(500) DEFAULT NULL,
  `ExternalUrl` varchar(500) DEFAULT NULL,
  `OriginalFileName` varchar(255) DEFAULT NULL,
  `StoredFileName` varchar(255) DEFAULT NULL,
  `FileSize` bigint DEFAULT NULL,
  `MimeType` varchar(100) DEFAULT NULL,
  `ReleaseDate` datetime NOT NULL,
  `ReleaseNotes` text,
  `MinimumRequirements` text,
  `Status` varchar(20) NOT NULL DEFAULT 'Active',
  `IsFeatured` tinyint(1) NOT NULL DEFAULT '0',
  `SortOrder` int NOT NULL DEFAULT '0',
  `DownloadCount` int NOT NULL DEFAULT '0',
  `CreatedAt` datetime NOT NULL,
  `UpdatedAt` datetime DEFAULT NULL,
  `CreatedBy` varchar(100) DEFAULT NULL,
  `UpdatedBy` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_ProductSoftware_ProductId` (`ProductId`),
  KEY `IX_ProductSoftware_Status` (`Status`),
  KEY `IX_ProductSoftware_SoftwareType` (`SoftwareType`),
  KEY `IX_ProductSoftware_Platform` (`Platform`),
  CONSTRAINT `FK_ProductSoftware_Products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productsoftware`
--

LOCK TABLES `productsoftware` WRITE;
/*!40000 ALTER TABLE `productsoftware` DISABLE KEYS */;
INSERT INTO `productsoftware` VALUES (7,9,'Honeywell Device Manager','Utility tool for configuring IP cameras, NVRs, and access controllers across local network.','Configuration Tool','2.4.1','Windows','64-bit',NULL,'https://www.honeywell.com/downloads/device-manager-v2.4.1.exe',NULL,NULL,NULL,NULL,'2026-09-17 11:23:42','Improved device discovery and batch configuration features.','Windows 10 or later, 4GB RAM','Active',1,1,142,'2026-09-17 11:23:42',NULL,NULL,NULL),(8,9,'Honeywell IP Camera Firmware Update','Latest firmware release with security updates and ONVIF Profile T support.','Firmware','1.8.4','Firmware','ARM',NULL,'https://www.honeywell.com/downloads/camera-firmware-v1.8.4.bin',NULL,NULL,NULL,NULL,'2026-09-17 11:23:42','Critical security patches and enhanced night-vision performance.','Compatible Honeywell IP Cameras','Active',1,2,89,'2026-09-17 11:23:42',NULL,NULL,NULL),(9,9,'Honeywell Access Control SDK & API','Developer SDK for integrating Honeywell Access Control panels with third-party software.','SDK & API','3.1.0','Cross-Platform','64-bit',NULL,'https://www.honeywell.com/downloads/access-control-sdk-v3.1.0.zip',NULL,NULL,NULL,NULL,'2026-09-17 11:23:42','Added REST API wrapper and WebSocket event listener sample code.','NET 8.0, C# or C++ support','Active',0,3,56,'2026-09-17 11:23:42',NULL,NULL,NULL),(10,9,'Honeywell Smart Scanner USB Driver','Official WHQL driver package for Honeywell barcode scanners and POS terminals.','Driver','4.0.2','Windows','32-bit/64-bit',NULL,'https://www.honeywell.com/downloads/scanner-driver-v4.0.2.exe',NULL,NULL,NULL,NULL,'2026-09-17 11:23:42','WHQL Windows 11 certified driver.','Windows 8.1/10/11','Active',1,4,310,'2026-09-17 11:23:42',NULL,NULL,NULL);
/*!40000 ALTER TABLE `productsoftware` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productvideos`
--

DROP TABLE IF EXISTS `productvideos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productvideos` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ProductId` int NOT NULL,
  `VideoUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`Id`),
  KEY `IX_ProductVideos_ProductId` (`ProductId`),
  CONSTRAINT `FK_ProductVideos_Products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productvideos`
--

LOCK TABLES `productvideos` WRITE;
/*!40000 ALTER TABLE `productvideos` DISABLE KEYS */;
/*!40000 ALTER TABLE `productvideos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchaseindentitems`
--

DROP TABLE IF EXISTS `purchaseindentitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchaseindentitems` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `PurchaseIndentId` int NOT NULL,
  `ProductId` varchar(100) NOT NULL,
  `ProductName` varchar(250) NOT NULL,
  `SKU` varchar(100) NOT NULL,
  `Quantity` int NOT NULL,
  `EstimatedCost` decimal(18,2) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `FK_PurchaseIndentItems_PurchaseIndents_PurchaseIndentId` (`PurchaseIndentId`),
  CONSTRAINT `FK_PurchaseIndentItems_PurchaseIndents_PurchaseIndentId` FOREIGN KEY (`PurchaseIndentId`) REFERENCES `purchaseindents` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchaseindentitems`
--

LOCK TABLES `purchaseindentitems` WRITE;
/*!40000 ALTER TABLE `purchaseindentitems` DISABLE KEYS */;
INSERT INTO `purchaseindentitems` VALUES (1,1,'6','Honeywell Xenon 1950g Scanner','HW-X1950G',15,16500.00),(2,2,'8','2MP ColorVu 3.0 Fixed PT Camera','HW-CCTV-TUR-2MP-001',6,4000.00),(3,2,'6','Honeywell Xenon 1950g Scanner','HW-X1950G',16,16500.00),(4,2,'7','Honeywell Orbit 7190g Hybrid Scanner','HW-ORB7190G',1,19500.00),(5,3,'6','Honeywell Xenon 1950g Scanner','HW-X1950G',3,16500.00);
/*!40000 ALTER TABLE `purchaseindentitems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchaseindents`
--

DROP TABLE IF EXISTS `purchaseindents`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchaseindents` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `IndentNumber` varchar(100) NOT NULL,
  `Date` datetime NOT NULL,
  `RequestedBy` varchar(200) NOT NULL,
  `Warehouse` varchar(200) NOT NULL,
  `Priority` varchar(50) NOT NULL DEFAULT 'High',
  `Status` varchar(50) NOT NULL DEFAULT 'Pending Approval',
  `Remarks` text,
  `TotalEstimatedCost` decimal(18,2) NOT NULL DEFAULT '0.00',
  `CreatedAt` datetime NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchaseindents`
--

LOCK TABLES `purchaseindents` WRITE;
/*!40000 ALTER TABLE `purchaseindents` DISABLE KEYS */;
INSERT INTO `purchaseindents` VALUES (1,'IND-1','2026-09-09 06:43:52','Operations Team','Central Warehouse (WH-01)','Medium','PO Created','',247500.00,'2026-09-09 06:43:52'),(2,'IND-2','2026-09-09 07:18:18','Operations Team','Central Warehouse (WH-01)','Medium','Pending Approval','',307500.00,'2026-09-09 07:18:18'),(3,'IND-3','2026-09-09 07:22:15','Operations Team','Central Warehouse (WH-01)','Medium','Pending Approval','',49500.00,'2026-09-09 07:22:15');
/*!40000 ALTER TABLE `purchaseindents` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchaseorderitems`
--

DROP TABLE IF EXISTS `purchaseorderitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchaseorderitems` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `PurchaseOrderId` int NOT NULL,
  `ProductId` varchar(100) NOT NULL,
  `ProductName` varchar(250) NOT NULL,
  `UnitPrice` decimal(18,2) NOT NULL,
  `Quantity` int NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId` (`PurchaseOrderId`),
  CONSTRAINT `FK_PurchaseOrderItems_PurchaseOrders_PurchaseOrderId` FOREIGN KEY (`PurchaseOrderId`) REFERENCES `purchaseorders` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchaseorderitems`
--

LOCK TABLES `purchaseorderitems` WRITE;
/*!40000 ALTER TABLE `purchaseorderitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchaseorderitems` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `purchaseorders`
--

DROP TABLE IF EXISTS `purchaseorders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `purchaseorders` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `PONumber` varchar(100) NOT NULL,
  `Date` datetime NOT NULL,
  `IndentId` int DEFAULT NULL,
  `SupplierId` int NOT NULL,
  `SupplierName` varchar(200) NOT NULL,
  `Warehouse` varchar(200) NOT NULL,
  `PaymentTerms` varchar(100) NOT NULL DEFAULT 'Net 30',
  `ExpectedDeliveryDate` datetime NOT NULL,
  `Status` varchar(50) NOT NULL DEFAULT 'Issued',
  `Remarks` text,
  `TotalAmount` decimal(18,2) NOT NULL DEFAULT '0.00',
  `CreatedAt` datetime NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `purchaseorders`
--

LOCK TABLES `purchaseorders` WRITE;
/*!40000 ALTER TABLE `purchaseorders` DISABLE KEYS */;
/*!40000 ALTER TABLE `purchaseorders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `qrcodeconfigs`
--

DROP TABLE IF EXISTS `qrcodeconfigs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `qrcodeconfigs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `QrImageUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `qrcodeconfigs`
--

LOCK TABLES `qrcodeconfigs` WRITE;
/*!40000 ALTER TABLE `qrcodeconfigs` DISABLE KEYS */;
INSERT INTO `qrcodeconfigs` VALUES (1,'data:image/jpeg;base64,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','2026-08-31 10:32:40.933351');
/*!40000 ALTER TABLE `qrcodeconfigs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `returnevidences`
--

DROP TABLE IF EXISTS `returnevidences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `returnevidences` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ReturnRequestId` int NOT NULL,
  `FileName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FileUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ContentType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FileSize` bigint NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_ReturnEvidences_ReturnRequestId` (`ReturnRequestId`),
  CONSTRAINT `FK_ReturnEvidences_ReturnRequests_ReturnRequestId` FOREIGN KEY (`ReturnRequestId`) REFERENCES `returnrequests` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `returnevidences`
--

LOCK TABLES `returnevidences` WRITE;
/*!40000 ALTER TABLE `returnevidences` DISABLE KEYS */;
/*!40000 ALTER TABLE `returnevidences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `returnpickups`
--

DROP TABLE IF EXISTS `returnpickups`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `returnpickups` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ReturnRequestId` int NOT NULL,
  `PickupDate` datetime(6) DEFAULT NULL,
  `PickupAgentName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PickupAgentPhone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `PickupTrackingNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_ReturnPickups_ReturnRequestId` (`ReturnRequestId`),
  CONSTRAINT `FK_ReturnPickups_ReturnRequests_ReturnRequestId` FOREIGN KEY (`ReturnRequestId`) REFERENCES `returnrequests` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `returnpickups`
--

LOCK TABLES `returnpickups` WRITE;
/*!40000 ALTER TABLE `returnpickups` DISABLE KEYS */;
/*!40000 ALTER TABLE `returnpickups` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `returnrequests`
--

DROP TABLE IF EXISTS `returnrequests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `returnrequests` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `RequestNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CustomerId` int NOT NULL,
  `OrderId` int NOT NULL,
  `OrderItemId` int NOT NULL,
  `ProductId` int NOT NULL,
  `RequestType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ReasonCode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ReasonText` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PurchasedQuantity` int NOT NULL,
  `RequestedQuantity` int NOT NULL,
  `RefundMethod` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EstimatedRefundAmount` decimal(65,30) DEFAULT NULL,
  `ApprovedRefundAmount` decimal(65,30) DEFAULT NULL,
  `PickupAddressId` int NOT NULL,
  `PickupName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PickupPhone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PickupAddress` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `PickupPincode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `RejectionReason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ProductNameSnapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProductCodeSnapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProductImageUrlSnapshot` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `UnitPriceSnapshot` decimal(65,30) NOT NULL,
  `SubmittedAt` datetime(6) NOT NULL,
  `ReviewedAt` datetime(6) DEFAULT NULL,
  `CompletedAt` datetime(6) DEFAULT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  `ReplacementOrderId` int DEFAULT NULL,
  `ReplacementOrderNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ReplacementTrackingNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ReplacementCarrierName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ReplacementEstimatedDeliveryDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_ReturnRequests_OrderItemId` (`OrderItemId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `returnrequests`
--

LOCK TABLES `returnrequests` WRITE;
/*!40000 ALTER TABLE `returnrequests` DISABLE KEYS */;
/*!40000 ALTER TABLE `returnrequests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `returntimelines`
--

DROP TABLE IF EXISTS `returntimelines`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `returntimelines` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ReturnRequestId` int NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Remarks` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `EventDate` datetime(6) DEFAULT NULL,
  `UpdatedByUserId` int DEFAULT NULL,
  `UpdatedByRole` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsCustomerVisible` tinyint(1) NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_ReturnTimelines_ReturnRequestId` (`ReturnRequestId`),
  CONSTRAINT `FK_ReturnTimelines_ReturnRequests_ReturnRequestId` FOREIGN KEY (`ReturnRequestId`) REFERENCES `returnrequests` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `returntimelines`
--

LOCK TABLES `returntimelines` WRITE;
/*!40000 ALTER TABLE `returntimelines` DISABLE KEYS */;
/*!40000 ALTER TABLE `returntimelines` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `solutions`
--

DROP TABLE IF EXISTS `solutions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `solutions` (
  `Id` varchar(100) NOT NULL,
  `Title` varchar(200) NOT NULL,
  `Description` text NOT NULL,
  `Application` varchar(100) NOT NULL,
  `CategoryId` varchar(100) NOT NULL,
  `ImageUrl` text,
  `Features` json DEFAULT NULL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `solutions`
--

LOCK TABLES `solutions` WRITE;
/*!40000 ALTER TABLE `solutions` DISABLE KEYS */;
/*!40000 ALTER TABLE `solutions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `staff`
--

DROP TABLE IF EXISTS `staff`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `staff` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Phone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Role` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DateJoined` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `staff`
--

LOCK TABLES `staff` WRITE;
/*!40000 ALTER TABLE `staff` DISABLE KEYS */;
INSERT INTO `staff` VALUES (1,'nanditha chebattina','nandhithachebattina@gmail.com','9491755555','admin','Active','2026-08-31 09:19:39.918887');
/*!40000 ALTER TABLE `staff` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stockledgerlogs`
--

DROP TABLE IF EXISTS `stockledgerlogs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `stockledgerlogs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ProductId` int NOT NULL,
  `ActionType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Quantity` int NOT NULL,
  `Reason` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Note` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Timestamp` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_StockLedgerLogs_ProductId` (`ProductId`),
  CONSTRAINT `FK_StockLedgerLogs_Products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stockledgerlogs`
--

LOCK TABLES `stockledgerlogs` WRITE;
/*!40000 ALTER TABLE `stockledgerlogs` DISABLE KEYS */;
/*!40000 ALTER TABLE `stockledgerlogs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subcategories`
--

DROP TABLE IF EXISTS `subcategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `subcategories` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CategoryId` int NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Subcategories_CategoryId` (`CategoryId`),
  CONSTRAINT `FK_Subcategories_Categories_CategoryId` FOREIGN KEY (`CategoryId`) REFERENCES `categories` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subcategories`
--

LOCK TABLES `subcategories` WRITE;
/*!40000 ALTER TABLE `subcategories` DISABLE KEYS */;
INSERT INTO `subcategories` VALUES (4,8,' Pro Series (All)','Get the smart features and imaging performance you need at a great value',1),(5,9,'Turbo HD Cameras with ColorVu','Provide colorful imaging 24/7 even in ultra-low-light scenarios',1),(6,8,'Value Series','Reliable protection that saves on budget, but never compromises on performance',1),(7,8,'Ultra Series (SmartIP)','Great performance with durable hardware and expanded software capabilities',1),(8,8,'PT Series','Enjoy flexible security coverage with remote, motorized panning and tilting',1),(9,9,'Smart Hybrid Light Series','Deliver great imaging via UHD technology & ultra low-light technology',1),(10,10,'Foldable Panels','Portable, lightweight foldable solar panels designed for convenient, reliable power wherever you go.',1),(11,10,'Small Solar Modules','Compact and efficient solar modules designed to deliver reliable power for small-scale and space-conscious applications.',1),(13,11,'Residential Radiance Solar Kit','The Residential Radiance Solar Kit is a modern solar energy solution designed to provide homes with clean, reliable, and efficient power. It combines advanced solar technology with intelligent energy management and dependable battery storage, helping homeowners make the most of renewable energy while reducing their dependence on conventional grid power.',1),(14,11,'Commercial & Industrial Solar Kits','The Commercial & Industrial Solar Kits are advanced renewable energy solutions designed to meet the demanding power requirements of businesses, commercial facilities, and industrial operations. They provide efficient solar power generation with intelligent energy management, helping organizations optimize energy consumption, reduce reliance on conventional electricity, and achieve long-term cost savings while supporting a cleaner and more sustainable future.',1),(15,11,'Hybrid Solar Solution Combo','The Hybrid Solar Solution Combo is a versatile energy system that combines solar power generation with intelligent battery storage to provide a reliable and uninterrupted electricity supply. Designed for greater energy independence, it efficiently utilizes solar energy during the day, stores excess power for later use, and provides dependable backup when grid power is unavailable. This solution offers a smart, efficient, and sustainable way to manage energy while reducing dependence on conventional power sources.',1),(16,10,'Flexible Solar Panels','Lightweight and flexible solar modules designed to deliver reliable clean energy on curved, portable, and space-limited surfaces.',1);
/*!40000 ALTER TABLE `subcategories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliercategories`
--

DROP TABLE IF EXISTS `suppliercategories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliercategories` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(255) NOT NULL,
  `Description` text,
  `IsActive` tinyint(1) NOT NULL DEFAULT '1',
  `CreatedAt` datetime NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliercategories`
--

LOCK TABLES `suppliercategories` WRITE;
/*!40000 ALTER TABLE `suppliercategories` DISABLE KEYS */;
INSERT INTO `suppliercategories` VALUES (1,'Industrial Automation','PLCs, DCS, Sensors, Actuators & Control Hardware',1,'2026-09-21 04:53:06'),(2,'Safety & Security','Fire Systems, CCTV, Gas Detectors & Personal Protection Equipment',1,'2026-09-21 04:53:06'),(3,'Electronics & Semiconductors','Microcontrollers, Relays, Circuit Boards & Power Modules',1,'2026-09-21 04:53:06'),(4,'Hardware & Tools','Valves, Pneumatics, Cabling, Fasteners & Mounting Hardware',1,'2026-09-21 04:53:06'),(5,'Chemicals & Processing','Specialty Solvents, Refrigerants & Process Reagents',1,'2026-09-21 04:53:06');
/*!40000 ALTER TABLE `suppliercategories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suppliers`
--

DROP TABLE IF EXISTS `suppliers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suppliers` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ContactPerson` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Phone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Address` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProductCount` int NOT NULL,
  `PerformanceRating` double NOT NULL,
  `CommercialTerms` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `Gstin` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ProductCategory` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `TrackingId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `City` varchar(100) DEFAULT NULL,
  `LeadTime` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suppliers`
--

LOCK TABLES `suppliers` WRITE;
/*!40000 ALTER TABLE `suppliers` DISABLE KEYS */;
INSERT INTO `suppliers` VALUES (4,'nandhitha','Nandhitha C','9491755559','nandhithachebattina@gmail.com','Eluru, AP',0,5,'Net 15',1,'37ABCDE1234F1Z5','CCTV & Security Equipment Supplier',NULL,'Verified','Eluru','2-4 days'),(5,'Suresh Enterprise','Suresh','9867895465','Suresh@gmail.com','kphp, hyderabad',0,4.5,'Net 15',0,'','Solar',NULL,'Inactive','hyderabad','15');
/*!40000 ALTER TABLE `suppliers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supportconfigs`
--

DROP TABLE IF EXISTS `supportconfigs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supportconfigs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `SupportPhoneNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `WorkTimings` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SupportEmail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supportconfigs`
--

LOCK TABLES `supportconfigs` WRITE;
/*!40000 ALTER TABLE `supportconfigs` DISABLE KEYS */;
INSERT INTO `supportconfigs` VALUES (1,'+91 040 4855 5758','Mon-Sat: 9:00 AM - 6:00 PM','info@honeywellproducts.com','2026-09-21 11:37:39.997775');
/*!40000 ALTER TABLE `supportconfigs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `supporttickets`
--

DROP TABLE IF EXISTS `supporttickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `supporttickets` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `TicketId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Phone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Subject` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Message` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SourceType` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `OrderReference` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Priority` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AssignedAgent` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `AuditNote` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Status` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `CreatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=31 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `supporttickets`
--

LOCK TABLES `supporttickets` WRITE;
/*!40000 ALTER TABLE `supporttickets` DISABLE KEYS */;
INSERT INTO `supporttickets` VALUES (1,'','Bhargava Kurapati','bhargavakurapati49@gmail.com','9876543210','[Business Enquiry] Contact Us Enquiry from Bhargava Kurapati','Interested in distributor partnership for security CCTV equipment in Hyderabad region.','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 06:19:08.397206'),(2,'','Test Contact User','contacttest@example.com','9876500000','[General Inquiry] Contact Us Enquiry from Test Contact User','Hello, testing contact form integration','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 07:22:27.509878'),(3,'','rithvik','rithvik@gmail.com','9856987345','[Product Enquiry] Contact Us Enquiry from rithvik','i need  your product details','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 07:24:03.661605'),(4,'','jagadesh','jagadesh@gmail.com','9834876266','[Sales Enquiry] Contact Us Enquiry from jagadesh','i need the sales details of your company to join as  distributer','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 07:26:11.798896'),(5,'','bharath','bharath@gmail.com','7309845678','[Distributor Enquiry] Contact Us Enquiry from bharath','i  want to join as a distributer','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 08:45:30.160346'),(6,'','Suresh Nuthangi','sureshnuthangi999@gmail.com','+91 98765 43210','Need guidance on equipment calibration','Hello support team, I purchased the Honeywell POS scanner unit last week and need assistance with setting up serial baud rate calibration.','General',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 09:02:16.287688'),(7,'TCK-SRV-73281','Anish Kumar','anishkumar@company.com','+91 98765 43210','[SERVICE & REPAIR] Hardware Defect / Faulty Unit - Honeywell IP Dome Camera 4MP','Product Model: Honeywell IP Dome Camera 4MP\nSerial Number: SN-88A2004\nOrder Number: 50342\nIssue Type: Hardware Defect / Faulty Unit\n\nDescription:\nThe camera IR sensor fails to trigger night vision mode after recent power surge. Need physical hardware inspection and repair under warranty.','ServiceRequest','50342','High',NULL,'No notes added','Open','2026-09-15 09:11:09.574187'),(8,'','raju','raju@gmail.com','9986567547','[Product Enquiry] Contact Us Enquiry from raju','i want detailes about the products','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 09:15:03.493801'),(9,'','Rajesh','Rajesh@gmail.com','9567895438','[Dealer Enquiry] Contact Us Enquiry from Rajesh','iam intresten on delarship with your company','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 09:23:03.388643'),(10,'','rajesh','rajesh@gmail.com','9825748793','[Product Enquiry] Contact Us Enquiry from rajesh','Make Your Next Security Decision With Clarity.','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 09:40:35.044172'),(11,'','Test User','test@test.com','','Test','Testing ticket API','General',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 09:58:21.262247'),(12,'','Verification Test','verify@test.com','','API Test','Verifying ticket API works','General',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 10:02:02.853048'),(13,'TCK-SRV-95946','FullName','no-email@service.com','9876543210','[SERVICE & REPAIR] Hardware Defect / Faulty Unit - Hardware Unit','Product Model: N/A\nSerial Number: N/A\nOrder Number: N/A\nIssue Type: Hardware Defect / Faulty Unit\n\nDescription:\nTest issue','ServiceRequest',NULL,'High',NULL,'No notes added','Open','2026-09-15 10:04:48.192682'),(14,'TCK-SRV-51849','John Doe','no-email@service.com','9876543210','[SERVICE & REPAIR] Hardware Defect / Faulty Unit - Hardware Unit','Product Model: N/A\nSerial Number: N/A\nOrder Number: N/A\nIssue Type: Hardware Defect / Faulty Unit\n\nDescription:\nTest issue','ServiceRequest',NULL,'High',NULL,'No notes added','Open','2026-09-15 10:04:53.575784'),(15,'TCK-SRV-69930','John Doe','no-email@service.com','9876543210','[SERVICE & REPAIR] Hardware Defect / Faulty Unit - Hardware Unit','Product Model: N/A\nSerial Number: N/A\nOrder Number: N/A\nIssue Type: Hardware Defect / Faulty Unit\n\nDescription:\nTest issue','ServiceRequest',NULL,'High',NULL,'No notes added','Open','2026-09-15 10:04:57.359215'),(16,'TCK-SRV-66296','John Doe','no-email@service.com','9876543210','[SERVICE & REPAIR] Hardware Defect / Faulty Unit - Hardware Unit','Product Model: N/A\nSerial Number: N/A\nOrder Number: N/A\nIssue Type: Hardware Defect / Faulty Unit\n\nDescription:\nTest issue','ServiceRequest',NULL,'High',NULL,'No notes added','Open','2026-09-15 10:05:01.332923'),(17,'TCK-SRV-31107','Robert Vance','robert@vance.com','+91 9876543210','[SERVICE & REPAIR] Hardware Defect - Honeywell IP Dome Camera 4MP','Product Model: Honeywell IP Dome Camera 4MP\nSerial Number: SN-8840291\nOrder Number: 10214\nIssue Type: Hardware Defect\n\nDescription:\nCamera lens reflection bug under low light conditions.','ServiceRequest','10214','High',NULL,'No notes added','Open','2026-09-15 10:05:08.571431'),(18,'TCK-SRV-31489','Bhargava Technical Test','bhargava@test.com','+91 9988776655','[SERVICE & REPAIR] Firmware Issue - Honeywell Barcode Scanner Setup Utility','Product Model: Honeywell Barcode Scanner Setup Utility\nSerial Number: SN-99112233\nOrder Number: 109988\nIssue Type: Firmware Issue\n\nDescription:\nFirmware update failed during flash installation phase.','ServiceRequest','109988','High',NULL,'No notes added','Open','2026-09-15 10:05:37.712741'),(19,'TCK-SRV-89727','Verification Customer','verification@honeywell.com','+91 9123456789','[SERVICE & REPAIR] Hardware Defect - Honeywell Thermal Printer Driver','Product Model: Honeywell Thermal Printer Driver\nSerial Number: SN-VERIFY-001\nOrder Number: ORD-9911\nIssue Type: Hardware Defect\n\nDescription:\nTesting end-to-end integration for 100% verification.','ServiceRequest','ORD-9911','High',NULL,'No notes added','Open','2026-09-15 10:05:59.115264'),(20,'','Master Check','test@check.com','','Verify','Master verification','General',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 10:19:51.494291'),(21,'TCK-SRV-42467','Master Check','test@check.com','+91 9988776655','[SERVICE & REPAIR] Hardware Defect - Honeywell IP Camera','Product Model: Honeywell IP Camera\nSerial Number: N/A\nOrder Number: N/A\nIssue Type: Hardware Defect\n\nDescription:\nTesting master verification','ServiceRequest',NULL,'High',NULL,'No notes added','Open','2026-09-15 10:19:55.207329'),(22,'','t','e@e.com','','s','m','General',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 10:19:56.454635'),(23,'TCK-SRV-64003','n','no-email@service.com','123','[SERVICE & REPAIR] Hardware Defect / Faulty Unit - Hardware Unit','Product Model: N/A\nSerial Number: N/A\nOrder Number: N/A\nIssue Type: Hardware Defect / Faulty Unit\n\nDescription:\nd','ServiceRequest',NULL,'High',NULL,'No notes added','Open','2026-09-15 10:20:00.122122'),(24,'','Suresh Nuthangi','sureshnuthangi999@gmail.com','+91 98765 43210','Need guidance on equipment calibration','Hello support team, I purchased the Honeywell POS scanner unit last week and need assistance with setting up serial baud rate calibration.','General',NULL,'Medium',NULL,'No notes added','Open','2026-09-15 11:27:50.552361'),(25,'TCK-SRV-80615','nandhitha','nandhitha@gmail.com','9867546787','[SERVICE & REPAIR] Hardware Defect - honeywell 2mp','Product Model: honeywell 2mp\nSerial Number: N/A\nOrder Number: N/A\nIssue Type: Hardware Defect\n\nDescription:\ndamaged','ServiceRequest','','High',NULL,'No notes added','Open','2026-09-16 04:57:14.309457'),(26,'','BHARGAVA','BHARGAVA@GMAIL.COM','7386999881','[Sales Enquiry] Contact Us Enquiry from BHARGAVA','I NEED SALES INFORMATION','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-16 05:49:52.402483'),(27,'','Test Contact','contact@example.com','9999999999','[General Enquiry] Contact Us Enquiry from Test Contact','Test message','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-16 07:52:55.136282'),(28,'','Test Support','support@example.com','9999999999','Technical issue','Test ticket message','General',NULL,'Medium',NULL,'No notes added','Open','2026-09-16 07:52:59.659694'),(29,'','Alex Verification','ticket.verify@example.com','9876543210','Automated Integration Test Ticket','This is a verification test ticket.','General',NULL,'Medium',NULL,'No notes added','Open','2026-09-16 08:12:23.957878'),(30,'','Alex Verification','contact.verify@example.com','9876543210','[General Enquiry] Contact Us Enquiry from Alex Verification','Automated verification contact message.','ContactUs',NULL,'Medium',NULL,'No notes added','Open','2026-09-16 08:12:27.623714');
/*!40000 ALTER TABLE `supporttickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemconfigs`
--

DROP TABLE IF EXISTS `systemconfigs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `systemconfigs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Key` varchar(100) NOT NULL,
  `JsonValue` longtext NOT NULL,
  `UpdatedAt` datetime NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `Key` (`Key`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemconfigs`
--

LOCK TABLES `systemconfigs` WRITE;
/*!40000 ALTER TABLE `systemconfigs` DISABLE KEYS */;
INSERT INTO `systemconfigs` VALUES (1,'contact_card','{\"companyName\":\"HoneywellProducts\",\"email\":\"info@honeywellproducts.com\",\"phone\":\"\\u002B91 040 4855 5758\",\"address\":\"101, Jain Sadguru Capital Park, Hitech City, Madhapur, Hyderabad - 500081, Telangana.\",\"businessHours\":\"Monday - Saturday: 9:00 AM - 6:00 PM IST\",\"supportHotline\":\"\\u002B91 040 4855 5758\",\"businessName\":\"Honeywell Solutions\",\"supportEmail\":\"\",\"contactPhone\":\"\",\"alternatePhone\":\"\",\"workingHours\":\"\",\"googleMapsUrl\":\"\"}','2026-09-17 07:00:46');
/*!40000 ALTER TABLE `systemconfigs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `systemsettings`
--

DROP TABLE IF EXISTS `systemsettings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `systemsettings` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `PlatformName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `GstPercentage` decimal(18,2) NOT NULL,
  `FlatShippingFee` decimal(18,2) NOT NULL,
  `CurrencySymbol` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `AdvisoryPolicy` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SupportPhone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `SupportEmail` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `systemsettings`
--

LOCK TABLES `systemsettings` WRITE;
/*!40000 ALTER TABLE `systemsettings` DISABLE KEYS */;
/*!40000 ALTER TABLE `systemsettings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testimonials`
--

DROP TABLE IF EXISTS `testimonials`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testimonials` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Role` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Text` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ImageUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Rating` int NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  `SortOrder` int NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `UpdatedDate` datetime(6) DEFAULT NULL,
  `Location` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CompanyName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ProductName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testimonials`
--

LOCK TABLES `testimonials` WRITE;
/*!40000 ALTER TABLE `testimonials` DISABLE KEYS */;
INSERT INTO `testimonials` VALUES (2,'bhargava','customer','nice products','',5,1,1,'2026-08-31 16:06:16.779080','2026-09-21 17:51:34.318773',NULL,NULL,NULL),(3,'Suresh','business','best products  i have ever seen','/uploads/testimonials/10f9daf2-c73f-4be8-92cc-d012e8bc1284.png',5,1,1,'2026-09-16 10:25:16.819426',NULL,NULL,NULL,NULL),(4,'raju','customer','good experience with  Honeywel','',5,1,1,'2026-09-17 13:11:06.773418',NULL,NULL,NULL,NULL),(5,'ravikiran','distributor','This company is a reliable, professional partner that delivers high-quality, high-demand products on time with exceptional dealer support and seamless fulfillment.','',5,1,1,'2026-09-18 16:41:29.544038',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `testimonials` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `testusers`
--

DROP TABLE IF EXISTS `testusers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `testusers` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `MobileNumber` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `FullName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Email` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `ProfileImageUrl` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `DoorNo` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `StreetArea` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `City` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `State` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `Pincode` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `OTP` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `OTPGeneratedAt` datetime(6) DEFAULT NULL,
  `IsVerified` tinyint(1) NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  `UpdatedDate` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `testusers`
--

LOCK TABLES `testusers` WRITE;
/*!40000 ALTER TABLE `testusers` DISABLE KEYS */;
/*!40000 ALTER TABLE `testusers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `upidetailsconfigs`
--

DROP TABLE IF EXISTS `upidetailsconfigs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `upidetailsconfigs` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `MerchantUpiId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `MerchantName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `BankDisplayName` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Currency` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `UpdatedAt` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `upidetailsconfigs`
--

LOCK TABLES `upidetailsconfigs` WRITE;
/*!40000 ALTER TABLE `upidetailsconfigs` DISABLE KEYS */;
INSERT INTO `upidetailsconfigs` VALUES (1,'honeywell@hdfcbank','Honeywell Products India','Andhra Bank - 0863','INR','2026-09-21 11:37:40.000213');
/*!40000 ALTER TABLE `upidetailsconfigs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `users` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Phone` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Role` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `DateCreated` datetime(6) NOT NULL,
  `IsActive` tinyint(1) NOT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wallettransactions`
--

DROP TABLE IF EXISTS `wallettransactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wallettransactions` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CustomerId` int NOT NULL,
  `Type` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Source` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Title` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Description` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `Coins` int NOT NULL,
  `OrderId` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci,
  `CreatedDate` datetime(6) NOT NULL,
  `ExpiresAt` datetime(6) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wallettransactions`
--

LOCK TABLES `wallettransactions` WRITE;
/*!40000 ALTER TABLE `wallettransactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `wallettransactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `wishlistitems`
--

DROP TABLE IF EXISTS `wishlistitems`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `wishlistitems` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `UserPhone` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci NOT NULL,
  `ProductId` int NOT NULL,
  `CreatedDate` datetime(6) NOT NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `IX_WishlistItems_UserPhone_ProductId` (`UserPhone`,`ProductId`),
  KEY `IX_WishlistItems_ProductId` (`ProductId`),
  CONSTRAINT `FK_WishlistItems_Products_ProductId` FOREIGN KEY (`ProductId`) REFERENCES `products` (`Id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `wishlistitems`
--

LOCK TABLES `wishlistitems` WRITE;
/*!40000 ALTER TABLE `wishlistitems` DISABLE KEYS */;
/*!40000 ALTER TABLE `wishlistitems` ENABLE KEYS */;
UNLOCK TABLES;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-22  9:30:16
