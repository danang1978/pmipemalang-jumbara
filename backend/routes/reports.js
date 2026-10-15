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

// GET /api/reports/dashboard
router.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const isUnit = req.user.role === 'unit';
    const unitFilter = isUnit ? ` WHERE p.unit_id = ${parseInt(req.user.unit_id)}` : '';

    const qStats = `
      SELECT
        COUNT(p.id) as total_peserta,
        SUM(CASE WHEN p.level = 'Mula' THEN 1 ELSE 0 END) as total_mula,
        SUM(CASE WHEN p.level = 'Madya' THEN 1 ELSE 0 END) as total_madya,
        SUM(CASE WHEN p.level = 'Wira' THEN 1 ELSE 0 END) as total_wira,
        SUM(CASE WHEN p.status = 'pending_unit' THEN 1 ELSE 0 END) as status_pending_unit,
        SUM(CASE WHEN p.status = 'verified_unit' THEN 1 ELSE 0 END) as status_verified_unit,
        SUM(CASE WHEN p.status = 'verified_kabupaten' THEN 1 ELSE 0 END) as status_verified_kabupaten,
        SUM(CASE WHEN p.status = 'rejected' THEN 1 ELSE 0 END) as status_rejected
      FROM participants p ${unitFilter}
    `;

    const [statsRows] = await pool.query(qStats);
    const [uRows] = await pool.query('SELECT COUNT(*) as total_units FROM units');
    const [eRows] = await pool.query('SELECT COUNT(*) as total_events FROM events');

    res.json({
      stats: statsRows[0],
      total_units: uRows[0] ? uRows[0].total_units : 0,
      total_events: eRows[0] ? eRows[0].total_events : 0
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
