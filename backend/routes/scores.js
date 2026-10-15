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

// GET /api/scores/event_aspects
router.get('/event_aspects', authenticateToken, async (req, res) => {
  try {
    const eventId = req.query.event_id;
    if (!eventId) return res.status(400).json({ error: 'ID Kegiatan (event_id) wajib.' });

    const pool = getPool();
    const [rows] = await pool.query('SELECT * FROM event_aspects WHERE event_id = ? ORDER BY id ASC', [eventId]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scores/save_event_aspects
router.post('/save_event_aspects', authenticateToken, async (req, res) => {
  if (req.user.role !== 'kabupaten' && req.user.role !== 'admin' && req.user.role !== 'panitia' && req.user.role !== 'unit') {
    return res.status(403).json({ error: 'Anda tidak memiliki akses untuk mengatur aspek penilaian.' });
  }

  const { event_id, aspects } = req.body;
  if (!event_id) return res.status(400).json({ error: 'ID Kegiatan wajib.' });

  try {
    const pool = getPool();
    await pool.query('DELETE FROM event_aspects WHERE event_id = ?', [event_id]);
    if (Array.isArray(aspects)) {
      for (const asp of aspects) {
        if (asp.aspect_name && asp.aspect_name.trim()) {
          await pool.query(
            'INSERT INTO event_aspects (event_id, aspect_name, max_score, weight) VALUES (?, ?, ?, ?)',
            [event_id, asp.aspect_name.trim(), parseFloat(asp.max_score || 100), parseFloat(asp.weight || 1.0)]
          );
        }
      }
    }
    res.json({ message: 'Aspek penilaian kegiatan berhasil disimpan!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scores/lookup_target
router.get('/lookup_target', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    const q = (req.query.q || req.query.code || '').trim();
    const targetType = req.query.target_type || 'peserta';

    if (!q) return res.status(400).json({ error: 'Kata kunci atau kode wajib.' });

    if (targetType === 'kontingen') {
      const [units] = await pool.query(
        `SELECT u.*, u.id as unit_id, u.name as unit_name, u.level_category,
                (SELECT COUNT(*) FROM participants WHERE unit_id = u.id AND status = 'verified_kabupaten') as participant_count
         FROM units u WHERE u.name LIKE ? OR CAST(u.id AS CHAR) = ? LIMIT 5`,
        [`%${q}%`, q]
      );
      res.json({ target_type: 'kontingen', results: units });
    } else {
      const [participants] = await pool.query(
        `SELECT p.*, u.name as unit_name, u.level_category
         FROM participants p
         JOIN units u ON p.unit_id = u.id
         WHERE p.code = ? OR p.nik = ? OR p.full_name LIKE ? LIMIT 10`,
        [q, q, `%${q}%`]
      );
      res.json({ target_type: 'peserta', results: participants });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scores
router.get('/', authenticateToken, async (req, res) => {
  try {
    const pool = getPool();
    let query = `
      SELECT s.*, un.name as unit_name, p.full_name as participant_name, p.code as participant_code,
             e.title as event_title
      FROM scores s
      JOIN units un ON s.unit_id = un.id
      LEFT JOIN participants p ON s.participant_id = p.id
      LEFT JOIN events e ON s.event_id = e.id
      WHERE 1=1
    `;
    const params = [];

    if (req.user.role === 'unit') {
      query += ` AND s.unit_id = ? `;
      params.push(req.user.unit_id);
    } else if (req.query.unit_id) {
      query += ` AND s.unit_id = ? `;
      params.push(req.query.unit_id);
    }

    if (req.query.category_type) {
      query += ` AND s.category_type = ? `;
      params.push(req.query.category_type);
    }

    query += ` ORDER BY s.score_val DESC `;
    const [rows] = await pool.query(query, params);

    for (const score of rows) {
      const [aspects] = await pool.query(
        `SELECT sad.score_val, ea.aspect_name, ea.max_score
         FROM score_aspect_details sad
         JOIN event_aspects ea ON sad.aspect_id = ea.id
         WHERE sad.score_id = ?`,
        [score.id]
      );
      score.aspect_details = aspects;
    }

    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/scores
router.post('/', authenticateToken, async (req, res) => {
  if (req.user.role !== 'kabupaten') {
    return res.status(403).json({ error: 'Hanya Admin Kabupaten / Juri yang dapat menginput nilai.' });
  }

  const {
    event_id, unit_id, participant_id, target_type,
    category_type, branch_name, pmr_level, score_val,
    aspect_scores, judge_name, notes
  } = req.body;

  if (!unit_id || !branch_name) {
    return res.status(400).json({ error: 'Unit/Kontingen dan Cabang Lomba/Kegiatan wajib diisi.' });
  }

  let totalScore = 0;
  if (aspect_scores && typeof aspect_scores === 'object') {
    for (const val of Object.values(aspect_scores)) {
      totalScore += parseFloat(val || 0);
    }
  } else {
    totalScore = parseFloat(score_val || 0);
  }

  if (totalScore <= 0) {
    return res.status(400).json({ error: 'Nilai kegiatan harus lebih besar dari 0.' });
  }

  let grade = 'Peserta';
  if (totalScore >= 90) grade = 'Emas';
  else if (totalScore >= 80) grade = 'Perak';
  else if (totalScore >= 70) grade = 'Perunggu';

  try {
    const pool = getPool();
    const [result] = await pool.query(
      `INSERT INTO scores (event_id, unit_id, participant_id, target_type, category_type, branch_name, pmr_level, score_val, grade, judge_name, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        event_id || null,
        unit_id,
        participant_id || null,
        target_type || (participant_id ? 'peserta' : 'kontingen'),
        category_type || 'Jumpa',
        branch_name,
        pmr_level || 'Wira',
        totalScore,
        grade,
        judge_name || req.user.username,
        notes || ''
      ]
    );

    const scoreId = result.insertId;

    if (aspect_scores && typeof aspect_scores === 'object') {
      for (const [aspId, val] of Object.entries(aspect_scores)) {
        await pool.query(
          'INSERT INTO score_aspect_details (score_id, aspect_id, score_val) VALUES (?, ?, ?)',
          [scoreId, parseInt(aspId), parseFloat(val || 0)]
        );
      }
    }

    res.json({ message: 'Penilaian berhasil disimpan!', score_id: scoreId, score_val: totalScore, grade });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/scores/standings
router.get('/standings', async (req, res) => {
  try {
    const pool = getPool();
    const query = `
      SELECT
        un.id as unit_id,
        un.name as unit_name,
        un.level_category,
        COUNT(s.id) as total_lomba,
        SUM(CASE WHEN s.grade = 'Emas' THEN 1 ELSE 0 END) as emas,
        SUM(CASE WHEN s.grade = 'Perak' THEN 1 ELSE 0 END) as perak,
        SUM(CASE WHEN s.grade = 'Perunggu' THEN 1 ELSE 0 END) as perunggu,
        AVG(s.score_val) as avg_score
      FROM units un
      LEFT JOIN scores s ON un.id = s.unit_id
      GROUP BY un.id, un.name, un.level_category
      ORDER BY emas DESC, perak DESC, perunggu DESC, avg_score DESC
    `;
    const [rows] = await pool.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
