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

-- Insert initial users with email addresses (passwords match README: admin123, director123, etc.)
INSERT IGNORE INTO users (username, password, email, role, created_at) VALUES
('admin', '$2b$10$NKxDv2xBS3.Pc0mMHlATQuMi.auxS0Gaoers5FqPFtqejiNRK/OYm', 'admin@example.com', 'admin', '2025-02-23 17:07:25'),
('director', '$2b$10$66.a0QLBw5BjeEPAqFMcUuQBApkvJ5yKb3fNCKIdl/o.iT29A2Dna', 'director@example.com', 'director', '2025-02-23 17:07:25'),
('frontoffice', '$2b$10$pk/89H4ej95La1swZcjvLeRD6NKg8TP7xo/YiGuVR3hGA2YYBrM1.', 'frontoffice@example.com', 'front_office', '2025-02-23 17:07:25'),
('cadet', '$2b$10$NXHZpOFqqeCfJh5DLN.RnuwckhJEwLybEk6sCYEisKacrncZC/kwW', 'cadet@example.com', 'cadet', '2025-02-23 17:07:25'),
('Keith', '$2b$10$Q0jfYPdUT7u9b1S7spV/0urJJl38.qEfwlNJ5ULtWs.b.dTzm1vgW', 'keith@example.com', 'director', '2025-02-24 08:26:13'),
('John', '$2b$10$r1OGhlqH7pxOGQFT5/sywOECATiNpwHXOR9tTQ7STLQCsVImTWxZS', 'john@example.com', 'cadet', '2025-02-24 08:27:43'),
('Doe', '$2b$10$H4ePA4ad5fw0TRv/bZQAX.X7nBjXMTYk4Tj.9H2vK0gl2uvMvO7E.', 'doe@example.com', 'cadet', '2025-02-24 08:28:32');
