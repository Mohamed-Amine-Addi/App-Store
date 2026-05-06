import { useState } from 'react';
import { authUpdate, authChangePassword } from '../api';

const EMOJIS = ['👤','🦊','🐻','🐼','🦁','🐯','🐸','🤖','👽','🦄','🐉','⚡','🌟','🔥','💎'];
const COLORS  = ['#7c6cff','#4ade80','#60a5fa','#f87171','#fbbf24','#fb923c','#f472b6','#a78bfa'];

const inp = (extra={}) => ({
  width: '100%', padding: '12px 14px',
  background: '#0a0a0f', border: '1.5px solid #2a2a35', borderRadius: 10,
  color: '#e8e8f0', fontSize: '0.9rem', fontFamily: "'DM Sans',sans-serif",
  outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s',
  ...extra,
});

const btn = (bg='#7c6cff', fg='#fff', extra={}) => ({
  background: bg, color: fg, border: 'none', borderRadius: 10,
  padding: '12px 20px', fontFamily: "'DM Sans',sans-serif",
  fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer',
  transition: 'all 0.2s', ...extra,
});

export default function ProfileModal({ user, onClose, onLogout, onUpdate }) {
  const [tab, setTab]           = useState('profile');  // profile | security
  const [username, setUsername] = useState(user.username);
  const [bio, setBio]           = useState(user.bio || '');
  const [emoji, setEmoji]       = useState(user.avatar_emoji);
  const [color, setColor]       = useState(user.avatar_color);
  const [curPass, setCurPass]   = useState('');
  const [newPass, setNewPass]   = useState('');
  const [newPass2, setNewPass2] = useState('');
  const [saving, setSaving]     = useState(false);
  const [msg, setMsg]           = useState('');
  const [err, setErr]           = useState('');

  const clear = () => { setMsg(''); setErr(''); };

  const saveProfile = async () => {
    clear(); setSaving(true);
    try {
      const d = await authUpdate({ username, bio, avatar_emoji: emoji, avatar_color: color });
      setMsg('Profile updated successfully!');
      onUpdate(d.user);
    } catch(e) {
      setErr(e.response?.data?.error || 'Update failed.');
    } finally { setSaving(false); }
  };

  const changePass = async () => {
    clear();
    if (newPass !== newPass2) { setErr("New passwords don't match."); return; }
    if (newPass.length < 6)   { setErr("Password must be at least 6 characters."); return; }
    setSaving(true);
    try {
      const d = await authChangePassword({ current_password: curPass, new_password: newPass });
      setMsg(d.message); setCurPass(''); setNewPass(''); setNewPass2('');
    } catch(e) {
      setErr(e.response?.data?.error || 'Failed to change password.');
    } finally { setSaving(false); }
  };

  const joined = user.created_at ? new Date(user.created_at).toLocaleDateString('en-US',{ year:'numeric', month:'long', day:'numeric' }) : '';

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, padding:16 }}
      onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        background:'#111118', border:'1px solid #2a2a35', borderRadius:24, width:'100%', maxWidth:480,
        boxShadow:'0 32px 80px rgba(0,0,0,0.7)', overflow:'hidden', maxHeight:'90vh', display:'flex', flexDirection:'column',
        animation:'slideUp 0.3s cubic-bezier(0.175,0.885,0.32,1.275)',
      }}>
        <style>{`@keyframes slideUp{from{opacity:0;transform:translateY(30px)scale(0.96)}to{opacity:1;transform:none}}`}</style>

        {/* Hero banner */}
        <div style={{ background:`linear-gradient(135deg,${color}44,${color}22)`, padding:'28px 28px 0', position:'relative', borderBottom:`1px solid ${color}33` }}>
          {/* Close */}
          <button onClick={onClose} style={{ position:'absolute', top:16, right:16, background:'rgba(0,0,0,0.3)', border:'none', color:'#e8e8f0', width:32, height:32, borderRadius:'50%', cursor:'pointer', fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>

          <div style={{ display:'flex', gap:20, alignItems:'flex-end', paddingBottom:20 }}>
            {/* Avatar */}
            <div style={{ width:72, height:72, borderRadius:20, background:`linear-gradient(135deg,${color}66,${color}33)`, border:`3px solid ${color}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'2.2rem', flexShrink:0, boxShadow:`0 8px 30px ${color}44` }}>
              {emoji}
            </div>
            <div>
              <div style={{ color:'#e8e8f0', fontWeight:700, fontSize:'1.15rem' }}>{username}</div>
              <div style={{ color:'#9ca3af', fontSize:'0.82rem', marginTop:2 }}>{user.email}</div>
              {joined && <div style={{ color:'#6b6b80', fontSize:'0.75rem', marginTop:4 }}>Joined {joined}</div>}
            </div>
          </div>

          {/* Tabs */}
          <div style={{ display:'flex', gap:0, marginTop:4 }}>
            {[['profile','👤 Profile'],['security','🔑 Security']].map(([t,lbl])=>(
              <button key={t} onClick={()=>{setTab(t);clear();}} style={{
                flex:1, padding:'10px 0', background:'none', border:'none',
                borderBottom:`2px solid ${tab===t?color:'transparent'}`,
                color: tab===t?color:'#6b6b80',
                fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:'0.85rem', cursor:'pointer', transition:'all 0.2s'
              }}>{lbl}</button>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ padding:'24px 28px', overflowY:'auto', flex:1 }}>
          {/* Feedback */}
          {msg && <div style={{ background:'#4ade8018', border:'1px solid #4ade8044', borderRadius:10, padding:'10px 14px', marginBottom:16, color:'#4ade80', fontSize:'0.85rem' }}>✅ {msg}</div>}
          {err && <div style={{ background:'#f8717118', border:'1px solid #f8717144', borderRadius:10, padding:'10px 14px', marginBottom:16, color:'#f87171', fontSize:'0.85rem' }}>⚠️ {err}</div>}

          {tab === 'profile' && (
            <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
              {/* Emoji picker */}
              <div>
                <div style={{ color:'#9ca3af', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Avatar Emoji</div>
                <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                  {EMOJIS.map(e=>(
                    <button key={e} onClick={()=>setEmoji(e)} style={{ width:38, height:38, borderRadius:10, background:emoji===e?`${color}33`:'#0a0a0f', border:`2px solid ${emoji===e?color:'#2a2a35'}`, fontSize:'1.2rem', cursor:'pointer', transition:'all 0.15s', display:'flex', alignItems:'center', justifyContent:'center' }}>{e}</button>
                  ))}
                </div>
              </div>
              {/* Color picker */}
              <div>
                <div style={{ color:'#9ca3af', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em', marginBottom:10 }}>Avatar Color</div>
                <div style={{ display:'flex', gap:10 }}>
                  {COLORS.map(c=>(
                    <button key={c} onClick={()=>setColor(c)} style={{ width:28, height:28, borderRadius:'50%', background:c, border:`3px solid ${color===c?'#fff':'transparent'}`, cursor:'pointer', transition:'all 0.15s', transform:color===c?'scale(1.25)':'scale(1)' }}/>
                  ))}
                </div>
              </div>
              {/* Name */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ color:'#9ca3af', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Display Name</label>
                <input value={username} onChange={e=>setUsername(e.target.value)} style={inp()} onFocus={e=>e.target.style.borderColor=color} onBlur={e=>e.target.style.borderColor='#2a2a35'}/>
              </div>
              {/* Bio */}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ color:'#9ca3af', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Bio</label>
                <textarea value={bio} onChange={e=>setBio(e.target.value)} rows={3} placeholder="Tell us about yourself..." style={{ ...inp(), resize:'vertical', lineHeight:1.6 }} onFocus={e=>e.target.style.borderColor=color} onBlur={e=>e.target.style.borderColor='#2a2a35'}/>
              </div>

              <button onClick={saveProfile} disabled={saving} style={btn(`linear-gradient(135deg,${color},${color}cc)`,'#fff',{ width:'100%', padding:14, fontSize:'0.95rem', opacity:saving?0.7:1, boxShadow:`0 8px 24px ${color}44` })}>
                {saving ? 'Saving...' : '💾 Save Changes'}
              </button>
            </div>
          )}

          {tab === 'security' && (
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ color:'#9ca3af', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Current Password</label>
                <input type="password" value={curPass} onChange={e=>setCurPass(e.target.value)} style={inp()} placeholder="Enter current password"/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ color:'#9ca3af', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>New Password</label>
                <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} style={inp()} placeholder="Min. 6 characters"/>
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <label style={{ color:'#9ca3af', fontSize:'0.75rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Confirm New Password</label>
                <input type="password" value={newPass2} onChange={e=>setNewPass2(e.target.value)} style={inp()} placeholder="Same password again"/>
              </div>
              <button onClick={changePass} disabled={saving} style={btn('#60a5fa','#000',{ width:'100%', padding:14, fontSize:'0.95rem', opacity:saving?0.7:1 })}>
                {saving ? 'Changing...' : '🔑 Change Password'}
              </button>
            </div>
          )}
        </div>

        {/* Footer — logout */}
        <div style={{ padding:'16px 28px', borderTop:'1px solid #2a2a35', display:'flex', gap:12 }}>
          <button onClick={onClose} style={{ ...btn('#1a1a2e','#9ca3af'), flex:1, border:'1px solid #2a2a35', boxShadow:'none' }}>Cancel</button>
          <button onClick={onLogout} style={{ ...btn('#f8717122','#f87171'), flex:1, border:'1px solid #f8717144', boxShadow:'none', fontWeight:700 }}>
            🚪 Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}