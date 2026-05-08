import { useState } from 'react';
import { authUpdate, authChangePassword } from '../api';

/* ─── Icons ─────────────────────────────────────────────────────────────── */
const ICONS = {
  user:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  lock:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  mail:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  edit:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
  shield: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  save:   <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>,
  logout: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>,
  x:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
  check:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"/></svg>,
  alert:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
  eye:    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>,
  eyeOff: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>,
  calendar:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
};

function Icon({ name, size=17, color='currentColor' }) {
  return <span style={{ display:'inline-flex', alignItems:'center', justifyContent:'center', width:size, height:size, color, flexShrink:0 }}>{ICONS[name]}</span>;
}

/* ─── Colors ────────────────────────────────────────────────────────────── */
const COLORS = ['#7c6cff','#4ade80','#60a5fa','#f87171','#fbbf24','#fb923c','#f472b6','#a78bfa','#34d399'];

/* ─── Avatar (initials-based) ────────────────────────────────────────────── */
function Avatar({ name, color, size=64, radius=18 }) {
  const initials = name ? name.trim().slice(0,2).toUpperCase() : 'U';
  return (
    <div style={{
      width:size, height:size, borderRadius:radius,
      background:`linear-gradient(135deg,${color},${color}99)`,
      border:`2.5px solid ${color}66`,
      display:'flex', alignItems:'center', justifyContent:'center',
      flexShrink:0, boxShadow:`0 6px 24px ${color}44`,
    }}>
      <span style={{ fontFamily:"'Space Mono',monospace", fontWeight:700, fontSize:size*0.3+'px', color:'#fff', letterSpacing:'-0.02em' }}>
        {initials}
      </span>
    </div>
  );
}

/* ─── Input ──────────────────────────────────────────────────────────────── */
function Input({ label, type='text', value, onChange, placeholder, iconName, readOnly=false }) {
  const [show, setShow] = useState(false);
  const [focused, setFocused] = useState(false);
  const isPass = type === 'password';

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
      {label && <label style={{ color:'#9ca3af', fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>}
      <div style={{ position:'relative' }}>
        {iconName && (
          <span style={{ position:'absolute', left:13, top:'50%', transform:'translateY(-50%)', color: focused?'#7c6cff':'#3a3a4a', transition:'color 0.2s', pointerEvents:'none' }}>
            <Icon name={iconName} size={15}/>
          </span>
        )}
        <input
          type={isPass?(show?'text':'password'):type}
          value={value}
          onChange={e=>onChange?.(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}
          style={{
            width:'100%', boxSizing:'border-box',
            padding:`12px ${isPass?'42px':'14px'} 12px ${iconName?'40px':'14px'}`,
            background: readOnly ? '#070710' : (focused?'#0d0d18':'#0a0a0f'),
            border:`1.5px solid ${focused&&!readOnly?'#7c6cff':'#1e1e30'}`,
            borderRadius:10, color: readOnly?'#4a4a5a':'#e8e8f0', fontSize:'0.88rem',
            fontFamily:"'Inter','DM Sans',sans-serif", outline:'none', transition:'all 0.2s',
            boxShadow: focused&&!readOnly ? '0 0 0 3px #7c6cff18' : 'none',
            cursor: readOnly ? 'default' : 'text',
          }}
        />
        {isPass && (
          <button onClick={()=>setShow(s=>!s)} type="button"
            style={{ position:'absolute', right:12, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#3a3a4a', display:'flex', padding:4 }}>
            <Icon name={show?'eyeOff':'eye'} size={15}/>
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── PROFILE MODAL ──────────────────────────────────────────────────────── */
export default function ProfileModal({ user, onClose, onLogout, onUpdate }) {
  const [tab, setTab]         = useState('profile');
  const [username, setName]   = useState(user.username);
  const [bio, setBio]         = useState(user.bio || '');
  const [color, setColor]     = useState(user.avatar_color);
  const [curPass, setCurPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [newPass2, setNewPas2]= useState('');
  const [saving, setSaving]   = useState(false);
  const [msg, setMsg]         = useState('');
  const [err, setErr]         = useState('');

  const clear = () => { setMsg(''); setErr(''); };

  const saveProfile = async () => {
    clear(); setSaving(true);
    try {
      const d = await authUpdate({ username, bio, avatar_emoji: user.avatar_emoji, avatar_color: color });
      setMsg('Profile updated successfully');
      onUpdate(d.user);
    } catch(e) { setErr(e.response?.data?.error || 'Update failed'); }
    finally { setSaving(false); }
  };

  const changePass = async () => {
    clear();
    if (!curPass)              { setErr('Current password is required'); return; }
    if (newPass.length < 6)    { setErr('Password must be at least 6 characters'); return; }
    if (newPass !== newPass2)  { setErr("Passwords don't match"); return; }
    setSaving(true);
    try {
      const d = await authChangePassword({ current_password: curPass, new_password: newPass });
      setMsg(d.message); setCurPass(''); setNewPass(''); setNewPas2('');
    } catch(e) { setErr(e.response?.data?.error || 'Failed to change password'); }
    finally { setSaving(false); }
  };

  const joined = user.created_at
    ? new Date(user.created_at).toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})
    : '';

  const tabs = [
    { id:'profile', label:'Profile',  icon:'edit'   },
    { id:'security',label:'Security', icon:'shield'  },
  ];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.8)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'#0d0d18', border:'1px solid #1e1e30', borderRadius:24,
        width:'100%', maxWidth:460, maxHeight:'90vh',
        display:'flex', flexDirection:'column',
        boxShadow:'0 32px 80px rgba(0,0,0,0.7)',
        animation:'modalIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
        overflow:'hidden',
      }}>
        <style>{`
          @keyframes modalIn { from{opacity:0;transform:translateY(24px)scale(0.97)} to{opacity:1;transform:none} }
          @keyframes spin { to { transform:rotate(360deg); } }
        `}</style>

        {/* ── Header banner ── */}
        <div style={{ background:`linear-gradient(135deg,${color}22,${color}0a)`, borderBottom:`1px solid ${color}22`, padding:'24px 24px 0' }}>
          {/* Close button */}
          <button onClick={onClose}
            style={{ position:'absolute', top:16, right:16, background:'#0d0d18', border:'1px solid #1e1e30', color:'#6b7280', width:32, height:32, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#f87171';e.currentTarget.style.color='#f87171';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e1e30';e.currentTarget.style.color='#6b7280';}}>
            <Icon name="x" size={15}/>
          </button>

          {/* User info */}
          <div style={{ display:'flex', gap:16, alignItems:'center', marginBottom:20 }}>
            <Avatar name={username} color={color} size={64} radius={18}/>
            <div>
              <div style={{ color:'#e8e8f0', fontWeight:700, fontSize:'1.05rem' }}>{username}</div>
              <div style={{ display:'flex', alignItems:'center', gap:6, color:'#6b7280', fontSize:'0.8rem', marginTop:3 }}>
                <Icon name="mail" size={13}/> {user.email}
              </div>
              {joined && (
                <div style={{ display:'flex', alignItems:'center', gap:6, color:'#3a3a4a', fontSize:'0.75rem', marginTop:3 }}>
                  <Icon name="calendar" size={12}/> Joined {joined}
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={()=>{setTab(t.id);clear();}}
                style={{
                  display:'flex', alignItems:'center', gap:7, padding:'10px 16px',
                  background:'none', border:'none', borderBottom:`2px solid ${tab===t.id?color:'transparent'}`,
                  color: tab===t.id ? color : '#4a4a5a', cursor:'pointer',
                  fontFamily:"'Inter','DM Sans',sans-serif", fontWeight:600, fontSize:'0.82rem',
                  transition:'all 0.2s', letterSpacing:'0.01em',
                }}>
                <Icon name={t.icon} size={14}/> {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding:'24px', overflowY:'auto', flex:1 }}>
          {msg && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#4ade8012', border:'1px solid #4ade8030', borderRadius:10, padding:'11px 14px', marginBottom:18, color:'#4ade80', fontSize:'0.84rem' }}>
              <Icon name="check" size={14}/> {msg}
            </div>
          )}
          {err && (
            <div style={{ display:'flex', alignItems:'center', gap:8, background:'#f8717112', border:'1px solid #f8717130', borderRadius:10, padding:'11px 14px', marginBottom:18, color:'#f87171', fontSize:'0.84rem' }}>
              <Icon name="alert" size={14}/> {err}
            </div>
          )}

          {/* ── PROFILE TAB ── */}
          {tab === 'profile' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              {/* Color picker */}
              <div>
                <div style={{ color:'#9ca3af', fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:10 }}>Profile Color</div>
                <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                  {COLORS.map(c => (
                    <button key={c} onClick={()=>setColor(c)} type="button"
                      style={{ width:28, height:28, borderRadius:'50%', background:c, border:`3px solid ${color===c?'#fff':'transparent'}`, cursor:'pointer', transition:'all 0.15s', transform:color===c?'scale(1.2)':'scale(1)', flexShrink:0 }}/>
                  ))}
                  {/* Live preview */}
                  <div style={{ marginLeft:'auto' }}>
                    <Avatar name={username} color={color} size={36} radius={10}/>
                  </div>
                </div>
              </div>

              {/* Email (readonly) */}
              <Input label="Email Address" value={user.email} iconName="mail" readOnly onChange={()=>{}}/>

              {/* Name */}
              <Input label="Display Name" value={username} onChange={setName} placeholder="Your name" iconName="user"/>

              {/* Bio */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ color:'#9ca3af', fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>Bio</label>
                <textarea value={bio} onChange={e=>setBio(e.target.value)} placeholder="Tell us a bit about yourself..." rows={3}
                  style={{ width:'100%', boxSizing:'border-box', padding:'12px 14px', background:'#0a0a0f', border:'1.5px solid #1e1e30', borderRadius:10, color:'#e8e8f0', fontSize:'0.88rem', fontFamily:"'Inter','DM Sans',sans-serif", outline:'none', resize:'vertical', lineHeight:1.6, transition:'border-color 0.2s' }}
                  onFocus={e=>e.target.style.borderColor='#7c6cff'}
                  onBlur={e=>e.target.style.borderColor='#1e1e30'}/>
              </div>

              <button onClick={saveProfile} disabled={saving}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'13px', background:`linear-gradient(135deg,${color},${color}bb)`, color:'#fff', border:'none', borderRadius:12, cursor:saving?'not-allowed':'pointer', fontFamily:"'Inter','DM Sans',sans-serif", fontWeight:700, fontSize:'0.9rem', opacity:saving?0.7:1, boxShadow:`0 6px 20px ${color}44`, transition:'all 0.2s' }}>
                {saving ? (
                  <><span style={{ width:15, height:15, border:'2px solid #ffffff30', borderTopColor:'#fff', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block'}}/> Saving...</>
                ) : (
                  <><Icon name="save" size={16}/> Save Changes</>
                )}
              </button>
            </div>
          )}

          {/* ── SECURITY TAB ── */}
          {tab === 'security' && (
            <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
              <div style={{ background:'#070710', border:'1px solid #1a1a28', borderRadius:12, padding:'14px 16px', display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:36, height:36, borderRadius:10, background:'#1a1a28', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  <Icon name="shield" size={18} color="#7c6cff"/>
                </div>
                <div>
                  <div style={{ color:'#e8e8f0', fontSize:'0.85rem', fontWeight:600 }}>Change Password</div>
                  <div style={{ color:'#4a4a5a', fontSize:'0.75rem', marginTop:2 }}>Use a strong password of at least 6 characters</div>
                </div>
              </div>

              <Input label="Current Password" type="password" value={curPass} onChange={setCurPass} placeholder="Enter current password" iconName="lock"/>
              <Input label="New Password" type="password" value={newPass} onChange={setNewPass} placeholder="At least 6 characters" iconName="lock"/>
              <Input label="Confirm New Password" type="password" value={newPass2} onChange={setNewPas2} placeholder="Same password again" iconName="lock"/>

              <button onClick={changePass} disabled={saving}
                style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, width:'100%', padding:'13px', background:'linear-gradient(135deg,#60a5fa,#3b82f6)', color:'#000', border:'none', borderRadius:12, cursor:saving?'not-allowed':'pointer', fontFamily:"'Inter','DM Sans',sans-serif", fontWeight:700, fontSize:'0.9rem', opacity:saving?0.7:1, boxShadow:'0 6px 20px #60a5fa44', transition:'all 0.2s' }}>
                {saving ? (
                  <><span style={{ width:15, height:15, border:'2px solid rgba(0,0,0,0.2)', borderTopColor:'#000', borderRadius:'50%', animation:'spin 0.7s linear infinite', display:'inline-block'}}/> Updating...</>
                ) : (
                  <><Icon name="shield" size={16}/> Update Password</>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{ padding:'16px 24px', borderTop:'1px solid #1a1a28', display:'flex', gap:10 }}>
          <button onClick={onClose}
            style={{ flex:1, padding:'11px', background:'transparent', border:'1px solid #1e1e30', color:'#6b7280', borderRadius:10, cursor:'pointer', fontFamily:"'Inter','DM Sans',sans-serif", fontWeight:600, fontSize:'0.85rem', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#2a2a3a';e.currentTarget.style.color='#9ca3af';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e1e30';e.currentTarget.style.color='#6b7280';}}>
            Cancel
          </button>
          <button onClick={onLogout}
            style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:7, padding:'11px', background:'#f8717112', border:'1px solid #f8717130', color:'#f87171', borderRadius:10, cursor:'pointer', fontFamily:"'Inter','DM Sans',sans-serif", fontWeight:700, fontSize:'0.85rem', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.background='#f8717122';e.currentTarget.style.borderColor='#f8717155';}}
            onMouseLeave={e=>{e.currentTarget.style.background='#f8717112';e.currentTarget.style.borderColor='#f8717130';}}>
            <Icon name="logout" size={15}/> Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
