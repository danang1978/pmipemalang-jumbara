const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

// Middleware to verify JWT token
function authenticateToken(req, res, next) {
  const jwt = require('jsonwebtoken');
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Akses ditolak.' });

  jwt.verify(token, process.env.JWT_SECRET || 'jumbara_pmr_secret_key_2026', (err, user) => {
    if (err) return res.status(403).json({ error: 'Sesi habis.' });
    req.user = user;
    next();
  });
}

// GET /api/units
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM units ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/units
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'kabupaten') {
    return res.status(403).json({ error: 'Hanya Admin Kabupaten yang dapat menambah Unit PMR.' });
  }
  const { name, level_category, pembina_name, phone, address } = req.body;
  if (!name || !level_category || !pembina_name) {
    return res.status(400).json({ error: 'Nama unit, tingkat PMR, dan Pembina wajib diisi.' });
  }

  try {
    const pool = getPool();
    const code = 'UNT-' + Math.floor(100 + Math.random() * 900);
    const [result] = await pool.query(
      `INSERT INTO units (code, name, level_category, pembina_name, phone, address) VALUES (?, ?, ?, ?, ?, ?)`,
      [code, name, level_category, pembina_name, phone || '', address || '']
    );
    res.json({ message: 'Unit PMR berhasil ditambahkan', unit_id: result.insertId, code });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
