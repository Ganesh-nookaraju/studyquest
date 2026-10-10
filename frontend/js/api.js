// frontend/js/api.js
/**
 * Dynamic API Base URL resolution for StudyQuest:
 * Supports localhost, VS Code Live Server (port 5500), local network / LAN IPs (e.g., 192.168.x.x),
 * and custom host environments without hardcoded localhost limitations.
 */
(function() {
  const getApiBaseUrl = () => {
    if (window.STUDYQUEST_API_URL) return window.STUDYQUEST_API_URL;
    
    const host = window.location.hostname;
    // When served over a LAN network (e.g. Live Server on 192.168.1.x:5500)
    if (host && host !== 'localhost' && host !== '127.0.0.1' && host !== '') {
      return `${window.location.protocol}//${host}:5000`;
    }
    
    return 'http://localhost:5000';
  };

  window.API_BASE_URL = getApiBaseUrl();
  console.log('[StudyQuest] Connected to API server:', window.API_BASE_URL);
})();
