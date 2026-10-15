const mysql = require('mysql2/promise');

const DB_CONFIG = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: parseInt(process.env.DB_PORT || '8889'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'jumbara_db',
  waitForConnections: true,
  connectionLimit: 15,
  queueLimit: 0
};

let pool = null;

async function initDatabase() {
  try {
    const rootConn = await mysql.createConnection({
      host: DB_CONFIG.host,
      port: DB_CONFIG.port,
      user: DB_CONFIG.user,
      password: DB_CONFIG.password
    });

    await rootConn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_CONFIG.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
    await rootConn.end();

    pool = mysql.createPool(DB_CONFIG);

    // Create Tables
    await pool.query(`
      CREATE TABLE IF NOT EXISTS units (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        level_category VARCHAR(100) NOT NULL,
        pembina_name VARCHAR(255) NOT NULL,
        phone VARCHAR(50),
        address TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(150) UNIQUE,
        role VARCHAR(50) NOT NULL,
        unit_id INT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS participants (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        user_id INT UNIQUE,
        unit_id INT NOT NULL,
        full_name VARCHAR(255) NOT NULL,
        nisn VARCHAR(50),
        level VARCHAR(50) NOT NULL,
        registration_type VARCHAR(50) DEFAULT 'Peserta',
        religion VARCHAR(50) DEFAULT 'Islam',
        is_disabled VARCHAR(20) DEFAULT 'Tidak',
        disability_type VARCHAR(150) DEFAULT 'Tidak Ada',
        address TEXT,
        birth_place VARCHAR(100),
        birth_date VARCHAR(50),
        gender CHAR(1),
        blood_type VARCHAR(10),
        phone VARCHAR(50),
        emergency_contact VARCHAR(255),
        photo_url TEXT,
        assignment_letter_url TEXT,
        sub_categories TEXT,
        status VARCHAR(50) DEFAULT 'pending_unit',
        reject_reason TEXT,
        email VARCHAR(100),
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS events (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        pmr_level VARCHAR(50) DEFAULT 'Semua',
        location VARCHAR(255) NOT NULL,
        event_date VARCHAR(50) NOT NULL,
        start_time VARCHAR(20) NOT NULL,
        end_time VARCHAR(20) NOT NULL,
        description TEXT,
        pic_name VARCHAR(150),
        max_participants_per_unit INT NOT NULL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_registrations (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        participant_id INT NOT NULL,
        registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY event_part_unique (event_id, participant_id),
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS attendance (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        participant_id INT NOT NULL,
        scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        scanned_by VARCHAR(100),
        status VARCHAR(50) DEFAULT 'masuk',
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS scores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT,
        unit_id INT NOT NULL,
        participant_id INT,
        target_type VARCHAR(20) DEFAULT 'peserta',
        category_type VARCHAR(50) NOT NULL,
        branch_name VARCHAR(150) NOT NULL,
        pmr_level VARCHAR(50) NOT NULL,
        score_val DOUBLE NOT NULL,
        grade VARCHAR(50),
        judge_name VARCHAR(150),
        notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE,
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS event_aspects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        event_id INT NOT NULL,
        aspect_name VARCHAR(150) NOT NULL,
        max_score DOUBLE DEFAULT 100,
        weight DOUBLE DEFAULT 1.0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS score_aspect_details (
        id INT AUTO_INCREMENT PRIMARY KEY,
        score_id INT NOT NULL,
        aspect_id INT NOT NULL,
        score_val DOUBLE DEFAULT 0,
        FOREIGN KEY (score_id) REFERENCES scores(id) ON DELETE CASCADE,
        FOREIGN KEY (aspect_id) REFERENCES event_aspects(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    try { await pool.query("ALTER TABLE scores ADD COLUMN event_id INT NULL AFTER id"); } catch (e) {}
    try { await pool.query("ALTER TABLE scores ADD COLUMN target_type VARCHAR(20) DEFAULT 'peserta' AFTER participant_id"); } catch (e) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS announcements (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        target_role VARCHAR(50) DEFAULT 'all',
        priority VARCHAR(50) DEFAULT 'normal',
        author_name VARCHAR(150) DEFAULT 'Panitia Kabupaten PMI',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        \`key\` VARCHAR(100) PRIMARY KEY,
        \`value\` TEXT
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS unsur_categories (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        quota INT NOT NULL DEFAULT 1,
        description VARCHAR(255) DEFAULT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `);

    // Migrations for existing tables
    const migrations = [
      "ALTER TABLE participants ADD COLUMN IF NOT EXISTS registration_type VARCHAR(50) DEFAULT 'Peserta'",
      "ALTER TABLE participants ADD COLUMN IF NOT EXISTS religion VARCHAR(50) DEFAULT 'Islam'",
      "ALTER TABLE participants ADD COLUMN IF NOT EXISTS is_disabled VARCHAR(20) DEFAULT 'Tidak'",
      "ALTER TABLE participants ADD COLUMN IF NOT EXISTS disability_type VARCHAR(150) DEFAULT 'Tidak Ada'",
      "ALTER TABLE participants ADD COLUMN IF NOT EXISTS address TEXT DEFAULT NULL",
      "ALTER TABLE participants ADD COLUMN IF NOT EXISTS assignment_letter_url TEXT DEFAULT NULL",
      "ALTER TABLE participants ADD COLUMN IF NOT EXISTS email VARCHAR(100) DEFAULT NULL",
      "ALTER TABLE events ADD COLUMN IF NOT EXISTS max_participants_per_unit INT NOT NULL DEFAULT 0"
    ];
    for (const sql of migrations) {
      try { await pool.query(sql); } catch (e) {}
    }

    console.log(`[Backend Database] MySQL Connection Pool [${DB_CONFIG.database}] Ready!`);
    return pool;
  } catch (err) {
    console.error('[Backend Database] Connection Error:', err);
    throw err;
  }
}

function getPool() {
  if (!pool) {
    throw new Error('Database pool has not been initialized. Call initDatabase() first.');
  }
  return pool;
}

module.exports = {
  initDatabase,
  getPool
};
