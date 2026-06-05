-- LifeLink Database Schema - MySQL 8.0
-- SIMPLIFIED for Quick Implementation
-- Database: LifeLink_dev
-- User: root
-- All user types are stored in users table with 'type' field

CREATE DATABASE IF NOT EXISTS LifeLink_dev;
USE LifeLink_dev;

-- Users Table (Hospital Admin, Ambulance Driver, Patient - all treated as users)
CREATE TABLE IF NOT EXISTS users (
  id CHAR(36) PRIMARY KEY,
  phone VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  type ENUM('patient', 'ambulance_driver', 'hospital_admin') NOT NULL DEFAULT 'patient',
  password_hash VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_phone (phone),
  INDEX idx_type (type)
);

-- Hospitals Table (Hospital Profile - created by hospital_admin after login)
CREATE TABLE IF NOT EXISTS hospitals (
  id CHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(255) NOT NULL,
  address VARCHAR(255) NOT NULL,
  city VARCHAR(255) NOT NULL,
  state VARCHAR(255) NOT NULL,
  zipCode VARCHAR(255) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  totalBeds INT DEFAULT 0,
  icuBeds INT DEFAULT 0,
  icu_beds_available INT DEFAULT 0,
  icu_beds_total INT DEFAULT 0,
  oxygen_cylinders_available INT DEFAULT 0,
  oxygen_cylinders_total INT DEFAULT 0,
  blood_bank_info JSON NULL,
  ambulances_available INT DEFAULT 0,
  ventilators INT DEFAULT 0,
  ambulances INT DEFAULT 0,
  doctors INT DEFAULT 0,
  specializations JSON,
  contactPerson VARCHAR(255) NOT NULL,
  contactPhone VARCHAR(255) NOT NULL,
  isVerified BOOLEAN DEFAULT false,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  INDEX idx_city (city),
  INDEX idx_location (latitude, longitude)
);

-- Emergency Requests Table
CREATE TABLE IF NOT EXISTS emergency_requests (
  id CHAR(36) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority ENUM('low', 'medium', 'high', 'critical') DEFAULT 'medium',
  requiredResources JSON,
  hospitalId CHAR(36) NULL,
  patientName VARCHAR(255) NOT NULL,
  patientAge INT NOT NULL,
  patientPhone VARCHAR(255) NULL,
  location VARCHAR(255) NOT NULL,
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  status ENUM('pending', 'assigned', 'in_transit', 'completed', 'cancelled') DEFAULT 'pending',
  assignedTo CHAR(36) NULL,
  createdBy CHAR(36) NOT NULL,
  estimatedArrival DATETIME NULL,
  completedAt DATETIME NULL,
  createdAt DATETIME NOT NULL,
  updatedAt DATETIME NOT NULL,
  FOREIGN KEY (hospitalId) REFERENCES hospitals(id) ON DELETE SET NULL,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_status (status),
  INDEX idx_hospital (hospitalId)
);

