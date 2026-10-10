// Auth controller logic
const AUTH_CONFIG = {
  privatePages: ['dashboard.html', 'dashboard', 'categories.html', 'categories', 'quiz.html', 'quiz', 'result.html', 'result'],
  authPages: ['login.html', 'login', 'register.html', 'register']
};

document.addEventListener('DOMContentLoaded', () => {
  checkRouteGuards();
  
  // Hook forms if present
  initLoginForm();
  initRegisterForm();
});

// Route Guard logic
function checkRouteGuards() {
  const currentPath = window.location.pathname;
  const pageName = currentPath.substring(currentPath.lastIndexOf('/') + 1);
  const currentUser = localStorage.getItem('studyquest_user');

  if (AUTH_CONFIG.privatePages.includes(pageName) && !currentUser) {
    // Attempting to access private page without session
    window.location.href = 'login.html?redirect=' + encodeURIComponent(pageName + window.location.search);
  }

  if (AUTH_CONFIG.authPages.includes(pageName) && currentUser) {
    // Attempting to access auth page with session active
    window.location.href = 'index.html';
  }
}

// User registration
function initRegisterForm() {
  const registerForm = document.getElementById('register-form');
  if (!registerForm) return;

  registerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const usernameInput = document.getElementById('reg-username');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const confirmPasswordInput = document.getElementById('reg-confirm-password');

    let isValid = true;

    // Reset validations
    [usernameInput, emailInput, passwordInput, confirmPasswordInput].forEach(input => {
      input.classList.remove('is-invalid');
    });

    // Username check
    if (usernameInput.value.trim().length < 3) {
      usernameInput.classList.add('is-invalid');
      isValid = false;
    }

    // Email check (basic regex)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailInput.value.trim())) {
      emailInput.classList.add('is-invalid');
      isValid = false;
    }

    // Password length
    if (passwordInput.value.length < 6) {
      passwordInput.classList.add('is-invalid');
      isValid = false;
    }

    // Password matching
    if (passwordInput.value !== confirmPasswordInput.value) {
      confirmPasswordInput.classList.add('is-invalid');
      isValid = false;
    }

    if (!isValid) {
      showToast('Please correct validation errors', 'error');
      return;
    }

    const apiBase = window.API_BASE_URL || 'http://localhost:5000';
    fetch(`${apiBase}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: usernameInput.value.trim(),
        email: emailInput.value.trim().toLowerCase(),
        password: passwordInput.value
      })
    })
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        showToast(data.message || 'Registration failed', 'error');
        return;
      }

      // Initialize user progression locally for front-end stats
      initUserProgress(data.user.username);

      // Save token session
      localStorage.setItem('studyquest_user', JSON.stringify({
        username: data.user.username,
        email: data.user.email,
        token: data.token
      }));

      showToast('Registration successful! Redirecting to home...', 'success');
      
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 1500);
    })
    .catch(err => {
      console.error(err);
      showToast('Network error during registration', 'error');
    });
  });
}

// User login
function initLoginForm() {
  const loginForm = document.getElementById('login-form');
  if (!loginForm) return;

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();

    const usernameOrEmailInput = document.getElementById('login-identity');
    const passwordInput = document.getElementById('login-password');

    let isValid = true;
    [usernameOrEmailInput, passwordInput].forEach(input => {
      input.classList.remove('is-invalid');
    });

    if (usernameOrEmailInput.value.trim().length === 0) {
      usernameOrEmailInput.classList.add('is-invalid');
      isValid = false;
    }

    if (passwordInput.value.length === 0) {
      passwordInput.classList.add('is-invalid');
      isValid = false;
    }

    if (!isValid) return;

    const identity = usernameOrEmailInput.value.trim().toLowerCase();
    const password = passwordInput.value;


    const apiBase = window.API_BASE_URL || 'http://localhost:5000';
    fetch(`${apiBase}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: identity,
        password: password
      })
    })
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        showToast(data.message || 'Invalid credentials. Please try again.', 'error');
        return;
      }

      // Set current session with token
      localStorage.setItem('studyquest_user', JSON.stringify({
        username: data.user.username,
        email: data.user.email,
        token: data.token
      }));

      // Initialize user progression locally for front-end stats (if not initialized)
      initUserProgress(data.user.username);

      showToast(`Welcome back, ${data.user.username}!`, 'success');

      // Handle redirection
      const urlParams = new URLSearchParams(window.location.search);
      const redirectPage = urlParams.get('redirect');

      setTimeout(() => {
        if (redirectPage) {
          window.location.href = decodeURIComponent(redirectPage);
        } else {
          window.location.href = 'index.html';
        }
      }, 1200);
    })
    .catch(err => {
      console.error(err);
      showToast('Network error during login', 'error');
    });
  });
}

// Initialize user progress structure
function initUserProgress(username) {
  const progressKey = `studyquest_progress_${username}`;
  // Structure holds courses/categories levels completed.
  // Initially, only 'easy' is unlocked for HTML, CSS, JS, Python.
  const defaultProgress = {
    courses: {
      html: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      css: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      javascript: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      python: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 }
    },
    categories: {
      c: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      cpp: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      java: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      sql: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      dbms: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      json: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      reactjs: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      nodejs: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      expressjs: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      mongodb: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      datastructures: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      algorithms: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      os: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      networks: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 },
      git: { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 }
    },
    stats: {
      xp: 0,
      quizzesTaken: 0,
      quizzesPassed: 0
    }
  };

  if (!localStorage.getItem(progressKey)) {
    localStorage.setItem(progressKey, JSON.stringify(defaultProgress));
  }
}
