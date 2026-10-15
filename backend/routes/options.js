const express = require('express');
const router = express.Router();
const { getPool } = require('../config/database');

// GET /api/options
router.get('/', async (req, res) => {
  try {
    const pool = getPool();

    const [units] = await pool.query('SELECT id, code, name, level_category FROM units ORDER BY name ASC');
    const [settingsRows] = await pool.query("SELECT `key`, `value` FROM settings WHERE `key` LIKE 'option_%'");

    const settingsRaw = {};
    settingsRows.forEach(r => { settingsRaw[r.key] = r.value; });

    const religions = settingsRaw['option_religions']
      ? JSON.parse(settingsRaw['option_religions'])
      : ['Islam', 'Kristen Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'];

    const bloodTypes = settingsRaw['option_blood_types']
      ? JSON.parse(settingsRaw['option_blood_types'])
      : ['O', 'A', 'B', 'AB', 'Belum Tahu'];

    const genders = settingsRaw['option_genders']
      ? JSON.parse(settingsRaw['option_genders'])
      : [
          { value: 'L', label: 'Laki-laki' },
          { value: 'P', label: 'Perempuan' }
        ];

    const [unsurList] = await pool.query('SELECT id, name, quota, description FROM unsur_categories ORDER BY id ASC');

    let levels;
    if (unsurList.length > 0) {
      levels = unsurList.map(u => ({
        value: u.name,
        label: u.name + (u.quota > 0 ? ` (Kuota: ${u.quota} / Kontingen)` : ''),
        quota: u.quota,
        description: u.description
      }));
    } else {
      levels = settingsRaw['option_levels']
        ? JSON.parse(settingsRaw['option_levels'])
        : [
            { value: 'Wira', label: 'Wira (SMA / SMK / MA)' },
            { value: 'Madya', label: 'Madya (SMP / MTs)' },
            { value: 'Mula', label: 'Mula (SD / MI)' }
          ];
    }

    const disabilityStatuses = settingsRaw['option_disability_statuses']
      ? JSON.parse(settingsRaw['option_disability_statuses'])
      : [
          { value: 'Tidak', label: 'Tidak (Non-Disabilitas)' },
          { value: 'Ya', label: 'Ya (Penyandang Disabilitas)' }
        ];

    const disabilityTypes = settingsRaw['option_disability_types']
      ? JSON.parse(settingsRaw['option_disability_types'])
      : ['Tidak Ada', 'Disabilitas Fisik / Daksa', 'Disabilitas Netra', 'Disabilitas Rungu / Wicara', 'Disabilitas Intelektual / Grahita', 'Disabilitas Mental', 'Lainnya'];

    res.json({
      units,
      religions,
      blood_types: bloodTypes,
      genders,
      levels,
      disability_statuses: disabilityStatuses,
      disability_types: disabilityTypes
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/options
router.post('/', async (req, res) => {
  const allowedKeys = [
    'option_religions',
    'option_blood_types',
    'option_genders',
    'option_levels',
    'option_disability_statuses',
    'option_disability_types'
  ];

  try {
    const pool = getPool();
    for (const k of allowedKeys) {
      if (req.body[k] !== undefined) {
        const val = typeof req.body[k] === 'object' ? JSON.stringify(req.body[k]) : String(req.body[k]);
        await pool.query('INSERT INTO settings (`key`, `value`) VALUES (?, ?) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)', [k, val]);
      }
    }
    res.json({ message: 'Master Data pilihan formulir berhasil diperbarui!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
