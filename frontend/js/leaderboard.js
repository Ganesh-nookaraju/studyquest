// Leaderboard controller logic
document.addEventListener('DOMContentLoaded', () => {
  renderLeaderboard();
});

function renderLeaderboard() {
  const leaderboard = JSON.parse(localStorage.getItem('studyquest_leaderboard')) || [];
  
  const subjectTitleMap = {
    html: 'HTML5', css: 'CSS3', javascript: 'JavaScript', python: 'Python',
    c: 'C Lang', cpp: 'C++', java: 'Java', sql: 'SQL', dbms: 'DBMS',
    json: 'JSON', reactjs: 'React JS', nodejs: 'Node.js', expressjs: 'Express.js',
    mongodb: 'MongoDB', datastructures: 'Data Structures', algorithms: 'Algorithms',
    os: 'Operating Systems', networks: 'Networks', git: 'Git'
  };

  // Sort scores descending: score first, then date
  leaderboard.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return new Date(b.date) - new Date(a.date);
  });

  const podiumArea = document.getElementById('podium-grid');
  const tableBody = document.getElementById('ranking-table-body');
  const emptyState = document.getElementById('leaderboard-empty-state');
  const tableCard = document.getElementById('ranking-table-card');

  if (leaderboard.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    if (podiumArea) podiumArea.style.display = 'none';
    if (tableCard) tableCard.style.display = 'none';
    return;
  }

  if (emptyState) emptyState.style.display = 'none';
  if (podiumArea) podiumArea.style.display = 'grid';
  if (tableCard) tableCard.style.display = 'block';

  // Render Top 3 Podiums
  const top3 = leaderboard.slice(0, 3);
  
  if (podiumArea) {
    podiumArea.innerHTML = '';
    
    // Define podium slots: 1st, 2nd, 3rd.
    // We will render them in order: 2nd, 1st, 3rd (styled with CSS order property)
    const podiumConfigs = [
      { rank: 1, class: 'first', medal: '👑', color: 'Gold' },
      { rank: 2, class: 'second', medal: '🥈', color: 'Silver' },
      { rank: 3, class: 'third', medal: '🥉', color: 'Bronze' }
    ];

    podiumConfigs.forEach(cfg => {
      const entry = top3[cfg.rank - 1];
      const card = document.createElement('div');
      card.className = `podium-card ${cfg.class} animate-fade`;

      if (entry) {
        const courseName = subjectTitleMap[entry.course] || (entry.course ? entry.course.toUpperCase() : 'HTML5');
        const rawName = (entry.username && String(entry.username).trim()) ? String(entry.username).trim() : 'Anonymous';
        const safeName = escapeHtml(rawName);
        
        card.innerHTML = `
          <div class="podium-avatar-wrapper">
            <div class="podium-avatar">
              <span>${cfg.medal}</span>
            </div>
            <div class="podium-rank-badge">${cfg.rank}</div>
          </div>
          <h4 class="podium-username" title="${safeName}">${safeName}</h4>
          <div class="podium-score">${entry.score} / 5</div>
          <div class="podium-meta">${courseName} (${entry.difficulty || 'easy'})</div>
        `;
      } else {
        // TBD placeholder slot
        card.innerHTML = `
          <div class="podium-avatar-wrapper">
            <div class="podium-avatar" style="opacity: 0.5;">
              <span>👤</span>
            </div>
            <div class="podium-rank-badge" style="background-color: var(--text-muted);">${cfg.rank}</div>
          </div>
          <h4 class="podium-username" style="color: var(--text-muted);">TBD</h4>
          <div class="podium-score" style="color: var(--text-muted);">-</div>
          <div class="podium-meta">-</div>
        `;
      }
      podiumArea.appendChild(card);
    });
  }

  // Render Remaining Entries in Table (starting from rank 1)
  if (tableBody) {
    tableBody.innerHTML = '';

    leaderboard.forEach((entry, idx) => {
      const row = document.createElement('tr');
      const courseName = subjectTitleMap[entry.course] || (entry.course ? entry.course.toUpperCase() : 'HTML5');
      const rawName = (entry.username && String(entry.username).trim()) ? String(entry.username).trim() : 'Anonymous';
      const initial = rawName.charAt(0).toUpperCase();
      const safeName = escapeHtml(rawName);

      row.innerHTML = `
        <td class="ranking-row-num">#${idx + 1}</td>
        <td>
          <div class="ranking-username">
            <div class="ranking-avatar">${escapeHtml(initial)}</div>
            <span title="${safeName}">${safeName}</span>
          </div>
        </td>
        <td>${courseName}</td>
        <td>
          <span class="quiz-diff-badge ${entry.difficulty || 'easy'}" style="font-size: 0.7rem; padding: 2px 8px;">
            ${entry.difficulty || 'easy'}
          </span>
        </td>
        <td class="ranking-row-score">${entry.score} / 5</td>
        <td style="color: var(--text-muted); font-size: 0.85rem;">
          ${new Date(entry.date || Date.now()).toLocaleDateString(undefined, {month: 'short', day: 'numeric', hour: '2-digit', minute:'2-digit'})}
        </td>
      `;

      tableBody.appendChild(row);
    });
  }
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

