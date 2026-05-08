const ICONS = {
  calculator: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="3"/><line x1="8" y1="7" x2="16" y2="7"/><circle cx="8.5" cy="12" r="0.5" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="0.5" fill="currentColor" stroke="none"/><circle cx="15.5" cy="12" r="0.5" fill="currentColor" stroke="none"/><circle cx="8.5" cy="16" r="0.5" fill="currentColor" stroke="none"/><circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="none"/><circle cx="15.5" cy="16" r="0.5" fill="currentColor" stroke="none"/></svg>,
  notes:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
  timer:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="13" r="8"/><polyline points="12 9 12 13 15 15"/><path d="M5 3 3 5M21 5l-2-2M12 1v2"/></svg>,
  url_shortener:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  task_scheduler:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><polyline points="9 16 11 18 15 14"/></svg>,
  smart_notes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  unit_converter:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/></svg>,
  expense_tracker:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  focus_mode:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2" fill="currentColor" stroke="none"/></svg>,
  file_organizer:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  system_monitor:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  music_player:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  weather:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  password_vault:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/></svg>,
  network_scanner:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><circle cx="12" cy="20" r="1" fill="currentColor" stroke="none"/></svg>,
  snake:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 8c0-2.2 1.8-4 4-4h10c2.2 0 4 1.8 4 4s-1.8 4-4 4H7"/><path d="M7 12c-2.2 0-4 1.8-4 4s1.8 4 4 4h4"/><circle cx="19" cy="6" r="1.2" fill="currentColor" stroke="none"/></svg>,
  tetris:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  memory:      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><rect x="6" y="7" width="4" height="6" rx="1"/><rect x="14" y="7" width="4" height="6" rx="1"/></svg>,
};

const DEFAULT_ICON = <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="3"/><circle cx="12" cy="12" r="4"/></svg>;

const CAT = {
  productivity: '#7c6cff',
  tools:        '#60a5fa',
  security:     '#f87171',
  games:        '#4ade80',
};

export default function AppCard({ app, onInstall, onUninstall, onRun, loading }) {
  const color = CAT[app.category] || '#7c6cff';
  const icon  = ICONS[app.name] || DEFAULT_ICON;
  const isDark = ['#4ade80','#fbbf24'].includes(color);

  return (
    <div
      style={{
        background:'#111118', border:'1px solid #1e1e2e', borderRadius:20,
        padding:'1.2rem', display:'flex', flexDirection:'column', gap:'0.9rem',
        transition:'all 0.2s', position:'relative', overflow:'hidden',
      }}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=color;e.currentTarget.style.transform='translateY(-3px)';e.currentTarget.style.boxShadow=`0 12px 40px ${color}18`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e1e2e';e.currentTarget.style.transform='none';e.currentTarget.style.boxShadow='none';}}>

      {/* Subtle gradient top accent */}
      <div style={{ position:'absolute', top:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${color}66, transparent)`, borderRadius:'20px 20px 0 0', opacity:0.6 }}/>

      {/* Header */}
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div style={{
          width:50, height:50, borderRadius:14,
          background:`linear-gradient(135deg,${color}20,${color}08)`,
          border:`1.5px solid ${color}30`,
          display:'flex', alignItems:'center', justifyContent:'center',
          color: color, flexShrink:0,
        }}>
          <span style={{ width:24, height:24, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon}</span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:4 }}>
          <span style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', color, background:`${color}18`, border:`1px solid ${color}28`, padding:'2px 8px', borderRadius:999 }}>
            {app.category}
          </span>
          <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.65rem', color:'#3a3a4a' }}>v{app.version}</span>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex:1 }}>
        <h3 style={{ fontSize:'0.98rem', fontWeight:700, color:'#e8e8f0', marginBottom:5, letterSpacing:'-0.01em' }}>{app.title}</h3>
        <p style={{ fontSize:'0.8rem', color:'#5a5a6a', lineHeight:1.55, margin:0 }}>{app.description}</p>
      </div>

      {/* Footer */}
      {app.installed ? (
        <div style={{ display:'flex', gap:'0.4rem' }}>
          <button onClick={() => onRun(app)} disabled={loading}
            style={{ flex:1, padding:'9px 0', borderRadius:10, border:'none', cursor:'pointer', background:`linear-gradient(135deg,${color},${color}cc)`, color: isDark?'#000':'#fff', fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:'0.82rem', display:'flex', alignItems:'center', justifyContent:'center', gap:6, transition:'opacity 0.15s', opacity:loading?0.6:1 }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            Open
          </button>
          <button onClick={() => onUninstall(app.id)} disabled={loading}
            style={{ padding:'9px 14px', borderRadius:10, border:'1px solid #1e1e2e', background:'transparent', color:'#4a4a5a', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:'0.78rem', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor='#f87171';e.currentTarget.style.color='#f87171';}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor='#1e1e2e';e.currentTarget.style.color='#4a4a5a';}}>
            Remove
          </button>
        </div>
      ) : (
        <button onClick={() => onInstall(app.id)} disabled={loading}
          style={{ width:'100%', padding:'10px 0', borderRadius:10, border:'none', cursor:loading?'not-allowed':'pointer', background:loading?'#1e1e2e':`linear-gradient(135deg,${color},${color}bb)`, color:(!loading&&isDark)?'#000':'#fff', fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:'0.85rem', display:'flex', alignItems:'center', justifyContent:'center', gap:7, transition:'all 0.2s', boxShadow:loading?'none':`0 4px 18px ${color}28`, opacity:loading?0.7:1 }}>
          {loading
            ? <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,0.3)',borderTopColor:'currentColor',borderRadius:'50%',animation:'spin 0.7s linear infinite',display:'inline-block'}}/>
            : <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
          }
          {loading ? 'Installing...' : 'Install'}
        </button>
      )}
    </div>
  );
}

