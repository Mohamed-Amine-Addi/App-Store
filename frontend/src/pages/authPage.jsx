import { useState, useEffect, useRef } from 'react';
import { authRegister, authVerify, authLogin } from '../api';

/* ─── Floating particle background ────────────────────────────────────── */
function Particles() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 2 + 0.5,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      o: Math.random() * 0.5 + 0.1,
      color: ['#7c6cff', '#a78bfa', '#4ade80', '#60a5fa'][Math.floor(Math.random() * 4)],
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.o;
        ctx.fill();
        p.x += p.dx; p.y += p.dy;
        if (p.x < 0 || p.x > canvas.width)  p.dx *= -1;
        if (p.y < 0 || p.y > canvas.height) p.dy *= -1;
      });
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    draw();

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    window.addEventListener('resize', resize);
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);

  return <canvas ref={canvasRef} style={{ position:'fixed', inset:0, pointerEvents:'none', zIndex:0 }}/>;
}

/* ─── Code input — 6 boxes ─────────────────────────────────────────────── */
function CodeInput({ value, onChange }) {
  const refs = Array.from({ length: 6 }, () => useRef(null));
  const digits = value.split('').concat(Array(6).fill('')).slice(0, 6);

  const handleKey = (i, e) => {
    if (e.key === 'Backspace') {
      const next = digits.map((d, j) => j === i ? '' : d).join('');
      onChange(next);
      if (i > 0) refs[i - 1].current?.focus();
    } else if (/^\d$/.test(e.key)) {
      const next = digits.map((d, j) => j === i ? e.key : d).join('');
      onChange(next);
      if (i < 5) refs[i + 1].current?.focus();
    }
  };

  const handlePaste = e => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    onChange(pasted);
    refs[Math.min(pasted.length, 5)].current?.focus();
  };

  return (
    <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={refs[i]}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={d}
          onChange={() => {}}
          onKeyDown={e => handleKey(i, e)}
          onPaste={handlePaste}
          onFocus={e => e.target.select()}
          style={{
            width: 52, height: 60,
            textAlign: 'center',
            fontSize: '1.6rem',
            fontFamily: "'Space Mono',monospace",
            fontWeight: 700,
            background: d ? 'linear-gradient(135deg,#7c6cff22,#a78bfa22)' : '#0a0a0f',
            border: `2px solid ${d ? '#7c6cff' : '#2a2a35'}`,
            borderRadius: 12,
            color: '#e8e8f0',
            outline: 'none',
            transition: 'all 0.2s',
            boxShadow: d ? '0 0 16px #7c6cff44' : 'none',
          }}
        />
      ))}
    </div>
  );
}

/* ─── Input field ─────────────────────────────────────────────────────── */
function Field({ label, type = 'text', value, onChange, placeholder, icon, error }) {
  const [show, setShow] = useState(false);
  const isPass = type === 'password';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{label}</label>}
      <div style={{ position: 'relative' }}>
        {icon && <span style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', fontSize: '1rem', pointerEvents: 'none' }}>{icon}</span>}
        <input
          type={isPass ? (show ? 'text' : 'password') : type}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: `14px ${isPass ? '48px' : '16px'} 14px ${icon ? '44px' : '16px'}`,
            background: '#0a0a0f',
            border: `1.5px solid ${error ? '#f87171' : '#2a2a35'}`,
            borderRadius: 12,
            color: '#e8e8f0',
            fontSize: '0.95rem',
            fontFamily: "'DM Sans',sans-serif",
            outline: 'none',
            transition: 'border-color 0.2s, box-shadow 0.2s',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = '#7c6cff'; e.target.style.boxShadow = '0 0 0 3px #7c6cff22'; }}
          onBlur={e => { e.target.style.borderColor = error ? '#f87171' : '#2a2a35'; e.target.style.boxShadow = 'none'; }}
        />
        {isPass && (
          <button onClick={() => setShow(s => !s)} type="button"
            style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b6b80', fontSize: '1rem' }}>
            {show ? '🙈' : '👁️'}
          </button>
        )}
      </div>
      {error && <span style={{ color: '#f87171', fontSize: '0.78rem' }}>{error}</span>}
    </div>
  );
}

/* ─── Strength bar ───────────────────────────────────────────────────── */
function StrengthBar({ password }) {
  const score = !password ? 0 : [/.{8,}/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter(r => r.test(password)).length;
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', '#f87171', '#fbbf24', '#60a5fa', '#4ade80'];
  if (!password) return null;
  return (
    <div style={{ marginTop: -4 }}>
      <div style={{ display: 'flex', gap: 4 }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= score ? colors[score] : '#2a2a35', transition: 'all 0.3s' }} />
        ))}
      </div>
      <div style={{ color: colors[score], fontSize: '0.72rem', marginTop: 4, fontWeight: 600 }}>{labels[score]}</div>
    </div>
  );
}

/* ── AVATAR PICKER ─────────────────────────────────────────────────────── */
const EMOJIS  = ['👤','🦊','🐻','🐼','🦁','🐯','🐸','🤖','👽','🦄','🐉','⚡','🌟','🔥','💎'];
const COLORS  = ['#7c6cff','#4ade80','#60a5fa','#f87171','#fbbf24','#fb923c','#f472b6','#a78bfa'];

function AvatarPicker({ emoji, color, onEmoji, onColor }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ color: '#9ca3af', fontSize: '0.78rem', fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Choose Avatar</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {EMOJIS.map(e => (
          <button key={e} onClick={() => onEmoji(e)} type="button"
            style={{ width: 40, height: 40, borderRadius: 10, background: emoji === e ? `${color}33` : '#0a0a0f', border: `2px solid ${emoji === e ? color : '#2a2a35'}`, fontSize: '1.3rem', cursor: 'pointer', transition: 'all 0.15s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {e}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        {COLORS.map(c => (
          <button key={c} onClick={() => onColor(c)} type="button"
            style={{ width: 28, height: 28, borderRadius: '50%', background: c, border: `3px solid ${color === c ? '#fff' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.15s', transform: color === c ? 'scale(1.2)' : 'scale(1)' }} />
        ))}
      </div>
    </div>
  );
}

/* ── MAIN AUTH PAGE ────────────────────────────────────────────────────── */
export default function AuthPage({ onAuth }) {
  const [mode, setMode]         = useState('login');   // login | register | verify
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [pendingEmail, setPending] = useState('');

  // Login form
  const [loginEmail, setLoginEmail]   = useState('');
  const [loginPass,  setLoginPass]    = useState('');

  // Register form
  const [regName,   setRegName]   = useState('');
  const [regEmail,  setRegEmail]  = useState('');
  const [regPass,   setRegPass]   = useState('');
  const [regPass2,  setRegPass2]  = useState('');
  const [regEmoji,  setRegEmoji]  = useState('👤');
  const [regColor,  setRegColor]  = useState('#7c6cff');

  // Verify
  const [code, setCode] = useState('');

  const clear = () => { setError(''); setSuccess(''); };

  /* LOGIN */
  const handleLogin = async e => {
    e?.preventDefault(); clear(); setLoading(true);
    try {
      const d = await authLogin({ email: loginEmail, password: loginPass });
      localStorage.setItem('mas_token', d.token);
      onAuth(d.user);
    } catch (err) {
      const data = err.response?.data;
      if (data?.needs_verify) { setPending(data.email); setMode('verify'); }
      else setError(data?.error || 'Login failed.');
    } finally { setLoading(false); }
  };

  /* REGISTER */
  const handleRegister = async e => {
    e?.preventDefault(); clear();
    if (regPass !== regPass2) { setError('Passwords do not match.'); return; }
    if (regPass.length < 6)   { setError('Password must be at least 6 characters.'); return; }
    setLoading(true);
    try {
      await authRegister({ username: regName, email: regEmail, password: regPass });
      setPending(regEmail);
      setSuccess('Account created! Check your email for the 6-digit code.');
      setMode('verify');
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed.');
    } finally { setLoading(false); }
  };

  /* VERIFY */
  const handleVerify = async () => {
    if (code.length < 6) { setError('Enter all 6 digits.'); return; }
    clear(); setLoading(true);
    try {
      const d = await authVerify({ email: pendingEmail, code });
      localStorage.setItem('mas_token', d.token);
      onAuth(d.user);
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed.');
    } finally { setLoading(false); }
  };

  /* UI helpers */
  const primaryBtn = (label, onClick, disabled) => (
    <button onClick={onClick} disabled={disabled || loading} type="button"
      style={{
        width: '100%', padding: '15px', borderRadius: 14,
        background: loading || disabled ? '#2a2a35' : 'linear-gradient(135deg,#7c6cff,#a78bfa)',
        color: '#fff', border: 'none', cursor: loading || disabled ? 'not-allowed' : 'pointer',
        fontFamily: "'DM Sans',sans-serif", fontWeight: 700, fontSize: '1rem',
        boxShadow: loading || disabled ? 'none' : '0 8px 30px #7c6cff44',
        transition: 'all 0.2s', letterSpacing: '0.02em',
      }}>
      {loading ? (
        <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <span style={{ width: 16, height: 16, border: '2px solid #ffffff55', borderTopColor: '#fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }}/>
          {typeof loading === 'string' ? loading : 'Please wait...'}
        </span>
      ) : label}
    </button>
  );

  const card = (
    <div style={{
      background: 'rgba(17,17,24,0.92)',
      backdropFilter: 'blur(24px)',
      border: '1px solid #2a2a35',
      borderRadius: 28,
      padding: '40px 36px',
      width: '100%',
      maxWidth: 440,
      boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 0 1px #7c6cff11',
      position: 'relative',
      zIndex: 1,
    }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: '2.5rem', marginBottom: 8, filter: 'drop-shadow(0 0 20px #7c6cff88)' }}>◈</div>
        <div style={{ fontFamily: "'Space Mono',monospace", fontSize: '1.5rem', fontWeight: 700, color: '#e8e8f0', letterSpacing: '-0.02em' }}>MiniStore</div>
        <div style={{ color: '#6b6b80', fontSize: '0.85rem', marginTop: 4 }}>
          {mode === 'login'    && 'Welcome back'}
          {mode === 'register' && 'Create your account'}
          {mode === 'verify'   && 'Verify your email'}
        </div>
      </div>

      {/* Mode tabs (login/register) */}
      {mode !== 'verify' && (
        <div style={{ display: 'flex', background: '#0a0a0f', borderRadius: 12, padding: 4, marginBottom: 28 }}>
          {[['login','Sign In'],['register','Create Account']].map(([m, lbl]) => (
            <button key={m} onClick={() => { setMode(m); clear(); }} type="button"
              style={{
                flex: 1, padding: '10px', borderRadius: 9, border: 'none', cursor: 'pointer',
                background: mode === m ? 'linear-gradient(135deg,#7c6cff,#a78bfa)' : 'transparent',
                color: mode === m ? '#fff' : '#6b6b80',
                fontFamily: "'DM Sans',sans-serif", fontWeight: 600, fontSize: '0.88rem',
                transition: 'all 0.2s', boxShadow: mode === m ? '0 4px 14px #7c6cff44' : 'none',
              }}>{lbl}</button>
          ))}
        </div>
      )}

      {/* Error / success banners */}
      {error && (
        <div style={{ background: '#f8717118', border: '1px solid #f8717144', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#f87171', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>⚠️</span> {error}
        </div>
      )}
      {success && (
        <div style={{ background: '#4ade8018', border: '1px solid #4ade8044', borderRadius: 10, padding: '10px 14px', marginBottom: 16, color: '#4ade80', fontSize: '0.85rem', display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>✅</span> {success}
        </div>
      )}

      {/* ── LOGIN FORM ── */}
      {mode === 'login' && (
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Field label="Email" type="email" value={loginEmail} onChange={setLoginEmail} placeholder="you@example.com" icon="📧"/>
          <Field label="Password" type="password" value={loginPass} onChange={setLoginPass} placeholder="Your password" icon="🔑"/>
          {primaryBtn('Sign In →', handleLogin)}
        </form>
      )}

      {/* ── REGISTER FORM ── */}
      {mode === 'register' && (
        <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar preview */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: '#0a0a0f', borderRadius: 12, border: '1px solid #2a2a35' }}>
            <div style={{ width: 56, height: 56, borderRadius: 16, background: `linear-gradient(135deg,${regColor}44,${regColor}22)`, border: `2px solid ${regColor}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>
              {regEmoji}
            </div>
            <div>
              <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: '0.9rem' }}>{regName || 'Your name'}</div>
              <div style={{ color: '#6b6b80', fontSize: '0.78rem' }}>{regEmail || 'email@example.com'}</div>
            </div>
          </div>
          <AvatarPicker emoji={regEmoji} color={regColor} onEmoji={setRegEmoji} onColor={setRegColor}/>
          <Field label="Full Name" value={regName} onChange={setRegName} placeholder="John Doe" icon="👤"/>
          <Field label="Email" type="email" value={regEmail} onChange={setRegEmail} placeholder="you@example.com" icon="📧"/>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Field label="Password" type="password" value={regPass} onChange={setRegPass} placeholder="Min. 6 characters" icon="🔑"/>
            <StrengthBar password={regPass}/>
          </div>
          <Field label="Confirm Password" type="password" value={regPass2} onChange={setRegPass2} placeholder="Same password again" icon="🔑"
            error={regPass2 && regPass !== regPass2 ? "Passwords don't match" : ''}/>
          {primaryBtn('Create Account →', handleRegister)}
        </form>
      )}

      {/* ── VERIFY FORM ── */}
      {mode === 'verify' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: 8 }}>📬</div>
            <div style={{ color: '#e8e8f0', fontWeight: 600, fontSize: '1rem' }}>Check your inbox</div>
            <div style={{ color: '#6b6b80', fontSize: '0.85rem', marginTop: 4 }}>
              We sent a 6-digit code to<br/>
              <strong style={{ color: '#7c6cff' }}>{pendingEmail}</strong>
            </div>
          </div>
          <CodeInput value={code} onChange={v => { setCode(v); clear(); }}/>
          <div style={{ width: '100%' }}>
            {primaryBtn('Verify & Enter →', handleVerify, code.length < 6)}
          </div>
          <button onClick={() => { setMode('register'); clear(); }} type="button"
            style={{ background: 'none', border: 'none', color: '#6b6b80', cursor: 'pointer', fontSize: '0.85rem', fontFamily: "'DM Sans',sans-serif" }}>
            ← Back to registration
          </button>
        </div>
      )}

      {/* Bottom note */}
      {mode === 'login' && (
        <p style={{ textAlign: 'center', color: '#6b6b80', fontSize: '0.82rem', marginTop: 20, marginBottom: 0 }}>
          No account?{' '}
          <button onClick={() => { setMode('register'); clear(); }} type="button"
            style={{ background: 'none', border: 'none', color: '#7c6cff', cursor: 'pointer', fontWeight: 600, fontFamily: "'DM Sans',sans-serif", fontSize: '0.82rem' }}>
            Create one →
          </button>
        </p>
      )}
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      position: 'relative', padding: '20px',
      background: 'radial-gradient(ellipse at 20% 50%, #7c6cff0d 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, #4ade800a 0%, transparent 60%), #0a0a0f',
    }}>
      <Particles/>
      <style>{`
        @keyframes spin { to { transform:rotate(360deg); } }
        input:-webkit-autofill { -webkit-box-shadow:0 0 0 1000px #0a0a0f inset !important; -webkit-text-fill-color:#e8e8f0 !important; }
        input { background-color: #0a0a0f !important; }
      `}</style>
      {card}
    </div>
  );
}
