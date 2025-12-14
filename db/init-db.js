#!/usr/bin/env node
/**
 * Database initialization script
 * Creates all required tables and inserts sample data
 * Usage: node db/init-db.js
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  let connection;
  try {
    // Connect to MySQL without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASS || '123456',
    });

    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    const dbName = process.env.DB_NAME || 'online_turkey';
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
    console.log(`✅ Database "${dbName}" ready`);

    // Select database
    await connection.query(`USE ${dbName}`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'create-tables.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    for (const statement of statements) {
      try {
        await connection.query(statement);
      } catch (err) {
        console.warn(`⚠️  Statement warning: ${err.message}`);
      }
    }

    console.log('✅ All tables created successfully');

    // Verify tables exist
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`✅ Tables in database: ${tables.map(t => Object.values(t)[0]).join(', ')}`);

    console.log('\n✅ Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Run if called directly
if (require.main === module) {
  require('dotenv').config();
  initDatabase();
}

module.exports = { initDatabase };
