const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');
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

// GET /api/participants
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    let query = `
      SELECT p.*, un.name as unit_name, un.code as unit_code, u.username, u.email
      FROM participants p
      JOIN units un ON p.unit_id = un.id
      LEFT JOIN users u ON p.user_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'unit') {
      query += ` AND p.unit_id = ? `;
      params.push(req.user.unit_id);
    } else if (req.query.unit_id) {
      query += ` AND p.unit_id = ? `;
      params.push(req.query.unit_id);
    }

    if (req.query.status) {
      query += ` AND p.status = ? `;
      params.push(req.query.status);
    }

    if (req.query.level) {
      query += ` AND p.level = ? `;
      params.push(req.query.level);
    }

    if (req.query.search) {
      query += ` AND (p.full_name LIKE ? OR p.code LIKE ? OR p.nisn LIKE ?) `;
      const term = `%${req.query.search}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY p.created_at DESC `;

    const [rows] = await pool.query(query, params);
    const result = rows.map(r => ({
      ...r,
      sub_categories: r.sub_categories ? JSON.parse(r.sub_categories) : []
    }));
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/participants/me
router.get('/me', authenticateToken, async (req, res) => {
  if (req.user.role !== 'peserta') {
    return res.status(400).json({ error: 'Endpoint ini khusus peserta.' });
  }

  try {
    const pool = getPool();
    const query = `
      SELECT p.*, un.name as unit_name, un.code as unit_code, un.pembina_name, un.address as unit_address
      FROM participants p
      JOIN units un ON p.unit_id = un.id
      WHERE p.user_id = ?
    `;

    const [rows] = await pool.query(query, [req.user.id]);
    if (!rows.length) return res.status(404).json({ error: 'Data peserta tidak ditemukan.' });

    const row = rows[0];
    row.sub_categories = row.sub_categories ? JSON.parse(row.sub_categories) : [];
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/participants/:id/status
router.patch('/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, reject_reason } = req.body;

  if (!['pending_unit', 'verified_unit', 'verified_kabupaten', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid.' });
  }

  try {
    const pool = getPool();
    const [parts] = await pool.query('SELECT unit_id, status FROM participants WHERE id = ?', [id]);
    if (!parts.length) return res.status(404).json({ error: 'Peserta tidak ditemukan.' });

    const part = parts[0];
    if (req.user.role === 'unit') {
      if (part.unit_id !== req.user.unit_id) {
        return res.status(403).json({ error: 'Anda hanya dapat memvalidasi peserta dari unit sekolah Anda sendiri.' });
      }
      if (status === 'verified_kabupaten') {
        return res.status(403).json({ error: 'Hanya Admin Kabupaten yang dapat menyetujui status akhir Disetujui Kabupaten.' });
      }
    }

    await pool.query(
      `UPDATE participants SET status = ?, reject_reason = ? WHERE id = ?`,
      [status, status === 'rejected' ? (reject_reason || 'Berkas tidak lengkap') : null, id]
    );

    res.json({ message: 'Status pendaftaran peserta berhasil diperbarui.', new_status: status });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/participants/:id/idcard
router.get('/:id/idcard', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    const query = `
      SELECT p.*, un.name as unit_name, un.code as unit_code, un.pembina_name
      FROM participants p
      JOIN units un ON p.unit_id = un.id
      WHERE p.id = ?
    `;

    const [rows] = await pool.query(query, [id]);
    if (!rows.length) return res.status(404).json({ error: 'Peserta tidak ditemukan.' });

    const part = rows[0];
    const qrData = JSON.stringify({
      code: part.code,
      name: part.full_name,
      unit: part.unit_name,
      level: part.level,
      status: part.status,
      timestamp: part.created_at
    });

    const qrCodeUrl = await QRCode.toDataURL(qrData, { width: 250, margin: 1 });
    part.sub_categories = part.sub_categories ? JSON.parse(part.sub_categories) : [];
    res.json({
      ...part,
      qr_code_base64: qrCodeUrl
    });
  } catch (err) {
    res.status(500).json({ error: 'Gagal membuat QR Code: ' + err.message });
  }
});

module.exports = router;
