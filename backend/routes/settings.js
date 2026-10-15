const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
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

// GET /api/settings
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const [rows] = await pool.query('SELECT `key`, `value` FROM settings');
    const settings = {};
    rows.forEach(r => { settings[r.key] = r.value; });
    res.json(settings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings (Merubah Pengaturan Nama, Logo, Favicon & Jumbotron)
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'kabupaten') {
    return res.status(403).json({ error: 'Hanya Admin Kabupaten yang dapat merubah pengaturan.' });
  }

  const {
    app_name, organizer_name, jumbotron_title, jumbotron_subtitle,
    event_dates, app_logo, app_favicon
  } = req.body;

  try {
    const pool = getPool();
    const query = `INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`;
    
    if (app_name) await pool.query(query, ['app_name', app_name]);
    if (organizer_name) await pool.query(query, ['organizer_name', organizer_name]);
    if (jumbotron_title) await pool.query(query, ['jumbotron_title', jumbotron_title]);
    if (jumbotron_subtitle) await pool.query(query, ['jumbotron_subtitle', jumbotron_subtitle]);
    if (event_dates) await pool.query(query, ['event_dates', event_dates]);
    if (app_logo) await pool.query(query, ['app_logo', app_logo]);
    if (app_favicon) await pool.query(query, ['app_favicon', app_favicon]);

    res.json({ message: 'Pengaturan, Logo, dan Favicon berhasil diperbarui ke MySQL!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/upload (Upload File Logo atau Favicon)
router.post('/upload', authenticateToken, async (req, res) => {
  if (req.user.role !== 'kabupaten') {
    return res.status(403).json({ error: 'Hanya Admin Kabupaten yang dapat mengunggah berkas.' });
  }

  const { file_data, type } = req.body;
  if (!file_data || !type) {
    return res.status(400).json({ error: 'Data gambar dan tipe (logo/favicon) wajib diisi.' });
  }

  try {
    const matches = file_data.match(/^data:(.+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Format data gambar base64 tidak valid.' });
    }

    const extMatch = matches[1].match(/\/([a-zA-Z0-9+]+)$/);
    let ext = extMatch ? extMatch[1] : 'png';
    if (ext === 'svg+xml') ext = 'svg';
    if (ext === 'x-icon' || ext === 'vnd.microsoft.icon') ext = 'ico';

    const buffer = Buffer.from(matches[2], 'base64');
    const uploadDir = path.join(__dirname, '../../frontend/uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const fileName = `${type}_${Date.now()}.${ext}`;
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/${fileName}`;

    // Direct update settings in MySQL table
    const pool = getPool();
    const key = type === 'favicon' ? 'app_favicon' : 'app_logo';
    const query = `INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`;
    await pool.query(query, [key, relativeUrl]);

    res.json({
      message: `Berkas ${type.toUpperCase()} berhasil diunggah & disimpan ke MySQL!`,
      url: relativeUrl,
      key
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

