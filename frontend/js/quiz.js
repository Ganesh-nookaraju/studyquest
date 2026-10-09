// Quiz player controller
let quizQuestions = [];
let userAnswers = [];
let currentQuestionIndex = 0;
let timerInterval = null;
let timeLeft = 60; // 60 seconds total for 5 questions
let subject = '';
let difficulty = '';
let isMainCourse = true;
let isFallbackMode = false;

document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  
  // Read subject/course parameter flexibly to handle any URL parameter naming
  subject = urlParams.get('subject') || urlParams.get('course') || urlParams.get('category') || urlParams.get('id') || urlParams.get('topic') || 'html';
  difficulty = urlParams.get('difficulty') || urlParams.get('level') || urlParams.get('diff') || 'easy';

  subject = subject.toLowerCase().trim();
  difficulty = difficulty.toLowerCase().trim();

  isMainCourse = ['html', 'css', 'javascript', 'python'].includes(subject);

  // Check auth user session or create guest fallback session
  let currentUser = JSON.parse(localStorage.getItem('studyquest_user'));
  if (!currentUser) {
    currentUser = { username: 'Student', token: null };
    localStorage.setItem('studyquest_user', JSON.stringify(currentUser));
  }

  const token = currentUser.token;

  // If token is present, attempt fetching from Backend API
  if (token) {
    fetch(`http://localhost:5000/api/quiz/${subject}?difficulty=${difficulty}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(response => {
        if (!response.ok) throw new Error('Backend unavailable, switching to local question data');
        return response.json();
      })
      .then(data => {
        if (!data.success || !data.questions || data.questions.length === 0) {
          throw new Error('No questions returned from backend API');
        }
        initQuiz(data.questions, false);
      })
      .catch(err => {
        console.warn('Backend load attempt failed, loading local questions:', err.message);
        loadFromJSONFallback(subject, difficulty);
      });
  } else {
    // Load directly from local JSON fallback if no backend token
    loadFromJSONFallback(subject, difficulty);
  }
});

// Fallback loader from data/questions.json
function loadFromJSONFallback(subj, diff) {
  isFallbackMode = true;
  fetch('data/questions.json')
    .then(res => {
      if (!res.ok) throw new Error('Could not load local questions file');
      return res.json();
    })
    .then(jsonData => {
      const subjData = jsonData[subj];
      if (subjData && subjData[diff]) {
        const rawQuestions = subjData[diff];
        const formattedQuestions = rawQuestions.map(q => ({
          _id: q.id || `q_${Math.random()}`,
          question: q.question,
          options: q.options,
          correctAnswer: q.answer !== undefined ? q.answer : 0
        }));
        initQuiz(formattedQuestions, true);
      } else {
        // Ultimate fallback: try html easy if subject not found in JSON
        const defaultList = (jsonData.html && jsonData.html.easy) ? jsonData.html.easy : [];
        if (defaultList.length > 0) {
          const formattedQuestions = defaultList.map(q => ({
            _id: q.id || `q_${Math.random()}`,
            question: q.question,
            options: q.options,
            correctAnswer: q.answer !== undefined ? q.answer : 0
          }));
          initQuiz(formattedQuestions, true);
        } else {
          showToast('No question data available', 'error');
        }
      }
    })
    .catch(err => {
      console.error('Error reading questions.json:', err);
      showToast('Error loading question dataset', 'error');
    });
}

// Initialize quiz data and randomize 5 questions
function initQuiz(questionsList, fallback = false) {
  isFallbackMode = fallback;

  if (!questionsList || questionsList.length === 0) {
    showToast('No questions found for this topic', 'error');
    setTimeout(() => { window.location.href = 'dashboard.html'; }, 1000);
    return;
  }

  // Choose 5 questions
  const selectedQuestions = questionsList.slice(0, 5);

  // Randomize options for each question while tracking original indices
  quizQuestions = selectedQuestions.map(q => {
    const originalOptions = q.options || ['Option 1', 'Option 2', 'Option 3', 'Option 4'];
    const indexedOptions = originalOptions.map((opt, idx) => ({ text: opt, idx }));

    // Shuffle options
    const shuffledOptions = [...indexedOptions].sort(() => Math.random() - 0.5);

    return {
      _id: q._id,
      question: q.question,
      options: shuffledOptions.map(o => o.text),
      originalIndices: shuffledOptions.map(o => o.idx),
      correctAnswer: q.correctAnswer
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
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const submitBtn = document.getElementById('btn-submit');

  if (prevBtn) prevBtn.onclick = prevQuestion;
  if (nextBtn) nextBtn.onclick = nextQuestion;
  if (submitBtn) submitBtn.onclick = submitQuiz;

  // Start timer
  startTimer();
}

// Render question index onto player
function loadQuestion(index) {
  currentQuestionIndex = index;
  const q = quizQuestions[index];
  if (!q) return;

  // Update question numbers and progress bar
  const numEl = document.getElementById('current-question-num');
  if (numEl) numEl.textContent = index + 1;
  
  const dots = document.querySelectorAll('.progress-dot');
  dots.forEach((dot, idx) => {
    dot.className = 'progress-dot';
    if (idx < index) dot.classList.add('completed');
    if (idx === index) dot.classList.add('active');
  });

  // Render question text
  const qText = document.getElementById('question-text');
  if (qText) qText.textContent = q.question;

  // Render choices list
  const optionsContainer = document.getElementById('options-list');
  if (optionsContainer) {
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
  }

  // Toggle navigation buttons visibility
  const prevBtn = document.getElementById('btn-prev');
  const nextBtn = document.getElementById('btn-next');
  const submitBtn = document.getElementById('btn-submit');

  if (prevBtn) prevBtn.style.visibility = index === 0 ? 'hidden' : 'visible';

  if (index === 4) {
    if (nextBtn) nextBtn.style.display = 'none';
    if (submitBtn) submitBtn.style.display = 'inline-flex';
  } else {
    if (nextBtn) nextBtn.style.display = 'inline-flex';
    if (submitBtn) submitBtn.style.display = 'none';
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
  if (timerInterval) clearInterval(timerInterval);
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
      showToast('Time is up! Submitting answers.', 'error');
      setTimeout(() => {
        submitQuiz();
      }, 800);
    }
  }, 1000);
}

// Submit answers and compile results
function submitQuiz() {
  if (timerInterval) clearInterval(timerInterval);

  const currentUser = JSON.parse(localStorage.getItem('studyquest_user')) || { username: 'Student' };
  const token = currentUser.token;

  // Map user answers back to original indexes
  const answersPayload = quizQuestions.map((q, idx) => {
    const selectedShuffledIndex = userAnswers[idx];
    const originalIndex = selectedShuffledIndex !== null ? q.originalIndices[selectedShuffledIndex] : -1;
    return {
      questionId: q._id,
      selectedOption: originalIndex
    };
  });

  if (!isFallbackMode && token) {
    // Attempt backend submit
    fetch('http://localhost:5000/api/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        course: subject,
        difficulty: difficulty,
        answers: answersPayload
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.result) {
          processResultAndRedirect(currentUser, data.result.correctAnswers, data.result.wrongAnswers, data.result.percentage, data.result.passed);
        } else {
          processLocalResultAndRedirect(currentUser);
        }
      })
      .catch(err => {
        console.warn('Backend submission failed, falling back to local evaluation:', err);
        processLocalResultAndRedirect(currentUser);
      });
  } else {
    processLocalResultAndRedirect(currentUser);
  }
}

// Client-side local result processor (Fallback mode)
function processLocalResultAndRedirect(currentUser) {
  let correctCount = 0;
  let wrongCount = 0;

  quizQuestions.forEach((q, idx) => {
    const selectedShuffledIndex = userAnswers[idx];
    const originalIndex = selectedShuffledIndex !== null ? q.originalIndices[selectedShuffledIndex] : -1;
    if (q.correctAnswer !== undefined && originalIndex === q.correctAnswer) {
      correctCount++;
    } else {
      wrongCount++;
    }
  });

  const percentage = Math.round((correctCount / 5) * 100);
  const passed = percentage >= 60;

  processResultAndRedirect(currentUser, correctCount, wrongCount, percentage, passed);
}

// Unified result processing & redirection
function processResultAndRedirect(currentUser, correct, wrong, percentage, passed) {
  const username = currentUser ? currentUser.username : 'Student';
  const progressKey = `studyquest_progress_${username}`;
  let userProgress = JSON.parse(localStorage.getItem(progressKey));

  if (!userProgress) {
    initUserProgress(username);
    userProgress = JSON.parse(localStorage.getItem(progressKey));
  }

  if (userProgress) {
    userProgress.stats.quizzesTaken = (userProgress.stats.quizzesTaken || 0) + 1;
    const group = isMainCourse ? 'courses' : 'categories';

    if (passed) {
      userProgress.stats.quizzesPassed = (userProgress.stats.quizzesPassed || 0) + 1;
      let xpGained = 100;
      if (difficulty === 'medium') xpGained = 150;
      if (difficulty === 'hard') xpGained = 200;
      userProgress.stats.xp = (userProgress.stats.xp || 0) + xpGained;

      if (!userProgress[group]) userProgress[group] = {};
      if (!userProgress[group][subject]) {
        userProgress[group][subject] = { easy: 'unlocked', medium: 'locked', hard: 'locked', percent: 0 };
      }

      userProgress[group][subject][difficulty] = 'passed';

      if (difficulty === 'easy' && userProgress[group][subject].medium === 'locked') {
        userProgress[group][subject].medium = 'unlocked';
      } else if (difficulty === 'medium' && userProgress[group][subject].hard === 'locked') {
        userProgress[group][subject].hard = 'unlocked';
      }
    }

    localStorage.setItem(progressKey, JSON.stringify(userProgress));
    updateLeaderboard(username, subject, difficulty, correct);
  }

  const attemptResult = {
    subject: subject,
    difficulty: difficulty,
    score: correct,
    correct: correct,
    wrong: wrong,
    percent: percentage,
    passed: passed
  };
  sessionStorage.setItem('studyquest_last_result', JSON.stringify(attemptResult));

  window.location.href = 'result.html';
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
    if (score > leaderboard[existingIdx].score) {
      leaderboard[existingIdx].score = score;
      leaderboard[existingIdx].date = new Date().toISOString();
    }
  } else {
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
