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

// GET /api/announcements
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM announcements ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/announcements
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'kabupaten') {
    return res.status(403).json({ error: 'Hanya Admin Kabupaten yang dapat membuat pengumuman.' });
  }

  const { title, content, target_role, priority } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Judul dan isi pengumuman wajib diisi.' });
  }

  try {
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO announcements (title, content, target_role, priority, author_name) VALUES (?, ?, ?, ?, ?)`,
      [title, content, target_role || 'all', priority || 'normal', req.user.username]
    );
    res.json({ message: 'Pengumuman berhasil dipublikasikan.', announcement_id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/announcements/:id
router.delete('/:id', authenticateToken, async (req, res) => {
  if (req.user.role !== 'kabupaten') {
    return res.status(403).json({ error: 'Hanya Admin Kabupaten yang dapat menghapus pengumuman.' });
  }
  try {
    const pool = getPool();
    await pool.query('DELETE FROM announcements WHERE id = ?', [req.params.id]);
    res.json({ message: 'Pengumuman berhasil dihapus.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
