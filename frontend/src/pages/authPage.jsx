import { useState, useEffect, useRef, useCallback } from 'react';
import { authRegister, authLogin } from '../api';

/* ─── SVG Icon system ──────────────────────────────────────────────────── */
const icons = {
  logo: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
  user: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  mail: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  lock: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  eye:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  check:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  x:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  alert:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  refresh:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>,
  shield:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  arrow: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
};

function Icon({ name, size = 18, color = 'currentColor' }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:size, height:size, color, flexShrink:0 }}>
      {icons[name]}
    </span>
  );
}

/* ─── Animated background grid ─────────────────────────────────────────── */
function GridBackground() {
  return (
    <div style={{ position:'fixed', inset:0, overflow:'hidden', zIndex:0, pointerEvents:'none' }}>
      <div style={{
        position:'absolute', inset:0,
        backgroundImage:`
          linear-gradient(rgba(124,108,255,0.04) 1px, transparent 1px),
          linear-gradient(90deg, rgba(124,108,255,0.04) 1px, transparent 1px)
        `,
        backgroundSize:'48px 48px',
      }}/>
      <div style={{ position:'absolute', top:'20%', left:'10%', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, rgba(124,108,255,0.08) 0%, transparent 70%)', filter:'blur(40px)' }}/>
      <div style={{ position:'absolute', bottom:'20%', right:'10%', width:250, height:250, borderRadius:'50%', background:'radial-gradient(circle, rgba(74,222,128,0.06) 0%, transparent 70%)', filter:'blur(40px)' }}/>
    </div>
  );
}

/* ─── Password strength ─────────────────────────────────────────────────── */
function PasswordStrength({ password }) {
  if (!password) return null;
  const rules = [
    { label: 'At least 8 characters', pass: password.length >= 8 },
    { label: 'Uppercase letter',       pass: /[A-Z]/.test(password) },
    { label: 'Number',                 pass: /[0-9]/.test(password) },
    { label: 'Special character',      pass: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = rules.filter(r => r.pass).length;
  const colors = ['#f87171','#f87171','#fbbf24','#60a5fa','#4ade80'];
  const labels = ['','Weak','Weak','Fair','Strong'];

  return (
    <div style={{ marginTop:8 }}>
      <div style={{ display:'flex', gap:4, marginBottom:8 }}>
        {[1,2,3,4].map(i => (
          <div key={i} style={{ flex:1, height:3, borderRadius:2, background: i<=score ? colors[score] : '#2a2a35', transition:'all 0.3s' }}/>
        ))}
      </div>
      <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
        {rules.map((r,i) => (
          <div key={i} style={{ display:'flex', alignItems:'center', gap:6 }}>
            <span style={{ width:14, height:14, display:'flex', alignItems:'center', justifyContent:'center', color: r.pass ? '#4ade80' : '#3a3a4a' }}>
              {r.pass ? <Icon name="check" size={14}/> : <Icon name="x" size={14}/>}
            </span>
            <span style={{ fontSize:'0.75rem', color: r.pass ? '#6b7280' : '#4a4a5a' }}>{r.label}</span>
          </div>
        ))}
      </div>
      {score > 0 && <div style={{ color:colors[score], fontSize:'0.72rem', fontWeight:700, marginTop:4 }}>{labels[score]}</div>}
    </div>
  );
}

/* ─── Input field component ─────────────────────────────────────────────── */
function Field({ label, type='text', value, onChange, placeholder, iconName, error, hint }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPass = type === 'password';
  const hasErr = !!error;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && (
        <label style={{ color:'#9ca3af', fontSize:'0.75rem', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
          {label}
        </label>
      )}
      <div style={{ position:'relative' }}>
        {iconName && (
          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color: focused ? '#7c6cff' : '#4a4a5a', transition:'color 0.2s', pointerEvents:'none' }}>
            <Icon name={iconName} size={17}/>
          </span>
        )}
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width:'100%', boxSizing:'border-box',
            padding:`13px ${isPass?'48px':'16px'} 13px ${iconName?'44px':'16px'}`,
            background: focused ? '#0d0d18' : '#0a0a0f',
            border:`1.5px solid ${hasErr?'#f87171':focused?'#7c6cff':'#252535'}`,
            borderRadius:12, color:'#e8e8f0', fontSize:'0.9rem',
            fontFamily:"'Inter','DM Sans',sans-serif",
            outline:'none', transition:'all 0.2s',
            boxShadow: focused ? (hasErr?'0 0 0 3px #f8717122':'0 0 0 3px #7c6cff20') : 'none',
          }}
        />
        {isPass && (
          <button onClick={() => setShow(s=>!s)} type="button"
            style={{ position:'absolute', right:14, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#4a4a5a', display:'flex', padding:4 }}>
            <Icon name={show?'eyeOff':'eye'} size={17}/>
          </button>
        )}
      </div>
      {error && (
        <div style={{ display:'flex', alignItems:'center', gap:5, color:'#f87171', fontSize:'0.78rem' }}>
          <Icon name="alert" size={13}/> {error}
        </div>
      )}
      {hint && !error && <div style={{ color:'#4a4a5a', fontSize:'0.75rem' }}>{hint}</div>}
    </div>
  );
}

/* ─── CAPTCHA — Math challenge ──────────────────────────────────────────── */
function MathCaptcha({ onSolved, onReset }) {
  const gen = useCallback(() => {
    const ops = ['+', '-', '×'];
    const op  = ops[Math.floor(Math.random() * ops.length)];
    let a, b;
    if (op === '+') { a = Math.floor(Math.random()*20)+1; b = Math.floor(Math.random()*20)+1; }
    else if (op === '-') { a = Math.floor(Math.random()*20)+10; b = Math.floor(Math.random()*10)+1; }
    else { a = Math.floor(Math.random()*9)+2; b = Math.floor(Math.random()*9)+2; }
    const ans = op==='+' ? a+b : op==='-' ? a-b : a*b;
    return { a, b, op, ans };
  }, []);

  const [q, setQ]         = useState(gen);
  const [val, setVal]     = useState('');
  const [status, setStatus] = useState('idle'); // idle | correct | wrong
  const [attempts, setAttempts] = useState(0);

  const refresh = () => { setQ(gen()); setVal(''); setStatus('idle'); onReset?.(); };

  const check = (input) => {
    setVal(input);
    if (input === '') { setStatus('idle'); return; }
    if (parseInt(input) === q.ans) {
      setStatus('correct');
      onSolved(true);
    } else {
      setStatus('wrong');
      onSolved(false);
      setAttempts(a => a+1);
      if (attempts >= 1) setTimeout(refresh, 600);
    }
  };

  const borderColor = status==='correct' ? '#4ade80' : status==='wrong' ? '#f87171' : '#252535';
  const bgColor     = status==='correct' ? '#4ade8012' : status==='wrong' ? '#f8717112' : '#0a0a0f';

  return (
    <div style={{ background:'#0d0d18', border:'1px solid #252535', borderRadius:14, padding:'16px 18px' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, color:'#9ca3af', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>
          <Icon name="shield" size={14} color="#7c6cff"/>
          Human Verification
        </div>
        <button onClick={refresh} type="button"
          style={{ background:'none', border:'none', cursor:'pointer', color:'#4a4a5a', display:'flex', alignItems:'center', gap:4, fontSize:'0.75rem', padding:'4px 8px', borderRadius:6, transition:'color 0.2s' }}
          onMouseEnter={e=>e.currentTarget.style.color='#7c6cff'}
          onMouseLeave={e=>e.currentTarget.style.color='#4a4a5a'}>
          <Icon name="refresh" size={13}/> New
        </button>
      </div>

      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        {/* Math problem display */}
        <div style={{
          flex:1, background:'#070710', border:'1px solid #1e1e30', borderRadius:10,
          padding:'14px 18px', textAlign:'center',
          fontFamily:"'Space Mono','Courier New',monospace", fontSize:'1.4rem', fontWeight:700,
          color:'#e8e8f0', letterSpacing:'0.05em', userSelect:'none',
        }}>
          {q.a} {q.op} {q.b} = ?
        </div>

        {/* Answer input */}
        <div style={{ position:'relative', width:90 }}>
          <input
            type="number"
            value={val}
            onChange={e => check(e.target.value)}
            placeholder="?"
            style={{
              width:'100%', boxSizing:'border-box',
              padding:'14px 12px', textAlign:'center',
              background: bgColor,
              border:`2px solid ${borderColor}`,
              borderRadius:10, color:'#e8e8f0',
              fontFamily:"'Space Mono',monospace", fontSize:'1.1rem', fontWeight:700,
              outline:'none', transition:'all 0.2s',
              boxShadow: status==='correct' ? '0 0 0 3px #4ade8030' : status==='wrong' ? '0 0 0 3px #f8717130' : 'none',
              MozAppearance:'textfield',
            }}
          />
          {status !== 'idle' && (
            <span style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color: status==='correct'?'#4ade80':'#f87171' }}>
              <Icon name={status==='correct'?'check':'x'} size={16}/>
            </span>
          )}
        </div>
      </div>

      {status === 'correct' && (
        <div style={{ display:'flex', alignItems:'center', gap:6, color:'#4ade80', fontSize:'0.78rem', marginTop:10 }}>
          <Icon name="check" size={13}/> Verified — you're human
        </div>
      )}
    </div>
  );
}

/* ─── Avatar color picker ───────────────────────────────────────────────── */
const COLORS = ['#7c6cff','#4ade80','#60a5fa','#f87171','#fbbf24','#fb923c','#f472b6','#a78bfa','#34d399'];
const INITIALS = (name) => name ? name.trim().slice(0,2).toUpperCase() : 'U';

function AvatarPreview({ name, color }) {
  return (
    <div style={{ width:56, height:56, borderRadius:16, background:`linear-gradient(135deg,${color},${color}99)`, border:`2px solid ${color}44`, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, boxShadow:`0 4px 20px ${color}44` }}>
      <span style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:'1rem', color:'#fff', letterSpacing:'-0.02em' }}>
        {INITIALS(name)}
      </span>
    </div>
  );
}

/* ─── MAIN AUTH PAGE ────────────────────────────────────────────────────── */
export default function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState('login');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [captchaSolved, setCaptchaSolved] = useState(false);

  // Login
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass,  setLoginPass]  = useState('');

  // Register
  const [regName,  setRegName]  = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPass,  setRegPass]  = useState('');
  const [regPass2, setRegPass2] = useState('');
  const [regColor, setRegColor] = useState('#7c6cff');

  // Field errors
  const [fieldErrors, setFieldErrors] = useState({});

  const clearErrors = () => { setError(''); setFieldErrors({}); };

  const validate = () => {
    const errs = {};
    if (mode === 'register') {
      if (!regName.trim())                                       errs.name  = 'Name is required';
      if (!regEmail.trim() || !regEmail.includes('@'))           errs.email = 'Valid email required';
      if (regPass.length < 6)                                    errs.pass  = 'At least 6 characters';
      if (regPass !== regPass2)                                  errs.pass2 = "Passwords don't match";
      if (!captchaSolved)                                        errs.captcha = 'Please solve the verification';
    } else {
      if (!loginEmail.trim()) errs.email = 'Email required';
      if (!loginPass.trim())  errs.pass  = 'Password required';
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    clearErrors();
    if (!validate()) return;
    setLoading(true);

    try {
      if (mode === 'login') {
        const d = await authLogin({ email: loginEmail, password: loginPass });
        localStorage.setItem('mas_token', d.token);
        onAuth(d.user);
      } else {
        const d = await authRegister({ username: regName, email: regEmail, password: regPass, avatar_color: regColor });
        localStorage.setItem('mas_token', d.token);
        onAuth(d.user);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally { setLoading(false); }
  };

  const switchMode = (m) => { setMode(m); clearErrors(); setCaptchaSolved(false); };

  return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', position:'relative', padding:'20px', background:'#070710' }}>
      <GridBackground/>
      <style>{`
        * { box-sizing: border-box; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideIn { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        input[type=number]::-webkit-outer-spin-button,
        input[type=number]::-webkit-inner-spin-button { -webkit-appearance:none; margin:0; }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px #0a0a0f inset !important; -webkit-text-fill-color:#e8e8f0 !important; }
      `}</style>

      <div style={{
        position:'relative', zIndex:1, width:'100%', maxWidth:460,
        animation:'slideIn 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}>
        {/* Logo */}
        <div style={{ textAlign:'center', marginBottom:32 }}>
          <div style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:52, height:52, borderRadius:16, background:'linear-gradient(135deg,#7c6cff,#a78bfa)', marginBottom:16, boxShadow:'0 8px 32px #7c6cff44' }}>
            <Icon name="logo" size={26} color="#fff"/>
          </div>
          <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.6rem', fontWeight:700, color:'#e8e8f0', letterSpacing:'-0.03em' }}>MiniStore</div>
          <div style={{ color:'#4a4a5a', fontSize:'0.85rem', marginTop:4 }}>Your personal app universe</div>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(13,13,24,0.95)', backdropFilter:'blur(20px)', border:'1px solid #1e1e30', borderRadius:24, padding:'32px 32px 28px', boxShadow:'0 24px 60px rgba(0,0,0,0.5)' }}>

          {/* Tab switcher */}
          <div style={{ display:'flex', background:'#070710', borderRadius:12, padding:4, marginBottom:28, border:'1px solid #1a1a28' }}>
            {[['login','Sign In'],['register','Create Account']].map(([m,lbl]) => (
              <button key={m} onClick={() => switchMode(m)} type="button"
                style={{
                  flex:1, padding:'10px 8px', borderRadius:9, border:'none', cursor:'pointer',
                  background: mode===m ? 'linear-gradient(135deg,#7c6cff,#a78bfa)' : 'transparent',
                  color: mode===m ? '#fff' : '#4a4a5a',
                  fontFamily:"'Inter','DM Sans',sans-serif", fontWeight:600, fontSize:'0.85rem',
                  transition:'all 0.2s', boxShadow: mode===m ? '0 2px 12px #7c6cff44' : 'none',
                  letterSpacing:'0.01em',
                }}>
                {lbl}
              </button>
            ))}
          </div>

          {/* Error banner */}
          {error && (
            <div style={{ display:'flex', alignItems:'center', gap:10, background:'#f8717112', border:'1px solid #f8717130', borderRadius:10, padding:'11px 14px', marginBottom:20, color:'#f87171', fontSize:'0.84rem', animation:'fadeIn 0.2s' }}>
              <Icon name="alert" size={15}/> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display:'flex', flexDirection:'column', gap:16 }}>

            {/* ── REGISTER extra fields ── */}
            {mode === 'register' && (
              <>
                {/* Avatar preview + color */}
                <div style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', background:'#070710', borderRadius:12, border:'1px solid #1a1a28' }}>
                  <AvatarPreview name={regName} color={regColor}/>
                  <div style={{ flex:1 }}>
                    <div style={{ color:'#9ca3af', fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Profile Color</div>
                    <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                      {COLORS.map(c => (
                        <button key={c} onClick={() => setRegColor(c)} type="button"
                          style={{ width:22, height:22, borderRadius:'50%', background:c, border:`2.5px solid ${regColor===c?'#fff':'transparent'}`, cursor:'pointer', transition:'all 0.15s', transform:regColor===c?'scale(1.2)':'scale(1)', flexShrink:0 }}/>
                      ))}
                    </div>
                  </div>
                </div>

                <Field label="Full Name" value={regName} onChange={setRegName} placeholder="John Doe" iconName="user" error={fieldErrors.name}/>
                <Field label="Email Address" type="email" value={regEmail} onChange={setRegEmail} placeholder="you@example.com" iconName="mail" error={fieldErrors.email}/>
                <div>
                  <Field label="Password" type="password" value={regPass} onChange={setRegPass} placeholder="Create a strong password" iconName="lock" error={fieldErrors.pass}/>
                  <PasswordStrength password={regPass}/>
                </div>
                <Field label="Confirm Password" type="password" value={regPass2} onChange={setRegPass2} placeholder="Same password again" iconName="lock"
                  error={fieldErrors.pass2 || (regPass2 && regPass !== regPass2 ? "Passwords don't match" : '')}/>

                {/* CAPTCHA */}
                <div>
                  <MathCaptcha onSolved={setCaptchaSolved} onReset={() => setCaptchaSolved(false)}/>
                  {fieldErrors.captcha && (
                    <div style={{ display:'flex', alignItems:'center', gap:5, color:'#f87171', fontSize:'0.78rem', marginTop:6 }}>
                      <Icon name="alert" size={13}/> {fieldErrors.captcha}
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── LOGIN fields ── */}
            {mode === 'login' && (
              <>
                <Field label="Email Address" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="you@example.com" iconName="mail" error={fieldErrors.email}/>
                <Field label="Password" type="password" value={loginPass} onChange={setLoginPass} placeholder="Your password" iconName="lock" error={fieldErrors.pass}/>
              </>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                width:'100%', padding:'14px', marginTop:4,
                background: loading ? '#1e1e30' : 'linear-gradient(135deg,#7c6cff,#9b8bff)',
                color: '#fff', border:'none', borderRadius:12, cursor: loading ? 'not-allowed' : 'pointer',
                fontFamily:"'Inter','DM Sans',sans-serif", fontWeight:700, fontSize:'0.95rem',
                boxShadow: loading ? 'none' : '0 6px 24px #7c6cff44',
                transition:'all 0.2s', display:'flex', alignItems:'center', justifyContent:'center', gap:10,
                letterSpacing:'0.01em',
              }}>
              {loading ? (
                <>
                  <span style={{ width:16, height:16, border:'2px solid #ffffff30', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block'}}/>
                  Processing...
                </>
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <Icon name="arrow" size={17} color="rgba(255,255,255,0.8)"/>
                </>
              )}
            </button>
          </form>

          {/* Bottom link */}
          <div style={{ textAlign:'center', marginTop:20, color:'#4a4a5a', fontSize:'0.82rem' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button onClick={() => switchMode(mode==='login'?'register':'login')} type="button"
              style={{ background:'none', border:'none', color:'#7c6cff', cursor:'pointer', fontWeight:700, fontFamily:'inherit', fontSize:'0.82rem', padding:0 }}>
              {mode === 'login' ? 'Create one' : 'Sign in'}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div style={{ textAlign:'center', marginTop:20, color:'#2a2a3a', fontSize:'0.72rem' }}>
          MiniStore · Secure local app platform
        </div>
      </div>
    </div>
  );
}

