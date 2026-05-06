import { useState } from 'react';
import ProfileModal from './profileModal';

export default function Navbar({ page, setPage, installedCount, user, onLogout, onUpdateUser }) {
  const [showProfile, setShowProfile] = useState(false);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-icon">◈</span>
          <span className="brand-name">MiniStore</span>
        </div>
        <div className="navbar-links">
          {['store', 'myapps', 'history'].map(p => (
            <button key={p} className={`nav-btn ${page === p ? 'active' : ''}`} onClick={() => setPage(p)}>
              {p === 'myapps' ? 'My Apps' : p.charAt(0).toUpperCase() + p.slice(1)}
              {p === 'myapps' && installedCount > 0 && <span className="badge">{installedCount}</span>}
            </button>
          ))}
        </div>

        {/* Avatar button */}
        {user && (
          <button onClick={() => setShowProfile(true)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              background: `linear-gradient(135deg,${user.avatar_color}44,${user.avatar_color}22)`,
              border: `2px solid ${user.avatar_color}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1.1rem', cursor: 'pointer', transition: 'all 0.2s',
              flexShrink: 0, boxShadow: `0 0 12px ${user.avatar_color}44`,
            }}
            title={user.username}>
            {user.avatar_emoji}
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