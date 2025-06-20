-- Execute this in your local MySQL to set up the Distress Management System
-- Run this with your credentials: mysql -u root -p management < schema.sql

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS management;
USE management;

-- Create tables if they don't exist
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    role ENUM('admin', 'director', 'front_office', 'cadet') NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role),
    INDEX idx_is_active_role (is_active, role)
);

CREATE TABLE IF NOT EXISTS distress_messages (
    id INT PRIMARY KEY AUTO_INCREMENT,
    folio_number VARCHAR(50) NOT NULL UNIQUE,
    sender_name VARCHAR(255) NOT NULL,
    reference_number VARCHAR(100),
    subject VARCHAR(255) NOT NULL,
    country_of_origin VARCHAR(100) NOT NULL,
    distressed_person_name VARCHAR(255) NOT NULL,
    nature_of_case TEXT NOT NULL,
    case_details TEXT,
    priority ENUM('low', 'medium', 'high', 'urgent') DEFAULT 'medium',
    status ENUM('pending', 'assigned', 'in_progress', 'resolved') DEFAULT 'pending',
    created_by INT,
    assigned_to INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    first_response_at TIMESTAMP NULL,
    resolved_at TIMESTAMP NULL,
    resolution_notes TEXT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_folio_number (folio_number),
    INDEX idx_reference_number (reference_number),
    INDEX idx_status (status),
    INDEX idx_priority (priority),
    INDEX idx_created_at (created_at),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_first_response_at (first_response_at),
    INDEX idx_resolved_at (resolved_at),
    INDEX idx_status_priority (status, priority),
    INDEX idx_search (sender_name, distressed_person_name, subject)
);

CREATE TABLE IF NOT EXISTS case_updates (
    id INT PRIMARY KEY AUTO_INCREMENT,
    distress_message_id INT NOT NULL,
    updated_by INT NOT NULL,
    update_text TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (distress_message_id) REFERENCES distress_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE NO ACTION,
    INDEX idx_distress_message_id (distress_message_id),
    INDEX idx_created_at (created_at),
    INDEX idx_updated_by_created_at (updated_by, created_at)
);

CREATE TABLE IF NOT EXISTS case_assignments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    distress_message_id INT NOT NULL,
    assigned_by INT NOT NULL,
    assigned_to INT NOT NULL,
    assignment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    director_instructions TEXT,
    status ENUM('active', 'completed', 'reassigned') DEFAULT 'active',
    completed_at TIMESTAMP NULL,
    FOREIGN KEY (distress_message_id) REFERENCES distress_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE NO ACTION,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE NO ACTION,
    INDEX idx_distress_message_id (distress_message_id),
    INDEX idx_assigned_to (assigned_to),
    INDEX idx_status (status),
    INDEX idx_assignment_date (assignment_date),
    INDEX idx_completed_at (completed_at),
    INDEX idx_active_assignments (assigned_to, status, completed_at)
);

CREATE TABLE IF NOT EXISTS attachments (
    id INT PRIMARY KEY AUTO_INCREMENT,
    distress_message_id INT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size BIGINT,
    uploaded_by INT NOT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (distress_message_id) REFERENCES distress_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE NO ACTION,
    INDEX idx_distress_message_id (distress_message_id),
    INDEX idx_uploaded_at (uploaded_at),
    INDEX idx_file_type (file_type),
    INDEX idx_uploaded_by_uploaded_at (uploaded_by, uploaded_at)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    data JSON,
    reference_type VARCHAR(50),
    reference_id INT,
    sound_enabled BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_unread (user_id, read_at),
    INDEX idx_reference (reference_type, reference_id),
    INDEX idx_expires_at (expires_at),
    INDEX idx_created_at (created_at)
);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT,
    action_type ENUM('create', 'update', 'delete', 'login', 'logout', 'assign') NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id INT NOT NULL,
    old_values JSON,
    new_values JSON,
    ip_address VARCHAR(45),
    user_agent VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_action_type (action_type),
    INDEX idx_entity_type_id (entity_type, entity_id),
    INDEX idx_created_at (created_at),
    INDEX idx_audit_search (entity_type, action_type, created_at)
);

CREATE TABLE IF NOT EXISTS cleanup_events (
    id INT PRIMARY KEY AUTO_INCREMENT,
    event_type VARCHAR(50) NOT NULL,
    last_run TIMESTAMP NULL,
    next_run TIMESTAMP NULL,
    status VARCHAR(20) DEFAULT 'pending',
    affected_rows INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_next_run (next_run),
    INDEX idx_event_type (event_type)
);

-- Insert comprehensive test users (passwords are: admin123, director123, frontoffice123, cadet123)
INSERT IGNORE INTO users (username, password, email, role, is_active, last_login, created_at) VALUES
-- Admins (3 users)
('admin', '$2b$10$NKxDv2xBS3.Pc0mMHlATQuMi.auxS0Gaoers5FqPFtqejiNRK/OYm', 'admin@distressms.com', 'admin', TRUE, '2024-01-15 14:30:00', '2024-01-01 08:00:00'),
('john_admin', '$2b$10$NKxDv2xBS3.Pc0mMHlATQuMi.auxS0Gaoers5FqPFtqejiNRK/OYm', 'john.admin@distressms.com', 'admin', TRUE, '2024-01-14 16:45:00', '2024-01-02 09:15:00'),
('sarah_admin', '$2b$10$NKxDv2xBS3.Pc0mMHlATQuMi.auxS0Gaoers5FqPFtqejiNRK/OYm', 'sarah.admin@distressms.com', 'admin', FALSE, '2024-01-10 12:20:00', '2024-01-03 10:30:00'),

-- Directors (5 users)
('director', '$2b$10$66.a0QLBw5BjeEPAqFMcUuQBApkvJ5yKb3fNCKIdl/o.iT29A2Dna', 'director@distressms.com', 'director', TRUE, '2024-01-15 15:00:00', '2024-01-01 08:15:00'),
('michael_dir', '$2b$10$66.a0QLBw5BjeEPAqFMcUuQBApkvJ5yKb3fNCKIdl/o.iT29A2Dna', 'michael.director@distressms.com', 'director', TRUE, '2024-01-15 11:30:00', '2024-01-02 08:45:00'),
('lisa_dir', '$2b$10$66.a0QLBw5BjeEPAqFMcUuQBApkvJ5yKb3fNCKIdl/o.iT29A2Dna', 'lisa.director@distressms.com', 'director', TRUE, '2024-01-14 17:15:00', '2024-01-03 09:00:00'),
('james_dir', '$2b$10$66.a0QLBw5BjeEPAqFMcUuQBApkvJ5yKb3fNCKIdl/o.iT29A2Dna', 'james.director@distressms.com', 'director', TRUE, '2024-01-13 13:45:00', '2024-01-04 10:15:00'),
('emma_dir', '$2b$10$66.a0QLBw5BjeEPAqFMcUuQBApkvJ5yKb3fNCKIdl/o.iT29A2Dna', 'emma.director@distressms.com', 'director', FALSE, '2024-01-12 16:30:00', '2024-01-05 11:00:00'),

-- Front Office Staff (8 users)
('frontoffice', '$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.', 'frontoffice@distressms.com', 'front_office', TRUE, '2024-01-15 16:20:00', '2024-01-01 08:30:00'),
('alex_front', '$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.', 'alex.front@distressms.com', 'front_office', TRUE, '2024-01-15 14:10:00', '2024-01-02 09:30:00'),
('maria_front', '$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.', 'maria.front@distressms.com', 'front_office', TRUE, '2024-01-15 12:50:00', '2024-01-03 10:45:00'),
('david_front', '$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.', 'david.front@distressms.com', 'front_office', TRUE, '2024-01-14 18:30:00', '2024-01-04 11:15:00'),
('sophie_front', '$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.', 'sophie.front@distressms.com', 'front_office', TRUE, '2024-01-14 15:40:00', '2024-01-05 12:00:00'),
('ryan_front', '$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.', 'ryan.front@distressms.com', 'front_office', FALSE, '2024-01-13 10:20:00', '2024-01-06 13:15:00'),
('anna_front', '$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.', 'anna.front@distressms.com', 'front_office', TRUE, '2024-01-12 14:15:00', '2024-01-07 14:30:00'),
('tom_front', '$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.', 'tom.front@distressms.com', 'front_office', TRUE, '2024-01-11 16:45:00', '2024-01-08 15:45:00'),

-- Cadets (15 users)
('cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'cadet@distressms.com', 'cadet', TRUE, '2024-01-15 17:00:00', '2024-01-01 09:00:00'),
('peter_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'peter.cadet@distressms.com', 'cadet', TRUE, '2024-01-15 13:20:00', '2024-01-02 10:15:00'),
('julia_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'julia.cadet@distressms.com', 'cadet', TRUE, '2024-01-15 11:45:00', '2024-01-03 11:30:00'),
('mark_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'mark.cadet@distressms.com', 'cadet', TRUE, '2024-01-14 19:10:00', '2024-01-04 12:45:00'),
('lucy_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'lucy.cadet@distressms.com', 'cadet', TRUE, '2024-01-14 16:30:00', '2024-01-05 14:00:00'),
('chris_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'chris.cadet@distressms.com', 'cadet', FALSE, '2024-01-13 12:15:00', '2024-01-06 15:15:00'),
('nina_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'nina.cadet@distressms.com', 'cadet', TRUE, '2024-01-13 14:50:00', '2024-01-07 16:30:00'),
('kevin_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'kevin.cadet@distressms.com', 'cadet', TRUE, '2024-01-12 17:25:00', '2024-01-08 17:45:00'),
('grace_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'grace.cadet@distressms.com', 'cadet', TRUE, '2024-01-12 15:40:00', '2024-01-09 09:15:00'),
('daniel_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'daniel.cadet@distressms.com', 'cadet', TRUE, '2024-01-11 18:15:00', '2024-01-10 10:30:00'),
('amy_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'amy.cadet@distressms.com', 'cadet', FALSE, '2024-01-11 13:30:00', '2024-01-11 11:45:00'),
('robert_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'robert.cadet@distressms.com', 'cadet', TRUE, '2024-01-10 16:20:00', '2024-01-12 13:00:00'),
('claire_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'claire.cadet@distressms.com', 'cadet', TRUE, '2024-01-10 14:35:00', '2024-01-13 14:15:00'),
('lucas_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'lucas.cadet@distressms.com', 'cadet', TRUE, '2024-01-09 19:00:00', '2024-01-14 15:30:00'),
('olivia_cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'olivia.cadet@distressms.com', 'cadet', TRUE, '2024-01-09 12:45:00', '2024-01-15 16:45:00');

-- Insert sample distress messages for dashboard statistics
INSERT IGNORE INTO distress_messages (folio_number, sender_name, reference_number, subject, country_of_origin, distressed_person_name, nature_of_case, case_details, priority, status, created_by, assigned_to, created_at, first_response_at, resolved_at) VALUES
('DM001', 'Captain Johnson', 'REF001', 'Medical Emergency at Sea', 'United States', 'John Smith', 'Medical Emergency', 'Passenger suffering heart attack on cruise ship', 'urgent', 'resolved', 1, 5, '2024-01-10 08:30:00', '2024-01-10 08:45:00', '2024-01-10 12:30:00'),
('DM002', 'Harbor Master', 'REF002', 'Vessel in Distress', 'Canada', 'Mary Williams', 'Ship Emergency', 'Cargo vessel taking on water near coast', 'high', 'resolved', 2, 6, '2024-01-11 14:15:00', '2024-01-11 14:30:00', '2024-01-11 18:45:00'),
('DM003', 'Coast Guard Station', 'REF003', 'Missing Person Report', 'United Kingdom', 'David Brown', 'Missing Person', 'Tourist missing from hiking trail', 'medium', 'in_progress', 3, 7, '2024-01-12 09:20:00', '2024-01-12 09:35:00', NULL),
('DM004', 'Emergency Services', 'REF004', 'Aircraft Emergency', 'Australia', 'Sarah Davis', 'Aviation Emergency', 'Small aircraft forced landing', 'high', 'assigned', 1, 8, '2024-01-13 16:40:00', '2024-01-13 17:00:00', NULL),
('DM005', 'Police Department', 'REF005', 'Natural Disaster Response', 'Japan', 'Multiple Victims', 'Natural Disaster', 'Earthquake response coordination needed', 'urgent', 'in_progress', 2, 9, '2024-01-14 11:25:00', '2024-01-14 11:40:00', NULL),
('DM006', 'Fire Department', 'REF006', 'Building Collapse', 'Italy', 'Construction Workers', 'Structural Emergency', 'Building collapse with trapped workers', 'urgent', 'pending', 3, NULL, '2024-01-15 13:10:00', NULL, NULL),
('DM007', 'Red Cross', 'REF007', 'Humanitarian Crisis', 'Somalia', 'Refugee Families', 'Humanitarian', 'Urgent medical supplies needed', 'high', 'assigned', 1, 10, '2024-01-15 10:45:00', '2024-01-15 11:00:00', NULL),
('DM008', 'Airport Authority', 'REF008', 'Security Incident', 'France', 'Airport Staff', 'Security', 'Suspicious package at terminal', 'medium', 'resolved', 2, 11, '2024-01-08 15:30:00', '2024-01-08 15:45:00', '2024-01-08 17:20:00'),
('DM009', 'Maritime Authority', 'REF009', 'Oil Spill Response', 'Norway', 'Environmental Team', 'Environmental', 'Oil spill cleanup coordination', 'high', 'in_progress', 3, 12, '2024-01-09 12:15:00', '2024-01-09 12:30:00', NULL),
('DM010', 'Hospital', 'REF010', 'Mass Casualty Event', 'Spain', 'Multiple Patients', 'Medical Emergency', 'Bus accident with multiple injuries', 'urgent', 'pending', 1, NULL, '2024-01-15 17:20:00', NULL, NULL);

-- Insert case updates for active cases
INSERT IGNORE INTO case_updates (distress_message_id, updated_by, update_text, created_at) VALUES
(3, 7, 'Search and rescue team deployed to last known location', '2024-01-12 10:00:00'),
(3, 7, 'Helicopter search in progress, no visual contact yet', '2024-01-12 14:30:00'),
(4, 8, 'Emergency response team dispatched to crash site', '2024-01-13 17:15:00'),
(5, 9, 'Coordination center established, multiple agencies involved', '2024-01-14 12:00:00'),
(5, 9, 'Search and rescue operations ongoing in affected areas', '2024-01-14 15:45:00'),
(7, 10, 'Medical supplies being prepared for shipment', '2024-01-15 11:30:00'),
(9, 12, 'Environmental assessment team deployed to spill site', '2024-01-09 13:00:00'),
(9, 12, 'Containment efforts underway, cleanup equipment en route', '2024-01-09 16:20:00');

-- Insert case assignments
INSERT IGNORE INTO case_assignments (distress_message_id, assigned_by, assigned_to, assignment_date, director_instructions, status) VALUES
(1, 4, 5, '2024-01-10 08:45:00', 'Priority medical response required', 'completed'),
(2, 4, 6, '2024-01-11 14:30:00', 'Coordinate with coast guard immediately', 'completed'),
(3, 5, 7, '2024-01-12 09:35:00', 'Initiate full search and rescue protocol', 'active'),
(4, 5, 8, '2024-01-13 17:00:00', 'Aviation emergency procedures in effect', 'active'),
(5, 4, 9, '2024-01-14 11:40:00', 'Multi-agency coordination required', 'active'),
(7, 6, 10, '2024-01-15 11:00:00', 'Expedite humanitarian aid delivery', 'active'),
(8, 6, 11, '2024-01-08 15:45:00', 'Security protocols must be followed', 'completed'),
(9, 5, 12, '2024-01-09 12:30:00', 'Environmental protection priority', 'active');

-- Insert notifications for active users
INSERT IGNORE INTO notifications (user_id, type, title, message, reference_type, reference_id, created_at, read_at) VALUES
(7, 'assignment', 'New Case Assignment', 'You have been assigned to case DM003 - Missing Person Report', 'distress_message', 3, '2024-01-12 09:35:00', NULL),
(8, 'assignment', 'New Case Assignment', 'You have been assigned to case DM004 - Aircraft Emergency', 'distress_message', 4, '2024-01-13 17:00:00', NULL),
(9, 'assignment', 'New Case Assignment', 'You have been assigned to case DM005 - Natural Disaster Response', 'distress_message', 5, '2024-01-14 11:40:00', '2024-01-14 12:00:00'),
(10, 'assignment', 'New Case Assignment', 'You have been assigned to case DM007 - Humanitarian Crisis', 'distress_message', 7, '2024-01-15 11:00:00', NULL),
(12, 'assignment', 'New Case Assignment', 'You have been assigned to case DM009 - Oil Spill Response', 'distress_message', 9, '2024-01-09 12:30:00', '2024-01-09 13:00:00'),
(1, 'system', 'System Update', 'Database maintenance scheduled for tonight', 'system', NULL, '2024-01-15 09:00:00', '2024-01-15 09:15:00'),
(4, 'urgent', 'Urgent Cases Pending', 'Multiple urgent cases require immediate attention', 'system', NULL, '2024-01-15 17:30:00', NULL);

-- Confirm setup and show statistics
SELECT 'Database setup completed successfully!' as status;

SELECT 
    'User Statistics' as report_type,
    role,
    COUNT(*) as total_users,
    SUM(CASE WHEN is_active = TRUE THEN 1 ELSE 0 END) as active_users,
    SUM(CASE WHEN is_active = FALSE THEN 1 ELSE 0 END) as inactive_users
FROM users 
GROUP BY role
ORDER BY FIELD(role, 'admin', 'director', 'front_office', 'cadet');

SELECT 
    'Case Statistics' as report_type,
    status,
    COUNT(*) as case_count,
    AVG(CASE WHEN priority = 'urgent' THEN 4 WHEN priority = 'high' THEN 3 WHEN priority = 'medium' THEN 2 ELSE 1 END) as avg_priority_score
FROM distress_messages 
GROUP BY status
ORDER BY FIELD(status, 'pending', 'assigned', 'in_progress', 'resolved');

SELECT 'Sample users created with password: admin123, director123, frontoffice123, cadet123' as login_info;
