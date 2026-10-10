// Dashboard progression controller
document.addEventListener('DOMContentLoaded', () => {
  let currentUser = JSON.parse(localStorage.getItem('studyquest_user'));
  if (!currentUser) {
    currentUser = { username: 'Student', token: null };
    localStorage.setItem('studyquest_user', JSON.stringify(currentUser));
  }

  const progressKey = `studyquest_progress_${currentUser.username}`;
  let userProgress = JSON.parse(localStorage.getItem(progressKey));
  
  // Safeguard: re-init if lost
  if (!userProgress) {
    initUserProgress(currentUser.username);
    userProgress = JSON.parse(localStorage.getItem(progressKey));
  }

  // Populate dynamic user elements
  const welcomeName = document.getElementById('welcome-username');
  if (welcomeName) welcomeName.textContent = currentUser.username;

  const userInitial = document.getElementById('user-avatar-initial');
  if (userInitial && currentUser.username) {
    userInitial.textContent = currentUser.username.trim().charAt(0).toUpperCase();
  }

  // Render Page specific elements
  renderStats(userProgress);
  
  if (document.getElementById('dashboard-courses-grid')) {
    renderCourseGrid(userProgress.courses, 'dashboard-courses-grid', 'course');
  }

  if (document.getElementById('categories-courses-grid')) {
    renderCourseGrid(userProgress.categories, 'categories-courses-grid', 'category');
    initCategoryFilter();
  }

  // Hook reset progress
  const resetBtn = document.getElementById('reset-progress-btn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to reset all your progress, XP, and scores? This cannot be undone.')) {
        resetUserProgress(currentUser.username);
      }
    });
  }

  // Hook edit profile modal
  initProfileModal(currentUser, userProgress);

  // Auto-open edit profile modal if requested in URL query params
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('editProfile') === 'true') {
    const editBtn = document.getElementById('edit-profile-btn');
    if (editBtn) {
      setTimeout(() => { editBtn.click(); }, 150);
    }
  }
});

// Render user stats top panel
function renderStats(progress) {
  const xpVal = document.getElementById('stat-xp-val');
  const takenVal = document.getElementById('stat-taken-val');
  const passedVal = document.getElementById('stat-passed-val');
  const completionVal = document.getElementById('stat-completion-val');
  const completionFill = document.getElementById('stat-completion-fill');

  if (xpVal) xpVal.textContent = progress.stats.xp || 0;
  if (takenVal) takenVal.textContent = progress.stats.quizzesTaken || 0;
  if (passedVal) passedVal.textContent = progress.stats.quizzesPassed || 0;

  // Calculate completion percentage across 4 primary courses (3 levels each = 12 steps)
  // Categories completion handles categories page.
  const courses = progress.courses;
  let totalSteps = Object.keys(courses).length * 3; // 4 * 3 = 12
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

// Render specific Course grids (Main courses vs categories)
function renderCourseGrid(subjects, gridId, type) {
  const grid = document.getElementById(gridId);
  if (!grid) return;

  grid.innerHTML = '';

  const subjectMeta = {
    html: { title: 'HTML5', desc: 'Structure web pages with elements, semantic layouts, inputs, and canvas.', icon: 'fab fa-html5' },
    css: { title: 'CSS3 Styles', desc: 'Design stunning responsive UI with Flexbox, CSS Grid, animations, and shadows.', icon: 'fab fa-css3-alt' },
    javascript: { title: 'JavaScript (ES6)', desc: 'Bring pages to life with closures, arrays, promises, APIs, and the event loop.', icon: 'fab fa-js' },
    python: { title: 'Python Programming', desc: 'Master lists, dictionaries, list comprehension, generators, and decorators.', icon: 'fab fa-python' },
    c: { title: 'C Programming', desc: 'Learn pointers, memory allocation, structure overlays, and static compilers.', icon: 'fas fa-code' },
    cpp: { title: 'C++', desc: 'Dive into OOP, encapsulation, virtual constructors, dynamic delete, and STL templates.', icon: 'fas fa-terminal' },
    java: { title: 'Java Standard Edition', desc: 'Explore JVM structures, class polymorphism, checked exceptions, and threads.', icon: 'fab fa-java' },
    sql: { title: 'SQL & Joins', desc: 'Build statements, filtering joins, indexes, subqueries, and database commits.', icon: 'fas fa-database' },
    dbms: { title: 'Database Systems', desc: 'Analyze data integrity, 3NF normalization, transactions, and locks.', icon: 'fas fa-server' },
    json: { title: 'JSON Data Format', desc: 'Format variables, parse text strings, structure nesting, and validate rules.', icon: 'fas fa-brackets-curly' },
    reactjs: { title: 'React JS Framework', desc: 'Understand virtual DOM diffs, state hooks, props, context APIs, and JSX.', icon: 'fab fa-react' },
    nodejs: { title: 'Node.js Runtime', desc: 'Master asynchronous events, fs, streams, process, and V8 runtime execution.', icon: 'fab fa-node-js' },
    expressjs: { title: 'Express.js Web Server', desc: 'Build scalable APIs, middleware chains, REST routing, and error handlers.', icon: 'fas fa-server' },
    mongodb: { title: 'MongoDB & Mongoose', desc: 'Store BSON documents, aggregation pipelines, indexes, and collections.', icon: 'fas fa-leaf' },
    datastructures: { title: 'Data Structures', desc: 'Implement stacks, LIFO arrays, binary search trees, and custom queues.', icon: 'fas fa-project-diagram' },
    algorithms: { title: 'Algorithms', desc: 'Study recursion, sorting complexity, Dijkstra pathfinding, and greedy algorithms.', icon: 'fas fa-calculator' },
    os: { title: 'Operating Systems', desc: 'Understand CPU scheduling, deadlocks, paging, virtual memory, and threads.', icon: 'fas fa-microchip' },
    networks: { title: 'Computer Networks', desc: 'Master OSI layers, TCP 3-way handshake, IP routing, HTTP/2, and DNS.', icon: 'fas fa-network-wired' },
    git: { title: 'Git Version Control', desc: 'Master commits, branching, merging, rebasing, remotes, and reflog.', icon: 'fab fa-git-alt' }
  };

  Object.keys(subjects).forEach(key => {
    const progressObj = subjects[key];
    const meta = subjectMeta[key] || { title: key.toUpperCase(), desc: 'Practice programming quiz challenges.', icon: 'fas fa-laptop-code' };
    
    // Calculate subject progress percent
    let levelPoints = 0;
    if (progressObj.easy === 'passed') levelPoints++;
    if (progressObj.medium === 'passed') levelPoints++;
    if (progressObj.hard === 'passed') levelPoints++;
    
    const subjectPct = Math.round((levelPoints / 3) * 100);

    // Save calculated percent back in object
    progressObj.percent = subjectPct;

    const card = document.createElement('div');
    card.className = `course-card course-${key} sq-card animate-fade`;
    card.dataset.category = key; // for categories filtering

    card.innerHTML = `
      <div class="course-header">
        <div class="course-title-area">
          <div class="course-icon">
            <i class="${meta.icon}"></i>
          </div>
          <h4 class="course-title">${meta.title}</h4>
        </div>
      </div>
      <p class="course-desc">${meta.desc}</p>
      
      <div class="course-progress-container">
        <div class="progress-label-bar">
          <span>Syllabus Completed</span>
          <span>${subjectPct}%</span>
        </div>
        <div class="progress-bar-wrapper">
          <div class="progress-bar-fill" style="width: ${subjectPct}%"></div>
        </div>
      </div>

      <div class="levels-area">
        <span class="levels-title">Select Difficulty</span>
        <div class="levels-buttons">
          ${renderLevelButton(key, 'easy', progressObj.easy)}
          ${renderLevelButton(key, 'medium', progressObj.medium)}
          ${renderLevelButton(key, 'hard', progressObj.hard)}
        </div>
      </div>
    `;

    grid.appendChild(card);
  });
}

// Generate single difficulty level button markup
function renderLevelButton(subject, level, status) {
  let btnClass = 'locked';
  let icon = 'fa-lock';
  let onclick = 'return false;';

  if (status === 'passed' || status === 'unlocked') {
    btnClass = status;
    icon = status === 'passed' ? 'fa-check-circle' : 'fa-play';
    onclick = `selectAndLaunchQuiz('${subject}', '${level}', event)`;
  }

  return `
    <button class="btn-level ${btnClass}" onclick="${onclick}" aria-label="${level} difficulty ${status}">
      <i class="fas ${icon}"></i>
      <span>${level.charAt(0).toUpperCase() + level.slice(1)}</span>
    </button>
  `;
}

// Global click handler to guarantee selected course & difficulty persist across page navigation
window.selectAndLaunchQuiz = function(subject, level, event) {
  if (event) event.preventDefault();
  sessionStorage.setItem('studyquest_selected_subject', subject);
  sessionStorage.setItem('studyquest_selected_difficulty', level);
  window.location.href = `quiz.html?subject=${encodeURIComponent(subject)}&difficulty=${encodeURIComponent(level)}`;
};

// Initialize filters on the categories page
function initCategoryFilter() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const filter = chip.dataset.filter;
      const cards = document.querySelectorAll('.course-card');

      cards.forEach(card => {
        if (filter === 'all') {
          card.style.display = 'flex';
        } else if (filter === 'core') {
          // core: c, cpp, java
          const core = ['c', 'cpp', 'java'];
          card.style.display = core.includes(card.dataset.category) ? 'flex' : 'none';
        } else if (filter === 'web') {
          // web: json, reactjs, nodejs, expressjs, mongodb, sql, dbms
          const web = ['json', 'reactjs', 'nodejs', 'expressjs', 'mongodb', 'sql', 'dbms'];
          card.style.display = web.includes(card.dataset.category) ? 'flex' : 'none';
        } else if (filter === 'theory') {
          // theory: datastructures, algorithms, os, networks, git
          const theory = ['datastructures', 'algorithms', 'os', 'networks', 'git'];
          card.style.display = theory.includes(card.dataset.category) ? 'flex' : 'none';
        }
      });
    });
  });
}

// Reset progression data
function resetUserProgress(username) {
  const progressKey = `studyquest_progress_${username}`;
  localStorage.removeItem(progressKey);
  
  // Re-init with defaults
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

  localStorage.setItem(progressKey, JSON.stringify(defaultProgress));
  showToast('Progress reset successful!', 'success');
  
  setTimeout(() => {
    window.location.reload();
  }, 1000);
}

// Profile Modal Controller logic
function initProfileModal(currentUser, userProgress) {
  const modal = document.getElementById('profile-modal');
  const editBtn = document.getElementById('edit-profile-btn');
  const closeBtn = document.getElementById('close-profile-modal');
  const form = document.getElementById('edit-profile-form');

  if (!modal || !editBtn || !closeBtn || !form) return;

  const editLink = document.getElementById('edit-profile-link');

  const openProfileModal = (e) => {
    if (e) e.preventDefault();
    document.getElementById('edit-username').value = currentUser.username;
    document.getElementById('edit-xp').value = userProgress.stats.xp || 0;
    document.getElementById('edit-quizzes-taken').value = userProgress.stats.quizzesTaken || 0;
    document.getElementById('edit-quizzes-passed').value = userProgress.stats.quizzesPassed || 0;
    
    // Reset invalid state
    document.getElementById('edit-username').classList.remove('is-invalid');
    modal.classList.add('active');
  };

  // 1. Open modal and pre-fill form fields
  editBtn.addEventListener('click', openProfileModal);
  if (editLink) {
    editLink.addEventListener('click', openProfileModal);
  }

  // 2. Close modal
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('active');
  });

  // Close modal when clicking outside modal-content
  window.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
    }
  });

  // 3. Form submission
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const usernameInput = document.getElementById('edit-username');
    const xpInput = document.getElementById('edit-xp');
    const takenInput = document.getElementById('edit-quizzes-taken');
    const passedInput = document.getElementById('edit-quizzes-passed');

    const newUsername = usernameInput.value.trim();
    const newXp = parseInt(xpInput.value) || 0;
    const newTaken = parseInt(takenInput.value) || 0;
    const newPassed = parseInt(passedInput.value) || 0;

    let isValid = true;
    usernameInput.classList.remove('is-invalid');

    if (newUsername.length < 3) {
      usernameInput.classList.add('is-invalid');
      isValid = false;
    }

    if (!isValid) return;

    // Check if username changed and requires backend update
    const usernameChanged = newUsername !== currentUser.username;

    const saveLocalChanges = (updatedUsername) => {
      // Create copy of progress
      const updatedProgress = { ...userProgress };
      updatedProgress.stats.xp = newXp;
      updatedProgress.stats.quizzesTaken = newTaken;
      updatedProgress.stats.quizzesPassed = newPassed;

      const oldKey = `studyquest_progress_${currentUser.username}`;
      const newKey = `studyquest_progress_${updatedUsername}`;

      if (usernameChanged) {
        // Delete old key and write to new key
        localStorage.removeItem(oldKey);
        localStorage.setItem(newKey, JSON.stringify(updatedProgress));

        // Update user session token data
        currentUser.username = updatedUsername;
        localStorage.setItem('studyquest_user', JSON.stringify(currentUser));
      } else {
        localStorage.setItem(oldKey, JSON.stringify(updatedProgress));
      }

      showToast('Profile and activities updated successfully!', 'success');
      modal.classList.remove('active');

      setTimeout(() => {
        window.location.reload();
      }, 1000);
    };

    if (usernameChanged) {
      const apiBase = window.API_BASE_URL || 'http://localhost:5000';
      fetch(`${apiBase}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUser.token}`
        },
        body: JSON.stringify({
          username: newUsername
        })
      })
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          showToast(data.message || 'Profile update failed', 'error');
          return;
        }
        saveLocalChanges(data.user.username);
      })
      .catch(err => {
        console.error(err);
        showToast('Network error updating username', 'error');
      });
    } else {
      // Username didn't change, just update stats
      saveLocalChanges(currentUser.username);
    }
  });
}
