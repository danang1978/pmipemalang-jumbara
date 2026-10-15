const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { getPool } = require('../config/database');

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const search = (req.query.search || '').trim();
    const role = (req.query.role || '').trim();
    const page = Math.max(1, parseInt(req.query.page || '1'));
    const limit = Math.max(1, Math.min(100, parseInt(req.query.limit || '25')));
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params = [];

    if (search) {
      whereClause += ' AND (u.username LIKE ? OR u.email LIKE ? OR un.name LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }
    if (role) {
      whereClause += ' AND u.role = ?';
      params.push(role);
    }

    const [cntRes] = await pool.query(`SELECT COUNT(*) as total FROM users u LEFT JOIN units un ON u.unit_id = un.id ${whereClause}`, params);
    const total = cntRes[0].total;

    const [users] = await pool.query(
      `SELECT u.id, u.username, u.email, u.role, u.unit_id, u.created_at, un.name AS unit_name
       FROM users u
       LEFT JOIN units un ON u.unit_id = un.id
       ${whereClause}
       ORDER BY u.id DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({
      data: users,
      pagination: {
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit) || 1
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users
router.post('/', async (req, res) => {
  const action = req.query.action || '';
  const pool = getPool();

  if (action === 'reset-password') {
    const { user_id, new_password } = req.body;
    if (!user_id || !new_password) return res.status(400).json({ error: 'ID User dan password baru wajib diisi.' });
    if (new_password.length < 6) return res.status(400).json({ error: 'Password baru minimal harus 6 karakter.' });

    try {
      const [u] = await pool.query('SELECT username FROM users WHERE id = ?', [user_id]);
      if (!u.length) return res.status(404).json({ error: 'User tidak ditemukan.' });

      const hash = await bcrypt.hash(new_password, 10);
      await pool.query('UPDATE users SET password = ? WHERE id = ?', [hash, user_id]);
      return res.json({ message: `Password user '${u[0].username}' berhasil di-reset!` });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (action === 'create') {
    const { username, password, email, role, unit_id } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi.' });
    if (password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter.' });

    try {
      const [chk] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
      if (chk.length) return res.status(400).json({ error: `Username '${username}' sudah digunakan.` });

      const hash = await bcrypt.hash(password, 10);
      const [resIns] = await pool.query(
        'INSERT INTO users (username, password, email, role, unit_id) VALUES (?, ?, ?, ?, ?)',
        [username, hash, email || null, role || 'peserta', unit_id || null]
      );
      return res.json({ message: `User baru '${username}' berhasil dibuat!`, id: resIns.insertId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  if (action === 'update') {
    const { user_id, email, role, unit_id } = req.body;
    if (!user_id || !role) return res.status(400).json({ error: 'ID User dan Peran/Role wajib diisi.' });

    try {
      await pool.query('UPDATE users SET email = ?, role = ?, unit_id = ? WHERE id = ?', [email || null, role, unit_id || null, user_id]);
      return res.json({ message: 'Data user berhasil diperbarui!' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  res.status(400).json({ error: 'Action tidak valid.' });
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    await pool.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'User berhasil dihapus dari sistem.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
