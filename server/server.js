// ============================================================
// Nuji backend — Express API server (port 4000)
// Run with:  npm run server
// ============================================================
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import {
  getDB, save, findUser, createUser, normalizePhone, POINT_RULES,
  levelInfo, totalSubs, BADGES, earnedBadges, activityPayload, bumpDay,
  rankOf, topLanguage, STATE_ZONES
} from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ---------- voice recording uploads ----------
const UPLOAD_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.webm`)
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });
app.use('/uploads', express.static(UPLOAD_DIR));

// ================= AUTH / PROFILE =================

// Check a phone number; creates the account if new
app.post('/api/auth/phone', (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  const existing = findUser(phone);
  const user = existing || createUser(phone);
  res.json({ exists: !!existing, phone: user.phone, hasProfile: !!user.state });
});

// Create / update the contributor profile
app.post('/api/profile', (req, res) => {
  const { phone, nickname, state, lga, age, gender, languages, contribution, ref } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  const user = createUser(phone);

  Object.assign(user, {
    nickname: nickname || '',
    state: state || '',
    lga: lga || '',
    age: age || '',
    gender: gender || '',
    languages: languages || [],
    contributionLang: contribution || user.contributionLang
  });
  if (user.languages.length) {
    for (const l of user.languages) user.langCounts[l] = user.langCounts[l] || 0;
  }

  // referral: +10 points to the referrer, once
  if (ref && !user.referredBy) {
    const referrer = Object.values(getDB().users).find(u => u.refCode === ref);
    if (referrer && referrer.phone !== user.phone) {
      user.referredBy = ref;
      referrer.referrals += 1;
      referrer.points += POINT_RULES.referral;
    }
  }

  save();
  res.json(profilePayload(user));
});

// Full profile payload used by the Profile page
app.get('/api/profile/:phone', (req, res) => {
  const user = findUser(req.params.phone);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(profilePayload(user));
});

function profilePayload(user) {
  const act = activityPayload(user);
  const earned = earnedBadges(user);
  return {
    phone: user.phone,
    nickname: user.nickname,
    state: user.state,
    lga: user.lga,
    points: user.points,
    rank: rankOf(user.phone),
    submissions: totalSubs(user),
    reviews: user.reviews,
    ...levelInfo(user.points),
    streak: user.streak,
    overview: [
      { icon: 'total', number: totalSubs(user), label: 'Total' },
      { icon: 'text', number: user.subs.text, label: 'Text Only' },
      { icon: 'voice', number: user.subs.voice, label: 'Voice Only' },
      { icon: 'both', number: user.subs.both, label: 'Text + Voice' },
      { icon: 'mix', number: user.subs.mix, label: 'Code-switched' },
      { icon: 'reviews', number: user.reviews, label: 'Reviews Done' }
    ],
    breakdown: [
      { label: 'Text only', count: user.subs.text, rate: POINT_RULES.text },
      { label: 'Voice only', count: user.subs.voice, rate: POINT_RULES.voice },
      { label: 'Text + Voice', count: user.subs.both, rate: POINT_RULES.both }
    ],
    activityCells: act.cells,
    activityMonths: act.months,
    badges: BADGES.map(b => ({ ...b, earned: earned.includes(b.name) })),
    badgesEarned: earned.length,
    badgesTotal: BADGES.length,
    referral: {
      url: `https://nuji-test.netlify.app?ref=${user.refCode}`,
      refCode: user.refCode,
      joined: user.referrals,
      points: user.referrals * POINT_RULES.referral
    }
  };
}

// ================= CONTRIBUTIONS =================

// Accepts JSON (text only) or multipart with an "audio" file (voice / both)
app.post('/api/contributions', upload.single('audio'), (req, res) => {
  const body = { ...req.body, ...(req.body.data ? JSON.parse(req.body.data) : {}) };
  const { phone, language, text, translation, langs = [], formality, prompt } = body;

  const hasText = !!String(text || '').trim();
  const hasVoice = !!req.file;
  if (!hasText && !hasVoice) return res.status(400).json({ error: 'Nothing to submit' });

  const mix = (langs || []).length >= 2;
  const earned = (hasText && hasVoice ? POINT_RULES.both : hasVoice ? POINT_RULES.voice : POINT_RULES.text) + (mix ? POINT_RULES.mix : 0);

  let user = null;
  if (phone) {
    user = createUser(phone);
    user.points += earned;
    if (hasText && hasVoice) user.subs.both += 1;
    else if (hasVoice) user.subs.voice += 1;
    else user.subs.text += 1;
    if (mix) user.subs.mix += 1;
    for (const l of (langs.length ? langs : [language])) user.langCounts[l] = (user.langCounts[l] || 0) + 1;
    bumpDay(user);
  }

  const contribution = {
    id: crypto.randomUUID(),
    phone: phone || null,
    language,
    prompt: prompt || '',
    text: text || '',
    translation: translation || '',
    langs,
    formality: formality || 'Normal',
    audioUrl: req.file ? `/uploads/${req.file.filename}` : null,
    points: earned,
    reviews: [],
    createdAt: new Date().toISOString()
  };
  getDB().contributions.push(contribution);
  save();

  res.json({ ok: true, earned, totalPoints: user ? user.points : earned, contributionId: contribution.id });
});

// ================= LISTEN / REVIEWS =================

// A clip awaiting review: has audio, fewer than 3 reviews
app.get('/api/clips', (req, res) => {
  const language = req.query.language;
  const db = getDB();
  const clip = [...db.contributions]
    .reverse()
    .find(c => c.audioUrl && c.language === language && c.reviews.length < 3 && c.phone !== normalizePhone(req.query.phone));
  if (!clip) return res.json(null);
  res.json({ id: clip.id, audioUrl: clip.audioUrl, prompt: clip.prompt || clip.text });
});

app.post('/api/reviews', (req, res) => {
  const { phone, clipId, decision } = req.body;
  const db = getDB();
  const clip = db.contributions.find(c => c.id === clipId);
  if (!clip) return res.status(404).json({ error: 'Clip not found' });

  clip.reviews.push({ phone: phone || null, decision, at: new Date().toISOString() });

  let user = null;
  if (phone) {
    user = createUser(phone);
    user.reviews += 1;
    user.points += POINT_RULES.review;
    bumpDay(user);
  }
  save();
  res.json({ ok: true, earned: POINT_RULES.review, totalPoints: user ? user.points : POINT_RULES.review });
});

// ================= PUBLIC DATA =================

app.get('/api/leaderboard', (req, res) => {
  const rows = Object.values(getDB().users)
    .filter(u => totalSubs(u) > 0)
    .sort((a, b) => b.points - a.points)
    .slice(0, 10)
    .map(u => [u.nickname || 'Anonymous', topLanguage(u), totalSubs(u).toLocaleString()]);
  res.json(rows);
});

app.get('/api/states', (req, res) => {
  const agg = {};
  for (const u of Object.values(getDB().users)) {
    if (!u.state) continue;
    const s = agg[u.state] = agg[u.state] || { name: u.state, zone: STATE_ZONES[u.state] || '—', points: 0, contributors: 0, submissions: 0 };
    s.points += u.points;
    s.contributors += 1;
    s.submissions += totalSubs(u);
  }
  res.json(Object.values(agg));
});

// ================= START =================
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Nuji API running on http://localhost:${PORT}`));
