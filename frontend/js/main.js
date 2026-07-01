// ==================================================
// FUNDR COMMON CLIENT UTILITIES
// ==================================================

const API_BASE = window.location.origin + '/api';

// Format currency as INR Rupees (e.g. ₹1,50,000)
function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(amount);
}

// Format relative time (days since creation)
function getDaysSince(dateString) {
  const created = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - created);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) return 'Created today';
  if (diffDays === 1) return '1 day ago';
  return `${diffDays} days ago`;
}

// Toast Notifications System
function showToast(title, message, type = 'info') {
  let container = document.querySelector('.toast-container-custom');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container-custom';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast-custom ${type}`;
  
  let iconClass = 'bi-info-circle-fill';
  if (type === 'success') iconClass = 'bi-check-circle-fill';
  if (type === 'error') iconClass = 'bi-exclamation-triangle-fill';

  toast.innerHTML = `
    <span class="toast-custom-icon"><i class="bi ${iconClass}"></i></span>
    <div class="toast-custom-content">
      <div class="toast-custom-title">${title}</div>
      <div class="toast-custom-desc">${message}</div>
    </div>
    <button class="toast-custom-close"><i class="bi bi-x"></i></button>
  `;

  container.appendChild(toast);
  
  // Slide in
  setTimeout(() => {
    toast.classList.add('show');
  }, 50);

  // Close button binding
  toast.querySelector('.toast-custom-close').addEventListener('click', () => {
    dismissToast(toast);
  });

  // Auto-dismiss after 5s
  const autoDismiss = setTimeout(() => {
    dismissToast(toast);
  }, 5000);

  function dismissToast(toastEl) {
    clearTimeout(autoDismiss);
    toastEl.classList.remove('show');
    // Wait for slide-out animation to finish
    toastEl.addEventListener('transitionend', () => {
      toastEl.remove();
    });
  }
}

// Generate unique session-based client token to permit campaign authoring
function getOrCreateCreatorToken() {
  let token = localStorage.getItem('fundr_creator_token');
  if (!token) {
    // Basic browser fallback token if they have no backend token yet
    token = 'client_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
    localStorage.setItem('fundr_creator_token', token);
  }
  return token;
}

// Initialize Global UI Components
document.addEventListener('DOMContentLoaded', () => {
  // 1. Inject Navbar
  const navbarEl = document.getElementById('navbar-placeholder');
  if (navbarEl) {
    const activePage = navbarEl.getAttribute('data-active') || 'home';
    navbarEl.innerHTML = `
      <nav class="navbar navbar-expand-lg navbar-custom sticky-top py-3">
        <div class="container">
          <a class="navbar-brand d-flex align-items-center" href="index.html">
            <i class="bi bi-heart-fill me-2 text-primary"></i>
            <span>Fundr</span>
          </a>
          <button class="navbar-toggler border-0 shadow-none" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav" aria-controls="navbarNav" aria-expanded="false" aria-label="Toggle navigation">
            <i class="bi bi-list fs-2 text-main"></i>
          </button>
          <div class="collapse navbar-collapse" id="navbarNav">
            <ul class="navbar-nav ms-auto align-items-center">
              <li class="nav-item">
                <a class="nav-link ${activePage === 'home' ? 'active' : ''}" href="index.html">Home</a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${activePage === 'campaigns' ? 'active' : ''}" href="explore.html">Campaigns</a>
              </li>
              <li class="nav-item">
                <a class="nav-link ${activePage === 'profile' ? 'active' : ''}" href="profile.html">Dashboard</a>
              </li>
              <li class="nav-item ms-lg-3 mt-3 mt-lg-0">
                <a class="btn btn-primary-custom d-flex align-items-center" href="profile.html?action=create">
                  <i class="bi bi-plus-circle-fill me-2"></i>
                  Start Campaign
                </a>
              </li>
              <li class="nav-item ms-lg-3 mt-2 mt-lg-0">
                <button class="theme-switch" id="theme-toggle" aria-label="Toggle Theme">
                  <i class="bi bi-moon-fill" id="theme-icon"></i>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    `;
  }

  // 2. Inject Footer
  const footerEl = document.getElementById('footer-placeholder');
  if (footerEl) {
    footerEl.innerHTML = `
      <footer class="footer-custom">
        <div class="container">
          <div class="row g-4 mb-5">
            <div class="col-lg-4 col-md-6">
              <div class="footer-logo">
                <i class="bi bi-heart-fill me-1"></i>
                Fundr
              </div>
              <p class="mb-4">Empowering dreams, saving lives, and changing the world one donation at a time. Join our community of giving today.</p>
              <div class="d-flex gap-3 fs-5">
                <a href="#" class="text-muted"><i class="bi bi-twitter-x"></i></a>
                <a href="#" class="text-muted"><i class="bi bi-instagram"></i></a>
                <a href="#" class="text-muted"><i class="bi bi-linkedin"></i></a>
                <a href="#" class="text-muted"><i class="bi bi-facebook"></i></a>
              </div>
            </div>
            <div class="col-lg-2 col-md-6">
              <h5 class="mb-3 text-main font-weight-bold">Navigate</h5>
              <ul class="list-unstyled d-flex flex-column gap-2">
                <li><a href="index.html" class="text-muted text-decoration-none">Home</a></li>
                <li><a href="explore.html" class="text-muted text-decoration-none">Campaigns</a></li>
                <li><a href="profile.html" class="text-muted text-decoration-none">Dashboard</a></li>
              </ul>
            </div>
            <div class="col-lg-2 col-md-6">
              <h5 class="mb-3 text-main font-weight-bold">Categories</h5>
              <ul class="list-unstyled d-flex flex-column gap-2">
                <li><a href="explore.html?category=Medical" class="text-muted text-decoration-none">Medical</a></li>
                <li><a href="explore.html?category=Education" class="text-muted text-decoration-none">Education</a></li>
                <li><a href="explore.html?category=Startup" class="text-muted text-decoration-none">Startups</a></li>
                <li><a href="explore.html?category=Emergency" class="text-muted text-decoration-none">Emergencies</a></li>
              </ul>
            </div>
            <div class="col-lg-4 col-md-6">
              <h5 class="mb-3 text-main font-weight-bold">Newsletter</h5>
              <p>Subscribe to receive news about successful campaigns and impact reports.</p>
              <div class="input-group">
                <input type="email" class="form-control form-control-custom border-end-0" placeholder="Enter email" aria-label="Enter email">
                <button class="btn btn-primary-custom" type="button">Subscribe</button>
              </div>
            </div>
          </div>
          <hr class="border-color mb-4">
          <div class="d-flex flex-column flex-sm-row justify-content-between align-items-center gap-2">
            <span class="small">&copy; ${new Date().getFullYear()} Fundr. All rights reserved.</span>
            <div class="d-flex gap-3 small">
              <a href="#" class="text-muted text-decoration-none">Privacy Policy</a>
              <a href="#" class="text-muted text-decoration-none">Terms of Service</a>
              <a href="#" class="text-muted text-decoration-none">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    `;
  }

  // 3. Theme Toggle Switcher Handler
  const savedTheme = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeUI(savedTheme);

  const themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme');
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('theme', newTheme);
      updateThemeUI(newTheme);
    });
  }

  function updateThemeUI(theme) {
    const icon = document.getElementById('theme-icon');
    if (!icon) return;
    if (theme === 'dark') {
      icon.className = 'bi bi-sun-fill';
    } else {
      icon.className = 'bi bi-moon-fill';
    }
  }

  // Generate creator token on startup if none exists
  getOrCreateCreatorToken();
});
