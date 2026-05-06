import { useState, useEffect, useRef, useCallback } from 'react';
import { runApp } from '../api';

/* ─── FORMS for non-game apps (unchanged) ─────────────────────────────── */
const FORMS = {
  calculator: {
    fields: [
      { key: 'operation', label: 'Operation', type: 'select', options: ['add','subtract','multiply','divide'], default: 'add' },
      { key: 'a', label: 'Number A', type: 'number', default: 0 },
      { key: 'b', label: 'Number B', type: 'number', default: 0 },
    ],
    render: r => <div className="result-box"><div className="result-expression">{r.expression}</div><div className="result-value">{r.result}</div></div>
  },
  notes: {
    fields: [
      { key: 'action', label: 'Action', type: 'select', options: ['list','add','clear'], default: 'list' },
      { key: 'content', label: 'Content (for add)', type: 'text', default: '' },
    ],
    render: r => (
      <div className="result-box">
        {r.notes ? (r.notes.length === 0 ? <p className="result-empty">No notes yet.</p> : r.notes.map(n => <div key={n.id} className="note-item"><span className="note-date">{n.created_at}</span><p>{n.content}</p></div>)) : <p>{r.message}</p>}
      </div>
    )
  },
  timer: {
    fields: [
      { key: 'action', label: 'Action', type: 'select', options: ['start','format'], default: 'start' },
      { key: 'seconds', label: 'Seconds', type: 'number', default: 60 },
    ],
    render: r => <div className="result-box"><div className="result-value timer-display">{r.formatted}</div>{r.message && <p>{r.message}</p>}</div>
  },
  file_organizer: {
    fields: [
      { key: 'action', label: 'Action', type: 'select', options: ['scan','duplicates','history'], default: 'scan' },
      { key: 'path', label: 'Directory path (empty = demo)', type: 'text', default: '' },
    ],
    render: r => (
      <div className="result-box">
        <p>{r.message || `Found ${r.found} files`}</p>
        {r.breakdown && Object.entries(r.breakdown).map(([cat, files]) => (
          <div key={cat} className="note-item"><span className="note-date">{cat} ({files.length})</span><p>{files.join(', ')}</p></div>
        ))}
        {r.history && r.history.map((h, i) => <div key={i} className="note-item"><span className="note-date">{h.scanned_at}</span><p>{h.path} — {h.found} files</p></div>)}
      </div>
    )
  },
  system_monitor: {
    fields: [{ key: 'action', label: 'View', type: 'select', options: ['all','cpu','memory','disk'], default: 'all' }],
    render: r => (
      <div className="result-box">
        {r.cpu    && <div className="note-item"><span className="note-date">CPU</span><p>{r.cpu.cores} cores — {r.cpu.platform}</p></div>}
        {r.memory && <div className="note-item"><span className="note-date">RAM</span><p>{r.memory.used_mb} MB / {r.memory.total_mb} MB ({r.memory.percent}%)</p></div>}
        {r.disk   && <div className="note-item"><span className="note-date">Disk</span><p>{r.disk.used_gb} GB / {r.disk.total_gb} GB ({r.disk.percent}%)</p></div>}
      </div>
    )
  },
  password_vault: {
    fields: [
      { key: 'action', label: 'Action', type: 'select', options: ['list','add','get','search','delete'], default: 'list' },
      { key: 'account', label: 'Account name', type: 'text', default: '' },
      { key: 'password', label: 'Password (add)', type: 'text', default: '' },
      { key: 'search', label: 'Search term', type: 'text', default: '' },
      { key: 'master_key', label: 'Master key', type: 'text', default: 'default123' },
    ],
    render: r => (
      <div className="result-box">
        {r.message  && <p>{r.message}</p>}
        {r.accounts && r.accounts.map(a => <div key={a.id} className="note-item"><span className="note-date">#{a.id}</span><p>{a.account} — {a.added_at}</p></div>)}
        {r.password && <p>🔑 {r.password}</p>}
        {r.results  && r.results.map(a => <div key={a.id} className="note-item"><p>{a.account}</p></div>)}
      </div>
    )
  },
  url_shortener: {
    fields: [
      { key: 'action', label: 'Action', type: 'select', options: ['shorten','list','delete'], default: 'shorten' },
      { key: 'url', label: 'URL', type: 'text', default: '' },
    ],
    render: r => (
      <div className="result-box">
        {r.short  && <><p>{r.message}</p><div className="result-value" style={{fontSize:'1.2rem'}}>{r.short}</div><p className="result-expression">{r.original}</p></>}
        {r.links  && r.links.map(l => <div key={l.id} className="note-item"><span className="note-date">{l.short}</span><p>{l.original}</p></div>)}
        {r.message && !r.short && <p>{r.message}</p>}
      </div>
    )
  },
  task_scheduler: {
    fields: [
      { key: 'action',   label: 'Action',   type: 'select', options: ['list','add','complete','delete','clear'], default: 'list' },
      { key: 'title',    label: 'Task title', type: 'text', default: '' },
      { key: 'deadline', label: 'Deadline',   type: 'text', default: '' },
      { key: 'priority', label: 'Priority',   type: 'select', options: ['low','medium','high'], default: 'medium' },
      { key: 'task_id',  label: 'Task ID',    type: 'number', default: '' },
    ],
    render: r => (
      <div className="result-box">
        {r.message && <p>{r.message}</p>}
        {r.pending && r.pending.map(t => <div key={t.id} className="note-item"><span className="note-date">#{t.id} [{t.priority}]</span><p>{t.title}</p></div>)}
        {r.done    && r.done.map(t => <div key={t.id} className="note-item"><p>✅ {t.title}</p></div>)}
      </div>
    )
  },
  music_player: {
    fields: [
      { key: 'action', label: 'Action', type: 'select', options: ['playlist','play','volume','scan'], default: 'playlist' },
      { key: 'path',   label: 'Path',   type: 'text',   default: '' },
      { key: 'volume', label: 'Volume', type: 'number', default: 80 },
    ],
    render: r => (
      <div className="result-box">
        {r.status   && <div className="result-value" style={{fontSize:'1.2rem'}}>{r.status}</div>}
        {r.playlist && r.playlist.map(t => <div key={t.id} className="note-item"><span className="note-date">#{t.id}</span><p>{t.title}</p></div>)}
        {r.message  && <p>{r.message}</p>}
      </div>
    )
  },
  smart_notes: {
    fields: [
      { key: 'action',  label: 'Action',  type: 'select', options: ['list','add','search','clear'], default: 'list' },
      { key: 'content', label: 'Content', type: 'text',   default: '' },
      { key: 'search',  label: 'Search',  type: 'text',   default: '' },
    ],
    render: r => (
      <div className="result-box">
        {r.message && <p>{r.message}</p>}
        {r.notes   && r.notes.map(n => <div key={n.id} className="note-item"><span className="note-date">{n.created_at}</span><p>{n.content}</p></div>)}
        {r.results && r.results.map(n => <div key={n.id} className="note-item"><span className="note-date">{n.created_at}</span><p>{n.content}</p></div>)}
      </div>
    )
  },
  weather: {
    fields: [
      { key: 'action', label: 'View', type: 'select', options: ['current','forecast'], default: 'current' },
      { key: 'city',   label: 'City', type: 'text',   default: 'London' },
    ],
    render: r => (
      <div className="result-box">
        <div className="result-value" style={{fontSize:'2rem'}}>{r.temperature}</div>
        <p>{r.description}</p>
        <div className="note-item"><span className="note-date">Feels {r.feels_like} · Humidity {r.humidity} · Wind {r.wind}</span></div>
        {r.forecast && r.forecast.map((d,i) => <div key={i} className="note-item"><span className="note-date">{d.date}</span><p>{d.desc} · {d.min}–{d.max}</p></div>)}
      </div>
    )
  },
  network_scanner: {
    fields: [
      { key: 'action', label: 'Action', type: 'select', options: ['info','ping','scan'], default: 'info' },
      { key: 'target', label: 'Target IP (ping)', type: 'text', default: '' },
    ],
    render: r => (
      <div className="result-box">
        {r.hostname && <div className="note-item"><span className="note-date">Host</span><p>{r.hostname} — {r.local_ip}</p></div>}
        {r.status   && <p style={{color:r.alive?'#4ade80':'#f87171',fontWeight:600}}>{r.status}</p>}
        {r.devices  && r.devices.map((d,i) => <div key={i} className="note-item"><span className="note-date">{d.ip}</span><p>{d.hostname}</p></div>)}
      </div>
    )
  },
  unit_converter: {
    fields: [
      { key: 'category',  label: 'Category',  type: 'select', options: ['length','weight','temperature','speed','data'], default: 'length' },
      { key: 'value',     label: 'Value',      type: 'number', default: 1 },
      { key: 'from_unit', label: 'From unit',  type: 'text',   default: 'm' },
      { key: 'to_unit',   label: 'To unit',    type: 'text',   default: 'km' },
    ],
    render: r => <div className="result-box"><div className="result-value">{r.result}</div><div className="result-expression">{r.expression}</div></div>
  },
  expense_tracker: {
    fields: [
      { key: 'action',   label: 'Action',   type: 'select', options: ['list','add','stats','clear'], default: 'list' },
      { key: 'title',    label: 'Title',    type: 'text',   default: '' },
      { key: 'amount',   label: 'Amount',   type: 'number', default: 0 },
      { key: 'category', label: 'Category', type: 'select', options: ['food','transport','housing','health','entertainment','shopping','other'], default: 'other' },
    ],
    render: r => (
      <div className="result-box">
        {r.message      && <p>{r.message}</p>}
        {r.total !== undefined && !r.by_category && <div className="result-value">{r.total} €</div>}
        {r.expenses     && r.expenses.map(e => <div key={e.id} className="note-item"><span className="note-date">{e.date} · {e.category}</span><p>{e.title} — {e.amount}€</p></div>)}
        {r.by_category  && Object.entries(r.by_category).map(([c,a]) => <div key={c} className="note-item"><span className="note-date">{c}</span><p>{a}€</p></div>)}
      </div>
    )
  },
  focus_mode: {
    fields: [
      { key: 'action',   label: 'Action',        type: 'select', options: ['start','status','stop','history'], default: 'start' },
      { key: 'duration', label: 'Duration (min)', type: 'number', default: 25 },
      { key: 'label',    label: 'Label',          type: 'text',   default: 'Focus session' },
    ],
    render: r => (
      <div className="result-box">
        <div className="result-value timer-display">{r.formatted||r.remaining||''}</div>
        <p>{r.status}</p>
        {r.message && <p>{r.message}</p>}
      </div>
    )
  },
};

/* ─── GAME STYLES ──────────────────────────────────────────────────────── */
const G = {
  screen: {
    background:'linear-gradient(135deg,#0d0d1a 0%,#0a0f1e 100%)',
    borderRadius:16, padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1rem'
  },
  score: (color='#4ade80') => ({
    fontFamily:"'Space Mono',monospace", fontSize:'1.5rem', fontWeight:700, color,
    textShadow:`0 0 20px ${color}88`
  }),
  badge: (color='#4ade80') => ({
    background:`${color}18`, border:`1px solid ${color}44`, borderRadius:8,
    padding:'0.4rem 0.9rem', color, fontFamily:"'Space Mono',monospace",
    fontSize:'0.85rem', fontWeight:700
  }),
  btn: (bg='#7c6cff', fg='#fff') => ({
    background:bg, color:fg, border:'none', borderRadius:10, padding:'0.65rem 1.5rem',
    fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:'0.9rem', cursor:'pointer',
    transition:'all 0.2s', boxShadow:`0 4px 20px ${bg}55`
  }),
  dpad: {
    display:'grid', gridTemplateColumns:'repeat(3,44px)', gridTemplateRows:'repeat(3,44px)', gap:4
  }
};

/* ══════════════════════════════════════════════════════════════════
   🐍 SNAKE GAME  — full animated, no API calls during gameplay
══════════════════════════════════════════════════════════════════ */
function SnakeGame({ appName }) {
  const GRID = 20;
  const CELL = 17;
  const SIZE = GRID * CELL; // 340px

  const [phase,   setPhase]   = useState('menu');   // menu | playing | paused | dead
  const [snake,   setSnake]   = useState([[10,10]]);
  const [food,    setFood]    = useState([5,5]);
  const [bonus,   setBonus]   = useState(null);     // {pos, timer}
  const [score,   setScore]   = useState(0);
  const [level,   setLevel]   = useState(1);
  const [lives,   setLives]   = useState(3);
  const [combo,   setCombo]   = useState(0);
  const [flash,   setFlash]   = useState(null);     // particle effect
  const [lb,      setLb]      = useState([]);
  const [hiScore, setHiScore] = useState(0);

  const dirRef   = useRef([1, 0]);
  const snakeRef = useRef([[10,10]]);
  const foodRef  = useRef([5,5]);
  const bonusRef = useRef(null);
  const scoreRef = useRef(0);
  const levelRef = useRef(1);
  const comboRef = useRef(0);

  // Persist leaderboard
  const saveLb = useCallback(async (s, lv) => {
    try {
      await runApp(appName, { action: 'save_score', score: s, level: lv });
      const d = await runApp(appName, { action: 'leaderboard' });
      setLb(d.result.leaderboard || []);
    } catch(_) {}
  }, [appName]);

  useEffect(() => {
    runApp(appName, { action: 'leaderboard' })
      .then(d => {
        const scores = d.result.leaderboard || [];
        setLb(scores);
        if (scores.length) setHiScore(scores[0].score);
      }).catch(() => {});
  }, [appName]);

  const rndFood = useCallback((s) => {
    let f;
    do { f = [Math.floor(Math.random()*GRID), Math.floor(Math.random()*GRID)]; }
    while (s.some(c => c[0]===f[0] && c[1]===f[1]));
    return f;
  }, []);

  const startGame = useCallback(() => {
    const s = [[10,10],[10,11],[10,12]];
    const f = rndFood(s);
    snakeRef.current = s;
    foodRef.current  = f;
    dirRef.current   = [1, 0];
    scoreRef.current = 0;
    levelRef.current = 1;
    comboRef.current = 0;
    bonusRef.current = null;
    setSnake(s); setFood(f); setBonus(null);
    setScore(0); setLevel(1); setLives(3); setCombo(0);
    setPhase('playing');
  }, [rndFood]);

  // Keyboard
  useEffect(() => {
    const h = e => {
      const map = { ArrowUp:[0,-1], ArrowDown:[0,1], ArrowLeft:[-1,0], ArrowRight:[1,0] };
      if (map[e.key]) {
        e.preventDefault();
        const nd = map[e.key];
        if (nd[0] !== -dirRef.current[0] || nd[1] !== -dirRef.current[1])
          dirRef.current = nd;
      }
      if (e.key === ' ') {
        setPhase(p => p === 'playing' ? 'paused' : p === 'paused' ? 'playing' : p);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  // Game loop
  useEffect(() => {
    if (phase !== 'playing') return;
    const speed = Math.max(70, 160 - (levelRef.current - 1) * 15);
    const t = setInterval(() => {
      const s   = snakeRef.current;
      const d   = dirRef.current;
      const f   = foodRef.current;
      const bn  = bonusRef.current;
      const head = [(s[0][0]+d[0]+GRID)%GRID, (s[0][1]+d[1]+GRID)%GRID];

      // Collision with body
      if (s.some(c => c[0]===head[0] && c[1]===head[1])) {
        setPhase('dead');
        setFlash('💥');
        saveLb(scoreRef.current, levelRef.current);
        setHiScore(h => Math.max(h, scoreRef.current));
        return;
      }

      const ateFood  = head[0]===f[0]  && head[1]===f[1];
      const ateBonus = bn && head[0]===bn.pos[0] && head[1]===bn.pos[1];

      let ns;
      if (ateFood || ateBonus) {
        ns = [head, ...s];
      } else {
        ns = [head, ...s.slice(0, -1)];
      }
      snakeRef.current = ns;
      setSnake([...ns]);

      if (ateFood) {
        comboRef.current++;
        const pts = 10 * levelRef.current * (comboRef.current > 2 ? 2 : 1);
        scoreRef.current += pts;
        setScore(scoreRef.current);
        setCombo(comboRef.current);
        setFlash(comboRef.current >= 3 ? `🔥x${comboRef.current}` : '+' + pts);
        const nf = rndFood(ns);
        foodRef.current = nf;
        setFood([...nf]);
        // Level up every 50 pts
        const newLv = Math.floor(scoreRef.current / 80) + 1;
        if (newLv > levelRef.current) {
          levelRef.current = newLv;
          setLevel(newLv);
          setFlash('⬆️ LEVEL UP!');
        }
        // Spawn bonus every 5 foods
        if (scoreRef.current % 50 === 0) {
          const bp = rndFood([...ns, nf]);
          const bObj = { pos: bp, timer: 8 };
          bonusRef.current = bObj;
          setBonus({ ...bObj });
        }
      } else if (ateBonus) {
        const pts = 50 * levelRef.current;
        scoreRef.current += pts;
        setScore(scoreRef.current);
        setFlash(`⭐ +${pts}`);
        bonusRef.current = null;
        setBonus(null);
      } else {
        comboRef.current = 0;
        setCombo(0);
        // Bonus timeout countdown
        if (bn) {
          const nb = { ...bn, timer: bn.timer - 1 };
          if (nb.timer <= 0) { bonusRef.current = null; setBonus(null); }
          else { bonusRef.current = nb; setBonus({ ...nb }); }
        }
      }
    }, speed);
    return () => clearInterval(t);
  }, [phase, rndFood, saveLb]);

  // Flash clear
  useEffect(() => {
    if (!flash) return;
    const t = setTimeout(() => setFlash(null), 900);
    return () => clearTimeout(t);
  }, [flash]);

  const pressDir = (nd) => {
    if (nd[0] !== -dirRef.current[0] || nd[1] !== -dirRef.current[1])
      dirRef.current = nd;
  };

  // Snake gradient colors
  const snakeColor = (i, total) => {
    const t = i / Math.max(total, 1);
    const r = Math.round(74  + (139 - 74)  * t);
    const g = Math.round(222 + (90  - 222) * t);
    const b = Math.round(128 + (60  - 128) * t);
    return `rgb(${r},${g},${b})`;
  };

  if (phase === 'menu') return (
    <div style={{ ...G.screen, alignItems:'center', gap:'1.5rem', minHeight:420 }}>
      <div style={{ fontSize:'4rem', filter:'drop-shadow(0 0 20px #4ade8088)' }}>🐍</div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.8rem', fontWeight:700, color:'#4ade80', textShadow:'0 0 30px #4ade8088' }}>SNAKE</div>
        <div style={{ color:'#6b6b80', marginTop:4, fontSize:'0.85rem' }}>Eat 🔴 food · Avoid yourself</div>
      </div>
      {hiScore > 0 && <div style={G.badge('#fbbf24')}>🏆 Best: {hiScore}</div>}
      <button onClick={startGame} style={{ ...G.btn('#4ade80','#000'), fontSize:'1rem', padding:'0.75rem 2.5rem' }}>▶ Play</button>
      {lb.length > 0 && (
        <div style={{ width:'100%', background:'#0a0a0f', borderRadius:10, padding:'0.75rem 1rem' }}>
          <div style={{ color:'#6b6b80', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Leaderboard</div>
          {lb.slice(0,5).map((s,i) => (
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.25rem 0', borderBottom:'1px solid #1a1a25' }}>
              <span style={{ color:['#fbbf24','#9ca3af','#b45309','#6b6b80','#6b6b80'][i] }}>#{i+1}</span>
              <span style={{ fontFamily:"'Space Mono',monospace", color:'#e8e8f0', fontSize:'0.85rem' }}>{s.score} pts</span>
              <span style={{ color:'#6b6b80', fontSize:'0.75rem' }}>Lv.{s.level}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ ...G.screen, alignItems:'center' }}>
      {/* HUD */}
      <div style={{ display:'flex', gap:'0.75rem', width:'100%', justifyContent:'center', flexWrap:'wrap' }}>
        <div style={G.badge('#4ade80')}>Score {score}</div>
        <div style={G.badge('#7c6cff')}>Lv.{level}</div>
        <div style={G.badge('#fbbf24')}>Best {hiScore}</div>
        <div style={G.badge('#f87171')}>{'❤️'.repeat(lives)}</div>
        {combo >= 2 && <div style={G.badge('#fb923c')}>🔥 Combo x{combo}</div>}
      </div>

      {/* Flash */}
      {flash && (
        <div style={{ position:'absolute', fontFamily:"'Space Mono',monospace", fontSize:'1.2rem', fontWeight:700, color:'#fbbf24', textShadow:'0 0 20px #fbbf2499', pointerEvents:'none', zIndex:10, animation:'fadeUp 0.9s ease forwards' }}>
          {flash}
        </div>
      )}

      {/* Canvas */}
      <div style={{ position:'relative', border:'2px solid #2a2a35', borderRadius:12, overflow:'hidden', boxShadow:'0 0 40px #4ade8022' }}>
        <svg width={SIZE} height={SIZE} style={{ display:'block', background:'#05050f' }}>
          {/* Grid */}
          {Array.from({length:GRID}).flatMap((_,y)=>Array.from({length:GRID}).map((_,x)=>(
            <rect key={`g${x}-${y}`} x={x*CELL} y={y*CELL} width={CELL} height={CELL} fill="none" stroke="#0d0d1a" strokeWidth={0.5}/>
          )))}
          {/* Food glow */}
          <circle cx={food[0]*CELL+CELL/2} cy={food[1]*CELL+CELL/2} r={CELL*0.6} fill="#f8717122"/>
          <rect x={food[0]*CELL+2} y={food[1]*CELL+2} width={CELL-4} height={CELL-4} rx={4} fill="#f87171"/>
          {/* Bonus */}
          {bonus && (
            <g>
              <circle cx={bonus.pos[0]*CELL+CELL/2} cy={bonus.pos[1]*CELL+CELL/2} r={CELL*0.7} fill="#fbbf2433"/>
              <rect x={bonus.pos[0]*CELL+1} y={bonus.pos[1]*CELL+1} width={CELL-2} height={CELL-2} rx={5} fill="#fbbf24"/>
              <text x={bonus.pos[0]*CELL+CELL/2} y={bonus.pos[1]*CELL+CELL/2+4} textAnchor="middle" fontSize={10} fill="#000">⭐</text>
            </g>
          )}
          {/* Snake */}
          {snake.map((c, i) => (
            <g key={i}>
              {i > 0 && <circle cx={c[0]*CELL+CELL/2} cy={c[1]*CELL+CELL/2} r={CELL*0.45} fill={`${snakeColor(i,snake.length)}33`}/>}
              <rect x={c[0]*CELL+1} y={c[1]*CELL+1} width={CELL-2} height={CELL-2} rx={i===0?6:3}
                fill={snakeColor(i, snake.length)}
                opacity={Math.max(0.3, 1-i*0.025)}/>
              {i===0 && (
                <>
                  <circle cx={c[0]*CELL+4+(dirRef.current[0]===1?3:-1)} cy={c[1]*CELL+5+(dirRef.current[1]===1?3:-1)} r={2} fill="#000"/>
                  <circle cx={c[0]*CELL+CELL-4+(dirRef.current[0]===1?3:-1)} cy={c[1]*CELL+5+(dirRef.current[1]===1?3:-1)} r={2} fill="#000"/>
                </>
              )}
            </g>
          ))}
          {/* Pause overlay */}
          {phase === 'paused' && (
            <rect x={0} y={0} width={SIZE} height={SIZE} fill="#00000077"/>
          )}
          {phase === 'paused' && (
            <text x={SIZE/2} y={SIZE/2} textAnchor="middle" fill="#fff" fontFamily="'Space Mono',monospace" fontSize={20} fontWeight="bold">⏸ PAUSED</text>
          )}
          {phase === 'dead' && (
            <>
              <rect x={0} y={0} width={SIZE} height={SIZE} fill="#00000099"/>
              <text x={SIZE/2} y={SIZE/2-16} textAnchor="middle" fill="#f87171" fontFamily="'Space Mono',monospace" fontSize={18} fontWeight="bold">GAME OVER</text>
              <text x={SIZE/2} y={SIZE/2+12} textAnchor="middle" fill="#fbbf24" fontFamily="'Space Mono',monospace" fontSize={14}>Score: {score}</text>
            </>
          )}
        </svg>
      </div>

      {/* D-pad */}
      <div style={G.dpad}>
        {[['','↑',''],['←','','→'],['','↓','']].flat().map((k,i) => k ? (
          <button key={i} onClick={()=>pressDir({'↑':[0,-1],'↓':[0,1],'←':[-1,0],'→':[1,0]}[k])}
            style={{ ...G.btn('#1a1a2e'), border:'1px solid #2a2a35', width:44, height:44, borderRadius:10, padding:0, fontSize:'1.1rem', boxShadow:'none' }}>{k}</button>
        ) : <div key={i}/>)}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', gap:'0.75rem' }}>
        {phase === 'dead'
          ? <button onClick={startGame} style={G.btn('#4ade80','#000')}>🔄 Play Again</button>
          : <button onClick={()=>setPhase(p=>p==='playing'?'paused':'playing')} style={G.btn(phase==='paused'?'#4ade80':'#fbbf24','#000')}>
              {phase === 'paused' ? '▶ Resume' : '⏸ Pause'}
            </button>
        }
        <button onClick={()=>setPhase('menu')} style={{ ...G.btn('#1a1a2e'), border:'1px solid #2a2a35', boxShadow:'none' }}>Menu</button>
      </div>

      <div style={{ color:'#6b6b80', fontSize:'0.75rem', textAlign:'center' }}>Arrow keys to move · Space to pause</div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   🧱 TETRIS  — full game, animations, hold piece, next preview
══════════════════════════════════════════════════════════════════ */
function TetrisGame({ appName }) {
  const COLS=10, ROWS=20, CELL=22;

  const TETROMINOS = {
    I: { cells:[[0,0],[1,0],[2,0],[3,0]], color:'#60a5fa', glow:'#60a5fa55' },
    O: { cells:[[0,0],[1,0],[0,1],[1,1]], color:'#fbbf24', glow:'#fbbf2455' },
    T: { cells:[[1,0],[0,1],[1,1],[2,1]], color:'#a78bfa', glow:'#a78bfa55' },
    S: { cells:[[1,0],[2,0],[0,1],[1,1]], color:'#4ade80', glow:'#4ade8055' },
    Z: { cells:[[0,0],[1,0],[1,1],[2,1]], color:'#f87171', glow:'#f8717155' },
    L: { cells:[[2,0],[0,1],[1,1],[2,1]], color:'#fb923c', glow:'#fb923c55' },
    J: { cells:[[0,0],[0,1],[1,1],[2,1]], color:'#f472b6', glow:'#f472b655' },
  };
  const KEYS = Object.keys(TETROMINOS);
  const emptyBoard = () => Array.from({length:ROWS}, ()=>Array(COLS).fill(null));
  const rndPiece   = () => { const k=KEYS[Math.floor(Math.random()*KEYS.length)]; return {key:k,...TETROMINOS[k],x:3,y:0}; };

  const [board,    setBoard]    = useState(emptyBoard());
  const [piece,    setPiece]    = useState(null);
  const [next,     setNext]     = useState(null);
  const [held,     setHeld]     = useState(null);
  const [canHold,  setCanHold]  = useState(true);
  const [score,    setScore]    = useState(0);
  const [lines,    setLines]    = useState(0);
  const [level,    setLevel]    = useState(1);
  const [phase,    setPhase]    = useState('menu');
  const [clearing, setClearing] = useState([]);
  const [lb,       setLb]       = useState([]);
  const st = useRef({board:emptyBoard(),piece:null,next:null,held:null,canHold:true,score:0,lines:0,level:1});

  const loadLb = useCallback(() =>
    runApp(appName,{action:'leaderboard'}).then(d=>setLb(d.result.leaderboard||[])).catch(()=>{})
  ,[appName]);
  useEffect(()=>{ loadLb(); },[loadLb]);

  const valid = (cells, brd, px, py) =>
    cells.every(([cx,cy]) => {
      const nx=px+cx, ny=py+cy;
      return nx>=0 && nx<COLS && ny>=0 && ny<ROWS && !brd[ny]?.[nx];
    });

  const rotate90 = cells => {
    const max = Math.max(...cells.map(([,y])=>y));
    return cells.map(([x,y])=>[max-y,x]);
  };

  const ghostY = (p, brd) => {
    let gy = p.y;
    while (valid(p.cells, brd, p.x, gy+1)) gy++;
    return gy;
  };

  const merge = useCallback((brd, p) => {
    const nb = brd.map(r=>[...r]);
    p.cells.forEach(([cx,cy]) => { if(nb[p.y+cy]) nb[p.y+cy][p.x+cx] = p.color; });
    return nb;
  },[]);

  const lockPiece = useCallback((brd, p) => {
    const merged = merge(brd, p);
    const full = merged.reduce((acc,row,i) => row.every(Boolean) ? [...acc,i] : acc, []);

    if (full.length) {
      setClearing(full);
      setTimeout(() => {
        const cleared = full.length;
        const kept = merged.filter((_,i)=>!full.includes(i));
        const nb = [...Array(cleared).fill(null).map(()=>Array(COLS).fill(null)),...kept];
        const pts = [0,100,300,500,800][cleared]||0;
        const ns = st.current.score + pts * st.current.level;
        const nl = st.current.lines + cleared;
        const nlv = Math.floor(nl/10)+1;
        st.current.board=nb; st.current.score=ns; st.current.lines=nl; st.current.level=nlv;
        setBoard(nb); setScore(ns); setLines(nl); setLevel(nlv); setClearing([]);
        const np = st.current.next; st.current.next=rndPiece(); st.current.piece=np; st.current.canHold=true;
        setPiece({...np}); setNext({...st.current.next}); setCanHold(true);
        if (!valid(np.cells, nb, np.x, np.y)) {
          setPhase('dead');
          runApp(appName,{action:'save_score',score:ns,lines:nl,level:nlv}).then(loadLb).catch(()=>{});
        }
      }, 200);
    } else {
      st.current.board = merged;
      setBoard(merged);
      const np = st.current.next; st.current.next=rndPiece(); st.current.piece=np; st.current.canHold=true;
      setPiece({...np}); setNext({...st.current.next}); setCanHold(true);
      if (!valid(np.cells, merged, np.x, np.y)) {
        setPhase('dead');
        runApp(appName,{action:'save_score',score:st.current.score,lines:st.current.lines,level:st.current.level}).then(loadLb).catch(()=>{});
      }
    }
  },[merge,loadLb,appName]);

  const drop = useCallback(() => {
    const s = st.current;
    if (!s.piece) return;
    if (valid(s.piece.cells, s.board, s.piece.x, s.piece.y+1)) {
      const np = {...s.piece, y:s.piece.y+1};
      s.piece=np; setPiece({...np});
    } else {
      lockPiece(s.board, s.piece);
    }
  },[lockPiece]);

  useEffect(()=>{
    if(phase!=='playing')return;
    const spd=Math.max(100,800-(level-1)*70);
    const t=setInterval(drop,spd);
    return()=>clearInterval(t);
  },[phase,level,drop]);

  useEffect(()=>{
    if(phase!=='playing')return;
    const h=e=>{
      const s=st.current; if(!s.piece)return;
      if(e.key==='ArrowLeft'){
        if(valid(s.piece.cells,s.board,s.piece.x-1,s.piece.y)){const np={...s.piece,x:s.piece.x-1};s.piece=np;setPiece({...np});}
      } else if(e.key==='ArrowRight'){
        if(valid(s.piece.cells,s.board,s.piece.x+1,s.piece.y)){const np={...s.piece,x:s.piece.x+1};s.piece=np;setPiece({...np});}
      } else if(e.key==='ArrowDown'){
        drop();
      } else if(e.key===' '||e.key==='ArrowUp'){
        e.preventDefault();
        const rc=rotate90(s.piece.cells);
        if(valid(rc,s.board,s.piece.x,s.piece.y)){const np={...s.piece,cells:rc};s.piece=np;setPiece({...np});}
      } else if(e.key==='ArrowUp'&&e.shiftKey||e.key==='c'||e.key==='C'){
        // Hard drop
        const gy=ghostY(s.piece,s.board);
        const np={...s.piece,y:gy};s.piece=np;setPiece({...np});
        setTimeout(()=>lockPiece(s.board,np),10);
      } else if(e.key==='p'||e.key==='P'){
        setPhase(p=>p==='playing'?'paused':'playing');
      }
    };
    window.addEventListener('keydown',h);
    return()=>window.removeEventListener('keydown',h);
  },[phase,drop,lockPiece]);

  const hardDrop = () => {
    const s = st.current; if(!s.piece)return;
    const gy = ghostY(s.piece, s.board);
    const np = {...s.piece, y:gy}; s.piece=np; setPiece({...np});
    setTimeout(()=>lockPiece(s.board,np),10);
  };

  const holdPiece = () => {
    const s = st.current; if(!s.piece||!s.canHold)return;
    if (s.held) {
      const swap = {...s.held, x:3, y:0};
      s.held = {key:s.piece.key,...TETROMINOS[s.piece.key]};
      s.piece = swap; s.canHold=false;
      setPiece({...swap}); setHeld({...s.held}); setCanHold(false);
    } else {
      s.held = {key:s.piece.key,...TETROMINOS[s.piece.key]};
      const np=s.next; s.next=rndPiece(); s.piece=np; s.canHold=false;
      setHeld({...s.held}); setPiece({...np}); setNext({...s.next}); setCanHold(false);
    }
  };

  const startGame = () => {
    const b=emptyBoard(); const p=rndPiece(); const nx=rndPiece();
    st.current={board:b,piece:p,next:nx,held:null,canHold:true,score:0,lines:0,level:1};
    setBoard(b);setPiece(p);setNext(nx);setHeld(null);setCanHold(true);
    setScore(0);setLines(0);setLevel(1);setClearing([]);setPhase('playing');
  };

  const display = piece ? merge(board, piece) : board;
  const ghost   = piece ? ghostY(piece, board) : null;

  const miniGrid = (p, size=4) => {
    if(!p) return null;
    const cells = p.cells;
    const minX=Math.min(...cells.map(([x])=>x)), minY=Math.min(...cells.map(([,y])=>y));
    const grid = Array.from({length:size},()=>Array(size).fill(null));
    cells.forEach(([cx,cy])=>{ if(grid[cy-minY]) grid[cy-minY][cx-minX]=p.color; });
    return grid;
  };

  const PiecePreview = ({p, label, dim=false}) => {
    const g = miniGrid(p);
    if(!g) return <div style={{ background:'#0a0a0f', borderRadius:8, padding:'0.5rem', minHeight:70 }}><div style={{color:'#6b6b80',fontSize:'0.72rem'}}>{label}</div><div style={{color:'#2a2a35',fontSize:'0.8rem',textAlign:'center',paddingTop:8}}>—</div></div>;
    return (
      <div style={{ background:'#0a0a0f', borderRadius:8, padding:'0.5rem', opacity:dim?0.4:1 }}>
        <div style={{color:'#6b6b80',fontSize:'0.72rem',marginBottom:4}}>{label}</div>
        <svg width={g[0].length*14} height={g.length*14}>
          {g.map((row,y)=>row.map((c,x)=> c
            ? <rect key={`${x}-${y}`} x={x*14+1} y={y*14+1} width={12} height={12} rx={3} fill={c} opacity={0.9}/>
            : null
          ))}
        </svg>
      </div>
    );
  };

  if (phase === 'menu') return (
    <div style={{ ...G.screen, alignItems:'center', gap:'1.5rem', minHeight:420 }}>
      <div style={{ fontSize:'3.5rem', filter:'drop-shadow(0 0 20px #7c6cff88)' }}>🧱</div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.8rem', fontWeight:700, color:'#7c6cff', textShadow:'0 0 30px #7c6cff88' }}>TETRIS</div>
        <div style={{ color:'#6b6b80', marginTop:4, fontSize:'0.85rem' }}>Stack blocks · Clear lines · Level up</div>
      </div>
      <button onClick={startGame} style={{ ...G.btn('#7c6cff'), fontSize:'1rem', padding:'0.75rem 2.5rem' }}>▶ Play</button>
      {lb.length>0 && (
        <div style={{ width:'100%', background:'#0a0a0f', borderRadius:10, padding:'0.75rem 1rem' }}>
          <div style={{ color:'#6b6b80', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Leaderboard</div>
          {lb.slice(0,5).map((s,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.25rem 0', borderBottom:'1px solid #1a1a25' }}>
              <span style={{ color:['#fbbf24','#9ca3af','#b45309','#6b6b80','#6b6b80'][i] }}>#{i+1}</span>
              <span style={{ fontFamily:"'Space Mono',monospace", color:'#e8e8f0', fontSize:'0.85rem' }}>{s.score}</span>
              <span style={{ color:'#6b6b80', fontSize:'0.75rem' }}>Lv.{s.level} · {s.lines}L</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ ...G.screen, alignItems:'center' }}>
      <div style={{ display:'flex', gap:'0.75rem', alignItems:'flex-start' }}>
        {/* Side panel left */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', minWidth:80 }}>
          <PiecePreview p={held} label="HOLD" dim={!canHold}/>
          <div style={{ background:'#0a0a0f', borderRadius:8, padding:'0.5rem' }}>
            <div style={{ color:'#6b6b80', fontSize:'0.72rem' }}>SCORE</div>
            <div style={{ fontFamily:"'Space Mono',monospace", color:'#7c6cff', fontWeight:700, fontSize:'0.95rem' }}>{score}</div>
          </div>
          <div style={{ background:'#0a0a0f', borderRadius:8, padding:'0.5rem' }}>
            <div style={{ color:'#6b6b80', fontSize:'0.72rem' }}>LINES</div>
            <div style={{ fontFamily:"'Space Mono',monospace", color:'#4ade80', fontWeight:700, fontSize:'0.95rem' }}>{lines}</div>
          </div>
          <div style={{ background:'#0a0a0f', borderRadius:8, padding:'0.5rem' }}>
            <div style={{ color:'#6b6b80', fontSize:'0.72rem' }}>LEVEL</div>
            <div style={{ fontFamily:"'Space Mono',monospace", color:'#fbbf24', fontWeight:700, fontSize:'0.95rem' }}>{level}</div>
          </div>
        </div>

        {/* Board */}
        <div style={{ border:'2px solid #2a2a35', borderRadius:8, overflow:'hidden', boxShadow:'0 0 40px #7c6cff22' }}>
          <svg width={COLS*CELL} height={ROWS*CELL} style={{ display:'block', background:'#05050f' }}>
            {display.map((row,y)=>row.map((c,x)=>{
              const isClearing = clearing.includes(y);
              return (
                <g key={`${x}-${y}`}>
                  <rect x={x*CELL+1} y={y*CELL+1} width={CELL-2} height={CELL-2} rx={3}
                    fill={isClearing?'#fff':(c||'#0d0d1a')}
                    stroke={c?'rgba(255,255,255,0.12)':'#131320'}
                    strokeWidth={0.5}
                    opacity={isClearing?0.9:1}/>
                  {c && !isClearing && <rect x={x*CELL+2} y={y*CELL+2} width={CELL*0.4} height={3} rx={1} fill="rgba(255,255,255,0.25)"/>}
                </g>
              );
            }))}
            {/* Ghost */}
            {piece && ghost !== null && ghost !== piece.y && piece.cells.map(([cx,cy],i)=>(
              <rect key={`gh${i}`} x={(piece.x+cx)*CELL+2} y={(ghost+cy)*CELL+2} width={CELL-4} height={CELL-4} rx={3}
                fill="none" stroke={piece.color} strokeWidth={1} opacity={0.3}/>
            ))}
            {phase==='paused' && <rect x={0} y={0} width={COLS*CELL} height={ROWS*CELL} fill="#00000088"/>}
            {phase==='paused' && <text x={COLS*CELL/2} y={ROWS*CELL/2} textAnchor="middle" fill="#fff" fontFamily="'Space Mono',monospace" fontSize={16} fontWeight="bold">⏸ PAUSED</text>}
            {phase==='dead'   && <rect x={0} y={0} width={COLS*CELL} height={ROWS*CELL} fill="#00000099"/>}
            {phase==='dead'   && <text x={COLS*CELL/2} y={ROWS*CELL/2-14} textAnchor="middle" fill="#f87171" fontFamily="'Space Mono',monospace" fontSize={16} fontWeight="bold">GAME OVER</text>}
            {phase==='dead'   && <text x={COLS*CELL/2} y={ROWS*CELL/2+10} textAnchor="middle" fill="#fbbf24" fontFamily="'Space Mono',monospace" fontSize={12}>Score: {score}</text>}
          </svg>
        </div>

        {/* Side panel right */}
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', minWidth:80 }}>
          <PiecePreview p={next} label="NEXT"/>
          <div style={{ color:'#6b6b80', fontSize:'0.68rem', lineHeight:1.8, background:'#0a0a0f', borderRadius:8, padding:'0.5rem' }}>
            <div style={{ color:'#e8e8f0', fontWeight:600, fontSize:'0.72rem', marginBottom:4 }}>KEYS</div>
            ←→ Move{'\n'}↓ Soft{'\n'}↑/Spc Rotate{'\n'}P Pause
          </div>
        </div>
      </div>

      <div style={{ display:'flex', gap:'0.5rem', flexWrap:'wrap', justifyContent:'center' }}>
        <button onClick={hardDrop} style={{ ...G.btn('#60a5fa','#000'), padding:'0.5rem 1rem', fontSize:'0.8rem' }}>⬇ Hard Drop</button>
        <button onClick={holdPiece} disabled={!canHold} style={{ ...G.btn(canHold?'#a78bfa':'#2a2a35','#fff'), padding:'0.5rem 1rem', fontSize:'0.8rem', boxShadow:'none', opacity:canHold?1:0.4 }}>📦 Hold</button>
        {phase==='dead'
          ? <button onClick={startGame} style={G.btn('#4ade80','#000')}>🔄 Restart</button>
          : <button onClick={()=>setPhase(p=>p==='playing'?'paused':'playing')} style={G.btn(phase==='paused'?'#4ade80':'#fbbf24','#000')}>
              {phase==='paused'?'▶ Resume':'⏸ Pause'}
            </button>
        }
        <button onClick={()=>setPhase('menu')} style={{ ...G.btn('#1a1a2e'), border:'1px solid #2a2a35', boxShadow:'none' }}>Menu</button>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   🃏 MEMORY CARDS  — animated flip, themes, timer, combos
══════════════════════════════════════════════════════════════════ */
function MemoryGame({ appName }) {
  const CARD_SETS = {
    animals:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸'],
    food:   ['🍎','🍊','🍋','🍇','🍓','🍑','🥝','🍒','🥭','🍍','🥥','🍌'],
    sports: ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🥊'],
  };

  const [phase,   setPhase]   = useState('menu');
  const [theme,   setTheme]   = useState('animals');
  const [pairs,   setPairs]   = useState(8);
  const [deck,    setDeck]    = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves,   setMoves]   = useState(0);
  const [time,    setTime]    = useState(0);
  const [combo,   setCombo]   = useState(0);
  const [bestCombo,setBestC]  = useState(0);
  const [wrong,   setWrong]   = useState([]);   // shake animation
  const [lb,      setLb]      = useState([]);
  const lock = useRef(false);

  const loadLb = useCallback(()=>
    runApp(appName,{action:'leaderboard'}).then(d=>setLb(d.result.leaderboard||[])).catch(()=>{})
  ,[appName]);
  useEffect(()=>{ loadLb(); },[loadLb]);

  useEffect(()=>{
    if(phase!=='playing')return;
    const t=setInterval(()=>setTime(s=>s+1),1000);
    return()=>clearInterval(t);
  },[phase]);

  const startGame = () => {
    const cards = CARD_SETS[theme].slice(0, pairs);
    const d = [...cards,...cards]
      .map((emoji,i)=>({id:i,emoji}))
      .sort(()=>Math.random()-0.5);
    setDeck(d); setFlipped([]); setMatched([]); setWrong([]);
    setMoves(0); setTime(0); setCombo(0); setBestC(0);
    setPhase('playing'); lock.current=false;
  };

  const flip = (idx) => {
    if (lock.current||flipped.includes(idx)||matched.some(m=>m===idx)) return;
    const nf = [...flipped, idx];
    setFlipped(nf);

    if (nf.length === 2) {
      lock.current = true;
      const nm = moves+1; setMoves(nm);

      if (deck[nf[0]].emoji === deck[nf[1]].emoji) {
        // Match!
        const nc = combo+1; const nbc = Math.max(bestCombo, nc);
        setCombo(nc); setBestC(nbc);
        setTimeout(()=>{
          setMatched(m=>[...m,...nf]);
          setFlipped([]);
          lock.current=false;
          if (matched.length+2 === deck.length) {
            setPhase('won');
            runApp(appName,{action:'save_score',moves:nm,time_s:time,pairs}).then(loadLb).catch(()=>{});
          }
        },400);
      } else {
        // Miss
        setCombo(0);
        setWrong([...nf]);
        setTimeout(()=>{ setFlipped([]); setWrong([]); lock.current=false; },900);
      }
    }
  };

  const fmt = s => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;

  const cols = pairs<=6?3:4;
  const cardW = pairs<=6?70:56;

  if (phase === 'menu') return (
    <div style={{ ...G.screen, alignItems:'center', gap:'1.25rem', minHeight:420 }}>
      <div style={{ fontSize:'3.5rem', filter:'drop-shadow(0 0 20px #f472b688)' }}>🃏</div>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontFamily:"'Space Mono',monospace", fontSize:'1.8rem', fontWeight:700, color:'#f472b6', textShadow:'0 0 30px #f472b688' }}>MEMORY</div>
        <div style={{ color:'#6b6b80', marginTop:4, fontSize:'0.85rem' }}>Find all matching pairs!</div>
      </div>
      <div style={{ width:'100%' }}>
        <div style={{ color:'#6b6b80', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Theme</div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {Object.keys(CARD_SETS).map(t=>(
            <button key={t} onClick={()=>setTheme(t)} style={{ ...G.btn(theme===t?'#f472b6':' #1a1a2e'), border:`1px solid ${theme===t?'#f472b6':'#2a2a35'}`, flex:1, boxShadow:'none', textTransform:'capitalize', color:theme===t?'#000':'#e8e8f0' }}>{t}</button>
          ))}
        </div>
      </div>
      <div style={{ width:'100%' }}>
        <div style={{ color:'#6b6b80', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Pairs</div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          {[4,6,8,10,12].map(p=>(
            <button key={p} onClick={()=>setPairs(p)} style={{ ...G.btn(pairs===p?'#4ade80':'#1a1a2e', pairs===p?'#000':'#e8e8f0'), border:`1px solid ${pairs===p?'#4ade80':'#2a2a35'}`, flex:1, boxShadow:'none' }}>{p}</button>
          ))}
        </div>
      </div>
      <button onClick={startGame} style={{ ...G.btn('#f472b6','#000'), fontSize:'1rem', padding:'0.75rem 2.5rem', width:'100%' }}>🃏 Start Game</button>
      {lb.length>0&&(
        <div style={{ width:'100%', background:'#0a0a0f', borderRadius:10, padding:'0.75rem 1rem' }}>
          <div style={{ color:'#6b6b80', fontSize:'0.72rem', textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Best Runs</div>
          {lb.slice(0,3).map((s,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'0.25rem 0', borderBottom:'1px solid #1a1a25' }}>
              <span style={{ color:['#fbbf24','#9ca3af','#b45309'][i] }}>#{i+1}</span>
              <span style={{ fontFamily:"'Space Mono',monospace", color:'#e8e8f0', fontSize:'0.85rem' }}>{s.moves} moves</span>
              <span style={{ color:'#6b6b80', fontSize:'0.75rem' }}>{fmt(s.time_s)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div style={{ ...G.screen, alignItems:'center' }}>
      {/* HUD */}
      <div style={{ display:'flex', gap:'0.6rem', flexWrap:'wrap', justifyContent:'center' }}>
        <div style={G.badge('#7c6cff')}>Moves {moves}</div>
        <div style={G.badge('#60a5fa')}>⏱ {fmt(time)}</div>
        <div style={G.badge('#4ade80')}>{matched.length/2}/{pairs} pairs</div>
        {combo>=2&&<div style={G.badge('#fb923c')}>🔥 Combo x{combo}</div>}
        {bestCombo>=2&&<div style={G.badge('#fbbf24')}>⭐ Best combo x{bestCombo}</div>}
      </div>

      {phase==='won'&&(
        <div style={{ background:'linear-gradient(135deg,#4ade8022,#7c6cff22)', border:'1px solid #4ade8044', borderRadius:12, padding:'1rem', textAlign:'center', width:'100%' }}>
          <div style={{ fontSize:'2rem' }}>🎉</div>
          <div style={{ fontFamily:"'Space Mono',monospace", color:'#4ade80', fontWeight:700, fontSize:'1.1rem' }}>Completed!</div>
          <div style={{ color:'#6b6b80', fontSize:'0.85rem', marginTop:4 }}>{moves} moves · {fmt(time)} · Best combo x{bestCombo}</div>
        </div>
      )}

      {/* Card grid */}
      <div style={{ display:'grid', gridTemplateColumns:`repeat(${cols},${cardW}px)`, gap:8 }}>
        {deck.map((card,i)=>{
          const isFlipped  = flipped.includes(i)||matched.includes(i);
          const isMatched  = matched.includes(i);
          const isWrong    = wrong.includes(i);
          return (
            <div key={i} onClick={()=>flip(i)}
              style={{ width:cardW, height:cardW, cursor:'pointer', perspective:600,
                animation: isWrong ? 'shake 0.4s ease' : undefined }}>
              <div style={{
                position:'relative', width:'100%', height:'100%',
                transformStyle:'preserve-3d',
                transition:'transform 0.45s cubic-bezier(0.175,0.885,0.32,1.275)',
                transform: isFlipped?'rotateY(180deg)':'rotateY(0deg)',
              }}>
                {/* Back */}
                <div style={{
                  position:'absolute', inset:0, backfaceVisibility:'hidden',
                  background:'linear-gradient(135deg,#1a1a2e,#16213e)',
                  border:'2px solid #2a2a35', borderRadius:10,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:'1.4rem', color:'#2a2a35'
                }}>?</div>
                {/* Front */}
                <div style={{
                  position:'absolute', inset:0, backfaceVisibility:'hidden',
                  background: isMatched
                    ? 'linear-gradient(135deg,#4ade8022,#22c55e33)'
                    : isWrong
                      ? 'linear-gradient(135deg,#f8717122,#dc262633)'
                      : 'linear-gradient(135deg,#1e1e3a,#252545)',
                  border: `2px solid ${isMatched?'#4ade80':isWrong?'#f87171':'#7c6cff66'}`,
                  borderRadius:10, transform:'rotateY(180deg)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize: cardW>60?'1.8rem':'1.4rem',
                  boxShadow: isMatched?'0 0 15px #4ade8055':'none',
                  transition:'all 0.3s'
                }}>{card.emoji}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ display:'flex', gap:'0.5rem' }}>
        <button onClick={startGame} style={{ ...G.btn('#1a1a2e'), border:'1px solid #2a2a35', boxShadow:'none' }}>↺ New Game</button>
        <button onClick={()=>setPhase('menu')} style={{ ...G.btn('#1a1a2e'), border:'1px solid #2a2a35', boxShadow:'none' }}>Menu</button>
      </div>
    </div>
  );
}

/* ─── GAME REGISTRY ────────────────────────────────────────────────────── */
const GAME_COMPONENTS = {
  snake:  app => <SnakeGame  appName={app.name}/>,
  tetris: app => <TetrisGame appName={app.name}/>,
  memory: app => <MemoryGame appName={app.name}/>,
};

/* ─── DEFAULT FORM RUNNER (for non-game apps) ──────────────────────────── */
function FormRunner({ app, form }) {
  const initialArgs = Object.fromEntries(form.fields.map(f => [f.key, f.default]));
  const [args,   setArgs]   = useState(initialArgs);
  const [result, setResult] = useState(null);
  const [error,  setError]  = useState(null);
  const [busy,   setBusy]   = useState(false);

  const handleRun = async () => {
    setBusy(true); setError(null); setResult(null);
    try {
      const data = await runApp(app.name, args);
      setResult(data.result);
    } catch(e) {
      setError(e.response?.data?.error || 'Something went wrong');
    } finally { setBusy(false); }
  };

  return (
    <>
      <div className="modal-form">
        {form.fields.map(f => (
          <div key={f.key} className="form-group">
            <label>{f.label}</label>
            {f.type === 'select'
              ? <select value={args[f.key]} onChange={e => setArgs(p=>({...p,[f.key]:e.target.value}))}>
                  {f.options.map(o => <option key={o}>{o}</option>)}
                </select>
              : <input type={f.type} value={args[f.key]} onChange={e => setArgs(p=>({...p,[f.key]:f.type==='number'?Number(e.target.value):e.target.value}))}/>
            }
          </div>
        ))}
      </div>
      <button className="btn btn-run btn-full" onClick={handleRun} disabled={busy}>
        {busy ? 'Running...' : '▶ Run'}
      </button>
      {error  && <div className="error-box">{error}</div>}
      {result !== null && (form.render ? form.render(result) : <pre className="result-box">{JSON.stringify(result,null,2)}</pre>)}
    </>
  );
}

/* ─── ANIMATIONS (injected once) ─────────────────────────────────────── */
const STYLE_ID = 'mas-game-animations';
if (!document.getElementById(STYLE_ID)) {
  const s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = `
    @keyframes fadeUp { from{opacity:0;transform:translateY(-20px)scale(1.2)} to{opacity:0;transform:translateY(-60px)scale(0.8)} }
    @keyframes shake  { 0%,100%{transform:rotateY(180deg) translateX(0)} 25%{transform:rotateY(180deg) translateX(-8px)} 75%{transform:rotateY(180deg) translateX(8px)} }
    .modal-large { max-width:640px !important; max-height:92vh; display:flex; flex-direction:column; }
    .modal-scroll-body { overflow-y:auto; flex:1; padding-top:0.25rem; }
    .modal-scroll-body::-webkit-scrollbar{width:4px}
    .modal-scroll-body::-webkit-scrollbar-thumb{background:#2a2a35;border-radius:999px}
  `;
  document.head.appendChild(s);
}

/* ─── MAIN MODAL ───────────────────────────────────────────────────────── */
export default function RunModal({ app, onClose }) {
  const gameUI = GAME_COMPONENTS[app.name];
  const form   = FORMS[app.name];

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal ${gameUI ? 'modal-large' : ''}`} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <span className="modal-icon">{app.icon}</span>
          <h2>{app.title}</h2>
          <span style={{ marginLeft:'auto', marginRight:'0.75rem', color:'#6b6b80', fontFamily:"'Space Mono',monospace", fontSize:'0.72rem' }}>v{app.version}</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        {gameUI ? (
          <div className="modal-scroll-body">{gameUI(app)}</div>
        ) : form ? (
          <FormRunner app={app} form={form}/>
        ) : (
          <div className="result-box"><p style={{color:'#6b6b80'}}>No UI available for this plugin.</p></div>
        )}
      </div>
    </div>
  );
}
