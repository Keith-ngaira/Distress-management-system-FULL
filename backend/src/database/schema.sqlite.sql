-- SQLite Database Schema for Distress Management System
-- Create tables if they don't exist
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'director', 'front_office', 'cadet')),
    is_active BOOLEAN DEFAULT TRUE,
    last_login DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active_role ON users(is_active, role);

CREATE TABLE IF NOT EXISTS distress_messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio_number TEXT NOT NULL UNIQUE,
    sender_name TEXT NOT NULL,
    reference_number TEXT,
    subject TEXT NOT NULL,
    country_of_origin TEXT NOT NULL,
    distressed_person_name TEXT NOT NULL,
    nature_of_case TEXT NOT NULL,
    case_details TEXT,
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'in_progress', 'resolved')),
    created_by INTEGER,
    assigned_to INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    first_response_at DATETIME NULL,
    resolved_at DATETIME NULL,
    resolution_notes TEXT,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_distress_folio_number ON distress_messages(folio_number);
CREATE INDEX IF NOT EXISTS idx_distress_reference_number ON distress_messages(reference_number);
CREATE INDEX IF NOT EXISTS idx_distress_status ON distress_messages(status);
CREATE INDEX IF NOT EXISTS idx_distress_priority ON distress_messages(priority);
CREATE INDEX IF NOT EXISTS idx_distress_created_at ON distress_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_distress_assigned_to ON distress_messages(assigned_to);
CREATE INDEX IF NOT EXISTS idx_distress_status_priority ON distress_messages(status, priority);

CREATE TABLE IF NOT EXISTS case_updates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    distress_message_id INTEGER NOT NULL,
    updated_by INTEGER NOT NULL,
    update_text TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (distress_message_id) REFERENCES distress_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (updated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_case_updates_distress_message_id ON case_updates(distress_message_id);
CREATE INDEX IF NOT EXISTS idx_case_updates_created_at ON case_updates(created_at);

CREATE TABLE IF NOT EXISTS case_assignments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    distress_message_id INTEGER NOT NULL,
    assigned_by INTEGER NOT NULL,
    assigned_to INTEGER NOT NULL,
    assignment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    director_instructions TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'reassigned')),
    completed_at DATETIME NULL,
    FOREIGN KEY (distress_message_id) REFERENCES distress_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (assigned_by) REFERENCES users(id),
    FOREIGN KEY (assigned_to) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS attachments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    distress_message_id INTEGER NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT,
    file_size INTEGER,
    uploaded_by INTEGER NOT NULL,
    uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (distress_message_id) REFERENCES distress_messages(id) ON DELETE CASCADE,
    FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    data TEXT, -- JSON stored as TEXT in SQLite
    reference_type TEXT,
    reference_id INTEGER,
    sound_enabled BOOLEAN DEFAULT FALSE,
    read_at DATETIME NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    expires_at DATETIME NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read_at);

CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type TEXT NOT NULL CHECK (action_type IN ('create', 'update', 'delete', 'login', 'logout', 'assign')),
    entity_type TEXT NOT NULL,
    entity_id INTEGER NOT NULL,
    old_values TEXT, -- JSON stored as TEXT
    new_values TEXT, -- JSON stored as TEXT
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert initial users with hashed passwords
-- Password for all test users is: 'password123'
INSERT OR IGNORE INTO users (username, password, email, role, created_at) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlKYfn.3p8N8gVi', 'admin@example.com', 'admin', datetime('now')),
('director', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlKYfn.3p8N8gVi', 'director@example.com', 'director', datetime('now')),
('frontoffice', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlKYfn.3p8N8gVi', 'frontoffice@example.com', 'front_office', datetime('now')),
('cadet', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewlKYfn.3p8N8gVi', 'cadet@example.com', 'cadet', datetime('now'));
