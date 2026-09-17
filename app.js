/* ===================== Store ===================== */
const STORAGE_KEY = 'travelcare_state_v1';

function defaultState() {
  return {
    user: null, // {firstName,lastName,email,phone,password,dob,gender,bloodGroup,nationality,avatar}
    settings: { locationAllowed: false, notificationsAllowed: false },
    otp: { code: '123456', purpose: null },
    session: { loggedIn: false }
  };
}
function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  return defaultState();
}
const Store = {
  state: loadState(),
  save() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state)); } catch (e) {} },
  update(patch) { Object.assign(this.state, patch); this.save(); },
  updateUser(patch) { this.state.user = Object.assign({}, this.state.user || {}, patch); this.save(); },
  reset() { this.state = defaultState(); this.save(); location.hash = '#/onboarding'; render(); }
};
window.Store = Store;
window.resetDemo = () => { if (confirm('Reset all demo data (account, settings)?')) Store.reset(); };

/* ===================== Router ===================== */
function navigate(route) { location.hash = '#/' + route; }
window.navigate = navigate;

const BUILT_ROUTES = ['onboarding','login','location','create-account','otp-verification',
  'account-created','complete-profile','home','search','forget-password',
  'create-new-password','password-changed','no-internet','notification','coming-soon'];

function currentRoute() {
  const h = location.hash.replace(/^#\/?/, '');
  if (h && BUILT_ROUTES.includes(h)) return h;
  if (h) return 'coming-soon';
  return Store.state.session.loggedIn ? 'home' : 'onboarding';
}

function render() {
  const route = currentRoute();
  const screen = SCREENS[route] || SCREENS['onboarding'];
  document.getElementById('app').innerHTML = screen.template();
  if (screen.mount) screen.mount();
  window.scrollTo(0, 0);
}
window.addEventListener('hashchange', render);
window.addEventListener('DOMContentLoaded', render);

/* ===================== Helpers ===================== */
function validEmail(v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }
function digitsOnly(v) { return (v || '').replace(/\D/g, ''); }
function passwordStrength(pw) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (pw.length >= 12) score++;
  const labels = ['Very weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very strong'];
  const colors = ['#e02727', '#e17c29', '#e6c229', '#8cd35f', '#24d61b', '#008783'];
  return { score, label: labels[score], color: colors[score] };
}
function renderStrengthBars(score) {
  let bars = '';
  for (let i = 0; i < 5; i++) {
    bars += `<div class="bar" style="background:${i < score ? 'var(--teal)' : '#e5e5e5'}"></div>`;
  }
  return bars;
}

/* ===================== Screens ===================== */
const SCREENS = {};

/* ---- Onboarding ---- */
SCREENS['onboarding'] = {
  template: () => `
  <div class="screen-inner onb-wrap">
    <div class="onb-logo">🧳🩺</div>
    <div class="onb-title font-mont">Travel Care</div>
    <div class="onb-tag">
      <p>Trusted Doctors.</p><p>Transparent Prices.</p><p>Travel with Confidence.</p>
    </div>
    <div class="onb-desc">Find verified doctors and hospitals near you with clear consultation fees anytime, anywhere</div>
    <div class="onb-hero">🗺️✈️</div>
    <div class="onb-features">
      <div class="feat">Verified<br>Doctors</div><div class="div"></div>
      <div class="feat">Clear<br>Pricing</div><div class="div"></div>
      <div class="feat">Multiple<br>Languages</div>
    </div>
    <div class="onb-actions">
      <a class="btn btn-primary" onclick="navigate('location')">Get Started</a>
      <a class="btn btn-outline" onclick="navigate('login')">I already have an account</a>
    </div>
  </div>`
};

/* ---- Login ---- */
SCREENS['login'] = {
  template: () => `
  <div class="screen-inner login-wrap">
    <a class="back-btn" onclick="navigate('onboarding')">‹</a>
    <div class="login-logo">🧳🩺</div>
    <div class="login-title font-mont">Travel Care</div>
    <div class="login-sub"><span class="line"></span>Travel with Confidence<span class="line"></span></div>
    <div id="loginMsg"></div>
    <label class="field-label">Email or Phone number</label>
    <div class="field"><span class="icon">✉️</span><input id="loginEmail" class="input" type="text" placeholder="you@gmail.com"></div>
    <label class="field-label">Password</label>
    <div class="field"><span class="icon">🔒</span><input id="loginPassword" class="input" type="password" placeholder="Min. 8 characters"></div>
    <a class="forgot" onclick="navigate('forget-password')">Forget password</a>
    <div class="hint">Demo login: demo@travelcare.com / demo1234</div>
    <button id="loginBtn" class="btn btn-primary login-btn">→ Login</button>
    <div class="divider"><span class="line"></span>or continue with<span class="line"></span></div>
    <button class="btn social-btn" onclick="Store.update({session:{loggedIn:true}}); navigate('home')">🇬 Continue with Google</button>
    <button class="btn social-btn" onclick="Store.update({session:{loggedIn:true}}); navigate('home')"> Continue with Apple</button>
    <div class="signup-row">Don't have an account? <a onclick="navigate('create-account')">Sign up</a></div>
  </div>`,
  mount: () => {
    const doLogin = () => {
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const msgEl = document.getElementById('loginMsg');
      if (!email || !password) {
        msgEl.innerHTML = `<div class="form-msg err">Please enter both email/phone and password.</div>`;
        return;
      }
      const isDemo = email.toLowerCase() === 'demo@travelcare.com' && password === 'demo1234';
      const u = Store.state.user;
      const matches = u && u.email && u.email.toLowerCase() === email.toLowerCase() && u.password === password;
      if (isDemo || matches) {
        Store.update({ session: { loggedIn: true } });
        navigate('home');
      } else {
        msgEl.innerHTML = `<div class="form-msg err">Invalid email or password. Try the demo account, or sign up.</div>`;
      }
    };
    document.getElementById('loginBtn').addEventListener('click', doLogin);
    document.getElementById('loginPassword').addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
  }
};

/* ---- Location ---- */
SCREENS['location'] = {
  template: () => `
  <div class="screen-inner loc-wrap">
    <div class="loc-header"><a onclick="navigate('onboarding')">‹</a><h1>📍 Location Access</h1></div>
    <div class="loc-map">🗺️</div>
    <div class="loc-title font-mont">Allow <span>Location Access</span></div>
    <div class="loc-desc">we need your location to find trusted doctors and hospitals near you</div>
    <div class="loc-item"><div class="ic">📍</div><div><h3>Find nearby doctors</h3><p>Get clinics and doctors close to you</p></div></div>
    <div class="loc-item"><div class="ic">🛡️</div><div><h3>Accurate information</h3><p>Real distance, directions, and fees</p></div></div>
    <div class="loc-item"><div class="ic">🔔</div><div><h3>Timely Assistance</h3><p>Receive important updates and reminders</p></div></div>
    <button class="btn btn-primary allow-btn" onclick="Store.update({settings:Object.assign({},Store.state.settings,{locationAllowed:true})}); navigate('login')">➤ Allow Location</button>
    <a class="not-now" onclick="navigate('login')">Not Now</a>
  </div>`
};

/* ---- Create Account ---- */
SCREENS['create-account'] = {
  template: () => `
  <div class="screen-inner ca-wrap">
    <div class="ca-header">
      <a onclick="navigate('login')">‹</a>
      <div class="ca-title font-mont">Create your<br>TravelCare account</div>
      <div class="ca-desc">Join us and access trusted doctors where you go.</div>
    </div>
    <div id="caMsg"></div>
    <div class="grid2">
      <div><label class="field-label">First name</label><div class="field"><span class="icon">👤</span><input id="caFirst" class="input" placeholder="First name"></div><span class="error-text" id="errFirst"></span></div>
      <div><label class="field-label">Last name</label><div class="field"><span class="icon">👤</span><input id="caLast" class="input" placeholder="Last name"></div><span class="error-text" id="errLast"></span></div>
    </div>
    <label class="field-label">Email</label>
    <div class="field"><span class="icon">✉️</span><input id="caEmail" class="input" type="email" placeholder="you@gmail.com"></div>
    <span class="error-text" id="errEmail"></span>
    <label class="field-label">Phone number</label>
    <div class="phone-row">
      <div class="phone-country">🇮🇳 +91</div>
      <div class="phone-input"><span class="icon" style="left:14px;">📞</span><input id="caPhone" class="input" style="padding-left:44px;" placeholder="10-digit number"></div>
    </div>
    <span class="error-text" id="errPhone"></span>
    <label class="field-label">Password</label>
    <div class="field"><span class="icon">🔒</span><input id="caPassword" class="input" type="password" placeholder="Min. 8 characters"></div>
    <div class="strength"><div id="caBars" style="display:flex; gap:6px; flex:1;">${renderStrengthBars(0)}</div><span class="label" id="caStrengthLabel"></span></div>
    <span class="error-text" id="errPassword"></span>
    <div class="privacy-box">
      <input type="checkbox" id="caAgree">
      <div><strong style="color:var(--teal)">Your privacy matters to us.</strong><br>I agree to TravelCare's Terms of service and Privacy Policy.</div>
    </div>
    <span class="error-text" id="errAgree"></span>
    <button id="caSubmit" class="btn btn-primary create-btn">➕ Create Account</button>
    <div class="divider"><span class="line"></span>or continue with<span class="line"></span></div>
    <div class="signup-row">Already have an account? <a onclick="navigate('login')">Sign in</a></div>
  </div>`,
  mount: () => {
    const pwField = document.getElementById('caPassword');
    pwField.addEventListener('input', () => {
      const s = passwordStrength(pwField.value);
      document.getElementById('caBars').innerHTML = renderStrengthBars(s.score);
      const lbl = document.getElementById('caStrengthLabel');
      lbl.textContent = pwField.value ? s.label : '';
      lbl.style.color = s.color;
    });
    document.getElementById('caSubmit').addEventListener('click', () => {
      ['errFirst','errLast','errEmail','errPhone','errPassword','errAgree'].forEach(id => document.getElementById(id).textContent = '');
      document.getElementById('caMsg').innerHTML = '';
      const data = {
        firstName: document.getElementById('caFirst').value.trim(),
        lastName: document.getElementById('caLast').value.trim(),
        email: document.getElementById('caEmail').value.trim(),
        phone: digitsOnly(document.getElementById('caPhone').value),
        password: document.getElementById('caPassword').value,
        agree: document.getElementById('caAgree').checked
      };
      let hasError = false;
      if (!data.firstName) { document.getElementById('errFirst').textContent = 'Required'; hasError = true; }
      if (!data.lastName) { document.getElementById('errLast').textContent = 'Required'; hasError = true; }
      if (!validEmail(data.email)) { document.getElementById('errEmail').textContent = 'Enter a valid email address'; hasError = true; }
      if (data.phone.length !== 10) { document.getElementById('errPhone').textContent = 'Enter a valid 10-digit phone number'; hasError = true; }
      if (data.password.length < 8) { document.getElementById('errPassword').textContent = 'Password must be at least 8 characters'; hasError = true; }
      if (!data.agree) { document.getElementById('errAgree').textContent = 'You must agree to continue'; hasError = true; }
      if (hasError) return;
      Store.updateUser(data);
      Store.update({ otp: { code: '123456', purpose: 'signup' } });
      navigate('otp-verification');
    });
  }
};

/* ---- OTP Verification ---- */
SCREENS['otp-verification'] = {
  template: () => {
    const u = Store.state.user;
    const phone = u && u.phone ? `+91 ${u.phone.slice(0,2)}****${u.phone.slice(-4)}` : '+91 86****8733';
    return `
  <div class="screen-inner otp-wrap">
    <div class="otp-h1">Verify your number</div>
    <div class="otp-circle">💬</div>
    <div class="otp-title font-mont">Enter the 6-digit code</div>
    <div class="otp-sent"><span class="muted2">Sent to</span> <a>${phone}</a><br>via SMS - <a onclick="navigate('create-account')">Change number</a></div>
    <div class="otp-inputs" id="otpInputs">
      ${[0,1,2,3,4,5].map(i => `<input maxlength="1" inputmode="numeric" data-idx="${i}">`).join('')}
    </div>
    <div id="otpError" class="error-text" style="display:block; text-align:center; margin-bottom:8px;"></div>
    <div class="otp-hint">Demo code: 123456</div>
    <div class="otp-timer">Code expires in <span id="otpTimer">30</span>s</div>
    <div class="otp-resend">Didn't receive it? <a id="resendLink" class="disabled">Resend code</a></div>
    <div class="otp-security">🛡️ <span>Your number is used only for verification and is never shared.</span></div>
    <button id="otpVerifyBtn" class="btn btn-primary">Verify</button>
  </div>`;
  },
  mount: () => {
    const inputs = Array.from(document.querySelectorAll('#otpInputs input'));
    inputs.forEach((inp, idx) => {
      inp.addEventListener('input', () => {
        inp.value = inp.value.replace(/\D/g, '').slice(0, 1);
        if (inp.value) { inp.classList.add('filled'); if (inputs[idx + 1]) inputs[idx + 1].focus(); }
        else inp.classList.remove('filled');
      });
      inp.addEventListener('keydown', e => {
        if (e.key === 'Backspace' && !inp.value && inputs[idx - 1]) inputs[idx - 1].focus();
      });
    });
    if (inputs[0]) inputs[0].focus();

    let seconds = 30;
    const timerEl = document.getElementById('otpTimer');
    const resendLink = document.getElementById('resendLink');
    const timerInterval = setInterval(() => {
      seconds--;
      if (timerEl) timerEl.textContent = seconds;
      if (seconds <= 0) {
        clearInterval(timerInterval);
        resendLink.classList.remove('disabled');
      }
    }, 1000);
    resendLink.addEventListener('click', () => {
      if (resendLink.classList.contains('disabled')) return;
      seconds = 30;
      resendLink.classList.add('disabled');
      inputs.forEach(i => { i.value = ''; i.classList.remove('filled'); });
      inputs[0].focus();
      document.getElementById('otpError').textContent = '';
      const interval2 = setInterval(() => {
        seconds--;
        if (timerEl) timerEl.textContent = seconds;
        if (seconds <= 0) { clearInterval(interval2); resendLink.classList.remove('disabled'); }
      }, 1000);
    });
    document.getElementById('otpVerifyBtn').addEventListener('click', () => {
      const code = inputs.map(i => i.value).join('');
      const errEl = document.getElementById('otpError');
      if (code.length < 6) { errEl.textContent = 'Please enter all 6 digits.'; return; }
      if (code !== Store.state.otp.code) { errEl.textContent = 'Incorrect code. Try the demo code shown above.'; return; }
      Store.update({ session: { loggedIn: true } });
      navigate('account-created');
    });
  }
};

/* ---- Account Created ---- */
SCREENS['account-created'] = {
  template: () => `
  <div class="screen-inner ac-wrap">
    <div class="ac-hero">🛡️</div>
    <div class="ac-title font-mont">Welcome to<br>TravelCare! 🎉</div>
    <div class="ac-desc">Your account is created successfully.</div>
    <div class="ac-desc">You're all set to travel with confidence.</div>
    <div class="ac-checks">
      <div class="item"><span class="tick">✓</span> Verified Account</div>
      <div class="item"><span class="tick">✓</span> Health Profile Created</div>
      <div class="item"><span class="tick">✓</span> Emergency contact Added</div>
    </div>
    <div class="ac-actions">
      <button class="btn btn-primary" onclick="navigate('complete-profile')">Continue</button>
      <button class="btn btn-primary" onclick="navigate('home')">Explore TravelCare</button>
    </div>
  </div>`
};

/* ---- Complete Profile ---- */
SCREENS['complete-profile'] = {
  template: () => {
    const u = Store.state.user || {};
    return `
  <div class="screen-inner cp-wrap">
    <div class="cp-header"><a onclick="navigate('account-created')">‹</a><h1>Complete your profile</h1></div>
    <div class="avatar-wrap">
      <div class="avatar-circle" id="avatarCircle">${u.avatar || '👤'}</div>
      <div class="avatar-cam" id="avatarCam">📷</div>
    </div>
    <label class="field-label">First name</label>
    <div class="field"><span class="icon">👤</span><input id="cpFirst" class="input" placeholder="First name" value="${u.firstName || ''}"></div>
    <label class="field-label">Last name</label>
    <div class="field"><span class="icon">👤</span><input id="cpLast" class="input" placeholder="Last name" value="${u.lastName || ''}"></div>
    <label class="field-label">Date of birth</label>
    <div class="dob-row">
      <select id="cpDay"><option value="">Day</option>${Array.from({length:31},(_,i)=>`<option ${u.dobDay==i+1?'selected':''}>${i+1}</option>`).join('')}</select>
      <select id="cpMonth"><option value="">Month</option>${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'].map((m,i)=>`<option ${u.dobMonth==i+1?'selected':''} value="${i+1}">${m}</option>`).join('')}</select>
      <select id="cpYear"><option value="">Year</option>${Array.from({length:80},(_,i)=>2010-i).map(y=>`<option ${u.dobYear==y?'selected':''}>${y}</option>`).join('')}</select>
    </div>
    <label class="field-label">Gender</label>
    <div class="gender-row" id="genderRow">
      <button type="button" class="gender-btn ${u.gender==='Male'?'active':''}" data-gender="Male">♂ Male</button>
      <button type="button" class="gender-btn ${u.gender==='Female'?'active':''}" data-gender="Female">♀ Female</button>
      <button type="button" class="gender-btn ${u.gender==='Other'?'active':''}" data-gender="Other">⚧ Other</button>
    </div>
    <div class="grid2" style="margin-top:16px;">
      <div><label class="field-label">Blood Group</label>
        <div class="select-field"><select id="cpBlood">${['B+','A+','O+','AB+','B-','A-','O-','AB-'].map(bg=>`<option ${u.bloodGroup===bg?'selected':''}>${bg}</option>`).join('')}</select></div>
      </div>
      <div><label class="field-label">Nationality</label>
        <div class="select-field"><select id="cpNationality">${['Indian','American','British','Other'].map(n=>`<option ${u.nationality===n?'selected':''}>${n}</option>`).join('')}</select></div>
      </div>
    </div>
    <div class="cp-actions">
      <button id="cpSave" class="btn btn-primary" style="width:100%;">Save &amp; Continue</button>
      <a class="skip-link" onclick="navigate('home')">Skip for now</a>
    </div>
  </div>`;
  },
  mount: () => {
    let gender = (Store.state.user || {}).gender || null;
    document.querySelectorAll('.gender-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.gender-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gender = btn.getAttribute('data-gender');
      });
    });
    const avatars = ['👤','🧑','👩','🧔','👨‍🦱','👩‍🦰'];
    document.getElementById('avatarCircle').addEventListener('click', () => {
      const cur = (Store.state.user || {}).avatar || '👤';
      const next = avatars[(avatars.indexOf(cur) + 1) % avatars.length];
      document.getElementById('avatarCircle').textContent = next;
      Store.updateUser({ avatar: next });
    });
    document.getElementById('cpSave').addEventListener('click', () => {
      Store.updateUser({
        firstName: document.getElementById('cpFirst').value.trim() || (Store.state.user||{}).firstName,
        lastName: document.getElementById('cpLast').value.trim() || (Store.state.user||{}).lastName,
        dobDay: document.getElementById('cpDay').value,
        dobMonth: document.getElementById('cpMonth').value,
        dobYear: document.getElementById('cpYear').value,
        gender: gender,
        bloodGroup: document.getElementById('cpBlood').value,
        nationality: document.getElementById('cpNationality').value
      });
      navigate('home');
    });
  }
};

/* ---- Home ---- */
const SPECIALTIES = [
  { key: 'general', icon: '🧑‍⚕️', label: 'General' },
  { key: 'dental', icon: '🦷', label: 'Dental' },
  { key: 'pediatric', icon: '🧒', label: 'Pediatric' },
  { key: 'cardio', icon: '❤️', label: 'Cardio' }
];
const CLINICS = [
  { icon: '🏥', name: 'International Clinic', dist: '1.2 km', rating: '4.6', reviews: 128 },
  { icon: '🏨', name: 'City Care Hospital', dist: '1.8 km', rating: '4.6', reviews: 126 },
  { icon: '💊', name: 'Pharmacy', dist: '0.8 km', rating: '4.2', reviews: 528 }
];
SCREENS['home'] = {
  template: () => {
    const u = Store.state.user;
    return `
  <div class="screen-inner home-wrap">
    <div class="home-top">
      <div class="home-loc">📍 Yadiki, Anantapur.</div>
      <a class="home-bell" onclick="navigate('notification')">🔔</a>
    </div>
    ${u && u.firstName ? `<div class="home-greeting">Hi, ${u.firstName} 👋</div>` : ''}
    <div class="search-bar" onclick="navigate('search')">🔍 Search doctors, clinics</div>
    <div class="hero-card" onclick="navigate('search')">
      <div class="eyebrow">FEELING UNWELL?</div>
      <h3>Find trusted doctor's<br>near you.</h3>
      <span class="hero-btn">Search now →</span>
      <div class="stethoscope">🩺</div>
    </div>
    <div class="sec-header"><h4>Specialties</h4><a onclick="navigate('search')">View all</a></div>
    <div class="spec-row">
      ${SPECIALTIES.map(s => `<div class="spec-item" onclick="navigate('search')"><div class="ic">${s.icon}</div>${s.label}</div>`).join('')}
      <div class="spec-item" onclick="navigate('search')"><div class="ic">⋯</div>More</div>
    </div>
    <div class="sec-header"><h4>Nearby clinics</h4><a onclick="navigate('search')">View all</a></div>
    ${CLINICS.map(c => `
    <div class="clinic-card" onclick="navigate('coming-soon')">
      <div class="emoji-thumb">${c.icon}</div>
      <div class="clinic-info">
        <h5>${c.name}</h5>
        <div class="meta">${c.dist} <span class="open">Open</span></div>
        <div class="rating">⭐ ${c.rating} · ${c.reviews} reviews</div>
      </div>
      <div class="clinic-arrow">➤</div>
    </div>`).join('')}
    <div class="bottom-nav">
      <a class="active" onclick="navigate('home')"><span class="ic">🏠</span>Home</a>
      <a onclick="navigate('search')"><span class="ic">🔍</span>Search</a>
      <a onclick="navigate('coming-soon')"><span class="ic">📅</span>Booking</a>
      <a onclick="navigate('coming-soon')"><span class="ic">🚨</span>Emergency</a>
      <a onclick="navigate('coming-soon')"><span class="ic">👤</span>Profile</a>
    </div>
  </div>`;
  }
};

/* ---- Search ---- */
SCREENS['search'] = {
  template: () => `
  <div class="screen-inner se-wrap">
    <div class="se-header"><a onclick="navigate('home')">←</a><h1>Search Doctors</h1></div>
    <div class="se-searchbar">🔍 <input id="seQuery" placeholder="Doctors, clinics, hospitals"></div>
    <div class="sec">
      <div class="sec-head"><h4>Recent searches</h4><a id="clearRecent">Clear all</a></div>
      <div class="chip-row" id="chipRow">
        <span class="chip">General</span><span class="chip">Dental</span><span class="chip">Pediatric</span>
      </div>
    </div>
    <div class="sec">
      <h4>Specializations</h4>
      <div class="spec-grid">
        ${['General','Dentist','Pediatric','Cardio','Gynecologist','Neurologist','Pulmonologist'].map(s=>`<button type="button" class="spec-card" data-spec="${s}">${s}</button>`).join('')}
      </div>
    </div>
    <div class="sec">
      <div class="sec-head"><h4>Consultation fee range</h4><span>🪙</span></div>
      <div class="fee-row"><span>₹ <span id="feeVal">500</span></span><span>₹ 2,000</span></div>
      <input type="range" min="100" max="2000" value="500" class="fee-range" id="feeSlider">
    </div>
    <div class="se-results" id="seResults"></div>
    <div class="bottom-nav">
      <a onclick="navigate('home')"><span class="ic">🏠</span>Home</a>
      <a class="active" onclick="navigate('search')"><span class="ic">🔍</span>Search</a>
      <a onclick="navigate('coming-soon')"><span class="ic">📅</span>Booking</a>
      <a onclick="navigate('coming-soon')"><span class="ic">🚨</span>Emergency</a>
      <a onclick="navigate('coming-soon')"><span class="ic">👤</span>Profile</a>
    </div>
  </div>`,
  mount: () => {
    document.getElementById('feeSlider').addEventListener('input', e => {
      document.getElementById('feeVal').textContent = e.target.value;
    });
    document.querySelectorAll('.spec-card').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('seResults').innerHTML =
          `<div class="se-empty">No ${btn.getAttribute('data-spec')} doctors added to this prototype yet — this is where results would appear.</div>`;
      });
    });
    document.getElementById('clearRecent').addEventListener('click', () => {
      document.getElementById('chipRow').innerHTML = '<span class="chip" style="opacity:.5">No recent searches</span>';
    });
    document.getElementById('seQuery').addEventListener('keydown', e => {
      if (e.key === 'Enter') {
        document.getElementById('seResults').innerHTML =
          `<div class="se-empty">Searching "${e.target.value}" — demo prototype has no live doctor database yet.</div>`;
      }
    });
  }
};

/* ---- Forget Password ---- */
SCREENS['forget-password'] = {
  template: () => {
    const u = Store.state.user;
    const email = u && u.email ? u.email.replace(/(.{2}).+(@.+)/, '$1***$2') : 's**hack5@gmail.com';
    const phone = u && u.phone ? `+91 ${u.phone.slice(0,2)}****${u.phone.slice(-4)}` : '+91 86****8733';
    return `
  <div class="screen-inner fp-wrap">
    <div class="fp-title">Reset password</div>
    <div class="fp-circle">🔒</div>
    <div class="fp-h2 font-mont">Forget your password?</div>
    <div class="fp-desc">Change how you'd like to receive your reset link or OTP.</div>
    <div class="fp-option" data-target="email">
      <div class="ic">✉️</div><div><h4>Email address</h4><p>${email}</p></div><div class="radio"></div>
    </div>
    <div class="fp-option" data-target="phone">
      <div class="ic">📱</div><div><h4>Phone number</h4><p>${phone}</p></div><div class="radio"></div>
    </div>
    <div class="fp-note">⚠️ The reset link expires in 10 minutes for your security.</div>
    <button id="fpContinue" class="btn btn-primary" disabled>Continue</button>
    <a class="fp-back" onclick="navigate('login')">Back to sign in</a>
  </div>`;
  },
  mount: () => {
    let selected = null;
    const opts = document.querySelectorAll('.fp-option');
    const continueBtn = document.getElementById('fpContinue');
    opts.forEach(opt => {
      opt.addEventListener('click', () => {
        opts.forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        selected = opt.getAttribute('data-target');
        continueBtn.disabled = false;
      });
    });
    continueBtn.addEventListener('click', () => {
      if (!selected) return;
      Store.update({ otp: { code: '123456', purpose: 'reset' } });
      navigate('create-new-password');
    });
  }
};

/* ---- Create New Password ---- */
SCREENS['create-new-password'] = {
  template: () => `
  <div class="screen-inner np-wrap">
    <a class="back" onclick="navigate('forget-password')">‹</a>
    <div class="np-title font-mont">Create new<br>password</div>
    <div class="np-desc">Your new password must be different from previous used password.</div>
    <input id="npNew" class="input np-field" type="password" placeholder="New password">
    <input id="npConfirm" class="input np-field" type="password" placeholder="Confirm password">
    <div id="npError" class="error-text" style="display:block; margin-bottom:10px;"></div>
    <div class="strength"><div id="npBars" style="display:flex; gap:6px; flex:1;">${renderStrengthBars(0)}</div><span class="label" id="npStrengthLabel"></span></div>
    <div style="height:20px;"></div>
    <button id="npSave" class="btn btn-primary">Save Password</button>
  </div>`,
  mount: () => {
    const newPw = document.getElementById('npNew');
    newPw.addEventListener('input', () => {
      const s = passwordStrength(newPw.value);
      document.getElementById('npBars').innerHTML = renderStrengthBars(s.score);
      const lbl = document.getElementById('npStrengthLabel');
      lbl.textContent = newPw.value ? s.label : '';
      lbl.style.color = s.color;
    });
    document.getElementById('npSave').addEventListener('click', () => {
      const pw = newPw.value;
      const confirm = document.getElementById('npConfirm').value;
      const errEl = document.getElementById('npError');
      if (pw.length < 8) { errEl.textContent = 'Password must be at least 8 characters.'; return; }
      if (pw !== confirm) { errEl.textContent = 'Passwords do not match.'; return; }
      errEl.textContent = '';
      if (Store.state.user) Store.updateUser({ password: pw });
      navigate('password-changed');
    });
  }
};

/* ---- Password Changed ---- */
SCREENS['password-changed'] = {
  template: () => `
  <div class="screen-inner pc-wrap">
    <div class="pc-hero">🛡️</div>
    <div class="pc-title">Password updated<br>successfully</div>
    <div class="pc-desc">You can now login using your new password.</div>
    <button class="btn btn-primary" onclick="navigate('login')">Go to login</button>
  </div>`
};

/* ---- No Internet ---- */
SCREENS['no-internet'] = {
  template: () => `
  <div class="screen-inner ni-wrap">
    <div class="ni-hero">🚧✈️</div>
    <div class="ni-title">Oops ! Something went wrong</div>
    <div class="ni-desc">We couldn't load the page you're looking for. Please try again.</div>
    <div class="ni-actions">
      <button class="btn btn-primary" onclick="navigate('home')">Try Again</button>
      <button class="btn btn-outline" onclick="alert('This is a demo prototype — device settings are not available.')">Open Settings</button>
    </div>
    <div style="font-size:40px; padding-bottom:10px;">📍</div>
  </div>`
};

/* ---- Notification ---- */
SCREENS['notification'] = {
  template: () => `
  <div class="screen-inner not-wrap">
    <a class="back" onclick="navigate('home')">‹</a>
    <div class="not-hero">🔔</div>
    <div class="not-title font-mont">Never miss an<br>important update</div>
    <div class="not-desc">Allow notifications to receive appointment reminders, health tips and important alerts.</div>
    <div class="not-item"><div class="ic">🔔</div><div><h4>Appointment reminders</h4><p>Never miss your bookings</p></div></div>
    <div class="not-item"><div class="ic">⚠️</div><div><h4>Health alerts</h4><p>Get updates that matter</p></div></div>
    <div class="not-item"><div class="ic">🩹</div><div><h4>Emergency notifications</h4><p>Important alerts in time</p></div></div>
    <div class="not-actions">
      <button class="btn btn-primary" style="width:100%;" onclick="Store.update({settings:Object.assign({},Store.state.settings,{notificationsAllowed:true})}); navigate('home')">Allow Notifications</button>
      <a class="not-later" onclick="navigate('home')">Maybe Later</a>
    </div>
  </div>`
};

/* ---- Coming soon fallback ---- */
SCREENS['coming-soon'] = {
  template: () => `
  <div class="screen-inner soon-wrap">
    <div style="font-size:60px; margin-bottom:20px;">🚧</div>
    <h2 style="font-size:22px; margin-bottom:10px;">This screen isn't built yet</h2>
    <p style="color:#666; margin-bottom:30px;">It's part of the full 127-screen design but hasn't been wired up in this prototype.</p>
    <a class="btn btn-primary" onclick="navigate('home')" style="display:inline-flex;">Back to Home</a>
  </div>`
};
