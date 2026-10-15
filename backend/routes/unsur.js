const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

// GET /api/unsur
router.get('/', async (req, res) => {
  try {
    const pool = getPool();
    const unitId = parseInt(req.query.unit_id || '0');

    const [items] = await pool.query('SELECT * FROM unsur_categories ORDER BY id ASC');

    const [globalRows] = await pool.query(`
      SELECT level, COUNT(*) AS total 
      FROM participants 
      WHERE status != 'rejected'
      GROUP BY level
    `);
    const globalMap = {};
    globalRows.forEach(r => { globalMap[r.level] = parseInt(r.total); });

    if (unitId > 0) {
      const [usageRows] = await pool.query(`
        SELECT level, COUNT(*) AS total 
        FROM participants 
        WHERE unit_id = ? AND status != 'rejected'
        GROUP BY level
      `, [unitId]);
      const usageMap = {};
      usageRows.forEach(r => { usageMap[r.level] = parseInt(r.total); });

      const result = items.map(u => {
        const usedQuota = usageMap[u.name] || 0;
        return {
          ...u,
          used_quota: usedQuota,
          remaining_quota: u.quota > 0 ? Math.max(0, u.quota - usedQuota) : null,
          is_full: u.quota > 0 && usedQuota >= u.quota,
          total_global: globalMap[u.name] || 0
        };
      });
      return res.json(result);
    } else {
      const result = items.map(u => ({
        ...u,
        total_global: globalMap[u.name] || 0,
        used_quota: 0,
        remaining_quota: null,
        is_full: false
      }));
      return res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/unsur
router.post('/', async (req, res) => {
  const { name, quota, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama unsur wajib diisi.' });

  try {
    const pool = getPool();
    const [existing] = await pool.query('SELECT id FROM unsur_categories WHERE LOWER(name) = LOWER(?)', [name]);
    if (existing.length) return res.status(400).json({ error: `Nama unsur '${name}' sudah ada.` });

    const q = Math.max(0, parseInt(quota || 1));
    const [result] = await pool.query(
      'INSERT INTO unsur_categories (name, quota, description) VALUES (?, ?, ?)',
      [name, q, description || null]
    );

    res.json({ message: `Unsur baru '${name}' berhasil ditambahkan!`, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/unsur/:id
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, quota, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Nama unsur wajib diisi.' });

  try {
    const pool = getPool();
    const [existing] = await pool.query('SELECT id FROM unsur_categories WHERE LOWER(name) = LOWER(?) AND id != ?', [name, id]);
    if (existing.length) return res.status(400).json({ error: `Nama unsur '${name}' sudah digunakan.` });

    const q = Math.max(0, parseInt(quota || 1));
    await pool.query(
      'UPDATE unsur_categories SET name = ?, quota = ?, description = ? WHERE id = ?',
      [name, q, description || null, id]
    );

    res.json({ message: `Unsur '${name}' berhasil diperbarui!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/unsur/:id
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const pool = getPool();
    const [uRows] = await pool.query('SELECT name FROM unsur_categories WHERE id = ?', [id]);
    if (!uRows.length) return res.status(404).json({ error: 'Unsur tidak ditemukan.' });

    const name = uRows[0].name;
    const [pRows] = await pool.query('SELECT COUNT(*) as cnt FROM participants WHERE level = ?', [name]);
    if (pRows[0].cnt > 0) {
      return res.status(400).json({ error: `Unsur '${name}' sedang digunakan oleh ${pRows[0].cnt} data peserta. Tidak dapat dihapus.` });
    }

    await pool.query('DELETE FROM unsur_categories WHERE id = ?', [id]);
    res.json({ message: `Unsur '${name}' berhasil dihapus!` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
