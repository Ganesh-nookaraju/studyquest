// Quiz player controller
let quizQuestions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let timerInterval = null;
let timeLeft = 60; // 60 seconds total for 5 questions
let subject = '';
let difficulty = '';
let isMainCourse = true;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  subject = urlParams.get('subject');
  difficulty = urlParams.get('difficulty');

  if (!subject || !difficulty) {
    showToast('Invalid quiz parameters', 'error');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    return;
  }

  isMainCourse = ['html', 'css', 'javascript', 'python'].includes(subject);

  // Retrieve auth token
  const currentUser = JSON.parse(localStorage.getItem('studyquest_user'));
  const token = currentUser ? currentUser.token : null;

  // Load questions from Backend API
  fetch(`http://localhost:5000/api/quiz/${subject.toLowerCase().trim()}?difficulty=${difficulty.toLowerCase().trim()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  })
    .then(response => {
      if (!response.ok) throw new Error('Failed to load questions from backend');
      return response.json();
    })
    .then(data => {
      if (!data.success || !data.questions) {
        throw new Error(data.message || 'Failed to retrieve questions');
      }
      initQuiz(data.questions);
    })
    .catch(error => {
      console.error(error);
      showToast('Error loading quiz questions from server. Please log in first.', 'error');
      setTimeout(() => { window.location.href = 'login.html'; }, 1500);
    });
});

// Initialize quiz data and randomize 5 questions
function initQuiz(questionsList) {
  if (!questionsList || questionsList.length === 0) {
    showToast('No questions found for this topic or difficulty', 'error');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    return;
  }

  // Choose first 5 questions returned from backend
  const selectedQuestions = questionsList.slice(0, 5);

  // Randomize options for each question while tracking original indices for server grading
  quizQuestions = selectedQuestions.map(q => {
    const originalOptions = q.options;
    const indexedOptions = originalOptions.map((opt, idx) => ({ text: opt, idx }));

    // Shuffle options
    const shuffledOptions = [...indexedOptions].sort(() => Math.random() - 0.5);

    return {
      _id: q._id,
      question: q.question,
      options: shuffledOptions.map(o => o.text),
      originalIndices: shuffledOptions.map(o => o.idx)
    };
  });

  // Init user answers tracking
  userAnswers = new Array(5).fill(null);
  
  // Set meta info
  const subjectTitleMap = {
    html: 'HTML5', css: 'CSS3', javascript: 'JavaScript', python: 'Python',
    c: 'C Lang', cpp: 'C++', java: 'Java', sql: 'SQL', dbms: 'DBMS',
    json: 'JSON', reactjs: 'React JS', datastructures: 'Data Structures', algorithms: 'Algorithms'
  };

  const titleEl = document.getElementById('quiz-subject-title');
  if (titleEl) titleEl.textContent = subjectTitleMap[subject] || subject.toUpperCase();

  const diffBadge = document.getElementById('quiz-difficulty-badge');
  if (diffBadge) {
    diffBadge.className = `quiz-diff-badge ${difficulty}`;
    diffBadge.innerHTML = `<i class="fas fa-signal"></i> ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`;
  }

  // Load first question
  loadQuestion(0);

  // Hook navigation buttons
  document.getElementById('btn-prev').addEventListener('click', prevQuestion);
  document.getElementById('btn-next').addEventListener('click', nextQuestion);
  document.getElementById('btn-submit').addEventListener('click', submitQuiz);

  // Start timer
  startTimer();
}

// Render question index onto player
function loadQuestion(index) {
  currentQuestionIndex = index;
  const q = quizQuestions[index];

  // Update question numbers and progress bar
  document.getElementById('current-question-num').textContent = index + 1;
  
  const dots = document.querySelectorAll('.progress-dot');
  dots.forEach((dot, idx) => {
    dot.className = 'progress-dot';
    if (idx < index) dot.classList.add('completed');
    if (idx === index) dot.classList.add('active');
  });

  // Render question text
  document.getElementById('question-text').textContent = q.question;

  // Render choices list
  const optionsContainer = document.getElementById('options-list');
  optionsContainer.innerHTML = '';

  const markers = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, oIdx) => {
    const optCard = document.createElement('div');
    optCard.className = 'option-card';
    if (userAnswers[index] === oIdx) {
      optCard.classList.add('selected');
    }

    optCard.innerHTML = `
      <div class="option-marker">${markers[oIdx]}</div>
      <div class="option-text">${escapeHtml(opt)}</div>
    `;

    optCard.addEventListener('click', () => selectOption(oIdx));
    optionsContainer.appendChild(optCard);
  });

  // Toggle navigation buttons visibility
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const submitBtn = document.getElementById('btn-submit');

  prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';

  if (index === 4) {
    nextBtn.style.display = 'none';
    submitBtn.style.display = 'inline-flex';
  } else {
    nextBtn.style.display = 'inline-flex';
    submitBtn.style.display = 'none';
  }
}

// Select an option
function selectOption(optionIndex) {
  userAnswers[currentQuestionIndex] = optionIndex;
  
  // Highlight selection visually
  const cards = document.querySelectorAll('.option-card');
  cards.forEach((card, idx) => {
    card.classList.toggle('selected', idx === optionIndex);
  });
}

// Navigate back
function prevQuestion() {
  if (currentQuestionIndex > 0) {
    loadQuestion(currentQuestionIndex - 1);
  }
}

// Navigate forward
function nextQuestion() {
  if (currentQuestionIndex < 4) {
    loadQuestion(currentQuestionIndex + 1);
  }
}

// Total timer ticking
function startTimer() {
  timeLeft = 60;
  const timerVal = document.getElementById('timer-val');
  const timerBox = document.querySelector('.quiz-timer-box');

  if (timerVal) timerVal.textContent = timeLeft;

  timerInterval = setInterval(() => {
    timeLeft--;
    if (timerVal) timerVal.textContent = timeLeft;

    if (timeLeft <= 10 && timerBox) {
      timerBox.classList.add('warning');
    }

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      showToast('Time is up! Compiling answers.', 'error');
      setTimeout(() => {
        submitQuiz();
      }, 1000);
    }
  }, 1000);
}

// Submit answers and compile results
function submitQuiz() {
  clearInterval(timerInterval);

  const currentUser = JSON.parse(localStorage.getItem('studyquest_user'));
  const token = currentUser ? currentUser.token : null;

  // Map user answers back to original indexes
  const answersPayload = quizQuestions.map((q, idx) => {
    const selectedShuffledIndex = userAnswers[idx];
    const originalIndex = selectedShuffledIndex !== null ? q.originalIndices[selectedShuffledIndex] : -1;
    return {
      questionId: q._id,
      selectedOption: originalIndex
    };
  });

  const submitBody = {
    course: subject,
    difficulty: difficulty,
    answers: answersPayload
  };

  fetch('http://localhost:5000/api/quiz/submit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(submitBody)
  })
    .then(res => {
      if (!res.ok) throw new Error('Failed to grade quiz');
      return res.json();
    })
    .then(data => {
      if (!data.success) {
        showToast(data.message || 'Submission failed', 'error');
        return;
      }

      const result = data.result;

      // Retrieve and update local progression
      if (currentUser) {
        const progressKey = `studyquest_progress_${currentUser.username}`;
        const userProgress = JSON.parse(localStorage.getItem(progressKey));

        if (userProgress) {
          userProgress.stats.quizzesTaken = (userProgress.stats.quizzesTaken || 0) + 1;
          
          const group = isMainCourse ? 'courses' : 'categories';

          if (result.passed) {
            userProgress.stats.quizzesPassed = (userProgress.stats.quizzesPassed || 0) + 1;

            // Add XP
            let xpGained = 100;
            if (difficulty === 'medium') xpGained = 150;
            if (difficulty === 'hard') xpGained = 200;
            userProgress.stats.xp = (userProgress.stats.xp || 0) + xpGained;

            // Update level status
            userProgress[group][subject][difficulty] = 'passed';

            // Unlock next difficulties
            if (difficulty === 'easy') {
              if (userProgress[group][subject].medium === 'locked') {
                userProgress[group][subject].medium = 'unlocked';
              }
            } else if (difficulty === 'medium') {
              if (userProgress[group][subject].hard === 'locked') {
                userProgress[group][subject].hard = 'unlocked';
              }
            }
          }

          // Save user progress
          localStorage.setItem(progressKey, JSON.stringify(userProgress));

          // Log leaderboard entry
          updateLeaderboard(currentUser.username, subject, difficulty, result.correctAnswers);
        }
      }

      // Save session details for Result page display
      const attemptResult = {
        subject: subject,
        difficulty: difficulty,
        score: result.correctAnswers,
        correct: result.correctAnswers,
        wrong: result.wrongAnswers,
        percent: result.percentage,
        passed: result.passed
      };
      sessionStorage.setItem('studyquest_last_result', JSON.stringify(attemptResult));

      // Redirect to results screen
      window.location.href = 'result.html';
    })
    .catch(err => {
      console.error(err);
      showToast('Network error submitting quiz results', 'error');
    });
}

// Log high scores inside database
function updateLeaderboard(username, subjectKey, diff, score) {
  const leaderboard = JSON.parse(localStorage.getItem('studyquest_leaderboard')) || [];
  
  const existingIdx = leaderboard.findIndex(entry => 
    entry.username === username && 
    entry.course === subjectKey && 
    entry.difficulty === diff
  );

  if (existingIdx > -1) {
    // Overwrite if score is higher
    if (score > leaderboard[existingIdx].score) {
      leaderboard[existingIdx].score = score;
      leaderboard[existingIdx].date = new Date().toISOString();
    }
  } else {
    // Append entry
    leaderboard.push({
      username: username,
      course: subjectKey,
      difficulty: diff,
      score: score,
      date: new Date().toISOString()
    });
  }

  localStorage.setItem('studyquest_leaderboard', JSON.stringify(leaderboard));
}

// Basic HTML escaping helper
function escapeHtml(text) {
  if (typeof text !== 'string') return text;
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
