import { useEffect, useState } from 'react';
import { getApps, getCategories, installApp, uninstallApp } from '../api';
import AppCard from '../components/AppCard';
import RunModal from '../components/RunModal';

export default function Store({ onInstallChange }) {
  const [apps, setApps]           = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [selectedApp, setSelectedApp] = useState(null);
  const [loading, setLoading]     = useState({});
  const [search, setSearch]       = useState('');

  useEffect(() => {
    Promise.all([getApps(), getCategories()]).then(([a, c]) => { setApps(a); setCategories(c); });
  }, []);

  const handleInstall = async (id) => {
    setLoading(l => ({...l, [id]: true}));
    try { const {app} = await installApp(id); setApps(p => p.map(a => a.id === id ? app : a)); onInstallChange(); }
    finally { setLoading(l => ({...l, [id]: false})); }
  };

  const handleUninstall = async (id) => {
    setLoading(l => ({...l, [id]: true}));
    try { await uninstallApp(id); setApps(p => p.map(a => a.id === id ? {...a, installed: false} : a)); onInstallChange(); }
    finally { setLoading(l => ({...l, [id]: false})); }
  };

  const filtered = apps.filter(a =>
    (activeCategory === 'all' || a.category === activeCategory) &&
    (a.title.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="page">
      <div className="page-header"><h1>App Store</h1><p className="page-subtitle">Discover and install mini applications</p></div>
      <div className="toolbar">
        <input className="search-input" placeholder="Search apps..." value={search} onChange={e => setSearch(e.target.value)} />
        <div className="category-pills">
          <button className={`pill ${activeCategory === 'all' ? 'active' : ''}`} onClick={() => setActiveCategory('all')}>All</button>
          {categories.map(c => <button key={c} className={`pill ${activeCategory === c ? 'active' : ''}`} onClick={() => setActiveCategory(c)}>{c}</button>)}
        </div>
      </div>
      <div className="app-grid">
        {filtered.map(app => <AppCard key={app.id} app={app} onInstall={handleInstall} onUninstall={handleUninstall} onRun={setSelectedApp} loading={!!loading[app.id]} />)}
      </div>
      {selectedApp && <RunModal app={selectedApp} onClose={() => setSelectedApp(null)} />}
    </div>
  );
}