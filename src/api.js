// ============================================================
// Nuji API helper — talks to the Express backend in /server
// Every method returns null on failure so the UI can fall back
// to demo data when the backend is not running.
// ============================================================

const BASE = '/api';

async function request(path, options = {}) {
  try {
    const res = await fetch(BASE + path, {
      headers: options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {},
      ...options
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null; // backend offline -> UI uses fallback demo data
  }
}

const get = (path) => request(path);
const post = (path, body) => request(path, { method: 'POST', body: body instanceof FormData ? body : JSON.stringify(body) });

export const api = {
  // ---- auth / profile ----
  checkPhone: (phone) => post('/auth/phone', { phone }),
  saveProfile: (data) => post('/profile', data),
  getProfile: (phone) => get(`/profile/${encodeURIComponent(phone)}`),

  // ---- contributions ----
  submitContribution: (data) => post('/contributions', data),           // JSON (text only)
  submitContributionWithAudio: (formData) => post('/contributions', formData), // multipart (voice)

  // ---- listening / reviews ----
  pendingClip: (language) => get(`/clips?language=${encodeURIComponent(language)}`),
  submitReview: (data) => post('/reviews', data),

  // ---- public data ----
  leaderboard: () => get('/leaderboard'),
  states: () => get('/states')
};
