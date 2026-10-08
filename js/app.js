document.addEventListener('DOMContentLoaded', () => {
  // Mobile Nav Toggle
  const hamburger = document.querySelector('.hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', () => {
      navLinks.classList.toggle('active');
      hamburger.classList.toggle('active');
      
      // Simple icon transition
      const spans = hamburger.querySelectorAll('span');
      if (hamburger.classList.contains('active')) {
        spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
        spans[1].style.opacity = '0';
        spans[2].style.transform = 'rotate(-45deg) translate(6px, -6px)';
      } else {
        spans[0].style.transform = 'none';
        spans[1].style.opacity = '1';
        spans[2].style.transform = 'none';
      }
    });
  }

  // Active Navbar Link Indicator
  const currentPath = window.location.pathname;
  const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  const navItems = document.querySelectorAll('.nav-links a');

  navItems.forEach(item => {
    const itemHref = item.getAttribute('href');
    if (itemHref === pageName || (pageName === '' && itemHref === 'index.html')) {
      item.classList.add('active');
    }
  });

  // Dynamic Auth State in Navbar
  updateNavbarAuth();

  // Sync user progress from backend
  syncUserProgress();

  // Rewrite Courses link based on login state
  const currentUser = JSON.parse(localStorage.getItem('studyquest_user'));
  const coursesLink = Array.from(document.querySelectorAll('.nav-links a')).find(a => a.getAttribute('href') === 'dashboard.html');
  if (coursesLink) {
    if (!currentUser) {
      coursesLink.setAttribute('href', 'index.html#courses');
    } else {
      coursesLink.setAttribute('href', 'dashboard.html');
    }
  }

  // Populate dynamic hero layout based on user auth state
  const heroPointsContainer = document.getElementById('hero-points');
  const heroTitle = document.getElementById('hero-title');
  const heroTagline = document.getElementById('hero-tagline');

  if (heroPointsContainer) {
    if (currentUser) {
      // 1. Fetch user progress for live statistics display
      const progressKey = `studyquest_progress_${currentUser.username}`;
      const userProgress = JSON.parse(localStorage.getItem(progressKey));
      const xp = userProgress ? (userProgress.stats.xp || 0) : 0;
      const taken = userProgress ? (userProgress.stats.quizzesTaken || 0) : 0;
      const passed = userProgress ? (userProgress.stats.quizzesPassed || 0) : 0;

      // 2. Personalize headers
      if (heroTitle) {
        heroTitle.className = 'welcome-title';
        heroTitle.innerHTML = `Welcome back, <span class="gradient-text">${escapeHtml(currentUser.username)}</span>!`;
      }
      if (heroTagline) {
        heroTagline.innerHTML = `Track your learning accomplishments and complete quests to dominate the ranks.`;
      }

      // 3. Render dashboard stats summary inside hero
      heroPointsContainer.innerHTML = `
        <div class="hero-stats-panel animate-fade">
          <div class="hero-stat-pill">
            <i class="fas fa-fire"></i>
            <span><strong>${xp}</strong> XP Cumulative</span>
          </div>
          <div class="hero-stat-pill" style="animation-delay: 0.05s;">
            <i class="fas fa-trophy"></i>
            <span><strong>${passed}/${taken}</strong> Quizzes Passed</span>
          </div>
        </div>
        <div class="hero-quick-resume animate-fade" style="animation-delay: 0.1s;">
          <span class="resume-label"><i class="fas fa-play-circle"></i> Resume Quest:</span>
          <a href="quiz.html?subject=javascript&difficulty=easy" class="resume-badge javascript">
            <i class="fab fa-js"></i> JavaScript Easy
          </a>
          <a href="quiz.html?subject=python&difficulty=easy" class="resume-badge python">
            <i class="fab fa-python"></i> Python Easy
          </a>
        </div>
      `;
    } else {
      // Guest User
      if (heroTitle) {
        heroTitle.innerHTML = `Master Programming.<br><span class="gradient-text">One Quest</span> at a Time.`;
      }
      if (heroTagline) {
        heroTagline.innerHTML = `Interactive practice quizzes to level up your development capabilities.`;
      }

      heroPointsContainer.innerHTML = `
        <div class="hero-features-grid">
          <div class="hero-feature-item animate-fade">
            <div class="feature-icon"><i class="fas fa-gamepad"></i></div>
            <div class="feature-text">
              <h5>Gamified Quizzes</h5>
              <p>Practice Easy, Medium, and Hard challenges.</p>
            </div>
          </div>
          <div class="hero-feature-item animate-fade" style="animation-delay: 0.1s;">
            <div class="feature-icon"><i class="fas fa-trophy"></i></div>
            <div class="feature-text">
              <h5>Global Standings</h5>
              <p>Compete on a live community leaderboard.</p>
            </div>
          </div>
          <div class="hero-feature-item animate-fade" style="animation-delay: 0.2s;">
            <div class="feature-icon"><i class="fas fa-bolt"></i></div>
            <div class="feature-text">
              <h5>Earn Experience</h5>
              <p>Gain XP and unlock achievements as you code.</p>
            </div>
          </div>
        </div>
      `;
    }
  }
});

// Update navbar authentication actions
function updateNavbarAuth() {
  const navLinks = document.querySelector('.nav-links');
  if (!navLinks) return;

  // Check if there is an auth container
  let authContainer = document.querySelector('.nav-auth');
  if (!authContainer) {
    authContainer = document.createElement('div');
    authContainer.className = 'nav-auth';
    navLinks.appendChild(authContainer);
  }

  const currentUser = JSON.parse(localStorage.getItem('studyquest_user'));

  if (currentUser) {
    // User is logged in
    authContainer.innerHTML = `
      <a href="dashboard.html?editProfile=true" id="navbar-profile-btn" class="user-profile-badge" title="View Profile & Edit Info">
        <i class="fas fa-user-circle"></i>
        <span>${escapeHtml(currentUser.username)}</span>
      </a>
      <a href="#" id="logout-btn" class="btn btn-outline" style="padding: 6px 14px; font-size: 0.85rem; border-color: var(--secondary); color: var(--secondary)">
        <i class="fas fa-sign-out-alt"></i> Logout
      </a>
    `;

    document.getElementById('logout-btn').addEventListener('click', (e) => {
      e.preventDefault();
      logoutUser();
    });

    const profileBtn = document.getElementById('navbar-profile-btn');
    if (profileBtn) {
      profileBtn.addEventListener('click', (e) => {
        const currentPath = window.location.pathname.toLowerCase();
        if (currentPath.includes('dashboard')) {
          e.preventDefault();
          const editBtn = document.getElementById('edit-profile-btn');
          if (editBtn) editBtn.click();
        }
      });
    }
  } else {
    // User is not logged in
    authContainer.innerHTML = `
      <a href="login.html" class="btn btn-outline" style="padding: 8px 16px; font-size: 0.9rem; border-color: var(--primary); color: var(--primary)">Login</a>
      <a href="register.html" class="btn btn-primary" style="padding: 8px 16px; font-size: 0.9rem;">Register</a>
    `;
  }
}

// Log out action
function logoutUser() {
  localStorage.removeItem('studyquest_user');
  showToast('Logged out successfully', 'success');
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 1000);
}

// Global Toast Notification Helper
function showToast(message, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  const icon = type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle';
  toast.innerHTML = `
    <i class="fas ${icon}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Remove toast after 3 seconds
  setTimeout(() => {
    toast.style.animation = 'fadeIn 0.3s reverse forwards';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, 3000);
}

// HTML Escaping Utility Function to prevent Stored XSS
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Sync user progress stats from backend database
function syncUserProgress() {
  const currentUser = JSON.parse(localStorage.getItem('studyquest_user'));
  if (!currentUser) return;

  fetch('http://localhost:5000/api/auth/profile', {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${currentUser.token}`
    }
  })
  .then(res => res.json())
  .then(data => {
    if (data.success && data.progress) {
      const progressKey = `studyquest_progress_${currentUser.username}`;
      localStorage.setItem(progressKey, JSON.stringify(data.progress));
      
      // Update stats inside UI dynamically
      updateUIStats(data.progress);
    }
  })
  .catch(err => console.error("Error syncing user progress:", err));
}

// Dynamically refresh stats fields in active pages
function updateUIStats(progress) {
  // 1. Homepage Hero stats
  const heroPointsContainer = document.getElementById('hero-points');
  if (heroPointsContainer) {
    const pills = heroPointsContainer.querySelectorAll('.hero-stats-panel .hero-stat-pill');
    if (pills && pills.length >= 2) {
      const xpVal = pills[0].querySelector('strong');
      const passedVal = pills[1].querySelector('strong');
      if (xpVal) xpVal.textContent = progress.stats.xp;
      if (passedVal) passedVal.textContent = `${progress.stats.quizzesPassed}/${progress.stats.quizzesTaken}`;
    }
  }

  // 2. Dashboard widgets
  const xpVal = document.getElementById('stat-xp-val');
  const takenVal = document.getElementById('stat-taken-val');
  const passedVal = document.getElementById('stat-passed-val');
  const completionVal = document.getElementById('stat-completion-val');
  const completionFill = document.getElementById('stat-completion-fill');

  if (xpVal) xpVal.textContent = progress.stats.xp || 0;
  if (takenVal) takenVal.textContent = progress.stats.quizzesTaken || 0;
  if (passedVal) passedVal.textContent = progress.stats.quizzesPassed || 0;

  if (completionVal || completionFill) {
    const courses = progress.courses;
    let totalSteps = Object.keys(courses).length * 3; // 12
    let completedSteps = 0;
    Object.values(courses).forEach(c => {
      if (c.easy === 'passed') completedSteps++;
      if (c.medium === 'passed') completedSteps++;
      if (c.hard === 'passed') completedSteps++;
    });
    const completionPct = Math.round((completedSteps / totalSteps) * 100);
    if (completionVal) completionVal.textContent = `${completionPct}%`;
    if (completionFill) completionFill.style.width = `${completionPct}%`;
  }
}

