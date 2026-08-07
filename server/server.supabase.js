// ============================================================
// Nuji PRODUCTION backend — Supabase (Postgres + Storage)
//
//   Local test :  SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npm run start:supabase
//   Deploy     :  Render/Railway with the same two env vars
// ============================================================
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import {
  POINT_RULES, levelInfo, totalSubs, BADGES, earnedBadges,
  activityPayload, bumpDay, topLanguage, STATE_ZONES
} from './db.js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
const app = express();
app.use(cors());
app.use(express.json({ limit: '2mb' }));
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

// ---------------- helpers ----------------
const normalizePhone = (p) => String(p || '').replace(/\s/g, '');

const blankUser = (phone) => ({
  phone, nickname: '', state: '', lga: '', age: '', gender: '', languages: [],
  contributionLang: 'Igbo',
  refCode: 'NJ' + phone.replace(/\D/g, '').slice(-6),
  referredBy: null, referrals: 0, points: 0,
  subs: { text: 0, voice: 0, both: 0, mix: 0 }, langCounts: {},
  reviews: 0, days: {}, streak: 0, bestStreak: 0, lastDay: null, earlyBird: false
});

const toUser = (r) => ({
  phone: r.phone, nickname: r.nickname, state: r.state, lga: r.lga, age: r.age, gender: r.gender,
  languages: r.languages, contributionLang: r.contribution_lang, refCode: r.ref_code, referredBy: r.referred_by,
  referrals: r.referrals, points: r.points, subs: r.subs, langCounts: r.lang_counts, reviews: r.reviews,
  days: r.days, streak: r.streak, bestStreak: r.best_streak, lastDay: r.last_day, earlyBird: r.early_bird
});

const toRow = (u) => ({
  phone: u.phone, nickname: u.nickname, state: u.state, lga: u.lga, age: u.age, gender: u.gender,
  languages: u.languages, contribution_lang: u.contributionLang, ref_code: u.refCode, referred_by: u.referredBy,
  referrals: u.referrals, points: u.points, subs: u.subs, lang_counts: u.langCounts, reviews: u.reviews,
  days: u.days, streak: u.streak, best_streak: u.bestStreak, last_day: u.lastDay, early_bird: u.earlyBird
});

async function getUser(phone) {
  const { data } = await supabase.from('users').select('*').eq('phone', normalizePhone(phone)).maybeSingle();
  return data ? toUser(data) : null;
}
async function saveUser(u) {
  const { error } = await supabase.from('users').upsert(toRow(u));
  if (error) throw error;
}
async function rankOf(phone) {
  const me = await getUser(phone);
  const { count } = await supabase.from('users').select('*', { count: 'exact', head: true }).gt('points', me ? me.points : 0);
  return (count || 0) + 1;
}

// Same payload shape the frontend already understands
async function profilePayload(user) {
  const act = activityPayload(user);
  const earned = earnedBadges(user);
  return {
    phone: user.phone, nickname: user.nickname, state: user.state, lga: user.lga,
    points: user.points, rank: await rankOf(user.phone),
    submissions: totalSubs(user), reviews: user.reviews,
    ...levelInfo(user.points), streak: user.streak,
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
    activityCells: act.cells, activityMonths: act.months,
    badges: BADGES.map(b => ({ ...b, earned: earned.includes(b.name) })),
    badgesEarned: earned.length, badgesTotal: BADGES.length,
    referral: {
      url: `https://nuji-next.vercel.app?ref=${user.refCode}`,
      refCode: user.refCode, joined: user.referrals, points: user.referrals * POINT_RULES.referral
    }
  };
}

// ================= AUTH / PROFILE =================
app.post('/api/auth/phone', async (req, res) => {
  const phone = normalizePhone(req.body.phone);
  if (!phone) return res.status(400).json({ error: 'Phone required' });
  let user = await getUser(phone);
  const exists = !!user;
  if (!user) { user = blankUser(phone); await saveUser(user); }
  res.json({ exists, phone: user.phone, hasProfile: !!user.state });
});

app.post('/api/profile', async (req, res) => {
  try {
    const { phone, nickname, state, lga, age, gender, languages, contribution, ref } = req.body;
    if (!phone) return res.status(400).json({ error: 'Phone required' });
    let user = (await getUser(phone)) || blankUser(normalizePhone(phone));
    Object.assign(user, {
      nickname: nickname || '', state: state || '', lga: lga || '', age: age || '', gender: gender || '',
      languages: languages || [], contributionLang: contribution || user.contributionLang
    });
    if (ref && !user.referredBy) {
      const { data: refRow } = await supabase.from('users').select('*').eq('ref_code', ref).maybeSingle();
      if (refRow && refRow.phone !== user.phone) {
        user.referredBy = ref;
        const refUser = toUser(refRow);
        refUser.referrals += 1;
        refUser.points += POINT_RULES.referral;
        await saveUser(refUser);
      }
    }
    await saveUser(user);
    res.json(await profilePayload(user));
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/profile/:phone', async (req, res) => {
  const user = await getUser(req.params.phone);
  if (!user) return res.status(404).json({ error: 'Not found' });
  res.json(await profilePayload(user));
});

// ================= CONTRIBUTIONS =================
app.post('/api/contributions', upload.single('audio'), async (req, res) => {
  try {
    const body = { ...req.body, ...(req.body.data ? JSON.parse(req.body.data) : {}) };
    const { phone, language, text, translation, langs = [], formality, prompt } = body;
    const hasText = !!String(text || '').trim();
    const hasVoice = !!req.file;
    if (!hasText && !hasVoice) return res.status(400).json({ error: 'Nothing to submit' });

    // upload voice recording to Supabase Storage
    let audioUrl = null;
    if (req.file) {
      const path = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}.webm`;
      const { error } = await supabase.storage.from('recordings').upload(path, req.file.buffer, { contentType: req.file.mimetype || 'audio/webm' });
      if (error) throw error;
      audioUrl = supabase.storage.from('recordings').getPublicUrl(path).data.publicUrl;
    }

    const mix = (langs || []).length >= 2;
    const earned = (hasText && hasVoice ? POINT_RULES.both : hasVoice ? POINT_RULES.voice : POINT_RULES.text) + (mix ? POINT_RULES.mix : 0);

    let user = null;
    if (phone) {
      user = (await getUser(phone)) || blankUser(normalizePhone(phone));
      user.points += earned;
      if (hasText && hasVoice) user.subs.both += 1; else if (hasVoice) user.subs.voice += 1; else user.subs.text += 1;
      if (mix) user.subs.mix += 1;
      for (const l of (langs.length ? langs : [language])) user.langCounts[l] = (user.langCounts[l] || 0) + 1;
      bumpDay(user);
      await saveUser(user);
    }

    const { data, error } = await supabase.from('contributions').insert({
      phone: phone || null, language, prompt: prompt || '', text: text || '', translation: translation || '',
      langs, formality: formality || 'Normal', audio_url: audioUrl, points: earned
    }).select().single();
    if (error) throw error;

    res.json({ ok: true, earned, totalPoints: user ? user.points : earned, contributionId: data.id });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ================= LISTEN / REVIEWS =================
app.get('/api/clips', async (req, res) => {
  const language = req.query.language;
  const { data } = await supabase.from('contributions')
    .select('*').not('audio_url', 'is', null).eq('language', language)
    .order('created_at', { ascending: false }).limit(50);
  const clip = (data || []).find(c => (c.reviews || []).length < 3 && c.phone !== normalizePhone(req.query.phone));
  if (!clip) return res.json(null);
  res.json({ id: clip.id, audioUrl: clip.audio_url, prompt: clip.prompt || clip.text });
});

app.post('/api/reviews', async (req, res) => {
  try {
    const { phone, clipId, decision } = req.body;
    const { data: clip } = await supabase.from('contributions').select('*').eq('id', clipId).maybeSingle();
    if (!clip) return res.status(404).json({ error: 'Clip not found' });
    const reviews = [...(clip.reviews || []), { phone: phone || null, decision, at: new Date().toISOString() }];
    await supabase.from('contributions').update({ reviews }).eq('id', clipId);

    let user = null;
    if (phone) {
      user = (await getUser(phone)) || blankUser(normalizePhone(phone));
      user.reviews += 1;
      user.points += POINT_RULES.review;
      bumpDay(user);
      await saveUser(user);
    }
    res.json({ ok: true, earned: POINT_RULES.review, totalPoints: user ? user.points : POINT_RULES.review });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ================= PUBLIC DATA =================
app.get('/api/leaderboard', async (req, res) => {
  const { data } = await supabase.from('users').select('*').gt('points', 0).order('points', { ascending: false }).limit(10);
  res.json((data || []).map(u => {
    const user = toUser(u);
    return [user.nickname || 'Anonymous', topLanguage(user), totalSubs(user).toLocaleString()];
  }));
});

app.get('/api/states', async (req, res) => {
  const { data } = await supabase.from('users').select('*').not('state', 'is', null);
  const agg = {};
  for (const r of (data || [])) {
    const u = toUser(r);
    if (!u.state) continue;
    const s = agg[u.state] = agg[u.state] || { name: u.state, zone: STATE_ZONES[u.state] || '—', points: 0, contributors: 0, submissions: 0 };
    s.points += u.points; s.contributors += 1; s.submissions += totalSubs(u);
  }
  res.json(Object.values(agg));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => console.log(`✅ Nuji API (Supabase) on port ${PORT}`));
