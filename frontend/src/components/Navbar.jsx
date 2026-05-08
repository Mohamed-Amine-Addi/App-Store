import { useState } from 'react';
import ProfileModal from './profileModal';

function Avatar({ user, size=34 }) {
  const initials = user?.username ? user.username.trim().slice(0,2).toUpperCase() : 'U';
  const color    = user?.avatar_color || '#7c6cff';
  return (
    <div style={{
      width:size, height:size, borderRadius:10,
      background:`linear-gradient(135deg,${color},${color}99)`,
      border:`2px solid ${color}55`,
      display:'flex', alignItems:'center', justifyContent:'center',
      cursor:'pointer', flexShrink:0,
      boxShadow:`0 2px 12px ${color}33`,
      transition:'all 0.2s',
      fontFamily:"'Space Mono',monospace",
      fontWeight:700, fontSize:'0.7rem', color:'#fff',
      letterSpacing:'-0.02em',
    }}>
      {initials}
    </div>
  );
}

export default function Navbar({ page, setPage, installedCount, user, onLogout, onUpdateUser }) {
  const [showProfile, setShowProfile] = useState(false);

  const navItems = [
    { id:'store',   label:'Store'   },
    { id:'myapps',  label:'My Apps' },
    { id:'history', label:'History' },
  ];

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color:'#7c6cff' }}>
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
          <span className="brand-name">MiniStore</span>
        </div>

        <div className="navbar-links">
          {navItems.map(item => (
            <button key={item.id} className={`nav-btn ${page===item.id?'active':''}`} onClick={() => setPage(item.id)}>
              {item.label}
              {item.id==='myapps' && installedCount>0 && <span className="badge">{installedCount}</span>}
            </button>
          ))}
        </div>

        {user && (
          <button onClick={() => setShowProfile(true)}
            style={{ background:'none', border:'none', padding:0, cursor:'pointer', marginLeft:'auto' }}
            title={user.username}>
            <Avatar user={user}/>
          </button>
        )}
      </nav>

      {showProfile && (
        <ProfileModal
          user={user}
          onClose={() => setShowProfile(false)}
          onLogout={() => { setShowProfile(false); onLogout(); }}
          onUpdate={u => { onUpdateUser(u); }}
        />
      )}
    </>
  );
}
