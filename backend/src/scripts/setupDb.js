import bcrypt from 'bcrypt';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const users = [
    { username: 'admin', password: 'admin123', role: 'admin', email: 'admin@example.com' },
    { username: 'director', password: 'director123', role: 'director', email: 'director@example.com' },
    { username: 'frontoffice', password: 'frontoffice123', role: 'front_office', email: 'frontoffice@example.com' },
    { username: 'cadet', password: 'cadet123', role: 'cadet', email: 'cadet@example.com' }
];

// Create a separate connection for initialization that doesn't require an existing database
const initConnection = async () => {
    const config = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        waitForConnections: true,
        ssl: process.env.NODE_ENV === 'production' ? {
            rejectUnauthorized: true,
            minVersion: 'TLSv1.2'
        } : undefined
    };

    try {
        return await mysql.createConnection(config);
    } catch (error) {
        console.error('Failed to create initialization connection:', error);
        throw error;
    }
};

async function setupDatabase() {
    let connection;
    
    try {
        // Create initial connection
        connection = await initConnection();
        console.log('Connected to MySQL server');

        // Create and use database
        await connection.query('CREATE DATABASE IF NOT EXISTS ??', [process.env.DB_NAME || 'management']);
        await connection.query('USE ??', [process.env.DB_NAME || 'management']);
        console.log('Using database:', process.env.DB_NAME || 'management');

        // Drop existing tables if --force flag is provided
        if (process.argv.includes('--force')) {
            console.log('\nForce flag detected. Dropping existing tables...');
            const dropTables = [
                'cleanup_events',
                'audit_logs',
                'notifications',
                'attachments',
                'case_assignments',
                'case_updates',
                'distress_messages',
                'users'
            ];
            
            for (const table of dropTables) {
                try {
                    await connection.query(`DROP TABLE IF EXISTS ${table}`);
                    console.log(`Dropped table: ${table}`);
                } catch (error) {
                    console.error(`Error dropping table ${table}:`, error);
                }
            }
        }

        // Read and execute schema.sql
        const schemaPath = path.join(__dirname, '../database/schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        const statements = schemaSql
            .split(';')
            .filter(stmt => stmt.trim())
            .map(stmt => stmt.trim() + ';');
        
        console.log('\nCreating database schema...');
        for (const statement of statements) {
            if (statement.trim()) {
                try {
                    await connection.query(statement);
                    console.log('Successfully executed:', statement.substring(0, 50) + '...');
                } catch (error) {
                    if (!error.message.includes('already exists')) {
                        throw error;
                    }
                    console.log('Table already exists, skipping...');
                }
            }
        }
        console.log('Database schema created successfully');

        // Create users only if --force flag was used or users table is empty
        const [existingUsers] = await connection.query('SELECT COUNT(*) as count FROM users');
        if (process.argv.includes('--force') || existingUsers[0].count === 0) {
            console.log('\nCreating default users...');
            for (const user of users) {
                const salt = await bcrypt.genSalt(10);
                const hashedPassword = await bcrypt.hash(user.password, salt);

                try {
                    await connection.execute(
                        'INSERT INTO users (username, password, email, role) VALUES (?, ?, ?, ?)',
                        [user.username, hashedPassword, user.email, user.role]
                    );
                    console.log(`Created user: ${user.username} with role: ${user.role}`);
                } catch (error) {
                    if (error.code === 'ER_DUP_ENTRY') {
                        console.log(`User ${user.username} already exists, skipping...`);
                    } else {
                        throw error;
                    }
                }
            }

            console.log('\nAll users created successfully!');
            console.log('\nTest credentials:');
            users.forEach(user => {
                console.log(`\nUsername: ${user.username}`);
                console.log(`Password: ${user.password}`);
                console.log(`Role: ${user.role}`);
            });
        } else {
            console.log('\nUsers already exist, skipping user creation...');
        }

    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
        }
        process.exit();
    }
}

// Validate required environment variables
const requiredEnvVars = ['DB_PASSWORD'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    console.error('Missing required environment variables:', missingEnvVars.join(', '));
    process.exit(1);
}

setupDatabase();
