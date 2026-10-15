const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'jumbara_pmr_secret_key_2026';

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi.' });
  }

  try {
    const pool = getPool();
    const query = `
      SELECT u.*, un.name as unit_name, un.code as unit_code, un.level_category
      FROM users u
      LEFT JOIN units un ON u.unit_id = un.id
      WHERE u.username = ? OR u.email = ?
    `;

    const [users] = await pool.query(query, [username, username]);
    if (!users.length) return res.status(400).json({ error: 'Username atau email tidak ditemukan.' });

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Password salah.' });
    }

    let participantData = null;
    if (user.role === 'peserta') {
      const [parts] = await pool.query('SELECT * FROM participants WHERE user_id = ?', [user.id]);
      if (parts.length) participantData = parts[0];
    }

    const tokenPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      unit_id: user.unit_id,
      unit_name: user.unit_name,
      participant_id: participantData ? participantData.id : null
    };

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '24h' });

    res.json({
      message: 'Login berhasil',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        unit_id: user.unit_id,
        unit_name: user.unit_name,
        participant: participantData
      }
    });
  } catch (err) {
    res.status(500).json({ error: 'Database error: ' + err.message });
  }
});

// POST /api/auth/register-peserta (Mandiri Peserta)
router.post('/register-peserta', async (req, res) => {
  const {
    username, password, email, full_name, unit_id, nisn, level,
    birth_place, birth_date, gender, blood_type, phone, emergency_contact,
    photo_url, sub_categories
  } = req.body;

  if (!username || !password || !full_name || !unit_id || !level) {
    return res.status(400).json({ error: 'Lengkapi seluruh data wajib pendaftaran.' });
  }

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    await conn.beginTransaction();

    const [userRes] = await conn.query(
      `INSERT INTO users (username, password, email, role, unit_id) VALUES (?, ?, ?, 'peserta', ?)`,
      [username, hashedPassword, email || `${username}@jumbara.local`, unit_id]
    );

    const userId = userRes.insertId;
    const codeNum = String(userId).padStart(4, '0');
    const code = `JMB-2026-${codeNum}`;
    const subCatsStr = Array.isArray(sub_categories) ? JSON.stringify(sub_categories) : (sub_categories || '[]');

    await conn.query(
      `INSERT INTO participants (code, user_id, unit_id, full_name, nisn, level, birth_place, birth_date, gender, blood_type, phone, emergency_contact, photo_url, sub_categories, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending_unit')`,
      [
        code, userId, unit_id, full_name, nisn, level, birth_place, birth_date,
        gender, blood_type, phone, emergency_contact, photo_url || '', subCatsStr
      ]
    );

    await conn.commit();
    res.json({
      message: 'Pendaftaran mandiri berhasil. Akun Anda telah dibuat dan menunggu verifikasi dari Admin Unit PMR Sekolah.',
      participant_code: code,
      status: 'pending_unit'
    });
  } catch (err) {
    await conn.rollback();
    if (err.message.includes('DUPLICATE') || err.message.includes('UNIQUE')) {
      return res.status(400).json({ error: 'Username atau email sudah terdaftar.' });
    }
    res.status(500).json({ error: 'Gagal pendaftaran mandiri: ' + err.message });
  } finally {
    conn.release();
  }
});

module.exports = router;
