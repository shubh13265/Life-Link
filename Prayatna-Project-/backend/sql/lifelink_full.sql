-- LifeLink Full Database Script (MySQL)
-- Creates schema + seeds demo data aligned to frontend.

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP DATABASE IF EXISTS LifeLink_dev;
CREATE DATABASE LifeLink_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE LifeLink_dev;

-- ===== Tables =====

CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  type ENUM('patient','ambulance_driver','hospital_admin') NOT NULL DEFAULT 'patient',
  password_hash VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_users_phone (phone)
) ENGINE=InnoDB;

-- Role-specific user profile tables
CREATE TABLE IF NOT EXISTS patient_profiles (
  id CHAR(36) NOT NULL,
  userId CHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_patient_user (userId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ambulance_driver_profiles (
  id CHAR(36) NOT NULL,
  userId CHAR(36) NOT NULL,
  agencyName VARCHAR(255) NULL,
  vehicleNumber VARCHAR(100) NOT NULL,
  licenseNumber VARCHAR(100) NULL,
  latitude DOUBLE NULL,
  longitude DOUBLE NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 1,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_amb_profile_user (userId),
  UNIQUE KEY uniq_amb_profile_vehicle (vehicleNumber)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hospital_admin_profiles (
  id CHAR(36) NOT NULL,
  userId CHAR(36) NOT NULL,
  hospitalId CHAR(36) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_hosp_admin_user (userId),
  KEY idx_hosp_admin_hospital (hospitalId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS hospitals (
  id CHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  zipCode VARCHAR(20) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  totalBeds INT NOT NULL DEFAULT 0,
  icuBeds INT NOT NULL DEFAULT 0,
  icu_beds_available INT NOT NULL DEFAULT 0,
  icu_beds_total INT NOT NULL DEFAULT 0,
  oxygen_cylinders_available INT NOT NULL DEFAULT 0,
  oxygen_cylinders_total INT NOT NULL DEFAULT 0,
  ambulances_available INT NOT NULL DEFAULT 0,
  blood_bank_info JSON NULL,
  ventilators INT NOT NULL DEFAULT 0,
  ambulances INT NOT NULL DEFAULT 0,
  doctors INT NOT NULL DEFAULT 0,
  specializations JSON NOT NULL,
  contactPerson VARCHAR(255) NOT NULL,
  contactPhone VARCHAR(50) NOT NULL,
  isVerified TINYINT(1) NOT NULL DEFAULT 0,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uniq_hospitals_email (email)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS emergency_requests (
  id CHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low','medium','high','critical') NOT NULL DEFAULT 'medium',
  requiredResources JSON NOT NULL,
  hospitalId CHAR(36) NULL,
  patientName VARCHAR(255) NOT NULL,
  patientAge INT NOT NULL DEFAULT 0,
  patientPhone VARCHAR(50) NULL,
  location VARCHAR(255) NOT NULL,
  latitude DOUBLE NOT NULL,
  longitude DOUBLE NOT NULL,
  status ENUM('pending','assigned','in_transit','completed','cancelled') NOT NULL DEFAULT 'pending',
  assignedTo CHAR(36) NULL,
  createdBy CHAR(36) NOT NULL,
  estimatedArrival DATETIME NULL,
  completedAt DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_emergency_hospital (hospitalId),
  KEY idx_emergency_status (status)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  id CHAR(36) NOT NULL,
  userId CHAR(36) NULL,
  hospitalId CHAR(36) NOT NULL,
  appointmentType VARCHAR(50) NOT NULL DEFAULT 'consultation',
  patientName VARCHAR(255) NOT NULL,
  patientPhone VARCHAR(50) NULL,
  reason TEXT NOT NULL,
  appointmentDate DATETIME NULL,
  appointmentTime VARCHAR(50) NULL,
  status ENUM('pending','confirmed','completed','cancelled') NOT NULL DEFAULT 'pending',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_appointments_user (userId),
  KEY idx_appointments_hospital (hospitalId)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS ambulance_hospital_notifications (
  id CHAR(36) NOT NULL,
  ambulance_driver_id CHAR(36) NOT NULL,
  hospital_id CHAR(36) NOT NULL,
  patient_type VARCHAR(255) NOT NULL,
  patient_condition TEXT NULL,
  number_of_patients INT NOT NULL DEFAULT 1,
  driver_contact VARCHAR(50) NULL,
  eta_minutes INT NULL,
  status ENUM('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  hospital_response TEXT NULL,
  responded_at DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_notif_driver (ambulance_driver_id),
  KEY idx_notif_hospital (hospital_id),
  KEY idx_notif_status (status)
) ENGINE=InnoDB;

-- ===== Seed Data (aligned with frontend demo) =====

-- Users
INSERT INTO users (id, phone, name, email, type, password_hash)
VALUES
('00000000-0000-0000-0000-000000000001','9999999999','Demo Patient','patient@demo.local','patient','$2a$10$demo.demo.demo.demo.demo.demo.demo.demo.demo.demo'),
('00000000-0000-0000-0000-000000000002','8888888888','Demo Driver','driver@demo.local','ambulance_driver','$2a$10$demo.demo.demo.demo.demo.demo.demo.demo.demo.demo'),
('00000000-0000-0000-0000-000000000003','7777777777','Demo Hospital Admin','admin@sanjeevani.com','hospital_admin','$2a$10$demo.demo.demo.demo.demo.demo.demo.demo.demo.demo')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Patient profile
INSERT INTO patient_profiles (id, userId)
VALUES ('00000000-0000-0000-0000-00000000p001','00000000-0000-0000-0000-000000000001')
ON DUPLICATE KEY UPDATE userId=VALUES(userId);

-- Ambulance driver profile
INSERT INTO ambulance_driver_profiles (id, userId, agencyName, vehicleNumber, licenseNumber, latitude, longitude, isActive)
VALUES
('00000000-0000-0000-0000-00000000d001','00000000-0000-0000-0000-000000000002','Rapid Response Ambulance','AMB-001',NULL,28.6139,77.2090,1)
ON DUPLICATE KEY UPDATE vehicleNumber=VALUES(vehicleNumber);

-- Hospitals
INSERT INTO hospitals (
  id, name, email, phone, address, city, state, zipCode, latitude, longitude,
  totalBeds, icuBeds, icu_beds_available, icu_beds_total, oxygen_cylinders_available, oxygen_cylinders_total,
  ambulances_available, blood_bank_info, ventilators, ambulances, doctors, specializations,
  contactPerson, contactPhone, isVerified
)
VALUES
(
  '00000000-0000-0000-0000-00000000h001',
  'Sanjeevani Care Clinic',
  'admin@sanjeevani.com',
  '9876543210',
  'Sector 14, Main Healthcare Road',
  'New Delhi',
  'Delhi',
  '110001',
  28.6139,
  77.2090,
  120, 30, 10, 30, 45, 80,
  3,
  JSON_OBJECT('groups', JSON_ARRAY('A+','A-','B+','B-','O+','O-','AB+','AB-')),
  5, 1, 50,
  JSON_ARRAY('General Medicine','Emergency Care','Cardiology'),
  'Dr. Ramesh Sharma',
  '9876543211',
  1
),
(
  '00000000-0000-0000-0000-00000000h002',
  'Apollo Super Specialty Hospital',
  'contact@apollo.com',
  '9999999991',
  'Central Medical District',
  'New Delhi',
  'Delhi',
  '110002',
  28.6260,
  77.2240,
  500, 45, 0, 45, 0, 200,
  8,
  JSON_OBJECT('groups', JSON_ARRAY('A+','B+','O+')),
  0, 8, 120,
  JSON_ARRAY('Trauma','Neurology','Cardiology'),
  'Dr. Sharma',
  '9999999991',
  1
),
(
  '00000000-0000-0000-0000-00000000h003',
  'AIIMS Hospital',
  'contact@aiims.local',
  '011-26588500',
  'AIIMS Campus',
  'New Delhi',
  'Delhi',
  '110029',
  28.5672,
  77.2100,
  800, 100, 12, 100, 80, 200,
  10,
  NULL,
  20, 10, 300,
  JSON_ARRAY('Emergency Care','Surgery','Trauma'),
  'AIIMS Admin',
  '011-26588500',
  1
);

-- Hospital admin profile (links admin user to Sanjeevani)
INSERT INTO hospital_admin_profiles (id, userId, hospitalId)
VALUES
('00000000-0000-0000-0000-00000000a001','00000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-00000000h001')
ON DUPLICATE KEY UPDATE hospitalId=VALUES(hospitalId);

-- Demo emergency + bed booking entries (stored in emergency_requests table)
INSERT INTO emergency_requests (
  id, title, description, priority, requiredResources, hospitalId,
  patientName, patientAge, patientPhone, location, latitude, longitude,
  status, assignedTo, createdBy
)
VALUES
(
  '00000000-0000-0000-0000-00000000e001',
  'Severe Trauma Alert',
  'Car accident victim, multiple fractures. Requires immediate ICU preparation.',
  'critical',
  JSON_ARRAY('icu_beds','blood_bank'),
  '00000000-0000-0000-0000-00000000h001',
  'John Doe', 0, NULL,
  'New Delhi',
  28.6139, 77.2090,
  'pending',
  NULL,
  '00000000-0000-0000-0000-000000000001'
),
(
  '00000000-0000-0000-0000-00000000e002',
  'Bed Booking (ICU)',
  'Bed booking request',
  'low',
  JSON_ARRAY(),
  '00000000-0000-0000-0000-00000000h001',
  'Jane Smith', 0, '9999999990',
  'Public Portal',
  28.6139, 77.2090,
  'pending',
  NULL,
  '00000000-0000-0000-0000-000000000001'
);

SET FOREIGN_KEY_CHECKS = 1;


