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
    event_dates, event_location, event_location_address, event_map_embed, event_map_url,
    contact_phone, contact_email,
    contact_address, contact_hours, contact_wa,
    footer_about, footer_copyright,
    app_logo, app_favicon, event_logo, app_kop,
    reg_deadline, reg_active
  } = req.body;

  try {
    const pool = getPool();
    const query = `INSERT INTO settings (\`key\`, \`value\`) VALUES (?, ?) ON DUPLICATE KEY UPDATE \`value\` = VALUES(\`value\`)`;
    
    if (app_name !== undefined) await pool.query(query, ['app_name', app_name]);
    if (organizer_name !== undefined) await pool.query(query, ['organizer_name', organizer_name]);
    if (event_location !== undefined) await pool.query(query, ['event_location', event_location]);
    if (event_location_address !== undefined) await pool.query(query, ['event_location_address', event_location_address]);
    if (event_map_embed !== undefined) await pool.query(query, ['event_map_embed', event_map_embed]);
    if (event_map_url !== undefined) await pool.query(query, ['event_map_url', event_map_url]);
    if (event_dates !== undefined) await pool.query(query, ['event_dates', event_dates]);
    if (contact_phone !== undefined) await pool.query(query, ['contact_phone', contact_phone]);
    if (contact_email !== undefined) await pool.query(query, ['contact_email', contact_email]);
    if (contact_address !== undefined) await pool.query(query, ['contact_address', contact_address]);
    if (contact_hours !== undefined) await pool.query(query, ['contact_hours', contact_hours]);
    if (contact_wa !== undefined) await pool.query(query, ['contact_wa', contact_wa]);
    if (footer_about !== undefined) await pool.query(query, ['footer_about', footer_about]);
    if (footer_copyright !== undefined) await pool.query(query, ['footer_copyright', footer_copyright]);
    if (jumbotron_title !== undefined) await pool.query(query, ['jumbotron_title', jumbotron_title]);
    if (jumbotron_subtitle !== undefined) await pool.query(query, ['jumbotron_subtitle', jumbotron_subtitle]);
    if (app_logo !== undefined) await pool.query(query, ['app_logo', app_logo]);
    if (event_logo !== undefined) await pool.query(query, ['event_logo', event_logo]);
    if (app_favicon !== undefined) await pool.query(query, ['app_favicon', app_favicon]);
    if (app_kop !== undefined) await pool.query(query, ['app_kop', app_kop]);
    if (reg_deadline !== undefined) await pool.query(query, ['reg_deadline', reg_deadline]);
    if (reg_active !== undefined) await pool.query(query, ['reg_active', reg_active]);

    res.json({ message: 'Pengaturan Header, Footer, Logo, dan Informasi Penyelenggara berhasil diperbarui ke MySQL!' });
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

