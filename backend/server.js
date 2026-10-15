const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
const { initDatabase } = require('./config/database');

// Import Modular Routers
const authRoutes = require('./routes/auth');
const unitRoutes = require('./routes/units');
const participantRoutes = require('./routes/participants');
const attendanceRoutes = require('./routes/attendance');
const scoreRoutes = require('./routes/scores');
const eventRoutes = require('./routes/events');
const announcementRoutes = require('./routes/announcements');
const settingRoutes = require('./routes/settings');
const reportRoutes = require('./routes/reports');
const unsurRoutes = require('./routes/unsur');
const optionsRoutes = require('./routes/options');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// Mount API Routes cleanly with both REST and .php path aliases for complete frontend compatibility
app.use(['/api/auth', '/api/auth.php'], authRoutes);
app.use(['/api/units', '/api/units.php'], unitRoutes);
app.use(['/api/participants', '/api/participants.php'], participantRoutes);
app.use(['/api/attendance', '/api/attendance.php'], attendanceRoutes);
app.use(['/api/scores', '/api/scores.php'], scoreRoutes);
app.use(['/api/events', '/api/events.php'], eventRoutes);
app.use(['/api/announcements', '/api/announcements.php'], announcementRoutes);
app.use(['/api/settings', '/api/settings.php'], settingRoutes);
app.use(['/api/reports', '/api/reports.php'], reportRoutes);
app.use(['/api/unsur', '/api/unsur.php'], unsurRoutes);
app.use(['/api/options', '/api/options.php'], optionsRoutes);
app.use(['/api/users', '/api/users.php'], userRoutes);

// Serve Frontend Static Web App from dedicated 'frontend' directory
app.use(express.static(path.join(__dirname, '../frontend')));

// SPA Fallback to frontend/index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Initialize Database & Launch Express Server
initDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`  JUMBARA PMR 2026 - MODULAR BACKEND SERVER ONLINE `);
    console.log(`  Backend APIs : http://localhost:${PORT}/api        `);
    console.log(`  Frontend App : http://localhost:${PORT}            `);
    console.log(`====================================================`);
  });
}).catch(err => {
  console.error("Failed to start server due to Database connection error:", err);
});
