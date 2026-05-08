import { useEffect, useState } from 'react';
import { getInstalledApps, uninstallApp } from '../api';
import AppCard from '../components/AppCard';
import RunModal from '../components/RunModal';

export default function MyApps({ refreshTrigger, onInstallChange }) {
  const [apps, setApps]             = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading]       = useState({});

  useEffect(() => { getInstalledApps().then(setApps); }, [refreshTrigger]);

  const handleUninstall = async (id) => {
    setLoading(l => ({...l, [id]: true}));
    try { await uninstallApp(id); setApps(p => p.filter(a => a.id !== id)); onInstallChange(); }
    finally { setLoading(l => ({...l, [id]: false})); }
  };

  return (
    <div className="page">
      <div className="page-header"><h1>My Apps</h1><p className="page-subtitle">{apps.length} app(s) installed</p></div>
      {apps.length === 0
        ? <div className="empty-state"><div className="empty-icon">📦</div><p>No apps installed yet.</p></div>
        : <div className="app-grid">{apps.map(app => <AppCard key={app.id} app={app} onInstall={() => {}} onUninstall={handleUninstall} onRun={setSelectedApp} loading={!!loading[app.id]} />)}</div>
      }
      {selectedApp && <RunModal app={selectedApp} onClose={() => setSelectedApp(null)} />}
    </div>
  );
}

