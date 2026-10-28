<?php
require_once __DIR__ . '/functions.php';
$baseUrl = getBaseUrl();
$settings = getAppSettings();

// Format logo, event logo & favicon URLs with baseUrl if relative
$logoUrl = $settings['app_logo'];
if (strpos($logoUrl, 'http') !== 0 && strpos($logoUrl, '/') !== 0) {
    $logoUrl = $baseUrl . $logoUrl;
}
$eventLogoUrl = $settings['event_logo'] ?? 'frontend/images/logo-jumbara-xii.png';
if (strpos($eventLogoUrl, 'http') !== 0 && strpos($eventLogoUrl, '/') !== 0) {
    $eventLogoUrl = $baseUrl . $eventLogoUrl;
}
$favUrl = $settings['app_favicon'];
if (strpos($favUrl, 'http') !== 0 && strpos($favUrl, '/') !== 0) {
    $favUrl = $baseUrl . $favUrl;
}
$favType = 'image/png';
$favExt = strtolower(pathinfo($favUrl, PATHINFO_EXTENSION));
if ($favExt === 'svg') $favType = 'image/svg+xml';
else if ($favExt === 'ico') $favType = 'image/x-icon';
else if ($favExt === 'jpg' || $favExt === 'jpeg') $favType = 'image/jpeg';
else if ($favExt === 'webp') $favType = 'image/webp';
else if ($favExt === 'png') $favType = 'image/png';
?>
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <base href="<?php echo htmlspecialchars($baseUrl); ?>">
  <title id="pageTitle"><?php echo htmlspecialchars($settings['app_name']); ?> - Palang Merah Indonesia</title>
  <meta name="description" content="Sistem Informasi & Management Kegiatan JUMBARA (Jumpa Bakti Gembira) PMR PMI Kabupaten. Structured Native PHP & MySQL.">
  
  <script>
    window.APP_BASE_URL = '<?php echo htmlspecialchars($baseUrl); ?>';
  </script>

  <!-- Dynamic Favicon from MySQL Database (Supports PNG, JPG, WEBP, ICO, SVG) -->
  <link rel="icon" type="<?php echo $favType; ?>" href="<?php echo htmlspecialchars($favUrl); ?>">
  <link rel="apple-touch-icon" href="<?php echo htmlspecialchars($favUrl); ?>">

  <!-- Google Fonts: Outfit & Plus Jakarta Sans -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@500;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  
  <!-- FontAwesome 6 Pro Vector Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" crossorigin="anonymous" referrerpolicy="no-referrer" />

  <!-- CSS Stylesheets -->
  <?php 
    $cssStyleVer = file_exists(__DIR__ . '/../frontend/css/style.css') ? filemtime(__DIR__ . '/../frontend/css/style.css') : '2.0.0';
    $cssIdcardVer = file_exists(__DIR__ . '/../frontend/css/idcard.css') ? filemtime(__DIR__ . '/../frontend/css/idcard.css') : '2.0.0';
  ?>
  <link rel="stylesheet" href="<?php echo $baseUrl; ?>frontend/css/style.css?v=<?php echo $cssStyleVer; ?>">
  <link rel="stylesheet" href="<?php echo $baseUrl; ?>frontend/css/idcard.css?v=<?php echo $cssIdcardVer; ?>">

  <!-- html2pdf Library for Direct PDF File Downloads -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js" crossorigin="anonymous" referrerpolicy="no-referrer"></script>
</head>
<?php
  $currentLoggedUser = getCurrentUser();
  $headerBodyClasses = [];
  if ($currentLoggedUser) {
      $headerBodyClasses[] = 'user-logged-in';
      $headerRole = $currentLoggedUser['role'] ?? '';
      if (in_array($headerRole, ['kabupaten', 'admin_kabupaten', 'super_admin', 'unit', 'admin_unit'])) {
          $headerBodyClasses[] = 'in-admin-dashboard';
      }
  }
?>
<body class="<?php echo implode(' ', $headerBodyClasses); ?>">

  <!-- Fixed Main Header Navigation Wrapper -->
  <header class="site-header">
    <!-- Top Information Bar -->
    <div class="top-bar">
      <div class="top-bar-container">
        <div class="top-info-item">
          <i class="fa-solid fa-location-dot" style="cursor: pointer;" onclick="App.scrollToSection('lokasi', event)"></i>
          <span id="topEventLocation" onclick="App.scrollToSection('lokasi', event)" style="cursor: pointer;" title="Klik untuk melihat peta lokasi"><?php echo htmlspecialchars($settings['event_location'] ?? 'Buperta Utama PMI Kabupaten'); ?></span>
          <span class="divider">|</span>
          <span class="live-pulse-dot" style="margin: 0 2px;"></span>
          <i class="fa-solid fa-calendar-range"></i>
          <strong id="topEventDates"><?php echo htmlspecialchars($settings['event_dates'] ?? '15 - 17 Oktober 2026'); ?></strong>
        </div>
        <div class="top-info-contact">
          <span id="topContactPhoneWrapper"><i class="fa-solid fa-phone"></i> <span id="topContactPhone"><?php echo htmlspecialchars($settings['contact_phone'] ?? '(021) 555-PMR-2026'); ?></span></span>
          <span id="topContactEmailWrapper"><i class="fa-solid fa-envelope"></i> <span id="topContactEmail"><?php echo htmlspecialchars($settings['contact_email'] ?? 'sekretariat@jumbara-pmi.or.id'); ?></span></span>
        </div>
      </div>
    </div>

    <!-- Main Navigation Header -->
    <div class="navbar">
      <div class="nav-container">
        <div class="navbar-brand">
          <div class="brand-logos">
            <!-- Dynamic Logo PMI from MySQL Database -->
            <img src="<?php echo htmlspecialchars($logoUrl); ?>" alt="Logo PMI" class="navbar-logo-img navbar-logo-pmi" title="Palang Merah Indonesia">
            <div class="logo-divider"></div>
            <!-- Dynamic Logo Jumbara dari Pengaturan Database -->
            <img src="<?php echo htmlspecialchars($eventLogoUrl); ?>" alt="Logo Kegiatan Jumbara" class="navbar-logo-img navbar-logo-jumbara" title="Logo Kegiatan Jumbara">
          </div>
          <div class="brand-text">
            <h1 id="brandAppName"><?php echo htmlspecialchars($settings['app_name']); ?></h1>
            <p id="brandOrganizer"><?php echo htmlspecialchars(!empty($settings['organizer_name']) ? $settings['organizer_name'] : 'PMI Kabupaten Pemalang'); ?></p>
          </div>
        </div>

        <!-- Hamburger Menu Toggle Button (Mobile) -->
        <button class="nav-toggle-btn" id="navToggleBtn" onclick="App.toggleMobileMenu()" aria-label="Toggle Navigation">
          <i class="fa-solid fa-bars" id="navToggleIcon"></i>
        </button>

        <!-- Navigation Links -->
        <nav class="nav-menu" id="publicNavMenu">
          <a href="#beranda" class="nav-link active" onclick="App.scrollToSection('beranda', event)"><i class="fa-solid fa-house"></i> Beranda</a>
          <a href="#kegiatan" class="nav-link" onclick="App.scrollToSection('kegiatan', event)"><i class="fa-solid fa-calendar-days"></i> Agenda</a>
          <a href="#materi" class="nav-link" onclick="App.scrollToSection('materi', event)"><i class="fa-solid fa-book-bookmark"></i> Materi</a>
          <a href="#pengumuman" class="nav-link" onclick="App.scrollToSection('pengumuman', event)"><i class="fa-solid fa-bullhorn"></i> Pengumuman</a>
          <a href="#klasemen" class="nav-link" onclick="App.scrollToSection('klasemen', event)"><i class="fa-solid fa-trophy"></i> Medali</a>
          <a href="#unit" class="nav-link" onclick="App.scrollToSection('unit', event)"><i class="fa-solid fa-school"></i> Kontingen</a>
          <a href="#lokasi" class="nav-link" onclick="App.scrollToSection('lokasi', event)"><i class="fa-solid fa-map-location-dot"></i> Lokasi</a>
        </nav>
        
        <div class="nav-actions" id="navActions">
          <button class="btn btn-primary btn-sm" onclick="App.openLoginModal()"><i class="fa-solid fa-right-to-bracket"></i> Login</button>
        </div>
      </div>
    </div>
  </header>
