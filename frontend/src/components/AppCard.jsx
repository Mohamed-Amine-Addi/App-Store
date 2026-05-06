export default function AppCard({ app, onInstall, onUninstall, onRun, loading }) {
  const colors = { productivity: '#4ade80', tools: '#60a5fa' };
  const color = colors[app.category] || '#a78bfa';

  return (
    <div className="app-card">
      <div className="app-card-header">
        <div className="app-icon" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
          {app.icon}
        </div>
        <div className="app-meta">
          <span className="app-category" style={{ color }}>{app.category}</span>
          <span className="app-version">v{app.version}</span>
        </div>
      </div>
      <div className="app-card-body">
        <h3 className="app-title">{app.title}</h3>
        <p className="app-description">{app.description}</p>
      </div>
      <div className="app-card-footer">
        {app.installed ? (
          <div className="app-actions">
            <button className="btn btn-run" onClick={() => onRun(app)} disabled={loading}>▶ Run</button>
            <button className="btn btn-uninstall" onClick={() => onUninstall(app.id)} disabled={loading}>Remove</button>
          </div>
        ) : (
          <button className="btn btn-install" onClick={() => onInstall(app.id)} disabled={loading}>
            {loading ? '...' : '↓ Install'}
          </button>
        )}
        {app.installed && <span className="installed-badge">● Installed</span>}
      </div>
    </div>
  );
}