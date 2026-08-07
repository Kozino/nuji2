// ============================================================
// Nuji backend database — simple JSON file storage (no setup)
// ============================================================
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'db.json');

const today = () => new Date().toISOString().slice(0, 10);

function blankUser(phone) {
  return {
    phone,
    nickname: '',
    state: '',
    lga: '',
    age: '',
    gender: '',
    languages: [],
    contributionLang: 'Igbo',
    createdAt: new Date().toISOString(),
    refCode: 'NJ' + phone.replace(/\D/g, '').slice(-6),
    referredBy: null,
    referrals: 0,
    points: 0,
    subs: { text: 0, voice: 0, both: 0, mix: 0 },
    langCounts: {},
    reviews: 0,
    days: {},          // { '2026-08-07': 2 } contribution counts per day
    streak: 0,
    bestStreak: 0,
    lastDay: null,
    earlyBird: false
  };
}

// ---------- seed demo data so the site looks alive on first run ----------
function seed() {
  const mk = (phone, nickname, state, points, subs, reviews, lang) => {
    const u = blankUser(phone);
    u.nickname = nickname; u.state = state; u.points = points; u.subs = subs;
    u.reviews = reviews; u.earlyBird = true; u.bestStreak = 14; u.streak = 1;
    u.lastDay = today(); u.days = { [today()]: 1 };
    u.langCounts[lang] = (subs.text + subs.voice + subs.both);
    u.contributionLang = lang;
    return u;
  };
  const users = {};
  const list = [
    ['08011110001', 'Amina Yusuf', 'Kano', 1240, { text: 300, voice: 210, both: 180, mix: 40 }, 220, 'Hausa'],
    ['08011110002', 'Chiamaka Okoro', 'Anambra', 1126, { text: 280, voice: 190, both: 170, mix: 35 }, 205, 'Igbo'],
    ['08011110003', 'Tunde Adeyemi', 'Oyo', 978, { text: 250, voice: 160, both: 150, mix: 28 }, 180, 'Yoruba'],
    ['08011110004', 'Blessing James', 'Rivers', 842, { text: 210, voice: 140, both: 130, mix: 22 }, 150, 'Pidgin'],
    ['08011110005', 'Sani Garba', 'Kaduna', 770, { text: 190, voice: 130, both: 120, mix: 18 }, 130, 'Hausa']
  ];
  for (const [p, n, s, pts, subs, rev, lang] of list) users[p] = mk(p, n, s, pts, subs, rev, lang);
  return { users, contributions: [], reviews: [] };
}

let db;
try {
  db = JSON.parse(fs.readFileSync(DB_PATH, 'utf8'));
} catch {
  db = seed();
  save();
}

export function save() {
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2));
}

export const getDB = () => db;

export const findUser = (phone) => db.users[normalizePhone(phone)] || null;

export const normalizePhone = (phone) => String(phone || '').replace(/\s/g, '');

export function createUser(phone) {
  const p = normalizePhone(phone);
  if (!db.users[p]) { db.users[p] = blankUser(p); save(); }
  return db.users[p];
}

// ---------------- scoring / levels ----------------
export const POINT_RULES = { text: 3, voice: 5, both: 8, mix: 3, review: 1, referral: 10 };

const LEVELS = [
  [0, 'New Voice'],
  [50, 'Contributor'],
  [150, 'Expert Contributor'],
  [400, 'Community Leader'],
  [900, 'Language Champion']
];

export function levelInfo(points) {
  let i = 0;
  for (let k = 0; k < LEVELS.length; k++) if (points >= LEVELS[k][0]) i = k;
  const current = LEVELS[i][0];
  const target = LEVELS[i + 1] ? LEVELS[i + 1][0] : LEVELS[i][0] + 500;
  return { level: LEVELS[i][1], levelProgress: points - current, levelTarget: target - current };
}

export const totalSubs = (u) => u.subs.text + u.subs.voice + u.subs.both;

// ---------------- badges ----------------
export const BADGES = [
  { category: 'Getting Started', icon: '🎙️', name: 'First Voice', desc: 'Made your first contribution', test: u => totalSubs(u) >= 1 },
  { category: 'Volume', icon: '🔥', name: 'On Fire', desc: '10 contributions submitted', test: u => totalSubs(u) >= 10 },
  { category: 'Volume', icon: '💪', name: 'Dedicated', desc: '50 contributions submitted', test: u => totalSubs(u) >= 50 },
  { category: 'Volume', icon: '🏆', name: 'Champion', desc: '100 contributions submitted', test: u => totalSubs(u) >= 100 },
  { category: 'Voice', icon: '🎤', name: 'Voice Hero', desc: '20 voice recordings submitted', test: u => (u.subs.voice + u.subs.both) >= 20 },
  { category: 'Language', icon: '🦅', name: 'Igbo Pride', desc: '20 Igbo contributions', test: u => (u.langCounts['Igbo'] || 0) >= 20 },
  { category: 'Language', icon: '⭐', name: 'Yoruba Star', desc: '20 Yoruba contributions', test: u => (u.langCounts['Yoruba'] || 0) >= 20 },
  { category: 'Language', icon: '🌙', name: 'Arewa Champion', desc: '20 Hausa contributions', test: u => (u.langCounts['Hausa'] || 0) >= 20 },
  { category: 'Language', icon: '👑', name: 'Pidgin King', desc: '20 Pidgin contributions', test: u => (u.langCounts['Pidgin'] || 0) >= 20 },
  { category: 'Code Switch', icon: '🔀', name: 'Language Mixer', desc: 'First code-switched submission', test: u => u.subs.mix >= 1 },
  { category: 'Code Switch', icon: '🌍', name: 'Multilingual Master', desc: 'Code-switched in 3+ languages', test: u => Object.keys(u.langCounts).length >= 3 },
  { category: 'Streaks', icon: '📅', name: '7 Day Streak', desc: 'Contributed 7 days in a row', test: u => u.bestStreak >= 7 },
  { category: 'Streaks', icon: '⚔️', name: 'Two Week Warrior', desc: '14 day streak', test: u => u.bestStreak >= 14 },
  { category: 'Streaks', icon: '🌟', name: 'Monthly Legend', desc: 'Contributed 30 days in a row', test: u => u.bestStreak >= 30 },
  { category: 'Community', icon: '👥', name: 'Reviewer', desc: 'Reviewed 10 submissions', test: u => u.reviews >= 10 },
  { category: 'Community', icon: '🧓', name: 'Elder', desc: 'Reviewed 50 submissions', test: u => u.reviews >= 50 },
  { category: 'Community', icon: '🤝', name: 'Village Champion', desc: 'Referred 5 contributors', test: u => u.referrals >= 5 },
  { category: 'Points', icon: '⭐', name: 'Top Scorer', desc: 'Earned 100 points', test: u => u.points >= 100 },
  { category: 'Special', icon: '🐦', name: 'Early Bird', desc: 'One of the first 100 contributors', test: u => !!u.earlyBird }
];

export const earnedBadges = (u) => BADGES.filter(b => b.test(u)).map(b => b.name);

// ---------------- activity grid (GitHub style) ----------------
const dayLevel = (count) => (count <= 0 ? 0 : count === 1 ? 1 : count <= 3 ? 2 : count <= 6 ? 3 : 4);

export function activityPayload(u) {
  const cells = [];
  const months = [];
  const now = new Date();
  // start 52 weeks ago, aligned to a 7-day column cycle
  const start = new Date(now);
  start.setDate(start.getDate() - 370);
  for (let i = 0; i <= 370; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    if (i % 7 === 0) months.push(d.toLocaleString('en', { month: 'narrow' }));
    cells.push(dayLevel(u.days[key] || 0));
  }
  return { cells, months: months.slice(0, 12) };
}

// ---------------- streaks ----------------
export function bumpDay(u) {
  const t = today();
  u.days[t] = (u.days[t] || 0) + 1;
  if (u.lastDay === t) return;
  const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
  u.streak = u.lastDay === yesterday.toISOString().slice(0, 10) ? u.streak + 1 : 1;
  u.bestStreak = Math.max(u.bestStreak, u.streak);
  u.lastDay = t;
}

// ---------------- ranking ----------------
export function rankOf(phone) {
  const sorted = Object.values(db.users).sort((a, b) => b.points - a.points);
  return sorted.findIndex(u => u.phone === normalizePhone(phone)) + 1 || 1;
}

export function topLanguage(u) {
  const entries = Object.entries(u.langCounts);
  if (!entries.length) return u.contributionLang || 'Igbo';
  return entries.sort((a, b) => b[1] - a[1])[0][0];
}

// ---------------- state zones ----------------
export const STATE_ZONES = {
  'Abia': 'South East', 'Anambra': 'South East', 'Ebonyi': 'South East', 'Enugu': 'South East', 'Imo': 'South East',
  'Ekiti': 'South West', 'Lagos': 'South West', 'Ogun': 'South West', 'Ondo': 'South West', 'Osun': 'South West', 'Oyo': 'South West',
  'Akwa Ibom': 'South South', 'Bayelsa': 'South South', 'Cross River': 'South South', 'Delta': 'South South', 'Edo': 'South South', 'Rivers': 'South South',
  'Benue': 'North Central', 'FCT': 'North Central', 'Kogi': 'North Central', 'Kwara': 'North Central', 'Nasarawa': 'North Central', 'Niger': 'North Central', 'Plateau': 'North Central',
  'Adamawa': 'North East', 'Bauchi': 'North East', 'Borno': 'North East', 'Gombe': 'North East', 'Taraba': 'North East', 'Yobe': 'North East',
  'Jigawa': 'North West', 'Kaduna': 'North West', 'Kano': 'North West', 'Katsina': 'North West', 'Kebbi': 'North West', 'Sokoto': 'North West', 'Zamfara': 'North West'
};
