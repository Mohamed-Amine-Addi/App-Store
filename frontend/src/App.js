import { useState, useEffect } from 'react';
import Navbar      from './components/Navbar';
import Store       from './pages/Store';
import MyApps      from './pages/MyApps';
import History     from './pages/History';
import AuthPage    from './pages/authPage';
import { getInstalledApps, authMe } from './api';
import './App.css';

export default function App() {
  const [user, setUser]               = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [page, setPage]               = useState('store');
  const [installedCount, setInstalledCount] = useState(0);
  const [refreshKey, setRefreshKey]   = useState(0);

  // Check existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('mas_token');
    if (token) {
      authMe()
        .then(d => setUser(d.user))
        .catch(() => localStorage.removeItem('mas_token'))
        .finally(() => setAuthChecked(true));
    } else {
      setAuthChecked(true);
    }
  }, []);

  const sync = () => {
    getInstalledApps().then(apps => setInstalledCount(apps.length));
    setRefreshKey(k => k + 1);
  };

  useEffect(() => {
    if (user) sync();
  }, [user]);

  const handleAuth = (u) => setUser(u);

  const handleLogout = () => {
    localStorage.removeItem('mas_token');
    setUser(null);
  };

  // Still checking token
  if (!authChecked) {
    return (
      <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0a0a0f' }}>
        <div style={{ color:'#7c6cff', fontFamily:"'Space Mono',monospace", fontSize:'1.5rem', filter:'drop-shadow(0 0 20px #7c6cff88)' }}>◈</div>
      </div>
    );
  }

  // Not authenticated
  if (!user) return <AuthPage onAuth={handleAuth}/>;

  // Authenticated
  return (
    <div className="app">
      <Navbar
        page={page}
        setPage={setPage}
        installedCount={installedCount}
        user={user}
        onLogout={handleLogout}
        onUpdateUser={u => setUser(u)}
      />
      <main className="main-content">
        {page === 'store'   && <Store    onInstallChange={sync} />}
        {page === 'myapps'  && <MyApps   refreshTrigger={refreshKey} onInstallChange={sync} />}
        {page === 'history' && <History  />}
      </main>
    </div>
  );
}