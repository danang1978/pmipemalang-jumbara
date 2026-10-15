const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { getPool } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'jumbara_pmr_secret_key_2026';

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Akses ditolak.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Sesi habis.' });
    req.user = user;
    next();
  });
}

// GET /api/events
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM events ORDER BY event_date ASC, start_time ASC');
    
    for (const ev of rows) {
      const [aspects] = await pool.query('SELECT id, aspect_name, max_score, weight FROM event_aspects WHERE event_id = ? ORDER BY id ASC', [ev.id]);
      ev.aspects = aspects;
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/events
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'kabupaten') {
    return res.status(403).json({ error: 'Hanya Admin Kabupaten yang dapat mengelola jadwal.' });
  }

  const { title, category, pmr_level, location, event_date, start_time, end_time, description, pic_name } = req.body;
  if (!title || !location || !event_date || !start_time || !end_time) {
    return res.status(400).json({ error: 'Judul, lokasi, tanggal, dan jam kegiatan wajib diisi.' });
  }

  try {
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO events (title, category, pmr_level, location, event_date, start_time, end_time, description, pic_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, category || 'Umum', pmr_level || 'Semua', location, event_date, start_time, end_time, description || '', pic_name || '']
    );
    res.json({ message: 'Jadwal kegiatan berhasil ditambahkan', event_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/events/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'kabupaten') {
    return res.status(403).json({ error: 'Hanya Admin Kabupaten yang dapat menghapus jadwal.' });
  }
  try {
    const pool = getPool();
    await pool.query('DELETE FROM events WHERE id = ?', [req.params.id]);
    res.json({ message: 'Jadwal kegiatan berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
