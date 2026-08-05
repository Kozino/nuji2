import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  ArrowRight, Check, ChevronDown, CircleHelp, Headphones, LockKeyhole, Mail, Menu, Mic,
  Pause, Play, RotateCcw, SkipForward, Trophy, Volume2, X
} from 'lucide-react';
import './styles.css';

const languages = [
  { name: 'Igbo', native: 'Asụsụ Igbo', sample: 'Kedu ka ị dị taa?', color: 'berry' },
  { name: 'Yoruba', native: 'Èdè Yorùbá', sample: 'Bawo ni ọjọ́ rẹ?', color: 'gold' },
  { name: 'Hausa', native: 'Harshen Hausa', sample: 'Yaya ake yi yau?', color: 'green' },
  { name: 'Pidgin', native: 'Naija Pidgin', sample: 'How you dey today?', color: 'coral' },
];

const ranks = [
  ['Amina Yusuf', 'Hausa', '1,240'],
  ['Chiamaka Okoro', 'Igbo', '1,126'],
  ['Tunde Adeyemi', 'Yoruba', '978'],
  ['Blessing James', 'Pidgin', '842'],
  ['Sani Garba', 'Hausa', '770'],
];

function App() {
  const routeMap = { '/': 'home', '/about': 'about', '/contribute': 'join', '/speak': 'contribute', '/listen': 'listen', '/leaderboard': 'leaderboard', '/admin': 'admin' };
  const pathMap = { home: '/', about: '/about', join: '/contribute', contribute: '/speak', listen: '/listen', leaderboard: '/leaderboard', admin: '/admin' };
  const [page, setPage] = useState(() => routeMap[window.location.pathname] || 'home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [language, setLanguage] = useState(languages[0]);
  const navigate = (next) => { const path = pathMap[next] || '/'; window.history.pushState({}, '', path); setPage(next); setMenuOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  useEffect(() => { const onPop = () => setPage(routeMap[window.location.pathname] || 'home'); window.addEventListener('popstate', onPop); return () => window.removeEventListener('popstate', onPop); }, []);
  useEffect(() => { document.title = `Nuji — ${page === 'home' ? 'Voices build the future' : page[0].toUpperCase() + page.slice(1)}`; }, [page]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">Skip to main content</a>
      <Nav page={page} menuOpen={menuOpen} setMenuOpen={setMenuOpen} navigate={navigate} />
      <main id="main">
        {page === 'home' && <Home navigate={navigate} language={language} setLanguage={setLanguage} />}
        {page === 'about' && <About navigate={navigate} />}
        {page === 'join' && <Join navigate={navigate} language={language} setLanguage={setLanguage} />}
        {page === 'contribute' && <Contribute language={language} setLanguage={setLanguage} />}
        {page === 'listen' && <Listen language={language} setLanguage={setLanguage} />}
        {page === 'leaderboard' && <Leaderboard />}
        {page === 'admin' && <Admin />}
      </main>
      <Footer navigate={navigate} />
    </div>
  );
}

function Nav({ page, menuOpen, setMenuOpen, navigate }) {
  const links = [['home', 'Home'], ['about', 'About'], ['join', 'Contribute'], ['listen', 'Listen'], ['leaderboard', 'Leaderboard'], ['admin', 'Admin']];
  return <>
    <header className="nav-wrap">
      <nav className="nav container" aria-label="Main navigation">
        <button className="brand" onClick={() => navigate('home')} aria-label="Nuji home"><img className="brand-logo" src="/assets/nuji-logo.png" alt=""/><span>nuji</span></button>
        <div className="nav-links">
          {links.map(([key,label]) => <button key={key} className={page === key ? 'nav-link active' : 'nav-link'} onClick={() => navigate(key)}>{label}</button>)}
        </div>
        <div className="nav-actions">
          <button className="language-nav"><span className="dot"/> Igbo <ChevronDown size={16}/></button>
          <button className="btn btn-primary nav-cta" onClick={() => navigate('join')}>Contribute <ArrowRight size={16}/></button>
          <button className="menu-btn" aria-label="Open menu" aria-expanded={menuOpen} onClick={() => setMenuOpen(true)}><Menu size={23}/></button>
        </div>
      </nav>
    </header>
    <div className={menuOpen ? 'mobile-menu open' : 'mobile-menu'} aria-hidden={!menuOpen}>
      <div className="mobile-menu-top"><button className="brand" onClick={() => navigate('home')}><img className="brand-logo" src="/assets/nuji-logo.png" alt=""/><span>nuji</span></button><button className="icon-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X/></button></div>
      <div className="mobile-links">{links.map(([key,label], i) => <button key={key} onClick={() => navigate(key)}><span>0{i + 1}</span>{label}<ArrowRight size={18}/></button>)}</div>
      <button className="btn btn-primary mobile-cta" onClick={() => navigate('join')}>Start contributing <ArrowRight size={17}/></button>
    </div>
  </>;
}

function Home({ navigate, language, setLanguage }) {
  return <>
    <section className="hero wave-bg">
      <div className="container hero-grid">
        <div className="hero-copy">
          <div className="eyebrow"><span className="pulse-dot"/> Made with voices across Nigeria</div>
          <h1>Technology that <em>understands</em> home.</h1>
          <p>Help build voice data in the languages Nigerians actually use — at the market, with family, and everywhere in between.</p>
          <div className="hero-actions"><button className="btn btn-coral" onClick={() => navigate('contribute')}>Add your voice <ArrowRight size={18}/></button><button className="text-action" onClick={() => navigate('leaderboard')}>See community progress <ArrowRight size={17}/></button></div>
          <div className="hero-note"><span className="avatars"><i>A</i><i>C</i><i>T</i></span><span>Join people making language visible.</span></div>
        </div>
        <div className="sound-stage" aria-label="Example recording contribution">
          <div className="stage-orbit orbit-one"></div><div className="stage-orbit orbit-two"></div>
          <div className="record-card">
            <div className="record-top"><span className="language-badge"><span className="dot berry"/> Igbo</span><span className="record-status"><i/> Recording</span></div>
            <p className="record-sentence">“Kedu ka ị dị taa?”</p>
            <div className="waveform" aria-hidden="true">{Array.from({length: 29}, (_,i) => <b key={i} style={{height: `${18 + Math.abs(Math.sin(i * .72))*49}px`}}/>)}</div>
            <div className="record-bottom"><span>00:09</span><button className="round-play" aria-label="Pause recording"><Pause size={18} fill="currentColor"/></button><span>00:19</span></div>
          </div>
          <div className="floating-stat"><strong>4</strong><span>languages<br/>and growing</span></div>
          <div className="sound-ring">voice<br/>matters</div>
        </div>
      </div>
      <div className="hero-ticker"><span>Igbo</span><b/> <span>Yoruba</span><b/> <span>Hausa</span><b/> <span>Pidgin</span><b/> <span>Everyday Nigerian voices</span></div>
    </section>

    <section className="section intro-section">
      <div className="container split-head"><div><div className="eyebrow ink">A shared voice library</div><h2>Language lives in the way we speak.</h2></div><p>Nuji is a free, open platform where everyday speakers create the data that makes technology more useful to their communities.</p></div>
      <div className="container stat-grid"><Stat number="4" label="Languages represented" accent="berry"/><Stat number="200M+" label="People this work speaks for" accent="gold"/><Stat number="Open" label="Community-led and accessible" accent="green"/></div>
    </section>

    <section className="section language-section layered-surface">
      <div className="container"><div className="section-heading"><div><div className="eyebrow">Choose a language</div><h2>Start with the words you know.</h2></div><p>Every phrase helps make the next interaction feel a little more familiar.</p></div>
      <div className="language-grid">{languages.map(lang => <button className={`language-card ${lang.color}`} onClick={() => {setLanguage(lang);navigate('join')}} key={lang.name}><div className="lang-card-top"><span>{lang.name}</span><ArrowRight size={20}/></div><div className="lang-native">{lang.native}</div><p>“{lang.sample.replace(/[“”]/g,'')}”</p><div className="card-lines"/></button>)}</div></div>
    </section>

    <section className="section contribution-section">
      <div className="container"><div className="contribute-heading"><div className="eyebrow ink">Three ways to help</div><h2>Small moments. <em>Real</em> impact.</h2></div><div className="path-grid">
        <Path icon={<Mic/>} number="01" title="Speak a sentence" text="Read short prompts aloud in the language you use every day." cta="Start speaking" action={() => navigate('join')} tone="coral"/>
        <Path icon={<Headphones/>} number="02" title="Listen and validate" text="Help make sure recordings sound natural and clear." cta="Start listening" action={() => navigate('listen')} tone="indigo"/>
        <Path icon={<Volume2/>} number="03" title="Build the archive" text="Each contribution protects the way our communities speak." cta="See progress" action={() => navigate('leaderboard')} tone="green"/>
      </div></div>
    </section>

    <section className="section culture-section">
      <div className="container culture-grid"><div className="culture-visual"><div className="photo-block photo-main"/><div className="photo-block photo-small"/><div className="culture-stamp">OUR LANGUAGE<br/>IS OUR STORY</div></div><div className="culture-copy"><div className="eyebrow">Rooted in culture</div><h2>Not textbook language. <em>Life</em> as it is spoken.</h2><p>From Lagos to Kano and Enugu, everyday voices carry expressions, humour, memory, and place. Nuji gives those voices a place in the technologies being built now.</p><button className="text-action" onClick={() => navigate('join')}>Contribute a sentence <ArrowRight size={17}/></button></div></div>
    </section>

    <section className="final-cta"><div className="container final-inner"><div><div className="eyebrow">Your turn</div><h2>Your voice belongs<br/>in the dataset.</h2></div><button className="btn btn-light" onClick={() => navigate('join')}>Contribute now <ArrowRight size={18}/></button></div></section>
  </>;
}

function About({ navigate }) {
  const privacy = ['Your voice recordings are used only to train Nigerian language AI models', 'We never sell your data to third parties', 'You can choose to contribute anonymously — no real name required', 'Only your state and age range are collected — no personal details', 'The resulting AI models will be open and accessible to all Nigerians'];
  const steps = [['01','You contribute','You respond to everyday prompts in your natural language — Igbo, Yoruba, Hausa, Pidgin, or any mix. Speak, type, or both.'],['02','Community verifies','Other contributors listen and verify your recording sounds natural. This peer review ensures high quality data.'],['03','Data trains AI','Verified contributions are used to fine-tune language models that understand real Nigerian speech — not textbook language.']];
  return <section className="about-page"><section className="about-hero wave-bg"><div className="container about-hero-grid"><div><div className="eyebrow">About Nuji</div><h1>Technology that speaks<br/><em>your language.</em></h1><p>Why should AI only work for a few of the world's languages? Our language is our story, our community, our culture. Nuji is building the datasets we want to see in the world.</p><button className="btn btn-coral" onClick={()=>navigate('join')}>Start contributing <ArrowRight size={18}/></button></div><div className="about-mark"><img src="/assets/nuji-logo.png" alt="Nuji — Voices. Culture. Future."/><span>VOICES · CULTURE · FUTURE</span></div></div></section><section className="section"><div className="container reading-section"><div className="eyebrow ink">The problem</div><h2>Language should not be a barrier to being <em>understood.</em></h2><div className="reading-copy"><p>Over 200 million Nigerians speak Igbo, Yoruba, Hausa, and Pidgin every single day. Yet when they try to use AI assistants, those tools barely understand them — because they were trained almost entirely on English and a handful of other languages.</p><p>The data used by big AI companies doesn't include the way Nigerians actually speak — the code-switching, the street talk, the market language, the informal everyday conversations that make our languages alive. That's the gap Nuji is filling.</p></div></div></section><section className="section how-section"><div className="container"><div className="section-heading"><div><div className="eyebrow">How it works</div><h2>Built by voices.<br/>Checked by community.</h2></div></div><div className="how-grid">{steps.map(([n,title,text])=><article key={n}><span>{n}</span><h3>{title}</h3><p>{text}</p></article>)}</div></div></section><section className="section"><div className="container"><div className="section-heading"><div><div className="eyebrow ink">The languages</div><h2>Starting at home.<br/><em>Growing from there.</em></h2></div><p>We're starting with Nigeria's four most widely spoken languages — and expanding from there.</p></div><div className="about-language-grid">{languages.map(l=><div className={`about-language ${l.color}`} key={l.name}><b>{l.name}</b><span>{l.name==='Igbo'?'44M+':l.name==='Yoruba'?'45M+':l.name==='Hausa'?'63M+':'75M+'} speakers</span></div>)}</div></div></section><section className="section data-section"><div className="container data-grid"><div><div className="eyebrow">Your data, used responsibly</div><h2>Good data begins with <em>trust.</em></h2></div><ul>{privacy.map(item=><li key={item}><span><Check size={16}/></span>{item}</li>)}</ul></div></section><section className="section founder-section"><div className="container founder-card"><div className="founder-seal">N</div><div><div className="eyebrow">Who is building Nuji?</div><h2>A Nigerian founder<br/>building what should <em>exist.</em></h2><p>Nuji is built by a Nigerian who speaks Igbo, Yoruba, Pidgin and French — and understands firsthand what it means to be left out of the AI revolution. This is not an academic project. This is infrastructure for 200 million people who deserve AI that speaks their language.</p></div></div></section><section className="final-cta"><div className="container final-inner"><div><div className="eyebrow">Ready to contribute?</div><h2>Every voice brings<br/>us one step closer.</h2><p>Every sentence you speak or type brings Nigerian language AI one step closer to reality.</p></div><button className="btn btn-light" onClick={()=>navigate('join')}>Start Contributing <ArrowRight size={18}/></button></div><p className="about-signoff">Built for the people. Powered by their voice. 🇳🇬</p></section></section>;
}

function Admin() {
  const [showPassword, setShowPassword] = useState(false);
  return <section className="admin-page"><div className="admin-shell"><div className="admin-aside"><img src="/assets/nuji-logo.png" alt="Nuji"/><div><div className="eyebrow">Nuji operations</div><h1>Keep every voice<br/><em>moving forward.</em></h1><p>Secure access for Nuji dataset administrators and community operations teams.</p></div><span>© 2026 Nuji · Internal platform</span></div><div className="admin-login"><div className="admin-mobile-logo"><img src="/assets/nuji-logo.png" alt="Nuji"/></div><div className="admin-copy"><div className="eyebrow ink">Admin portal</div><h2>Welcome back.</h2><p>Sign in to manage contributions and community quality.</p></div><form onSubmit={e=>e.preventDefault()}><Field label="Work email"><span className="input-icon"><Mail size={18}/><input type="email" placeholder="you@nuji.ng" required/></span></Field><Field label="Password"><span className="input-icon"><LockKeyhole size={18}/><input type={showPassword?'text':'password'} placeholder="Enter your password" required/><button type="button" onClick={()=>setShowPassword(!showPassword)}>{showPassword?'Hide':'Show'}</button></span></Field><div className="admin-options"><label><input type="checkbox"/> Remember me</label><button type="button">Forgot password?</button></div><button type="submit" className="btn btn-primary admin-submit">Sign in to admin <ArrowRight size={17}/></button></form><div className="admin-security"><LockKeyhole size={15}/><span>Protected access · Authorized Nuji team members only</span></div></div></div></section>;
}

function Join({ navigate, language, setLanguage }) {
  const [step, setStep] = useState('phone');
  const [phone, setPhone] = useState('');
  const [profile, setProfile] = useState({ nickname:'', state:'', lga:'', age:'', gender:'', languages:[], contribution:language.name });
  const update = (key, value) => setProfile(p => ({...p, [key]: value}));
  const toggleLanguage = (name) => setProfile(p => ({...p, languages:p.languages.includes(name) ? p.languages.filter(x=>x!==name) : [...p.languages, name]}));
  if(step === 'choose') return <section className="join-page"><div className="join-container choice-screen"><button className="back-link" onClick={()=>setStep('phone')}>← Back</button><div className="join-heading"><div className="eyebrow">Start contributing</div><h1>How do you want<br/>to <em>contribute?</em></h1><p>Choose how you'd like to get started today.</p></div><div className="entry-choice-grid"><button className="entry-choice quick" onClick={()=>navigate('contribute')}><div className="choice-top"><span className="choice-icon"><Mic/></span><span className="choice-badge">Fastest</span></div><h2>Quick Contribute</h2><p>Just 3 quick questions — no account needed. Start contributing in under 30 seconds.</p><span className="choice-action">Start now <ArrowRight size={17}/></span></button><button className="entry-choice profile" onClick={()=>setStep('profile')}><div className="choice-top"><span className="choice-icon"><Trophy/></span><span className="choice-badge">Track Points</span></div><h2>Create Profile</h2><p>Save your profile, earn points, and climb the leaderboard. Takes 2 minutes.</p><span className="choice-action">Set up profile <ArrowRight size={17}/></span></button></div></div></section>;
  if(step === 'profile') return <section className="join-page"><div className="profile-container"><button className="back-link" onClick={()=>setStep('choose')}>← Back to options</button><div className="form-heading"><div className="eyebrow">Profile setup · 1 of 1</div><h1>Tell us about <em>yourself.</em></h1><p>This helps tag your dialect correctly — making your data more valuable.</p></div><form className="profile-form" onSubmit={e=>{e.preventDefault();navigate('contribute')}}><Field label="Nickname (optional)"><input value={profile.nickname} onChange={e=>update('nickname',e.target.value)} placeholder="e.g. Chukwuemeka or stay anonymous"/></Field><div className="form-pair"><Field label="State of Origin *"><select value={profile.state} onChange={e=>update('state',e.target.value)} required><option value="">Select your state</option><option>Lagos</option><option>Enugu</option><option>Kano</option><option>Oyo</option><option>Rivers</option></select></Field><Field label="LGA *"><select value={profile.lga} onChange={e=>update('lga',e.target.value)} required disabled={!profile.state}><option value="">{profile.state?'Select your LGA':'Select state first'}</option><option>Central</option><option>East</option><option>West</option></select></Field></div><div className="form-pair"><Field label="Age Range *"><select value={profile.age} onChange={e=>update('age',e.target.value)} required><option value="">Select age range</option><option>18–24</option><option>25–34</option><option>35–44</option><option>45+</option></select></Field><Field label="Gender *"><div className="gender-options">{['Male','Female','Prefer not to say'].map(g=><label key={g}><input type="radio" name="gender" value={g} checked={profile.gender===g} onChange={e=>update('gender',e.target.value)} required/><span>{g}</span></label>)}</div></Field></div><p className="form-note">Helps ensure our dataset represents all Nigerians equally 🇳🇬</p><Field label="Languages spoken at home *"><div className="checkbox-grid">{languages.map(l=><label key={l.name}><input type="checkbox" checked={profile.languages.includes(l.name)} onChange={()=>toggleLanguage(l.name)}/><span>{l.name}</span></label>)}</div></Field><Field label="Contributing today in *"><select value={profile.contribution} onChange={e=>{update('contribution',e.target.value);setLanguage(languages.find(l=>l.name===e.target.value))} } required>{languages.map(l=><option key={l.name}>{l.name}</option>)}</select></Field><Field label="Phone number"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="02200000" inputMode="tel"/><small>Used to recognise you on future visits. No OTP needed.</small></Field><button className="btn btn-coral profile-submit" type="submit">Create Profile & Start <ArrowRight size={18}/></button><p className="required-note">Fields marked * help us tag your dialect correctly.</p></form></div></section>;
  return <section className="join-page"><div className="join-container phone-layout"><div className="phone-card"><div className="eyebrow">Contribute to Nuji</div><h1>Welcome back <span>👋</span></h1><p>Enter your phone number to continue. New here? We'll set you up in seconds.</p><form onSubmit={e=>{e.preventDefault();setStep('choose')}}><Field label="Phone Number"><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="080 0000 0000" inputMode="tel" required/></Field><button className="btn btn-coral phone-submit" type="submit">Continue <ArrowRight size={18}/></button></form><div className="phone-key"><span>🔑</span><div><b>Your phone number is your key</b><small>No password, no long process.</small></div></div></div><div className="trust-panel"><div className="trust-mark"><img src="/assets/nuji-logo.png" alt="Nuji"/></div><div className="trust-list"><Trust icon="🔒" title="No password" text="Just your phone number"/><Trust icon="⚡" title="Instant access" text="Returning users skip setup"/><Trust icon="🏆" title="Track points" text="See your rank & progress"/><Trust icon="🇳🇬" title="Your data" text="Helping 200M+ Nigerians"/></div></div></div></section>;
}

function Field({label, children}) { return <label className="form-field"><span>{label}</span>{children}</label> }
function Trust({icon,title,text}) { return <div className="trust-item"><span>{icon}</span><div><b>{title}</b><small>{text}</small></div></div> }

function Contribute({ language, setLanguage }) {
  const [stage, setStage] = useState('prepare');
  const [time, setTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [count, setCount] = useState(3);
  useEffect(() => { if(stage !== 'recording') return; const id = setInterval(() => setTime(t => t + 1), 1000); return () => clearInterval(id); }, [stage]);
  const begin = () => {setTime(0);setStage('recording')};
  const stop = () => setStage('review');
  const next = () => {setCount(c => c + 1);setTime(0);setStage('prepare')};
  const fmt = (n) => `00:${String(n).padStart(2,'0')}`;
  return <section className="task-page wave-bg slim-wave"><div className="container task-layout">
    <aside className="task-aside"><div className="eyebrow ink">Contribute</div><h1>Speak a little<br/><em>closer to home.</em></h1><p>Read each sentence naturally. Every clear recording makes the collection stronger.</p><div className="task-aside-card"><span>Language</span><LanguageSelect language={language} setLanguage={setLanguage}/><div className="mini-progress"><div><span>Today’s goal</span><b>{count}/10 sentences</b></div><div className="progress-track"><i style={{width: `${count*10}%`}}/></div></div></div><div className="aside-tip"><CircleHelp size={18}/><span>Find a quiet spot and speak at a comfortable pace.</span></div></aside>
    <div className="task-main"><Stepper stage={stage}/><div className="task-card">
      <div className="task-card-head"><span className="language-badge"><span className={`dot ${language.color}`}/> {language.name}</span><span className="counter">Sentence {count} of 10</span></div>
      {stage === 'prepare' && <><div className="task-icon"><Mic size={27}/></div><h2>Ready when you are.</h2><p className="task-intro">We’ll ask for microphone access, then you can record this sentence in your natural voice.</p><div className="prompt-card"><span>Read this aloud</span><p>“{language.sample}”</p></div><button className="btn btn-coral task-cta" onClick={begin}>Start recording <Mic size={18}/></button><p className="task-help">Your recording is only sent when you choose submit.</p></>}
      {stage === 'recording' && <><div className="recording-header"><span className="record-status large"><i/> Recording</span><span>{fmt(time)}</span></div><div className="prompt-card active"><span>Read this aloud</span><p>“{language.sample}”</p></div><div className="big-waveform">{Array.from({length:37},(_,i)=><b key={i} style={{height:`${16+Math.abs(Math.sin(i*.8+time))*68}px`}}/>)}</div><button className="record-button" onClick={stop} aria-label="Stop recording"><span><span className="stop-square"/></span></button><p className="record-instruction">Tap when you’ve finished speaking</p></>}
      {stage === 'review' && <><div className="task-icon success"><Check size={28}/></div><h2>Have a quick listen.</h2><div className="prompt-card"><span>What you recorded</span><p>“{language.sample}”</p></div><div className="review-player"><button className="round-play dark" onClick={()=>setIsPlaying(!isPlaying)} aria-label={isPlaying?'Pause':'Play'}>{isPlaying?<Pause size={18} fill="currentColor"/>:<Play size={18} fill="currentColor"/>}</button><div className="player-line"><i style={{width:isPlaying?'66%':'24%'}}/></div><span>00:{String(Math.max(time,8)).padStart(2,'0')}</span></div><div className="review-actions"><button className="btn btn-secondary" onClick={()=>setStage('prepare')}><RotateCcw size={17}/> Record again</button><button className="btn btn-primary" onClick={()=>setStage('submitted')}>Submit recording <ArrowRight size={17}/></button></div></>}
      {stage === 'submitted' && <><div className="task-icon success"><Check size={29}/></div><h2>That sounded great.</h2><p className="task-intro">Your contribution has been added to the {language.name} collection. Thank you for making room for more voices.</p><div className="success-line"><span><Check size={15}/></span> Sentence {count} saved</div><button className="btn btn-coral task-cta" onClick={next}>Next sentence <ArrowRight size={18}/></button><button className="text-action centered" onClick={()=>setStage('prepare')}>Take a short break</button></>}
    </div></div>
  </div></section>;
}

function Listen({ language, setLanguage }) {
  const [decision, setDecision] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [clip, setClip] = useState(4);
  const next = () => {setClip(c => c+1);setDecision(null);setPlaying(false)};
  return <section className="task-page listen-page"><div className="container task-layout">
    <aside className="task-aside"><div className="eyebrow ink">Listen</div><h1>Help keep every<br/><em>voice clear.</em></h1><p>Listen to a short recording, compare it to the sentence, and make a simple call.</p><div className="task-aside-card"><span>Reviewing in</span><LanguageSelect language={language} setLanguage={setLanguage}/><div className="mini-progress"><div><span>This session</span><b>{clip}/10 clips</b></div><div className="progress-track green-track"><i style={{width:`${clip*10}%`}}/></div></div></div></aside>
    <div className="task-main"><div className="review-kicker"><span>Clip {clip} of 10</span><span>About 1 minute left</span></div><div className="task-card validation-card"><div className="task-card-head"><span className="language-badge"><span className={`dot ${language.color}`}/> {language.name}</span><span className="counter">Community review</span></div>{!decision ? <><h2>Does this recording match?</h2><div className="listen-prompt"><span>The speaker should be saying</span><p>“{language.sample}”</p></div><div className="listen-player"><button className="listen-play" onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause recording':'Play recording'}>{playing?<Pause fill="currentColor"/>:<Play fill="currentColor"/>}</button><div className="player-wave">{Array.from({length:35},(_,i)=><b key={i} style={{height:`${9+Math.abs(Math.sin(i*.55))*28}px`}}/>)}</div><span>00:12</span></div><p className="decision-label">Listen once, then choose what you heard.</p><div className="decision-grid"><button className="decision yes" onClick={()=>setDecision('yes')}><span><Check size={21}/></span><div><b>Yes, it matches</b><small>The words are clear and correct</small></div></button><button className="decision no" onClick={()=>setDecision('no')}><span><X size={20}/></span><div><b>No, it doesn’t match</b><small>The words are different or unclear</small></div></button></div><button className="skip-btn" onClick={next}>Skip this clip <SkipForward size={16}/></button></> : <><div className={`task-icon ${decision === 'yes' ? 'success' : 'neutral'}`}>{decision === 'yes' ? <Check size={29}/> : <X size={29}/>}</div><h2>{decision === 'yes' ? 'Thanks for confirming.' : 'Thanks for reviewing.'}</h2><p className="task-intro">Your review helps keep this collection useful for everyone who speaks {language.name}.</p><button className="btn btn-primary task-cta" onClick={next}>Next clip <ArrowRight size={18}/></button><button className="text-action centered" onClick={()=>setDecision(null)}>Change answer</button></>}</div></div>
  </div></section>;
}

function Leaderboard() {
  const [filter, setFilter] = useState('This month');
  return <section className="leader-page wave-bg slim-wave"><div className="container"><div className="leader-hero"><div><div className="eyebrow ink">Community progress</div><h1>Every contribution<br/>moves us <em>forward.</em></h1></div><p>A small thank-you to the people helping Nigerian languages take up the space they deserve.</p></div><div className="leader-stats"><Stat number="16,842" label="Sentences contributed" accent="coral"/><Stat number="2,418" label="Clips reviewed" accent="green"/><Stat number="4" label="Languages growing" accent="berry"/></div><div className="leader-controls"><div className="filters">{['This week','This month','All time'].map(x=><button key={x} className={filter===x?'filter active':'filter'} onClick={()=>setFilter(x)}>{x}</button>)}</div><button className="language-nav leader-lang"><span className="dot"/> All languages <ChevronDown size={16}/></button></div><div className="leaderboard-card"><div className="rank-head"><span>Rank</span><span>Contributor</span><span>Language</span><span>Contributions</span></div>{ranks.map((r,i)=><div className={`rank-row ${i<3?'top-rank':''}`} key={r[0]}><span className={`rank-num rank-${i+1}`}>{i<3?<Trophy size={18}/>:String(i+1).padStart(2,'0')}</span><span className="person"><i>{r[0].split(' ').map(x=>x[0]).join('')}</i><b>{r[0]}</b></span><span className="rank-lang"><span className="dot"/>{r[1]}</span><span className="rank-count">{r[2]}</span></div>)}</div><div className="rank-note"><span><Check size={16}/> Rankings celebrate contribution, not competition.</span><span>Updated today</span></div></div></section>;
}

function Stepper({stage}) { const items=['Prepare','Record','Review','Submit']; const step = stage==='prepare'?0:stage==='recording'?1:stage==='review'?2:3; return <div className="stepper">{items.map((x,i)=><React.Fragment key={x}><div className={i===step?'step active':i<step?'step done':'step'}><span>{i<step?<Check size={13}/>:i+1}</span><b>{x}</b></div>{i<items.length-1&&<i className={i<step?'step-line done':'step-line'}/>}</React.Fragment>)}</div>}
function LanguageSelect({language,setLanguage}) { const [open,setOpen]=useState(false); return <div className="selector-wrap"><button className="select-button" onClick={()=>setOpen(!open)}>{language.name}<ChevronDown size={16}/></button>{open&&<div className="select-menu">{languages.map(l=><button key={l.name} onClick={()=>{setLanguage(l);setOpen(false)}}><span className={`dot ${l.color}`}/>{l.name}{l.name===language.name&&<Check size={15}/>}</button>)}</div>}</div>}
function Stat({number,label,accent}) { return <div className={`stat ${accent}`}><strong>{number}</strong><span>{label}</span><i/></div>}
function Path({icon,number,title,text,cta,action,tone}) { return <article className={`path-card ${tone}`}><div className="path-top"><span className="path-icon">{icon}</span><span>{number}</span></div><h3>{title}</h3><p>{text}</p><button onClick={action}>{cta}<ArrowRight size={17}/></button></article>}
function Footer({navigate}) { return <footer className="footer"><div className="container footer-grid"><div><button className="brand footer-brand" onClick={()=>navigate('home')}><img className="brand-logo" src="/assets/nuji-logo.png" alt=""/><span>nuji</span></button><p>Language data made by the people who speak it.</p></div><div className="footer-links"><div><span>Explore</span><button onClick={()=>navigate('join')}>Contribute</button><button onClick={()=>navigate('listen')}>Listen</button><button onClick={()=>navigate('leaderboard')}>Leaderboard</button></div><div><span>Languages</span><button>Igbo</button><button>Yoruba</button><button>Hausa</button><button>Pidgin</button></div></div></div><div className="container footer-bottom"><span>© 2026 Nuji. Built for voices.</span><span>Open · Community-led · Nigerian</span></div></footer>}

createRoot(document.getElementById('root')).render(<App />);
