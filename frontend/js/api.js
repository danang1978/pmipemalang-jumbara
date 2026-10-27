/* ==========================================================================
   API FETCH CLIENT WRAPPER FOR STRUCTURED NATIVE PHP BACKEND
   ========================================================================== */

const API = {
  baseUrl: 'api',

  getToken() {
    return localStorage.getItem('jumbara_token');
  },

  setToken(token) {
    localStorage.setItem('jumbara_token', token);
  },

  clearToken() {
    localStorage.removeItem('jumbara_token');
    localStorage.removeItem('jumbara_user');
  },

  getUser() {
    const userStr = localStorage.getItem('jumbara_user');
    return userStr ? JSON.parse(userStr) : null;
  },

  setUser(user) {
    localStorage.setItem('jumbara_user', JSON.stringify(user));
  },

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers
    };

    const base = window.APP_BASE_URL || '/';
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
    const url = `${base}api/${cleanEndpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin'
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch (jsonErr) {
        console.error(`Non-JSON API Response [${endpoint}]:`, text);
        const cleanMessage = text.replace(/<[^>]*>?/gm, ' ').replace(/\s+/g, ' ').trim();
        throw new Error(cleanMessage || 'Terjadi kesalahan pada server (Respon tidak valid).');
      }

      if (!response.ok) {
        if (response.status === 401 || (data.error && data.error.includes('Silakan login terlebih dahulu'))) {
          console.warn(`[API] 401 Unauthorized for [${endpoint}]. Expirating session.`);
          this.clearToken();
          if (window.App && typeof window.App.handleSessionExpired === 'function') {
            window.App.handleSessionExpired(data.error);
          }
        }
        throw new Error(data.error || 'Terjadi kesalahan pada server.');
      }
      return data;
    } catch (err) {
      console.error(`API Error [${endpoint}]:`, err);
      throw err;
    }
  },

  // Auth
  getMe() {
    return this.request('/auth.php?action=me');
  },

  login(username, password) {
    return this.request('/auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({ username, password })
    });
  },

  registerPeserta(payload) {
    return this.request('/auth.php?action=register-peserta', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  registerParticipant(payload) {
    return this.registerPeserta(payload);
  },

  changePassword(old_password, new_password, confirm_password) {
    return this.request('/auth.php?action=change-password', {
      method: 'POST',
      body: JSON.stringify({ old_password, new_password, confirm_password })
    });
  },

  // Master Options (Units, Agama, Golda, JK, Level from Database)
  getOptions() {
    return this.request('/options.php');
  },

  updateOptions(payload) {
    return this.request('/options.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  // Units
  getUnits() {
    return this.request('/units.php');
  },

  createUnit(unitData) {
    return this.request('/units.php', {
      method: 'POST',
      body: JSON.stringify(unitData)
    });
  },

  updateUnit(id, unitData) {
    return this.request(`/units.php?action=update&id=${id}`, {
      method: 'POST',
      body: JSON.stringify(unitData)
    });
  },

  deleteUnit(id) {
    return this.request(`/units.php?id=${id}`, {
      method: 'DELETE'
    });
  },

  // Unsur Categories & Quotas
  getUnsur(unitId = null) {
    const query = unitId ? `?unit_id=${unitId}` : '';
    return this.request(`/unsur.php${query}`);
  },

  createUnsur(data) {
    return this.request('/unsur.php', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  },

  updateUnsur(id, data) {
    return this.request(`/unsur.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },

  deleteUnsur(id) {
    return this.request(`/unsur.php?id=${id}`, {
      method: 'DELETE'
    });
  },

  // Participants
  getParticipants(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/participants.php?${query}`);
  },

  getParticipantStats(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/participants.php?action=stats${query ? '&' + query : ''}`);
  },

  getParticipantMe() {
    return this.request('/participants.php?action=me');
  },

  updateParticipantMe(payload) {
    return this.request('/participants.php?action=update-me', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateParticipantAdmin(payload) {
    return this.request('/participants.php?action=admin_update', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  updateParticipantStatus(id, status, rejectReason = '') {
    return this.request(`/participants.php?action=status&id=${id}`, {
      method: 'POST',
      body: JSON.stringify({ id, status, reject_reason: rejectReason })
    });
  },

  getParticipantIDCard(id) {
    return this.request(`/participants.php?action=idcard&id=${id}`);
  },

  deleteParticipant(id) {
    return this.request(`/participants.php?id=${id}`, {
      method: 'DELETE'
    });
  },

  // Attendance (Presensi)
  scanAttendance(participantCode, eventId, type = 'masuk') {
    return this.request('/attendance.php?action=scan', {
      method: 'POST',
      body: JSON.stringify({ participant_code: participantCode, event_id: eventId, type: type, status: type })
    });
  },

  getEventAttendance(eventId) {
    return this.request(`/attendance.php?event_id=${eventId}`);
  },

  getEventRegisteredParticipants(eventId) {
    return this.request(`/attendance.php?action=registered_participants&event_id=${eventId}`);
  },

  getMyAttendance() {
    return this.request('/attendance.php?action=my_attendance');
  },

  // Scores & Standings
  getScores(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/scores.php?${query}`);
  },

  addScore(scoreData) {
    return this.request('/scores.php', {
      method: 'POST',
      body: JSON.stringify(scoreData)
    });
  },

  getEventAspects(eventId) {
    return this.request(`/scores.php?action=event_aspects&event_id=${eventId}`);
  },

  saveEventAspects(eventId, aspects) {
    return this.request('/scores.php?action=save_event_aspects', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, aspects })
    });
  },

  lookupScoreTarget(q, targetType = 'peserta') {
    return this.request(`/scores.php?action=lookup_target&q=${encodeURIComponent(q)}&target_type=${targetType}`);
  },

  getStandings() {
    return this.request('/scores.php?action=standings');
  },

  validateScore(scoreId, eventId = null) {
    return this.request('/scores.php?action=validate', {
      method: 'POST',
      body: JSON.stringify({ score_id: scoreId, event_id: eventId })
    });
  },

  unlockScore(scoreId) {
    return this.request('/scores.php?action=unlock', {
      method: 'POST',
      body: JSON.stringify({ score_id: scoreId })
    });
  },

  deleteScore(scoreId) {
    return this.request('/scores.php?action=delete', {
      method: 'POST',
      body: JSON.stringify({ score_id: scoreId })
    });
  },

  // Events / Rundown
  getEvents() {
    return this.request('/events.php');
  },

  getUnitEvents(unitId) {
    return this.request(`/events.php?action=unit_events&unit_id=${unitId}`);
  },

  saveUnitEventRegistrations(eventId, participantIds, unitId) {
    return this.request('/events.php?action=save_unit_event_registrations', {
      method: 'POST',
      body: JSON.stringify({ event_id: eventId, participant_ids: participantIds, unit_id: unitId })
    });
  },

  createEvent(eventData) {
    return this.request('/events.php', {
      method: 'POST',
      body: JSON.stringify(eventData)
    });
  },

  deleteEvent(id) {
    return this.request(`/events.php?id=${id}`, { method: 'DELETE' });
  },

  // Announcements
  getAnnouncements() {
    return this.request('/announcements.php');
  },

  createAnnouncement(annData) {
    return this.request('/announcements.php', {
      method: 'POST',
      body: JSON.stringify(annData)
    });
  },

  deleteAnnouncement(id) {
    return this.request(`/announcements.php?id=${id}`, { method: 'DELETE' });
  },

  // Reports
  getDashboardStats() {
    return this.request('/reports.php');
  },

  // Settings
  getSettings() {
    return this.request('/settings.php');
  },

  updateSettings(settings) {
    return this.request('/settings.php', {
      method: 'POST',
      body: JSON.stringify(settings)
    });
  },

  testFonnte(phone, message, fonnte_token) {
    return this.request('/settings.php?action=test-fonnte', {
      method: 'POST',
      body: JSON.stringify({ phone, message, fonnte_token })
    });
  },

  uploadSettingFile(type, file_data) {
    return this.request('/settings.php?action=upload', {
      method: 'POST',
      body: JSON.stringify({ type, file_data })
    });
  },

  uploadJumbotronImage(file_data) {
    return this.request('/settings.php?action=upload-jumbotron', {
      method: 'POST',
      body: JSON.stringify({ file_data })
    });
  },

  resetSettingFile(type) {
    return this.request('/settings.php?action=reset-file', {
      method: 'POST',
      body: JSON.stringify({ type })
    });
  },

  // Users Management
  getUsers(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/users.php?${query}`);
  },

  resetUserPassword(userId, newPassword) {
    return this.request('/users.php?action=reset-password', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, new_password: newPassword })
    });
  },

  createUser(userData) {
    return this.request('/users.php?action=create', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  updateUser(userData) {
    return this.request('/users.php?action=update', {
      method: 'POST',
      body: JSON.stringify(userData)
    });
  },

  deleteUser(userId) {
    return this.request(`/users.php?id=${userId}`, {
      method: 'DELETE'
    });
  },

  // Certificates / Piagam
  getCertificateConfig() {
    return this.request('/certificates.php?action=config');
  },

  saveCertificateConfig(payload) {
    return this.request('/certificates.php?action=save_config', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  uploadCertificateAsset(payload) {
    return this.request('/certificates.php?action=upload_asset', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  generateCertificateNumbers(payload) {
    return this.request('/certificates.php?action=generate_numbers', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getCertificateParticipants(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/certificates.php?action=participants&${query}`);
  },

  // Materials / Unduh Materi Jumbara
  getMaterials(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/materials.php?${query}`);
  },

  trackMaterialDownload(id) {
    return this.request(`/materials.php?action=download&id=${id}`);
  },

  saveMaterial(payload) {
    return this.request('/materials.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  deleteMaterial(id) {
    return this.request(`/materials.php?id=${id}`, {
      method: 'DELETE'
    });
  },

  // Kotak Saran & Aspirasi
  submitFeedback(payload) {
    return this.request('/feedback.php', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
  },

  getFeedbacks(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/feedback.php?${query}`);
  },

  updateFeedbackStatus(id, status, notes = '') {
    return this.request(`/feedback.php?id=${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status, admin_notes: notes })
    });
  },

  deleteFeedback(id) {
    return this.request(`/feedback.php?id=${id}`, {
      method: 'DELETE'
    });
  }
};
