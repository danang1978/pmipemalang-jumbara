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

// POST /api/attendance/scan
router.post('/scan', authenticateToken, async (req, res) => {
  if (req.user.role === 'peserta') {
    return res.status(403).json({ error: 'Hanya Panitia/Admin yang dapat melakukan scan presensi.' });
  }

  const { participant_code, event_id, status } = req.body;
  if (!participant_code || !event_id) {
    return res.status(400).json({ error: 'Kode peserta dan ID Kegiatan wajib diisi.' });
  }

  try {
    const pool = getPool();
    const [parts] = await pool.query(
      'SELECT p.*, un.name as unit_name FROM participants p JOIN units un ON p.unit_id = un.id WHERE p.code = ?',
      [participant_code]
    );

    if (!parts.length) return res.status(404).json({ error: `Peserta dengan kode [${participant_code}] tidak ditemukan.` });
    const part = parts[0];

    if (part.status !== 'verified_kabupaten' && part.status !== 'verified_unit') {
      return res.status(400).json({ error: `Peserta [${part.full_name}] belum disetujui/diverifikasi.` });
    }

    await pool.query(
      `INSERT INTO attendance (event_id, participant_id, status, scanned_by) VALUES (?, ?, ?, ?)`,
      [event_id, part.id, status || 'hadir', req.user.username]
    );

    res.json({
      message: 'Presensi berhasil dicatat!',
      participant: {
        id: part.id,
        code: part.code,
        name: part.full_name,
        level: part.level,
        unit_name: part.unit_name,
        photo_url: part.photo_url
      },
      timestamp: new Date().toLocaleTimeString('id-ID')
    });
  } catch (err) {
    if (err.message.includes('DUPLICATE') || err.message.includes('uq_event_part')) {
      return res.status(400).json({ error: `Peserta tersebut SUDAH melakukan presensi untuk kegiatan ini.` });
    }
    res.status(500).json({ error: err.message });
  }
});

// GET /api/attendance/event/:eventId
router.get('/event/:eventId', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const query = `
      SELECT a.*, p.code as participant_code, p.full_name, p.level, un.name as unit_name
      FROM attendance a
      JOIN participants p ON a.participant_id = p.id
      JOIN units un ON p.unit_id = un.id
      WHERE a.event_id = ?
      ORDER BY a.timestamp DESC
    `;
    const [rows] = await pool.query(query, [req.params.eventId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
