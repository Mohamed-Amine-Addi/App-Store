import { useState, useEffect, useRef, useCallback } from 'react';
import { runApp } from '../api';

/* ═══════════════════════════════════════════════════════════════
   DESIGN SYSTEM
═══════════════════════════════════════════════════════════════ */
const T = {
  bg:     '#07070f',
  surf:   '#0f0f1a',
  surf2:  '#151525',
  border: '#1e1e30',
  text:   '#e8e8f0',
  muted:  '#5a5a72',
  accent: '#7c6cff',
  green:  '#4ade80',
  blue:   '#60a5fa',
  red:    '#f87171',
  yellow: '#fbbf24',
  orange: '#fb923c',
  pink:   '#f472b6',
};

// Shared micro-style helpers
const s = {
  card: (accent=T.accent) => ({ background:T.surf, border:`1px solid ${accent}22`, borderRadius:12, padding:'1rem' }),
  tag:  (color=T.accent)  => ({ background:`${color}18`, border:`1px solid ${color}28`, color, borderRadius:999, padding:'2px 10px', fontSize:'0.72rem', fontWeight:700, display:'inline-block' }),
  btn:  (bg=T.accent, fg='#fff') => ({ background:bg, color:fg, border:'none', borderRadius:10, padding:'10px 18px', fontFamily:"'DM Sans',sans-serif", fontWeight:700, fontSize:'0.85rem', cursor:'pointer', transition:'all 0.15s' }),
  inp:  (focus=false) => ({ width:'100%', boxSizing:'border-box', padding:'11px 14px', background:T.bg, border:`1.5px solid ${focus?T.accent:T.border}`, borderRadius:10, color:T.text, fontSize:'0.88rem', fontFamily:"'DM Sans',sans-serif", outline:'none', transition:'border-color 0.2s' }),
  grid: (cols=2) => ({ display:'grid', gridTemplateColumns:`repeat(${cols},1fr)`, gap:'0.65rem' }),
  mono: (size='1rem', color=T.text) => ({ fontFamily:"'Space Mono',monospace", fontSize:size, color }),
  bar:  (pct, color=T.green) => (
    <div style={{ background:T.bg, borderRadius:999, height:8, overflow:'hidden', marginTop:4 }}>
      <div style={{ width:`${Math.min(100,pct)}%`, height:'100%', background:color, borderRadius:999, transition:'width 0.5s' }}/>
    </div>
  ),
};

function StatCard({ label, value, color=T.accent, sub }) {
  return (
    <div style={s.card(color)}>
      <div style={{ color:T.muted, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:4 }}>{label}</div>
      <div style={{ ...s.mono('1.25rem', color), fontWeight:700 }}>{value}</div>
      {sub && <div style={{ color:T.muted, fontSize:'0.72rem', marginTop:2 }}>{sub}</div>}
    </div>
  );
}

function FieldInput({ label, value, onChange, type='text', placeholder, children }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:5 }}>
      {label && <label style={{ color:T.muted, fontSize:'0.72rem', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em' }}>{label}</label>}
      {children || (
        <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          style={s.inp(focused)}
          onFocus={()=>setFocused(true)}
          onBlur={()=>setFocused(false)}/>
      )}
    </div>
  );
}

function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', background:T.bg, borderRadius:10, padding:3, marginBottom:16, gap:2 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)}
          style={{ flex:1, padding:'8px', borderRadius:8, border:'none', cursor:'pointer', background:active===t.id?T.surf2:'transparent', color:active===t.id?T.text:T.muted, fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:'0.8rem', transition:'all 0.15s' }}>
          {t.label}
        </button>
      ))}
    </div>
  );
}

function FeedbackMsg({ msg, err }) {
  if (!msg && !err) return null;
  const isErr = !!err;
  return (
    <div style={{ background: isErr?`${T.red}12`:`${T.green}12`, border:`1px solid ${isErr?T.red:T.green}30`, borderRadius:10, padding:'10px 14px', color:isErr?T.red:T.green, fontSize:'0.83rem', display:'flex', gap:8, alignItems:'center' }}>
      {isErr ? '⚠' : '✓'} {err||msg}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   CALCULATOR — Full interactive, no API needed
═══════════════════════════════════════════════════════════════ */
function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [expr, setExpr]       = useState('');
  const [hist, setHist]       = useState([]);
  const [mode, setMode]       = useState('basic'); // basic | sci

  const press = useCallback((k) => {
    if (k === 'AC')  { setDisplay('0'); setExpr(''); return; }
    if (k === '⌫')  { const e=expr.slice(0,-1); setExpr(e); setDisplay(e||'0'); return; }
    if (k === '+/-') { const v=parseFloat(display)*-1; setDisplay(String(v)); setExpr(String(v)); return; }
    if (k === '%')   { const v=parseFloat(display)/100; setDisplay(String(v)); setExpr(String(v)); return; }
    if (k === '=') {
      try {
        const safe = expr
          .replace(/×/g,'*').replace(/÷/g,'/')
          .replace(/π/g, String(Math.PI))
          .replace(/e/g, String(Math.E))
          .replace(/sin\(/g,'Math.sin(').replace(/cos\(/g,'Math.cos(').replace(/tan\(/g,'Math.tan(')
          .replace(/√\(/g,'Math.sqrt(').replace(/log\(/g,'Math.log10(').replace(/ln\(/g,'Math.log(')
          .replace(/\^/g,'**');
        // eslint-disable-next-line no-new-func
        const res = Function('"use strict";return('+safe+')')();
        const rounded = Math.round(res*1e10)/1e10;
        setHist(h=>[`${expr} = ${rounded}`,...h].slice(0,8));
        setDisplay(String(rounded));
        setExpr(String(rounded));
      } catch { setDisplay('Error'); setExpr(''); }
      return;
    }
    if (k === 'sin('||k === 'cos('||k === 'tan('||k === '√('||k === 'log('||k === 'ln(') {
      const ne = expr+k; setExpr(ne); setDisplay(ne); return;
    }
    const next = (display==='0'&&!['.','+','-','×','÷','%','^'].includes(k)) ? (expr===''?k:expr+k) : expr+k;
    setExpr(next); setDisplay(next);
  }, [expr, display]);

  useEffect(() => {
    const h = e => {
      const map = {'0':'0','1':'1','2':'2','3':'3','4':'4','5':'5','6':'6','7':'7','8':'8','9':'9','+':'+','-':'-','*':'×','/':'÷','.':'.','Enter':'=','Backspace':'⌫','Escape':'AC','%':'%'};
      if (map[e.key]) { e.preventDefault(); press(map[e.key]); }
    };
    window.addEventListener('keydown',h);
    return ()=>window.removeEventListener('keydown',h);
  },[press]);

  const basicKeys = [
    ['AC','±','%','÷'],
    ['7','8','9','×'],
    ['4','5','6','-'],
    ['1','2','3','+'],
    ['0','.','='],
  ];
  const sciKeys = [['sin(','cos(','tan(','π'],['ln(','log(','√(','e'],['(',')','x²','^']];

  const kColor = k => {
    if (['='].includes(k)) return T.green;
    if (['÷','×','-','+'].includes(k)) return T.accent;
    if (['AC','±','%'].includes(k)) return '#2a2a40';
    if (['sin(','cos(','tan(','ln(','log(','√('].includes(k)) return '#1a1a2e';
    if (['π','e','(',')','x²','^'].includes(k)) return '#1a1a2e';
    return '#18182a';
  };

  return (
    <div style={{ display:'flex', gap:'1rem' }}>
      <div style={{ flex:1 }}>
        {/* Display */}
        <div style={{ background:T.bg, borderRadius:14, padding:'16px 18px', marginBottom:12, minHeight:80, display:'flex', flexDirection:'column', justifyContent:'flex-end', alignItems:'flex-end' }}>
          <div style={{ ...s.mono('0.78rem', T.muted), marginBottom:4, minHeight:18, textAlign:'right', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%' }}>{expr||'0'}</div>
          <div style={{ ...s.mono('2.2rem', T.text), fontWeight:700, letterSpacing:'-0.03em', maxWidth:'100%', overflow:'hidden', textOverflow:'ellipsis' }}>{display}</div>
        </div>

        {/* Mode toggle */}
        <Tabs tabs={[{id:'basic',label:'Basic'},{id:'sci',label:'Scientific'}]} active={mode} onChange={setMode}/>

        {/* Scientific row */}
        {mode==='sci' && (
          <div style={{ marginBottom:8 }}>
            {sciKeys.map((row,ri) => (
              <div key={ri} style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:6, marginBottom:6 }}>
                {row.map((k,ki) => (
                  <button key={ki} onClick={()=>press(k)}
                    style={{ ...s.btn(kColor(k), T.muted), padding:'8px 4px', fontSize:'0.75rem', borderRadius:8, textAlign:'center', fontFamily:"'Space Mono',monospace" }}>
                    {k==='x²'?'x²':k}
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Basic keypad */}
        <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
          {basicKeys.map((row,ri) => (
            <div key={ri} style={{ display:'grid', gridTemplateColumns: ri===4?'2fr 1fr 1fr':'repeat(4,1fr)', gap:6 }}>
              {row.map((k,ki) => (
                <button key={ki} onClick={()=>press(k)}
                  style={{ ...s.btn(kColor(k), ['='].includes(k)?'#000':T.text), padding:'14px 0', fontSize:'1rem', borderRadius:12, fontFamily:"'Space Mono',monospace", boxShadow:['='].includes(k)?`0 4px 18px ${T.green}44`:'none' }}>
                  {k}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* History panel */}
      {hist.length > 0 && (
        <div style={{ width:160, display:'flex', flexDirection:'column', gap:6 }}>
          <div style={{ color:T.muted, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:2 }}>History</div>
          {hist.map((h,i) => (
            <div key={i} style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:8, padding:'8px 10px', ...s.mono('0.72rem',T.muted), lineHeight:1.5, cursor:'pointer', transition:'border-color 0.15s' }}
              onClick={()=>{const v=h.split(' = ')[1];setDisplay(v);setExpr(v);}}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              {h}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NOTES — Rich notes app with tags, search, pin
═══════════════════════════════════════════════════════════════ */
function NotesApp({ name }) {
  const [notes, setNotes]   = useState([]);
  const [input, setInput]   = useState('');
  const [search, setSearch] = useState('');
  const [msg, setMsg]       = useState('');

  const load = useCallback(async()=>{ try{const d=await runApp(name,{action:'list'});setNotes(d.result.notes||[]);}catch(_){} },[name]);
  useEffect(()=>{ load(); },[load]);

  const add = async()=>{
    if(!input.trim())return;
    await runApp(name,{action:'add',content:input});
    setInput(''); setMsg('Note saved!'); setTimeout(()=>setMsg(''),2000); load();
  };
  const clear = async()=>{ await runApp(name,{action:'clear'}); load(); };

  const filtered = notes.filter(n=>n.content.toLowerCase().includes(search.toLowerCase()));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {/* Search bar */}
      <div style={{ position:'relative' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" style={{ position:'absolute', left:12, top:'50%', transform:'translateY(-50%)' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search notes…" style={{ ...s.inp(), paddingLeft:38 }}
          onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
      </div>

      {/* Editor */}
      <div style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden' }}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Write a new note… (Ctrl+Enter to save)"
          style={{ width:'100%', boxSizing:'border-box', padding:'14px', background:'transparent', border:'none', color:T.text, fontSize:'0.9rem', fontFamily:"'DM Sans',sans-serif", outline:'none', resize:'vertical', minHeight:100, lineHeight:1.65 }}
          onKeyDown={e=>{if(e.ctrlKey&&e.key==='Enter')add();}}/>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 14px', borderTop:`1px solid ${T.border}` }}>
          <span style={{ color:T.muted, fontSize:'0.72rem' }}>Ctrl+Enter to save · {input.length} chars</span>
          <button onClick={add} style={s.btn(T.accent)}>+ Add Note</button>
        </div>
      </div>

      {msg && <div style={{ color:T.green, fontSize:'0.82rem', textAlign:'center' }}>✓ {msg}</div>}

      {/* Stats */}
      <div style={s.grid(3)}>
        <StatCard label="Total" value={notes.length} color={T.accent}/>
        <StatCard label="Words" value={notes.reduce((a,n)=>a+(n.content.split(' ').length||0),0)} color={T.blue}/>
        <StatCard label="Found" value={filtered.length} color={T.green}/>
      </div>

      {/* Notes list */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:260, overflowY:'auto' }}>
        {filtered.length===0
          ? <div style={{ color:T.muted, textAlign:'center', padding:'2rem', fontSize:'0.85rem' }}>No notes yet. Start writing above.</div>
          : [...filtered].reverse().map(n=>(
            <div key={n.id} style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 14px', transition:'border-color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              <div style={{ ...s.mono('0.7rem', T.muted), marginBottom:6 }}>{n.created_at}</div>
              <p style={{ color:T.text, margin:0, lineHeight:1.6, fontSize:'0.88rem' }}>{n.content}</p>
            </div>
          ))}
      </div>

      {notes.length>0 && <button onClick={clear} style={{ ...s.btn(`${T.red}18`, T.red), border:`1px solid ${T.red}30`, width:'100%' }}>Clear All Notes</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TIMER — Countdown + Stopwatch + Pomodoro
═══════════════════════════════════════════════════════════════ */
function TimerApp() {
  const [mode, setMode]     = useState('countdown');
  const [secs, setSecs]     = useState(300);
  const [rem, setRem]       = useState(null);
  const [elapsed, setElapsed]= useState(0);
  const [running, setRunning]= useState(false);
  const [laps, setLaps]     = useState([]);
  const iRef = useRef(null);

  const fmt = s => { s=Math.max(0,Math.round(s)); const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60; return h?`${h}:${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`:`${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`; };
  const stop = () => { setRunning(false); clearInterval(iRef.current); };
  const reset = () => { stop(); setRem(null); setElapsed(0); setLaps([]); };
  const start = () => { if(mode==='countdown')setRem(secs); setRunning(true); };
  const lap = () => { if(mode==='stopwatch') setLaps(l=>[elapsed,...l].slice(0,8)); };

  useEffect(()=>{
    if(!running)return;
    iRef.current = setInterval(()=>{
      if(mode==='countdown') setRem(r=>{ if(r<=1){stop();return 0;} return r-1; });
      else setElapsed(e=>e+1);
    },1000);
    return()=>clearInterval(iRef.current);
  },[running,mode]);

  const val   = mode==='countdown'?(rem??secs):elapsed;
  const pct   = mode==='countdown'?(val/secs*100):0;
  const color = mode==='countdown'?(val<30?T.red:val<60?T.yellow:T.green):T.blue;
  const PRESETS = [{l:'1m',s:60},{l:'5m',s:300},{l:'10m',s:600},{l:'25m',s:1500},{l:'30m',s:1800},{l:'1h',s:3600}];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem', alignItems:'center' }}>
      <Tabs tabs={[{id:'countdown',label:'Countdown'},{id:'stopwatch',label:'Stopwatch'},{id:'pomodoro',label:'Pomodoro'}]} active={mode} onChange={m=>{setMode(m);reset();if(m==='pomodoro')setSecs(1500);}}/>

      {/* Ring */}
      <div style={{ position:'relative', width:200, height:200 }}>
        <svg width="200" height="200" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r="88" fill="none" stroke={T.border} strokeWidth="10"/>
          {mode==='countdown'&&<circle cx="100" cy="100" r="88" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${2*Math.PI*88}`} strokeDashoffset={`${2*Math.PI*88*(1-pct/100)}`}
            style={{ transition:'stroke-dashoffset 0.9s,stroke 0.4s' }} strokeLinecap="round"/>}
          {mode==='stopwatch'&&<circle cx="100" cy="100" r="88" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${2*Math.PI*88*0.25} ${2*Math.PI*88*0.75}`}
            style={{ transition:'stroke-dashoffset 0.2s',animation:running?'rotateDash 4s linear infinite':undefined }}
            strokeLinecap="round"/>}
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ ...s.mono('2.6rem', color), fontWeight:700, letterSpacing:'-0.03em' }}>{fmt(val)}</div>
          <div style={{ color:T.muted, fontSize:'0.75rem', marginTop:4, textTransform:'uppercase', letterSpacing:'0.08em' }}>{mode}</div>
          {mode==='pomodoro'&&<div style={{ color:T.muted, fontSize:'0.72rem', marginTop:2 }}>Focus session</div>}
        </div>
      </div>

      {/* Presets */}
      {mode==='countdown'&&!running&&(
        <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', justifyContent:'center' }}>
          {PRESETS.map(p=>(
            <button key={p.s} onClick={()=>{setSecs(p.s);reset();}} style={{ ...s.btn(secs===p.s?T.accent:T.surf2), border:`1px solid ${secs===p.s?T.accent:T.border}`, padding:'5px 12px', fontSize:'0.8rem' }}>{p.l}</button>
          ))}
        </div>
      )}
      {mode==='countdown'&&!running&&<input type="range" min={5} max={7200} value={secs} onChange={e=>{setSecs(+e.target.value);reset();}} style={{ width:'90%', accentColor:T.accent }}/>}

      {/* Buttons */}
      <div style={{ display:'flex', gap:'0.6rem' }}>
        {!running
          ? <button onClick={start} style={{ ...s.btn(T.green,'#000'), padding:'12px 28px', fontSize:'0.95rem', boxShadow:`0 4px 20px ${T.green}44` }}>▶ Start</button>
          : <button onClick={stop}  style={{ ...s.btn(T.red), padding:'12px 28px', fontSize:'0.95rem' }}>⏸ Pause</button>}
        {mode==='stopwatch'&&running&&<button onClick={lap} style={{ ...s.btn(T.blue,'#000'), padding:'12px 18px' }}>⊕ Lap</button>}
        <button onClick={reset} style={{ ...s.btn(T.surf2), border:`1px solid ${T.border}`, padding:'12px 18px' }}>↺</button>
      </div>

      {/* Laps */}
      {laps.length>0&&(
        <div style={{ width:'100%' }}>
          <div style={{ color:T.muted, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Laps</div>
          {laps.map((l,i)=>(
            <div key={i} style={{ display:'flex', justifyContent:'space-between', padding:'6px 0', borderBottom:`1px solid ${T.border}`, ...s.mono('0.85rem') }}>
              <span style={{ color:T.muted }}>Lap {laps.length-i}</span>
              <span style={{ color:T.text }}>{fmt(l)}</span>
            </div>
          ))}
        </div>
      )}
      <style>{`@keyframes rotateDash{to{transform:rotate(360deg);transform-origin:center;}}`}</style>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   TASK SCHEDULER — Full task manager like Todoist
═══════════════════════════════════════════════════════════════ */
function TaskApp({ name }) {
  const [tasks, setTasks]     = useState({pending:[],done:[]});
  const [title, setTitle]     = useState('');
  const [deadline, setDeadline]= useState('');
  const [priority, setPriority]= useState('medium');
  const [filter, setFilter]   = useState('all');
  const [msg, setMsg]         = useState('');
  const PC = { high:T.red, medium:T.yellow, low:T.green };

  const load = useCallback(async()=>{ try{const d=await runApp(name,{action:'list'});setTasks(d.result);}catch(_){} },[name]);
  useEffect(()=>{ load(); },[load]);

  const add = async()=>{
    if(!title.trim())return;
    await runApp(name,{action:'add',title,deadline,priority});
    setTitle('');setDeadline('');
    setMsg('Task added!');setTimeout(()=>setMsg(''),1500);
    load();
  };
  const complete = async id=>{ await runApp(name,{action:'complete',task_id:id}); load(); };
  const del      = async id=>{ await runApp(name,{action:'delete',task_id:id}); load(); };

  const pending = tasks.pending||[];
  const done    = tasks.done||[];
  const shown   = filter==='done' ? done : filter==='high' ? pending.filter(t=>t.priority==='high') : pending;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {/* Add form */}
      <div style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:14, padding:'14px' }}>
        <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="What needs to be done?" onKeyDown={e=>e.key==='Enter'&&add()}
          style={{ ...s.inp(), marginBottom:10, fontSize:'0.95rem' }}
          onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
        <div style={{ display:'flex', gap:'0.5rem', alignItems:'center' }}>
          <input type="date" value={deadline} onChange={e=>setDeadline(e.target.value)} style={{ ...s.inp(), flex:1 }}
            onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
          {['low','medium','high'].map(p=>(
            <button key={p} onClick={()=>setPriority(p)} style={{ ...s.btn(priority===p?PC[p]:T.surf2), border:`1px solid ${priority===p?PC[p]:T.border}`, padding:'8px 12px', color:priority===p?'#000':T.muted, fontSize:'0.78rem', textTransform:'capitalize' }}>{p}</button>
          ))}
          <button onClick={add} style={{ ...s.btn(T.accent), boxShadow:`0 4px 16px ${T.accent}44`, flexShrink:0 }}>+ Add</button>
        </div>
      </div>

      {msg && <div style={{ color:T.green, fontSize:'0.82rem' }}>✓ {msg}</div>}

      {/* Stats */}
      <div style={s.grid(3)}>
        <StatCard label="Pending" value={pending.length} color={T.blue}/>
        <StatCard label="Done" value={done.length} color={T.green}/>
        <StatCard label="High Priority" value={pending.filter(t=>t.priority==='high').length} color={T.red}/>
      </div>

      {/* Filter tabs */}
      <Tabs tabs={[{id:'all',label:'All'},{id:'high',label:'⚡ High'},{id:'done',label:'✓ Done'}]} active={filter} onChange={setFilter}/>

      {/* Task list */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', maxHeight:250, overflowY:'auto' }}>
        {shown.length===0
          ? <div style={{ color:T.muted, textAlign:'center', padding:'1.5rem', fontSize:'0.85rem' }}>
              {filter==='done' ? 'No completed tasks yet.' : 'No tasks — add one above!'}
            </div>
          : shown.map(t=>(
            <div key={t.id} style={{ display:'flex', alignItems:'center', gap:'0.65rem', background:T.surf, border:`1px solid ${T.border}`, borderRadius:12, padding:'10px 14px', transition:'all 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=PC[t.priority]}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              {/* Priority dot */}
              <div style={{ width:10, height:10, borderRadius:'50%', background:PC[t.priority], flexShrink:0, boxShadow:`0 0 6px ${PC[t.priority]}66` }}/>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ color:filter==='done'?T.muted:T.text, fontSize:'0.88rem', fontWeight:500, textDecoration:filter==='done'?'line-through':'none', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{t.title}</div>
                {t.deadline&&t.deadline!=='No deadline'&&<div style={{ color:T.muted, fontSize:'0.72rem', marginTop:2 }}>📅 {t.deadline}</div>}
              </div>
              {filter!=='done'&&<button onClick={()=>complete(t.id)} style={{ ...s.btn(T.green,'#000'), padding:'5px 10px', fontSize:'0.75rem' }}>✓</button>}
              <button onClick={()=>del(t.id)} style={{ ...s.btn(`${T.red}18`,T.red), border:`1px solid ${T.red}28`, padding:'5px 10px', fontSize:'0.75rem' }}>✕</button>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   EXPENSE TRACKER — Full finance tracker
═══════════════════════════════════════════════════════════════ */
function ExpenseApp({ name }) {
  const [data, setData]     = useState({expenses:[],total:0});
  const [stats, setStats]   = useState(null);
  const [title, setTitle]   = useState('');
  const [amount, setAmount] = useState('');
  const [cat, setCat]       = useState('food');
  const [tab, setTab]       = useState('list');
  const CATS = ['food','transport','housing','health','entertainment','shopping','other'];
  const CC = { food:T.green, transport:T.blue, housing:T.yellow, health:T.red, entertainment:'#a78bfa', shopping:T.orange, other:T.muted };

  const load = useCallback(async()=>{ try{const d=await runApp(name,{action:'list'});setData(d.result);const s=await runApp(name,{action:'stats'});setStats(s.result);}catch(_){} },[name]);
  useEffect(()=>{ load(); },[load]);

  const add = async()=>{
    if(!title||!amount||parseFloat(amount)<=0)return;
    await runApp(name,{action:'add',title,amount:parseFloat(amount),category:cat});
    setTitle('');setAmount('');load();
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {/* Add form */}
      <div style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:14, padding:14 }}>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0.5rem', marginBottom:'0.5rem' }}>
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Description" style={s.inp()} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00 €" style={s.inp()} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
        </div>
        <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', marginBottom:'0.5rem' }}>
          {CATS.map(c=>(
            <button key={c} onClick={()=>setCat(c)} style={{ ...s.btn(cat===c?CC[c]:T.surf2), border:`1px solid ${cat===c?CC[c]:T.border}`, padding:'5px 10px', fontSize:'0.75rem', color:cat===c?'#000':T.muted, textTransform:'capitalize' }}>{c}</button>
          ))}
        </div>
        <button onClick={add} style={{ ...s.btn(T.accent), width:'100%', boxShadow:`0 4px 14px ${T.accent}33` }}>+ Add Expense</button>
      </div>

      {/* Total */}
      <div style={{ background:`linear-gradient(135deg,${T.accent}18,${T.green}0a)`, border:`1px solid ${T.accent}30`, borderRadius:14, padding:'16px 20px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ color:T.muted, fontWeight:600 }}>Total Spent</span>
        <span style={{ ...s.mono('1.8rem',T.text), fontWeight:700 }}>{data.total?.toFixed(2)||'0.00'} €</span>
      </div>

      <Tabs tabs={[{id:'list',label:'Transactions'},{id:'stats',label:'Analytics'}]} active={tab} onChange={setTab}/>

      {tab==='list'&&(
        <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', maxHeight:260, overflowY:'auto' }}>
          {!data.expenses?.length
            ? <div style={{ color:T.muted, textAlign:'center', padding:'1.5rem' }}>No expenses yet.</div>
            : [...data.expenses].reverse().map(e=>(
              <div key={e.id} style={{ display:'flex', alignItems:'center', gap:'0.65rem', background:T.surf, border:`1px solid ${T.border}`, borderRadius:11, padding:'10px 13px' }}>
                <span style={{ ...s.tag(CC[e.category]||T.muted), flexShrink:0 }}>{e.category}</span>
                <span style={{ flex:1, color:T.text, fontSize:'0.88rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{e.title}</span>
                <span style={{ ...s.mono('0.88rem', T.yellow), fontWeight:700, flexShrink:0 }}>{e.amount}€</span>
                <span style={{ color:T.muted, fontSize:'0.72rem', flexShrink:0 }}>{e.date}</span>
              </div>
            ))}
        </div>
      )}

      {tab==='stats'&&stats?.by_category&&(
        <div style={{ display:'flex', flexDirection:'column', gap:'0.7rem' }}>
          {Object.entries(stats.by_category).sort((a,b)=>b[1]-a[1]).map(([c,a])=>(
            <div key={c}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                <span style={{ color:CC[c]||T.muted, textTransform:'capitalize', fontWeight:500, fontSize:'0.85rem' }}>{c}</span>
                <span style={{ ...s.mono('0.85rem'), color:T.text }}>{a.toFixed(2)} €</span>
              </div>
              {s.bar(a/(stats.total||1)*100, CC[c]||T.muted)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SYSTEM MONITOR — Real-time dashboard
═══════════════════════════════════════════════════════════════ */
function SystemApp({ name }) {
  const [data, setData] = useState(null);
  const load = useCallback(async()=>{ try{const d=await runApp(name,{action:'all'});setData(d.result);}catch(_){} },[name]);
  useEffect(()=>{ load(); const t=setInterval(load,5000); return()=>clearInterval(t); },[load]);

  if (!data) return <div style={{ color:T.muted, textAlign:'center', padding:'3rem' }}>Loading system info…</div>;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ ...s.tag(T.blue) }}>{data.platform}</span>
        <button onClick={load} style={{ ...s.btn(T.surf2), border:`1px solid ${T.border}`, padding:'6px 14px', fontSize:'0.8rem' }}>↻ Refresh</button>
      </div>

      {/* CPU */}
      <div style={s.card(T.blue)}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
          <span style={{ color:T.blue, fontWeight:700, fontSize:'0.9rem' }}>CPU</span>
          <span style={{ ...s.tag(T.blue) }}>{data.cpu?.cores} cores</span>
        </div>
        <div style={{ color:T.muted, fontSize:'0.8rem' }}>{data.cpu?.platform||'Unknown processor'}</div>
      </div>

      {/* RAM */}
      {data.memory&&(
        <div style={s.card(T.green)}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ color:T.green, fontWeight:700, fontSize:'0.9rem' }}>RAM</span>
            <span style={{ ...s.tag(data.memory.percent>80?T.red:T.green) }}>{data.memory.percent}%</span>
          </div>
          {s.bar(data.memory.percent, data.memory.percent>80?T.red:T.green)}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:'0.75rem', color:T.muted }}>
            <span>Used: {data.memory.used_mb} MB</span>
            <span>Free: {data.memory.available_mb} MB</span>
            <span>Total: {data.memory.total_mb} MB</span>
          </div>
        </div>
      )}

      {/* Disk */}
      {data.disk&&(
        <div style={s.card(T.yellow)}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <span style={{ color:T.yellow, fontWeight:700, fontSize:'0.9rem' }}>Disk</span>
            <span style={{ ...s.tag(data.disk.percent>90?T.red:T.yellow) }}>{data.disk.percent}%</span>
          </div>
          {s.bar(data.disk.percent, data.disk.percent>90?T.red:T.yellow)}
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, fontSize:'0.75rem', color:T.muted }}>
            <span>Used: {data.disk.used_gb} GB</span>
            <span>Free: {data.disk.free_gb} GB</span>
            <span>Total: {data.disk.total_gb} GB</span>
          </div>
        </div>
      )}
      <div style={{ color:T.muted, fontSize:'0.72rem', textAlign:'center' }}>Auto-refreshes every 5 seconds</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   WEATHER — Real weather dashboard
═══════════════════════════════════════════════════════════════ */
function WeatherApp({ name }) {
  const [city, setCity]   = useState('London');
  const [data, setData]   = useState(null);
  const [fcast, setFcast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]     = useState('');

  const wIcon = d => { const s=(d||'').toLowerCase(); if(s.includes('sun')||s.includes('clear'))return'☀️';if(s.includes('rain'))return'🌧️';if(s.includes('snow'))return'❄️';if(s.includes('cloud'))return'☁️';if(s.includes('storm'))return'⛈️';return'🌤️'; };

  const fetch_ = async() => {
    if(!city)return; setLoading(true); setErr('');
    try {
      const c=await runApp(name,{action:'current',city});
      if(c.result?.error){setErr(c.result.error);return;}
      setData(c.result);
      const f=await runApp(name,{action:'forecast',city});
      setFcast(f.result?.forecast);
    } catch(e){ setErr('Could not fetch weather.'); }
    finally { setLoading(false); }
  };
  useEffect(()=>{ fetch_(); },[]);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ display:'flex', gap:'0.5rem' }}>
        <input value={city} onChange={e=>setCity(e.target.value)} placeholder="Enter city name…" style={{ ...s.inp(), flex:1 }}
          onKeyDown={e=>e.key==='Enter'&&fetch_()}
          onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.border}/>
        <button onClick={fetch_} disabled={loading} style={{ ...s.btn(T.blue,'#000'), padding:'10px 18px' }}>{loading?'…':'Search'}</button>
      </div>
      {err&&<div style={{ color:T.red, fontSize:'0.85rem' }}>⚠ {err}</div>}
      {data&&(
        <>
          <div style={{ background:`linear-gradient(135deg,${T.blue}18,${T.blue}08)`, border:`1px solid ${T.blue}30`, borderRadius:16, padding:'20px', display:'flex', gap:'1rem', alignItems:'center' }}>
            <div style={{ fontSize:'3.5rem' }}>{wIcon(data.description)}</div>
            <div>
              <div style={{ color:T.muted, fontSize:'0.8rem', marginBottom:2 }}>{data.city}</div>
              <div style={{ ...s.mono('2.8rem',T.blue), fontWeight:700, letterSpacing:'-0.03em' }}>{data.temperature}</div>
              <div style={{ color:T.text, fontSize:'0.9rem' }}>{data.description}</div>
            </div>
          </div>
          <div style={s.grid(3)}>
            <StatCard label="Feels Like" value={data.feels_like} color={T.yellow}/>
            <StatCard label="Humidity" value={data.humidity} color={T.blue}/>
            <StatCard label="Wind" value={data.wind} color={T.green}/>
          </div>
          {fcast&&(
            <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
              <div style={{ color:T.muted, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.07em' }}>3-Day Forecast</div>
              {fcast.map((d,i)=>(
                <div key={i} style={{ display:'flex', alignItems:'center', gap:'0.65rem', background:T.surf, border:`1px solid ${T.border}`, borderRadius:11, padding:'10px 13px' }}>
                  <span style={{ fontSize:'1.3rem' }}>{wIcon(d.desc)}</span>
                  <span style={{ ...s.mono('0.78rem',T.muted), minWidth:80 }}>{d.date}</span>
                  <span style={{ flex:1, color:T.text, fontSize:'0.85rem' }}>{d.desc}</span>
                  <span style={{ ...s.mono('0.85rem',T.blue) }}>{d.min}–{d.max}</span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PASSWORD VAULT — Secure storage like Bitwarden
═══════════════════════════════════════════════════════════════ */
function PasswordApp({ name }) {
  const [accounts, setAccounts] = useState([]);
  const [tab, setTab]           = useState('list');
  const [form, setForm]         = useState({ account:'', password:'', master_key:'default123', search:'' });
  const [revealed, setRevealed] = useState(null);
  const [msg, setMsg]           = useState('');
  const [err, setErr]           = useState('');

  const load = useCallback(async()=>{ try{const d=await runApp(name,{action:'list'});setAccounts(d.result.accounts||[]);}catch(_){} },[name]);
  useEffect(()=>{ load(); },[load]);

  const add = async()=>{
    if(!form.account||!form.password){setErr('Account and password are required');return;}
    setErr('');
    const d=await runApp(name,{action:'add',account:form.account,password:form.password,master_key:form.master_key});
    setMsg(d.result.message);setForm(f=>({...f,account:'',password:''}));setTimeout(()=>setMsg(''),2000);load();setTab('list');
  };
  const get = async a=>{ try{const d=await runApp(name,{action:'get',account:a,master_key:form.master_key});setRevealed({account:a,password:d.result.password});}catch(_){} };
  const del = async a=>{ await runApp(name,{action:'delete',account:a,master_key:form.master_key});load(); };
  const copy = text=>{ navigator.clipboard.writeText(text).then(()=>{setMsg('Copied!');setTimeout(()=>setMsg(''),1500);}); };

  const filtered = accounts.filter(a=>a.account.toLowerCase().includes(form.search.toLowerCase()));

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {/* Master key */}
      <div style={{ background:T.surf, border:`1px solid ${T.red}28`, borderRadius:12, padding:'12px 14px', display:'flex', gap:'0.65rem', alignItems:'center' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.red} strokeWidth="2" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        <input type="password" value={form.master_key} onChange={e=>setForm(f=>({...f,master_key:e.target.value}))} placeholder="Master key…" style={{ ...s.inp(), flex:1, padding:'8px 12px' }}
          onFocus={e=>e.target.style.borderColor=T.red} onBlur={e=>e.target.style.borderColor=T.border}/>
      </div>

      <FeedbackMsg msg={msg} err={err}/>
      <Tabs tabs={[{id:'list',label:`Passwords (${filtered.length})`},{id:'add',label:'+ Add New'}]} active={tab} onChange={setTab}/>

      {tab==='list'&&(
        <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
          <input value={form.search} onChange={e=>setForm(f=>({...f,search:e.target.value}))} placeholder="Search accounts…" style={s.inp()}
            onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
          <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', maxHeight:240, overflowY:'auto' }}>
            {!filtered.length
              ? <div style={{ color:T.muted, textAlign:'center', padding:'1.5rem', fontSize:'0.85rem' }}>No passwords saved.</div>
              : filtered.map(a=>(
                <div key={a.id} style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 14px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ color:T.text, fontWeight:600, fontSize:'0.9rem' }}>{a.account}</div>
                      <div style={{ color:T.muted, fontSize:'0.72rem' }}>{a.added_at}</div>
                      {revealed?.account===a.account&&(
                        <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6 }}>
                          <span style={{ ...s.mono('0.88rem',T.green) }}>{revealed.password}</span>
                          <button onClick={()=>copy(revealed.password)} style={{ ...s.btn(T.surf2,T.muted), border:`1px solid ${T.border}`, padding:'3px 8px', fontSize:'0.72rem' }}>Copy</button>
                        </div>
                      )}
                    </div>
                    <div style={{ display:'flex', gap:'0.4rem' }}>
                      <button onClick={()=>revealed?.account===a.account?setRevealed(null):get(a.account)} style={{ ...s.btn(T.accent), padding:'6px 12px', fontSize:'0.78rem' }}>
                        {revealed?.account===a.account?'Hide':'Show'}
                      </button>
                      <button onClick={()=>del(a.account)} style={{ ...s.btn(`${T.red}18`,T.red), border:`1px solid ${T.red}28`, padding:'6px 10px', fontSize:'0.78rem' }}>✕</button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {tab==='add'&&(
        <div style={{ display:'flex', flexDirection:'column', gap:'0.65rem' }}>
          <FieldInput label="Account Name" value={form.account} onChange={v=>setForm(f=>({...f,account:v}))} placeholder="Google, Netflix, etc."/>
          <FieldInput label="Password" value={form.password} onChange={v=>setForm(f=>({...f,password:v}))} placeholder="Password to store"/>
          <button onClick={add} style={{ ...s.btn(T.accent), width:'100%', boxShadow:`0 4px 14px ${T.accent}33` }}>🔐 Save Password</button>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   URL SHORTENER
═══════════════════════════════════════════════════════════════ */
function URLApp({ name }) {
  const [links, setLinks]   = useState([]);
  const [url, setUrl]       = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(null);

  const load = useCallback(async()=>{ try{const d=await runApp(name,{action:'list'});setLinks(d.result.links||[]);}catch(_){} },[name]);
  useEffect(()=>{ load(); },[load]);

  const shorten = async()=>{
    if(!url)return;
    const d=await runApp(name,{action:'shorten',url}); setResult(d.result); setUrl(''); load();
  };
  const copy = t=>{ navigator.clipboard.writeText(t); setCopied(t); setTimeout(()=>setCopied(null),2000); };
  const del  = async c=>{ await runApp(name,{action:'delete',url:c}); load(); setResult(null); };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ display:'flex', gap:'0.5rem' }}>
        <input value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://your-very-long-url.com/…" style={{ ...s.inp(), flex:1 }}
          onKeyDown={e=>e.key==='Enter'&&shorten()}
          onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
        <button onClick={shorten} style={s.btn(T.accent)}>Shorten</button>
      </div>

      {result&&(
        <div style={{ background:`${T.green}12`, border:`1px solid ${T.green}30`, borderRadius:14, padding:'16px 18px' }}>
          <div style={{ color:T.muted, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:6 }}>Short URL Created</div>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ ...s.mono('1.1rem',T.green), fontWeight:700 }}>{result.short}</span>
            <button onClick={()=>copy(result.short)} style={{ ...s.btn(copied===result.short?T.green:T.accent, copied===result.short?'#000':'#fff'), padding:'7px 14px', fontSize:'0.8rem' }}>
              {copied===result.short?'✓ Copied':'Copy'}
            </button>
          </div>
          <div style={{ color:T.muted, fontSize:'0.75rem', marginTop:6, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{result.original}</div>
        </div>
      )}

      <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem', maxHeight:260, overflowY:'auto' }}>
        {!links.length
          ? <div style={{ color:T.muted, textAlign:'center', padding:'1.5rem' }}>No links yet.</div>
          : [...links].reverse().map(l=>(
            <div key={l.id} style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:11, padding:'11px 14px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:'0.5rem' }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ ...s.mono('0.9rem',T.accent), fontWeight:600 }}>{l.short}</div>
                  <div style={{ color:T.muted, fontSize:'0.72rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', marginTop:2 }}>{l.original}</div>
                </div>
                <div style={{ display:'flex', gap:'0.35rem', flexShrink:0 }}>
                  <button onClick={()=>copy(l.short)} style={{ ...s.btn(copied===l.short?T.green:T.surf2, copied===l.short?'#000':T.muted), border:`1px solid ${T.border}`, padding:'5px 10px', fontSize:'0.75rem' }}>
                    {copied===l.short?'✓':'Copy'}
                  </button>
                  <button onClick={()=>del(l.code)} style={{ ...s.btn(`${T.red}15`,T.red), border:`1px solid ${T.red}25`, padding:'5px 8px', fontSize:'0.75rem' }}>✕</button>
                </div>
              </div>
              <div style={{ color:T.muted, fontSize:'0.7rem', marginTop:6 }}>{l.created_at}</div>
            </div>
          ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   UNIT CONVERTER
═══════════════════════════════════════════════════════════════ */
function UnitApp({ name }) {
  const [cat, setCat]     = useState('length');
  const [val, setVal]     = useState(1);
  const [from, setFrom]   = useState('m');
  const [to, setTo]       = useState('km');
  const [result, setRes]  = useState(null);
  const [err, setErr]     = useState('');

  const UNITS = { length:['km','m','cm','mm','mile','yard','foot','inch'], weight:['kg','g','mg','lb','oz','ton'], temperature:['C','F','K'], speed:['km/h','m/s','mph','knot'], data:['B','KB','MB','GB','TB'] };
  const ICONS2 = { length:'📏', weight:'⚖️', temperature:'🌡️', speed:'💨', data:'💾' };

  useEffect(()=>{ const u=UNITS[cat]; setFrom(u[0]); setTo(u[1]); setRes(null); },[cat]);

  const convert = async()=>{
    setErr('');
    try { const d=await runApp(name,{category:cat,value:val,from_unit:from,to_unit:to}); setRes(d.result); }
    catch(e){ setErr(e.response?.data?.error||'Conversion error'); }
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap' }}>
        {Object.keys(UNITS).map(c=>(
          <button key={c} onClick={()=>setCat(c)} style={{ ...s.btn(cat===c?T.accent:T.surf2), border:`1px solid ${cat===c?T.accent:T.border}`, padding:'7px 14px', fontSize:'0.82rem' }}>
            {ICONS2[c]} {c}
          </button>
        ))}
      </div>
      <div style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:14, padding:14, display:'flex', flexDirection:'column', gap:'0.7rem' }}>
        <input type="number" value={val} onChange={e=>setVal(+e.target.value)} style={s.inp()} onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
        <div style={{ display:'grid', gridTemplateColumns:'1fr auto 1fr', gap:'0.5rem', alignItems:'center' }}>
          <select value={from} onChange={e=>setFrom(e.target.value)} style={{ ...s.inp(), cursor:'pointer' }}>{UNITS[cat].map(u=><option key={u}>{u}</option>)}</select>
          <button onClick={()=>{const t=from;setFrom(to);setTo(t);setRes(null);}} style={{ ...s.btn(T.surf2), border:`1px solid ${T.border}`, padding:'10px' }}>⇄</button>
          <select value={to}   onChange={e=>setTo(e.target.value)}   style={{ ...s.inp(), cursor:'pointer' }}>{UNITS[cat].map(u=><option key={u}>{u}</option>)}</select>
        </div>
        <button onClick={convert} style={{ ...s.btn(T.accent), width:'100%', boxShadow:`0 4px 14px ${T.accent}33` }}>Convert</button>
      </div>
      {err&&<div style={{ color:T.red, fontSize:'0.85rem' }}>⚠ {err}</div>}
      {result&&(
        <div style={{ background:`${T.accent}12`, border:`1px solid ${T.accent}28`, borderRadius:14, padding:'20px', textAlign:'center' }}>
          <div style={{ color:T.muted, fontSize:'0.78rem', marginBottom:4 }}>{result.from} =</div>
          <div style={{ ...s.mono('2.4rem',T.accent), fontWeight:700, letterSpacing:'-0.02em' }}>{result.result}</div>
          <div style={{ color:T.muted, fontSize:'0.8rem', marginTop:4 }}>{to}</div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FOCUS MODE — Pomodoro app
═══════════════════════════════════════════════════════════════ */
function FocusApp({ name }) {
  const [running, setRunning] = useState(false);
  const [rem, setRem]         = useState(null);
  const [dur, setDur]         = useState(25);
  const [lbl, setLbl]         = useState('Deep Work');
  const [session, setSession] = useState(null);
  const [history, setHistory] = useState([]);
  const iRef = useRef(null);
  const PRESETS=[{l:'Quick',m:5},{l:'Pomodoro',m:25},{l:'Deep Work',m:50},{l:'Long Focus',m:90}];

  const loadH = useCallback(async()=>{ try{const d=await runApp(name,{action:'history'});setHistory(d.result.sessions||[]);}catch(_){} },[name]);
  useEffect(()=>{ loadH(); },[loadH]);

  const start = async()=>{ try{const d=await runApp(name,{action:'start',duration:dur,label:lbl});setSession(d.result);setRem(dur*60);setRunning(true);}catch(_){} };
  const stop  = async()=>{ setRunning(false);clearInterval(iRef.current); try{await runApp(name,{action:'stop'});}catch(_){} setSession(null);setRem(null);loadH(); };

  useEffect(()=>{
    if(!running)return;
    iRef.current=setInterval(()=>setRem(r=>{ if(r<=1){setRunning(false);setSession(null);loadH();return 0;} return r-1; }),1000);
    return()=>clearInterval(iRef.current);
  },[running,loadH]);

  const fmt=s=>{if(!s&&s!==0)return'--:--';return`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;};
  const pct=session?(rem/(dur*60)*100):100;
  const color=rem<60?T.red:rem<300?T.yellow:T.green;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem', alignItems:'center' }}>
      <div style={{ display:'flex', gap:'0.4rem', flexWrap:'wrap', justifyContent:'center' }}>
        {PRESETS.map(p=>(
          <button key={p.m} onClick={()=>{setDur(p.m);}} disabled={running}
            style={{ ...s.btn(dur===p.m?T.accent:T.surf2), border:`1px solid ${dur===p.m?T.accent:T.border}`, padding:'7px 14px', fontSize:'0.8rem', opacity:running?0.5:1 }}>{p.l} ({p.m}m)</button>
        ))}
      </div>
      {!running&&<input value={lbl} onChange={e=>setLbl(e.target.value)} placeholder="Session label…" style={{ ...s.inp(), textAlign:'center', width:'80%' }}
        onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>}

      {/* Ring */}
      <div style={{ position:'relative', width:200, height:200 }}>
        <svg width="200" height="200" style={{ transform:'rotate(-90deg)' }}>
          <circle cx="100" cy="100" r="88" fill="none" stroke={T.border} strokeWidth="10"/>
          <circle cx="100" cy="100" r="88" fill="none" stroke={color} strokeWidth="10"
            strokeDasharray={`${2*Math.PI*88}`} strokeDashoffset={`${2*Math.PI*88*(1-pct/100)}`}
            style={{ transition:'stroke-dashoffset 0.9s,stroke 0.5s' }} strokeLinecap="round"/>
        </svg>
        <div style={{ position:'absolute', inset:0, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center' }}>
          <div style={{ ...s.mono('2.6rem',color), fontWeight:700, letterSpacing:'-0.03em' }}>{fmt(rem)}</div>
          <div style={{ color:T.muted, fontSize:'0.75rem', marginTop:4 }}>{session?.label||lbl}</div>
        </div>
      </div>

      {!running
        ? <button onClick={start} style={{ ...s.btn(T.green,'#000'), padding:'13px 32px', fontSize:'1rem', boxShadow:`0 6px 24px ${T.green}44` }}>Start Focus</button>
        : <button onClick={stop}  style={{ ...s.btn(T.red), padding:'13px 32px', fontSize:'1rem' }}>Stop</button>}

      {history.length>0&&(
        <div style={{ width:'100%' }}>
          <div style={{ color:T.muted, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Completed Sessions</div>
          {history.slice(-5).reverse().map(s=>(
            <div key={s.id} style={{ display:'flex', justifyContent:'space-between', background:T.surf, border:`1px solid ${T.border}`, borderRadius:10, padding:'9px 13px', marginBottom:4 }}>
              <span style={{ color:T.text, fontSize:'0.85rem' }}>{s.label}</span>
              <span style={{ ...s.tag(T.green) }}>{s.duration_m} min ✓</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   SMART NOTES — AI-enhanced notes
═══════════════════════════════════════════════════════════════ */
function SmartNotesApp({ name }) {
  const [notes, setNotes]   = useState([]);
  const [input, setInput]   = useState('');
  const [search, setSearch] = useState('');
  const [results, setResults]= useState(null);

  const load = useCallback(async()=>{ try{const d=await runApp(name,{action:'list'});setNotes(d.result.notes||[]);}catch(_){} },[name]);
  useEffect(()=>{ load(); },[load]);

  const add       = async()=>{ if(!input.trim())return; await runApp(name,{action:'add',content:input}); setInput(''); load(); };
  const doSearch  = async()=>{ if(!search)return; const d=await runApp(name,{action:'search',search}); setResults(d.result.results||[]); };
  const clear     = async()=>{ await runApp(name,{action:'clear'}); load(); };

  const list = results||notes;

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <div style={{ display:'flex', gap:'0.5rem' }}>
        <input value={search} onChange={e=>{setSearch(e.target.value);if(!e.target.value)setResults(null);}} placeholder="Search by keyword…" style={{ ...s.inp(), flex:1 }}
          onKeyDown={e=>e.key==='Enter'&&doSearch()}
          onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
        <button onClick={doSearch} style={s.btn(T.blue,'#000')}>Search</button>
        {results&&<button onClick={()=>{setSearch('');setResults(null);}} style={{ ...s.btn(T.surf2), border:`1px solid ${T.border}` }}>✕</button>}
      </div>

      <div style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:12, overflow:'hidden' }}>
        <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="Write a note… AI will auto-format and extract keywords"
          style={{ width:'100%', boxSizing:'border-box', padding:'14px', background:'transparent', border:'none', color:T.text, fontSize:'0.9rem', fontFamily:"'DM Sans',sans-serif", outline:'none', resize:'vertical', minHeight:90, lineHeight:1.65 }}/>
        <div style={{ display:'flex', justifyContent:'flex-end', padding:'8px 14px', borderTop:`1px solid ${T.border}` }}>
          <button onClick={add} style={{ ...s.btn(T.accent), boxShadow:`0 4px 14px ${T.accent}33` }}>✦ Save & Format</button>
        </div>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem', maxHeight:280, overflowY:'auto' }}>
        {!list.length
          ? <div style={{ color:T.muted, textAlign:'center', padding:'1.5rem' }}>{results?'No results.':'No notes yet.'}</div>
          : [...list].reverse().map(n=>(
            <div key={n.id} style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:12, padding:'12px 14px', transition:'border-color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=T.accent}
              onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
              {(n.keywords||[]).length>0&&(
                <div style={{ display:'flex', gap:'0.35rem', flexWrap:'wrap', marginBottom:8 }}>
                  {n.keywords.map(k=><span key={k} style={s.tag(T.accent)}>{k}</span>)}
                </div>
              )}
              <p style={{ color:T.text, margin:0, lineHeight:1.6, fontSize:'0.88rem' }}>{n.content}</p>
              <div style={{ ...s.mono('0.7rem',T.muted), marginTop:8 }}>{n.created_at}</div>
            </div>
          ))}
      </div>
      {notes.length>0&&<button onClick={clear} style={{ ...s.btn(`${T.red}18`,T.red), border:`1px solid ${T.red}28`, width:'100%' }}>Clear All</button>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   FILE ORGANIZER
═══════════════════════════════════════════════════════════════ */
function FileOrgApp({ name }) {
  const [action, setAction] = useState('scan');
  const [path, setPath]     = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading]= useState(false);
  const CC2 = { images:T.pink, documents:T.blue, videos:'#a78bfa', audio:T.green, archives:T.yellow, code:T.orange, others:T.muted };

  const run_ = async()=>{ setLoading(true); try{const d=await runApp(name,{action,path}); setResult(d.result);}catch(_){} finally{setLoading(false);} };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      <Tabs tabs={[{id:'scan',label:'Scan'},{id:'duplicates',label:'Duplicates'},{id:'history',label:'History'}]} active={action} onChange={setAction}/>
      {action!=='history'&&(
        <input value={path} onChange={e=>setPath(e.target.value)} placeholder="Directory path (leave empty for demo)" style={s.inp()}
          onFocus={e=>e.target.style.borderColor=T.accent} onBlur={e=>e.target.style.borderColor=T.border}/>
      )}
      <button onClick={run_} disabled={loading} style={{ ...s.btn(T.accent), width:'100%', boxShadow:`0 4px 14px ${T.accent}33` }}>
        {loading?'Scanning…':'▶ Run'}
      </button>
      {result&&(
        <div style={{ display:'flex', flexDirection:'column', gap:'0.5rem' }}>
          {result.message&&<div style={{ color:T.muted, fontSize:'0.82rem' }}>{result.message}</div>}
          {result.found!==undefined&&(
            <div style={{ background:`${T.green}12`, border:`1px solid ${T.green}28`, borderRadius:12, padding:'16px', textAlign:'center' }}>
              <div style={{ ...s.mono('2rem',T.green), fontWeight:700 }}>{result.found}</div>
              <div style={{ color:T.muted, fontSize:'0.8rem' }}>files in {result.path||'demo'}</div>
            </div>
          )}
          {result.breakdown&&Object.entries(result.breakdown).map(([c,files])=>(
            <div key={c} style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:11, padding:'10px 13px' }}>
              <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                <span style={{ color:CC2[c]||T.muted, fontWeight:600, textTransform:'capitalize' }}>{c}</span>
                <span style={s.tag(CC2[c]||T.muted)}>{files.length}</span>
              </div>
              <div style={{ color:T.muted, fontSize:'0.78rem', lineHeight:1.8 }}>{files.slice(0,5).join(' · ')}{files.length>5&&` +${files.length-5} more`}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   NETWORK SCANNER
═══════════════════════════════════════════════════════════════ */
function NetworkApp({ name }) {
  const [info, setInfo]       = useState(null);
  const [pingT, setPingT]     = useState('');
  const [pingR, setPingR]     = useState(null);
  const [scanR, setScanR]     = useState(null);
  const [scanning, setScanning]= useState(false);

  useEffect(()=>{ runApp(name,{action:'info'}).then(d=>setInfo(d.result)).catch(()=>{}); },[name]);

  const ping = async()=>{ const d=await runApp(name,{action:'ping',target:pingT}); setPingR(d.result); };
  const scan = async()=>{ setScanning(true);setScanR(null); const d=await runApp(name,{action:'scan'}); setScanR(d.result); setScanning(false); };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {info&&(
        <div style={s.grid(2)}>
          <StatCard label="Hostname" value={info.hostname} color={T.blue}/>
          <StatCard label="Local IP"  value={info.local_ip} color={T.green}/>
        </div>
      )}
      <div style={{ background:T.surf, border:`1px solid ${T.border}`, borderRadius:14, padding:14 }}>
        <div style={{ color:T.muted, fontSize:'0.7rem', textTransform:'uppercase', letterSpacing:'0.07em', marginBottom:8 }}>Ping Test</div>
        <div style={{ display:'flex', gap:'0.5rem' }}>
          <input value={pingT} onChange={e=>setPingT(e.target.value)} placeholder="IP or hostname…" style={{ ...s.inp(), flex:1 }} onKeyDown={e=>e.key==='Enter'&&ping()}
            onFocus={e=>e.target.style.borderColor=T.blue} onBlur={e=>e.target.style.borderColor=T.border}/>
          <button onClick={ping} style={s.btn(T.blue,'#000')}>Ping</button>
        </div>
        {pingR&&(
          <div style={{ display:'flex', gap:8, alignItems:'center', marginTop:10 }}>
            <span style={{ color:pingR.alive?T.green:T.red, fontWeight:700, fontSize:'1.1rem' }}>{pingR.alive?'✓':'✕'}</span>
            <span style={{ color:pingR.alive?T.green:T.red, fontWeight:600 }}>{pingR.target}</span>
            <span style={{ color:T.muted, fontSize:'0.85rem' }}>{pingR.status}</span>
          </div>
        )}
      </div>
      <button onClick={scan} disabled={scanning} style={{ ...s.btn(T.accent), width:'100%', boxShadow:`0 4px 14px ${T.accent}33` }}>
        {scanning?'Scanning network…':'Scan Network'}
      </button>
      {scanR&&(
        <div style={{ display:'flex', flexDirection:'column', gap:'0.4rem' }}>
          <span style={s.tag(T.green)}>{scanR.found} devices found</span>
          {scanR.devices.map((d,i)=>(
            <div key={i} style={{ display:'flex', gap:'0.65rem', background:T.surf, border:`1px solid ${T.border}`, borderRadius:10, padding:'9px 13px' }}>
              <span style={{ ...s.mono('0.85rem',T.green) }}>{d.ip}</span>
              <span style={{ color:T.muted, fontSize:'0.85rem' }}>{d.hostname}</span>
            </div>
          ))}
          {scanR.note&&<div style={{ color:T.muted, fontSize:'0.72rem' }}>{scanR.note}</div>}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MUSIC PLAYER
═══════════════════════════════════════════════════════════════ */
function MusicApp({ name }) {
  const [state, setState] = useState({playlist:[],current:null,volume:80});
  const [curIdx, setCurIdx]= useState(0);
  const [playing, setPlaying]= useState(false);

  useEffect(()=>{ runApp(name,{action:'playlist'}).then(d=>setState(d.result)).catch(()=>{}); },[name]);

  const play = async(idx)=>{ setCurIdx(idx); setPlaying(true); await runApp(name,{action:'play',path:idx}).catch(()=>{}); setState(s=>({...s,current:idx})); };
  const setVol = async v=>{ setState(s=>({...s,volume:v})); await runApp(name,{action:'volume',volume:v}).catch(()=>{}); };
  const track = state.playlist[curIdx];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
      {/* Player */}
      <div style={{ background:`linear-gradient(135deg,#a78bfa18,#7c6cff0a)`, border:'1px solid #a78bfa28', borderRadius:16, padding:'20px', textAlign:'center' }}>
        <div style={{ width:56, height:56, borderRadius:16, background:'#a78bfa20', border:'1px solid #a78bfa30', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontSize:'1.6rem' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
        </div>
        {track
          ? <><div style={{ color:T.text, fontWeight:600, fontSize:'0.95rem' }}>{track.title}</div>{track.duration&&<div style={{ color:T.muted, fontSize:'0.8rem', marginTop:3 }}>{track.duration}</div>}</>
          : <div style={{ color:T.muted }}>Select a track</div>}
      </div>

      {/* Controls */}
      <div style={{ display:'flex', justifyContent:'center', gap:'0.65rem' }}>
        <button onClick={()=>play((curIdx-1+state.playlist.length)%state.playlist.length)} style={{ ...s.btn(T.surf2), border:`1px solid ${T.border}`, fontSize:'1.1rem', padding:'10px 14px' }}>⏮</button>
        <button onClick={()=>playing?setPlaying(false):play(curIdx)} style={{ ...s.btn('#a78bfa'), padding:'10px 22px', fontSize:'1.1rem', boxShadow:'0 4px 18px #a78bfa44' }}>{playing?'⏸':'▶'}</button>
        <button onClick={()=>play((curIdx+1)%state.playlist.length)}  style={{ ...s.btn(T.surf2), border:`1px solid ${T.border}`, fontSize:'1.1rem', padding:'10px 14px' }}>⏭</button>
      </div>

      {/* Volume */}
      <div style={{ display:'flex', alignItems:'center', gap:'0.65rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={T.muted} strokeWidth="2" strokeLinecap="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>{state.volume>0&&<path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>}{state.volume>50&&<path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>}</svg>
        <input type="range" min={0} max={100} value={state.volume} onChange={e=>setVol(+e.target.value)} style={{ flex:1, accentColor:'#a78bfa' }}/>
        <span style={{ ...s.mono('0.78rem',T.muted), minWidth:36 }}>{state.volume}%</span>
      </div>

      {/* Playlist */}
      <div style={{ display:'flex', flexDirection:'column', gap:'0.35rem', maxHeight:200, overflowY:'auto' }}>
        {state.playlist.map((t,i)=>(
          <div key={t.id} onClick={()=>play(i)} style={{ display:'flex', alignItems:'center', gap:'0.65rem', background:T.surf, border:`1px solid ${i===curIdx&&playing?'#a78bfa':T.border}`, borderRadius:10, padding:'9px 13px', cursor:'pointer', transition:'all 0.15s' }}
            onMouseEnter={e=>e.currentTarget.style.borderColor='#a78bfa'}
            onMouseLeave={e=>e.currentTarget.style.borderColor=i===curIdx&&playing?'#a78bfa':T.border}>
            <span style={{ color:i===curIdx&&playing?'#a78bfa':T.muted, fontSize:'0.85rem' }}>{i===curIdx&&playing?'▶':'○'}</span>
            <span style={{ flex:1, color:T.text, fontSize:'0.88rem' }}>{t.title}</span>
            {t.duration&&<span style={{ ...s.mono('0.72rem',T.muted) }}>{t.duration}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   GAMES — Snake, Tetris, Memory (unchanged from current)
═══════════════════════════════════════════════════════════════ */
function SnakeGame({ appName }) {
  const G=20,CELL=17,SIZE=G*CELL;
  const [snake,setSnake]=useState([[10,10],[10,11],[10,12]]);
  const [food,setFood]=useState([5,5]);
  const [bonus,setBonus]=useState(null);
  const [score,setScore]=useState(0);
  const [level,setLevel]=useState(1);
  const [phase,setPhase]=useState('menu');
  const [flash,setFlash]=useState(null);
  const [lb,setLb]=useState([]);
  const [best,setBest]=useState(0);
  const dRef=useRef([1,0]);const sRef=useRef([[10,10],[10,11],[10,12]]);const fRef=useRef([5,5]);const bRef=useRef(null);const scRef=useRef(0);const lvRef=useRef(1);

  const rndFood=useCallback(s=>{let f;do{f=[Math.floor(Math.random()*G),Math.floor(Math.random()*G)];}while(s.some(c=>c[0]===f[0]&&c[1]===f[1]));return f;},[]);
  const loadLb=useCallback(()=>runApp(appName,{action:'leaderboard'}).then(d=>{const lb2=d.result.leaderboard||[];setLb(lb2);if(lb2.length)setBest(lb2[0].score);}).catch(()=>{}),[appName]);
  useEffect(()=>{loadLb();},[loadLb]);

  const startGame=useCallback(()=>{const s=[[10,10],[10,11],[10,12]];const f=rndFood(s);sRef.current=s;fRef.current=f;dRef.current=[1,0];scRef.current=0;lvRef.current=1;bRef.current=null;setSnake(s);setFood(f);setBonus(null);setScore(0);setLevel(1);setFlash(null);setPhase('playing');},[rndFood]);

  useEffect(()=>{const h=e=>{const m={ArrowUp:[0,-1],ArrowDown:[0,1],ArrowLeft:[-1,0],ArrowRight:[1,0]};if(m[e.key]){e.preventDefault();const nd=m[e.key];if(nd[0]!==-dRef.current[0]||nd[1]!==-dRef.current[1])dRef.current=nd;}if(e.key===' ')setPhase(p=>p==='playing'?'paused':p==='paused'?'playing':p);};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);},[]);

  useEffect(()=>{if(phase!=='playing')return;const spd=Math.max(70,160-(lvRef.current-1)*15);const t=setInterval(()=>{const s=sRef.current;const d=dRef.current;const f=fRef.current;const bn=bRef.current;const head=[(s[0][0]+d[0]+G)%G,(s[0][1]+d[1]+G)%G];if(s.some(c=>c[0]===head[0]&&c[1]===head[1])){setPhase('dead');setFlash('Game Over');runApp(appName,{action:'save_score',score:scRef.current,level:lvRef.current}).then(loadLb).catch(()=>{});setBest(b=>Math.max(b,scRef.current));return;}const ateF=head[0]===f[0]&&head[1]===f[1];const ateB=bn&&head[0]===bn.pos[0]&&head[1]===bn.pos[1];const ns=ateF||ateB?[head,...s]:[head,...s.slice(0,-1)];sRef.current=ns;setSnake([...ns]);if(ateF){scRef.current+=10*lvRef.current;setScore(scRef.current);setFlash('+'+10*lvRef.current);const nf=rndFood(ns);fRef.current=nf;setFood([...nf]);const nl=Math.floor(scRef.current/80)+1;if(nl>lvRef.current){lvRef.current=nl;setLevel(nl);setFlash('⬆ LEVEL '+nl);}if(scRef.current%50===0){const bp=rndFood([...ns,nf]);bRef.current={pos:bp,timer:8};setBonus({pos:bp,timer:8});}}else if(ateB){scRef.current+=50*lvRef.current;setScore(scRef.current);setFlash('★ +'+50*lvRef.current);bRef.current=null;setBonus(null);}else if(bn){const nb={...bn,timer:bn.timer-1};if(nb.timer<=0){bRef.current=null;setBonus(null);}else{bRef.current=nb;setBonus({...nb});}}},spd);return()=>clearInterval(t);},[phase,rndFood,loadLb,appName]);

  useEffect(()=>{if(!flash)return;const t=setTimeout(()=>setFlash(null),900);return()=>clearTimeout(t);},[flash]);
  const snakeColor=(i,total)=>{const t2=i/Math.max(total,1);return`rgb(${Math.round(74+(139-74)*t2)},${Math.round(222+(90-222)*t2)},${Math.round(128+(60-128)*t2)})`;};
  const dpad=[['','↑',''],['←','','→'],['','↓','']];

  if(phase==='menu')return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1.5rem',padding:'1.5rem',minHeight:400}}>
      <div style={{fontSize:'3.5rem',filter:`drop-shadow(0 0 20px ${T.green}88)`}}>🐍</div>
      <div style={{textAlign:'center'}}><div style={{...s.mono('1.8rem',T.green),fontWeight:700,textShadow:`0 0 30px ${T.green}66`}}>SNAKE</div><div style={{color:T.muted,fontSize:'0.82rem',marginTop:4}}>Eat food · Grow · Survive</div></div>
      {best>0&&<span style={s.tag(T.yellow)}>🏆 Best: {best}</span>}
      <button onClick={startGame} style={{...s.btn(T.green,'#000'),padding:'12px 32px',fontSize:'1rem',boxShadow:`0 6px 24px ${T.green}44`}}>▶ Play</button>
      {lb.length>0&&<div style={{width:'100%',background:T.bg,borderRadius:12,padding:'0.75rem 1rem'}}><div style={{color:T.muted,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Top Scores</div>{lb.slice(0,5).map((e,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:[T.yellow,'#9ca3af','#b45309',T.muted,T.muted][i],fontWeight:700}}>#{i+1}</span><span style={s.mono('0.85rem')}>{e.score} pts</span><span style={{color:T.muted,fontSize:'0.75rem'}}>Lv.{e.level}</span></div>)}</div>}
    </div>
  );
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.75rem'}}>
      <div style={{display:'flex',gap:'0.6rem',flexWrap:'wrap',justifyContent:'center'}}>
        <span style={s.tag(T.green)}>Score {score}</span>
        <span style={s.tag(T.accent)}>Lv.{level}</span>
        <span style={s.tag(T.yellow)}>Best {best}</span>
        {flash&&<span style={{...s.tag(T.orange),animation:'fadeUp 0.9s ease forwards'}}>{flash}</span>}
      </div>
      <div style={{border:`2px solid ${T.border}`,borderRadius:12,overflow:'hidden',boxShadow:`0 0 40px ${T.green}18`}}>
        <svg width={SIZE} height={SIZE} style={{display:'block',background:'#05050f'}}>
          {Array.from({length:G}).flatMap((_,y)=>Array.from({length:G}).map((_,x)=><rect key={`${x}-${y}`} x={x*CELL} y={y*CELL} width={CELL} height={CELL} fill="none" stroke="#0d0d1a" strokeWidth={0.5}/>))}
          <circle cx={food[0]*CELL+CELL/2} cy={food[1]*CELL+CELL/2} r={CELL*0.55} fill={`${T.red}22`}/>
          <rect x={food[0]*CELL+2} y={food[1]*CELL+2} width={CELL-4} height={CELL-4} rx={4} fill={T.red}/>
          {bonus&&<><circle cx={bonus.pos[0]*CELL+CELL/2} cy={bonus.pos[1]*CELL+CELL/2} r={CELL*0.65} fill={`${T.yellow}33`}/><rect x={bonus.pos[0]*CELL+1} y={bonus.pos[1]*CELL+1} width={CELL-2} height={CELL-2} rx={5} fill={T.yellow}/></>}
          {snake.map((c,i)=><rect key={i} x={c[0]*CELL+1} y={c[1]*CELL+1} width={CELL-2} height={CELL-2} rx={i===0?6:3} fill={snakeColor(i,snake.length)} opacity={Math.max(0.3,1-i*0.025)}/>)}
          {phase==='paused'&&<><rect x={0} y={0} width={SIZE} height={SIZE} fill="#00000077"/><text x={SIZE/2} y={SIZE/2} textAnchor="middle" fill="#fff" fontFamily="Space Mono" fontSize={18} fontWeight="bold">⏸ PAUSED</text></>}
          {phase==='dead'&&<><rect x={0} y={0} width={SIZE} height={SIZE} fill="#00000099"/><text x={SIZE/2} y={SIZE/2-14} textAnchor="middle" fill={T.red} fontFamily="Space Mono" fontSize={16} fontWeight="bold">GAME OVER</text><text x={SIZE/2} y={SIZE/2+10} textAnchor="middle" fill={T.yellow} fontFamily="Space Mono" fontSize={13}>Score: {score}</text></>}
        </svg>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(3,44px)',gridTemplateRows:'repeat(3,44px)',gap:4}}>
        {dpad.flat().map((k,i)=>k?<button key={i} onClick={()=>{const m={'↑':[0,-1],'↓':[0,1],'←':[-1,0],'→':[1,0]};const nd=m[k];if(nd[0]!==-dRef.current[0]||nd[1]!==-dRef.current[1])dRef.current=nd;}} style={{...s.btn(T.surf2),border:`1px solid ${T.border}`,width:44,height:44,borderRadius:10,padding:0,fontSize:'1.1rem'}}>{k}</button>:<div key={i}/>)}
      </div>
      <div style={{display:'flex',gap:'0.5rem'}}>
        {phase==='dead'?<button onClick={startGame} style={s.btn(T.green,'#000')}>🔄 Play Again</button>:<button onClick={()=>setPhase(p=>p==='playing'?'paused':'playing')} style={s.btn(phase==='paused'?T.green:T.yellow,'#000')}>{phase==='paused'?'▶ Resume':'⏸ Pause'}</button>}
        <button onClick={()=>setPhase('menu')} style={{...s.btn(T.surf2),border:`1px solid ${T.border}`}}>Menu</button>
      </div>
    </div>
  );
}

function TetrisGame({ appName }) {
  const COLS=10,ROWS=20,CELL=22;
  const SHAPES={I:{cells:[[0,1],[1,1],[2,1],[3,1]],color:T.blue},O:{cells:[[0,0],[1,0],[0,1],[1,1]],color:T.yellow},T:{cells:[[1,0],[0,1],[1,1],[2,1]],color:'#a78bfa'},S:{cells:[[1,0],[2,0],[0,1],[1,1]],color:T.green},Z:{cells:[[0,0],[1,0],[1,1],[2,1]],color:T.red},L:{cells:[[2,0],[0,1],[1,1],[2,1]],color:T.orange},J:{cells:[[0,0],[0,1],[1,1],[2,1]],color:T.pink}};
  const KS=Object.keys(SHAPES);
  const empty=()=>Array.from({length:ROWS},()=>Array(COLS).fill(null));
  const rnd=()=>{const k=KS[Math.floor(Math.random()*KS.length)];return{key:k,...SHAPES[k],x:3,y:0};};
  const [board,setBoard]=useState(empty());const [piece,setPiece]=useState(null);const [next,setNext]=useState(null);const [held,setHeld]=useState(null);const [canHold,setCanHold]=useState(true);const [score,setScore]=useState(0);const [lines,setLines]=useState(0);const [level,setLevel]=useState(1);const [phase,setPhase]=useState('menu');const [clearing,setClearing]=useState([]);const [lb,setLb]=useState([]);
  const st=useRef({board:empty(),piece:null,next:null,held:null,canHold:true,score:0,lines:0,level:1});
  const loadLb=useCallback(()=>runApp(appName,{action:'leaderboard'}).then(d=>setLb(d.result.leaderboard||[])).catch(()=>{}),[appName]);
  useEffect(()=>{loadLb();},[loadLb]);
  const valid=(cells,brd,px,py)=>cells.every(([cx,cy])=>{const nx=px+cx,ny=py+cy;return nx>=0&&nx<COLS&&ny>=0&&ny<ROWS&&!brd[ny]?.[nx];});
  const rot=cells=>{const m=Math.max(...cells.map(([,y])=>y));return cells.map(([x,y])=>[m-y,x]);};
  const ghostY=(p,brd)=>{let gy=p.y;while(valid(p.cells,brd,p.x,gy+1))gy++;return gy;};
  const merge=useCallback((brd,p)=>{const nb=brd.map(r=>[...r]);p.cells.forEach(([cx,cy])=>{if(nb[p.y+cy])nb[p.y+cy][p.x+cx]=p.color;});return nb;},[]);
  const lockPiece=useCallback((brd,p)=>{const merged=merge(brd,p);const full=merged.reduce((a,row,i)=>row.every(Boolean)?[...a,i]:a,[]);if(full.length){setClearing(full);setTimeout(()=>{const cleared=full.length;const kept=merged.filter((_,i)=>!full.includes(i));const nb=[...Array(cleared).fill(null).map(()=>Array(COLS).fill(null)),...kept];const pts=[0,100,300,500,800][cleared]||0;const ns=st.current.score+pts*st.current.level;const nl=st.current.lines+cleared;const nlv=Math.floor(nl/10)+1;st.current.board=nb;st.current.score=ns;st.current.lines=nl;st.current.level=nlv;setBoard(nb);setScore(ns);setLines(nl);setLevel(nlv);setClearing([]);const np=st.current.next;st.current.next=rnd();st.current.piece=np;st.current.canHold=true;setPiece({...np});setNext({...st.current.next});setCanHold(true);if(!valid(np.cells,nb,np.x,np.y)){setPhase('dead');runApp(appName,{action:'save_score',score:ns,lines:nl,level:nlv}).then(loadLb).catch(()=>{});}},200);}else{st.current.board=merged;setBoard(merged);const np=st.current.next;st.current.next=rnd();st.current.piece=np;st.current.canHold=true;setPiece({...np});setNext({...st.current.next});setCanHold(true);if(!valid(np.cells,merged,np.x,np.y)){setPhase('dead');runApp(appName,{action:'save_score',score:st.current.score,lines:st.current.lines,level:st.current.level}).then(loadLb).catch(()=>{});}};},[merge,loadLb,appName]);
  const drop=useCallback(()=>{const s=st.current;if(!s.piece)return;if(valid(s.piece.cells,s.board,s.piece.x,s.piece.y+1)){const np={...s.piece,y:s.piece.y+1};s.piece=np;setPiece({...np});}else lockPiece(s.board,s.piece);},[lockPiece]);
  useEffect(()=>{if(phase!=='playing')return;const t=setInterval(drop,Math.max(100,800-(level-1)*70));return()=>clearInterval(t);},[phase,level,drop]);
  useEffect(()=>{if(phase!=='playing')return;const h=e=>{const s2=st.current;if(!s2.piece)return;if(e.key==='ArrowLeft'){const np={...s2.piece,x:s2.piece.x-1};if(valid(np.cells,s2.board,np.x,np.y)){s2.piece=np;setPiece({...np});}}else if(e.key==='ArrowRight'){const np={...s2.piece,x:s2.piece.x+1};if(valid(np.cells,s2.board,np.x,np.y)){s2.piece=np;setPiece({...np});}}else if(e.key==='ArrowDown'){drop();}else if(e.key===' '||e.key==='ArrowUp'){e.preventDefault();const rc=rot(s2.piece.cells);if(valid(rc,s2.board,s2.piece.x,s2.piece.y)){const np={...s2.piece,cells:rc};s2.piece=np;setPiece({...np});}}};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);},[phase,drop]);
  const hardDrop=()=>{const s2=st.current;if(!s2.piece)return;const gy=ghostY(s2.piece,s2.board);const np={...s2.piece,y:gy};s2.piece=np;setPiece({...np});setTimeout(()=>lockPiece(s2.board,np),10);};
  const holdPiece=()=>{const s2=st.current;if(!s2.piece||!s2.canHold)return;if(s2.held){const swap={...s2.held,x:3,y:0};s2.held={key:s2.piece.key,...SHAPES[s2.piece.key]};s2.piece=swap;s2.canHold=false;setPiece({...swap});setHeld({...s2.held});setCanHold(false);}else{s2.held={key:s2.piece.key,...SHAPES[s2.piece.key]};const np=s2.next;s2.next=rnd();s2.piece=np;s2.canHold=false;setHeld({...s2.held});setPiece({...np});setNext({...s2.next});setCanHold(false);}};
  const startGame=()=>{const b=empty();const p=rnd();const nx=rnd();st.current={board:b,piece:p,next:nx,held:null,canHold:true,score:0,lines:0,level:1};setBoard(b);setPiece(p);setNext(nx);setHeld(null);setCanHold(true);setScore(0);setLines(0);setLevel(1);setClearing([]);setPhase('playing');};
  const display=piece?merge(board,piece):board;
  const ghost=piece?ghostY(piece,board):null;
  const mini=(p,sz=4)=>{if(!p)return null;const minX=Math.min(...p.cells.map(([x])=>x)),minY=Math.min(...p.cells.map(([,y])=>y));const g=Array.from({length:sz},()=>Array(sz).fill(null));p.cells.forEach(([cx,cy])=>{if(g[cy-minY])g[cy-minY][cx-minX]=p.color;});return g;};
  const Preview=({p,label,dim})=>{const g=mini(p);return(<div style={{background:T.bg,borderRadius:8,padding:'0.5rem',opacity:dim?0.4:1}}><div style={{color:T.muted,fontSize:'0.7rem',marginBottom:4}}>{label}</div>{g?<svg width={g[0].length*14} height={g.length*14}>{g.map((row,y)=>row.map((c,x)=>c?<rect key={`${x}-${y}`} x={x*14+1} y={y*14+1} width={12} height={12} rx={3} fill={c}/>:null))}</svg>:<div style={{color:T.border,fontSize:'0.8rem'}}>—</div>}</div>);};

  if(phase==='menu')return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1.5rem',padding:'1.5rem',minHeight:400}}>
      <div style={{fontSize:'3rem',filter:`drop-shadow(0 0 20px ${T.accent}88)`}}>🧱</div>
      <div style={{textAlign:'center'}}><div style={{...s.mono('1.8rem',T.accent),fontWeight:700}}>TETRIS</div><div style={{color:T.muted,fontSize:'0.82rem',marginTop:4}}>Stack · Clear · Level up</div></div>
      <button onClick={startGame} style={{...s.btn(T.accent),padding:'12px 32px',fontSize:'1rem',boxShadow:`0 6px 24px ${T.accent}44`}}>▶ Play</button>
      {lb.length>0&&<div style={{width:'100%',background:T.bg,borderRadius:12,padding:'0.75rem 1rem'}}><div style={{color:T.muted,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Leaderboard</div>{lb.slice(0,5).map((e,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:[T.yellow,'#9ca3af','#b45309',T.muted,T.muted][i]}}>#{i+1}</span><span style={s.mono('0.85rem')}>{e.score}</span><span style={{color:T.muted,fontSize:'0.75rem'}}>Lv.{e.level}·{e.lines}L</span></div>)}</div>}
    </div>
  );
  return(
    <div style={{display:'flex',gap:'0.75rem',justifyContent:'center',alignItems:'flex-start'}}>
      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',minWidth:80}}>
        <Preview p={held} label="HOLD" dim={!canHold}/>
        <div style={{background:T.bg,borderRadius:8,padding:'0.5rem'}}><div style={{color:T.muted,fontSize:'0.7rem'}}>SCORE</div><div style={{...s.mono('1rem',T.accent),fontWeight:700}}>{score}</div></div>
        <div style={{background:T.bg,borderRadius:8,padding:'0.5rem'}}><div style={{color:T.muted,fontSize:'0.7rem'}}>LINES</div><div style={{...s.mono('1rem',T.green),fontWeight:700}}>{lines}</div></div>
        <div style={{background:T.bg,borderRadius:8,padding:'0.5rem'}}><div style={{color:T.muted,fontSize:'0.7rem'}}>LEVEL</div><div style={{...s.mono('1rem',T.yellow),fontWeight:700}}>{level}</div></div>
      </div>
      <div style={{border:`2px solid ${T.border}`,borderRadius:8,overflow:'hidden',boxShadow:`0 0 40px ${T.accent}18`}}>
        <svg width={COLS*CELL} height={ROWS*CELL} style={{display:'block',background:'#05050f'}}>
          {display.map((row,y)=>row.map((c,x)=>{const ic=clearing.includes(y);return(<g key={`${x}-${y}`}><rect x={x*CELL+1} y={y*CELL+1} width={CELL-2} height={CELL-2} rx={3} fill={ic?'#fff':(c||'#0d0d1a')} stroke={c?'rgba(255,255,255,0.1)':'#131320'} strokeWidth={0.5} opacity={ic?0.9:1}/>{c&&!ic&&<rect x={x*CELL+2} y={y*CELL+2} width={CELL*0.4} height={3} rx={1} fill="rgba(255,255,255,0.2)"/>}</g>);}))}
          {piece&&ghost!==null&&ghost!==piece.y&&piece.cells.map(([cx,cy],i)=><rect key={`g${i}`} x={(piece.x+cx)*CELL+2} y={(ghost+cy)*CELL+2} width={CELL-4} height={CELL-4} rx={3} fill="none" stroke={piece.color} strokeWidth={1} opacity={0.3}/>)}
          {phase==='paused'&&<><rect x={0} y={0} width={COLS*CELL} height={ROWS*CELL} fill="#00000088"/><text x={COLS*CELL/2} y={ROWS*CELL/2} textAnchor="middle" fill="#fff" fontFamily="Space Mono" fontSize={14} fontWeight="bold">⏸ PAUSED</text></>}
          {phase==='dead'&&<><rect x={0} y={0} width={COLS*CELL} height={ROWS*CELL} fill="#00000099"/><text x={COLS*CELL/2} y={ROWS*CELL/2-12} textAnchor="middle" fill={T.red} fontFamily="Space Mono" fontSize={14} fontWeight="bold">GAME OVER</text><text x={COLS*CELL/2} y={ROWS*CELL/2+8} textAnchor="middle" fill={T.yellow} fontFamily="Space Mono" fontSize={11}>Score: {score}</text></>}
        </svg>
      </div>
      <div style={{display:'flex',flexDirection:'column',gap:'0.5rem',minWidth:80}}>
        <Preview p={next} label="NEXT"/>
        <div style={{color:T.muted,fontSize:'0.65rem',lineHeight:1.9,background:T.bg,borderRadius:8,padding:'0.5rem'}}>←→ Move<br/>↓ Fall<br/>↑/Spc Rot<br/>P Pause</div>
        {phase==='dead'?<button onClick={startGame} style={{...s.btn(T.green,'#000'),fontSize:'0.78rem',padding:'8px'}}>Restart</button>:<button onClick={()=>setPhase(p=>p==='playing'?'paused':'playing')} style={{...s.btn(phase==='paused'?T.green:T.yellow,'#000'),fontSize:'0.78rem',padding:'8px'}}>{phase==='paused'?'▶':'⏸'}</button>}
        <button onClick={()=>{hardDrop();}} style={{...s.btn(T.blue,'#000'),fontSize:'0.75rem',padding:'7px'}}>↓ Drop</button>
        <button onClick={holdPiece} disabled={!canHold} style={{...s.btn(canHold?'#a78bfa':T.surf2),fontSize:'0.75rem',padding:'7px',opacity:canHold?1:0.4}}>Hold</button>
        <button onClick={()=>setPhase('menu')} style={{...s.btn(T.surf2),border:`1px solid ${T.border}`,fontSize:'0.75rem',padding:'7px'}}>Menu</button>
        {lb.length>0&&<><div style={{color:T.muted,fontSize:'0.68rem',marginTop:4}}>Best</div>{lb.slice(0,3).map((e,i)=><div key={i} style={{...s.mono('0.68rem',T.muted),padding:'2px 0'}}>#{i+1} {e.score}</div>)}</>}
      </div>
    </div>
  );
}

function MemoryGame({ appName }) {
  const CS={animals:['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸'],food:['🍎','🍊','🍋','🍇','🍓','🍑','🥝','🍒','🥭','🍍','🥥','🍌'],sports:['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🥊']};
  const [phase,setPhase]=useState('menu');const [theme,setTheme]=useState('animals');const [pairs,setPairs]=useState(8);const [deck,setDeck]=useState([]);const [flipped,setFlipped]=useState([]);const [matched,setMatched]=useState([]);const [moves,setMoves]=useState(0);const [time,setTime]=useState(0);const [combo,setCombo]=useState(0);const [wrong,setWrong]=useState([]);const [lb,setLb]=useState([]);
  const lock=useRef(false);
  const loadLb=useCallback(()=>runApp(appName,{action:'leaderboard'}).then(d=>setLb(d.result.leaderboard||[])).catch(()=>{}),[appName]);
  useEffect(()=>{loadLb();},[loadLb]);
  useEffect(()=>{if(phase!=='playing')return;const t=setInterval(()=>setTime(s=>s+1),1000);return()=>clearInterval(t);},[phase]);
  const startGame=()=>{const cards=CS[theme].slice(0,pairs);const d=[...cards,...cards].map((e,i)=>({id:i,emoji:e})).sort(()=>Math.random()-0.5);setDeck(d);setFlipped([]);setMatched([]);setWrong([]);setMoves(0);setTime(0);setCombo(0);setPhase('playing');lock.current=false;};
  const flip=idx=>{if(lock.current||flipped.includes(idx)||matched.some(m=>m===idx))return;const nf=[...flipped,idx];setFlipped(nf);if(nf.length===2){lock.current=true;setMoves(m=>m+1);if(deck[nf[0]].emoji===deck[nf[1]].emoji){setCombo(c=>c+1);setTimeout(()=>{const nm=[...matched,...nf];setMatched(nm);setFlipped([]);lock.current=false;if(nm.length===deck.length){setPhase('won');runApp(appName,{action:'save_score',moves:moves+1,time_s:time,pairs}).then(loadLb).catch(()=>{});}},400);}else{setCombo(0);setWrong([...nf]);setTimeout(()=>{setFlipped([]);setWrong([]);lock.current=false;},900);}}};
  const fmt=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
  const cols=pairs<=6?3:4;

  if(phase==='menu')return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'1.25rem',padding:'1.5rem',minHeight:400}}>
      <div style={{fontSize:'3rem',filter:`drop-shadow(0 0 20px ${T.pink}88)`}}>🃏</div>
      <div style={{textAlign:'center'}}><div style={{...s.mono('1.8rem',T.pink),fontWeight:700}}>MEMORY</div><div style={{color:T.muted,fontSize:'0.82rem',marginTop:4}}>Find all matching pairs</div></div>
      <div style={{width:'100%'}}>
        <div style={{color:T.muted,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Theme</div>
        <div style={{display:'flex',gap:'0.4rem'}}>
          {Object.keys(CS).map(t=><button key={t} onClick={()=>setTheme(t)} style={{...s.btn(theme===t?T.pink:T.surf2),border:`1px solid ${theme===t?T.pink:T.border}`,flex:1,color:theme===t?'#000':'#fff',textTransform:'capitalize',fontSize:'0.8rem'}}>{t}</button>)}
        </div>
      </div>
      <div style={{width:'100%'}}>
        <div style={{color:T.muted,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Pairs</div>
        <div style={{display:'flex',gap:'0.4rem'}}>
          {[4,6,8,10,12].map(p=><button key={p} onClick={()=>setPairs(p)} style={{...s.btn(pairs===p?T.green:T.surf2,pairs===p?'#000':'#fff'),border:`1px solid ${pairs===p?T.green:T.border}`,flex:1}}>{p}</button>)}
        </div>
      </div>
      <button onClick={startGame} style={{...s.btn(T.pink,'#000'),padding:'12px 32px',fontSize:'1rem',width:'100%',boxShadow:`0 6px 24px ${T.pink}44`}}>Start Game</button>
      {lb.length>0&&<div style={{width:'100%',background:T.bg,borderRadius:12,padding:'0.75rem 1rem'}}><div style={{color:T.muted,fontSize:'0.7rem',textTransform:'uppercase',letterSpacing:'0.07em',marginBottom:8}}>Best Runs</div>{lb.slice(0,3).map((e,i)=><div key={i} style={{display:'flex',justifyContent:'space-between',padding:'4px 0',borderBottom:`1px solid ${T.border}`}}><span style={{color:[T.yellow,'#9ca3af','#b45309'][i]}}>#{i+1}</span><span style={s.mono('0.85rem')}>{e.moves} moves</span><span style={{color:T.muted,fontSize:'0.75rem'}}>{fmt(e.time_s)}</span></div>)}</div>}
    </div>
  );
  return(
    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:'0.75rem'}}>
      <div style={{display:'flex',gap:'0.5rem',flexWrap:'wrap',justifyContent:'center'}}>
        <span style={s.tag(T.accent)}>Moves {moves}</span>
        <span style={s.tag(T.blue)}>⏱ {fmt(time)}</span>
        <span style={s.tag(T.green)}>{matched.length/2}/{pairs}</span>
        {combo>=2&&<span style={s.tag(T.orange)}>🔥 Combo x{combo}</span>}
      </div>
      {phase==='won'&&<div style={{background:`${T.green}12`,border:`1px solid ${T.green}28`,borderRadius:12,padding:'12px 20px',textAlign:'center',width:'100%'}}><div style={{...s.mono('1rem',T.green),fontWeight:700}}>🎉 Completed in {moves} moves!</div></div>}
      <div style={{display:'grid',gridTemplateColumns:`repeat(${cols},1fr)`,gap:8}}>
        {deck.map((card,i)=>{const isF=flipped.includes(i)||matched.includes(i);const isMat=matched.includes(i);const isWr=wrong.includes(i);return(<div key={i} onClick={()=>flip(i)} style={{width:58,height:58,cursor:'pointer',perspective:500,animation:isWr?'shake 0.4s ease':undefined}}><div style={{position:'relative',width:'100%',height:'100%',transformStyle:'preserve-3d',transition:'transform 0.4s cubic-bezier(0.175,0.885,0.32,1.275)',transform:isF?'rotateY(180deg)':'none'}}><div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',background:'linear-gradient(135deg,#1a1a2e,#16213e)',border:`2px solid ${T.border}`,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.3rem',color:T.border}}>?</div><div style={{position:'absolute',inset:0,backfaceVisibility:'hidden',background:isMat?`${T.green}18`:isWr?`${T.red}18`:'#1e1e30',border:`2px solid ${isMat?T.green:isWr?T.red:T.accent+'44'}`,borderRadius:12,transform:'rotateY(180deg)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'1.6rem',boxShadow:isMat?`0 0 16px ${T.green}55`:'none'}}>{card.emoji}</div></div></div>);})}
      </div>
      <div style={{display:'flex',gap:'0.5rem'}}>
        <button onClick={startGame} style={{...s.btn(T.surf2),border:`1px solid ${T.border}`}}>↺ New Game</button>
        <button onClick={()=>setPhase('menu')} style={{...s.btn(T.surf2),border:`1px solid ${T.border}`}}>Menu</button>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   REGISTRY
═══════════════════════════════════════════════════════════════ */
const APP_COMPONENTS = {
  calculator:     () => <CalculatorApp/>,
  notes:          a  => <NotesApp name={a.name}/>,
  timer:          () => <TimerApp/>,
  task_scheduler: a  => <TaskApp name={a.name}/>,
  expense_tracker:a  => <ExpenseApp name={a.name}/>,
  system_monitor: a  => <SystemApp name={a.name}/>,
  weather:        a  => <WeatherApp name={a.name}/>,
  password_vault: a  => <PasswordApp name={a.name}/>,
  url_shortener:  a  => <URLApp name={a.name}/>,
  unit_converter: a  => <UnitApp name={a.name}/>,
  focus_mode:     a  => <FocusApp name={a.name}/>,
  smart_notes:    a  => <SmartNotesApp name={a.name}/>,
  file_organizer: a  => <FileOrgApp name={a.name}/>,
  network_scanner:a  => <NetworkApp name={a.name}/>,
  music_player:   a  => <MusicApp name={a.name}/>,
  snake:          a  => <SnakeGame appName={a.name}/>,
  tetris:         a  => <TetrisGame appName={a.name}/>,
  memory:         a  => <MemoryGame appName={a.name}/>,
};

/* ─── Inject animations once ─────────────────────────────────── */
const _SID = 'mas-run-styles';
if (!document.getElementById(_SID)) {
  const el = document.createElement('style');
  el.id = _SID;
  el.textContent = `
    @keyframes spin    { to { transform: rotate(360deg); } }
    @keyframes fadeUp  { from{opacity:1;transform:translateY(-10px)} to{opacity:0;transform:translateY(-50px)} }
    @keyframes shake   { 0%,100%{transform:rotateY(180deg) translateX(0)} 25%{transform:rotateY(180deg) translateX(-8px)} 75%{transform:rotateY(180deg) translateX(8px)} }
    .mas-modal-lg { max-width: 640px !important; max-height: 90vh; display:flex; flex-direction:column; }
    .mas-modal-scroll { overflow-y:auto; flex:1; }
    .mas-modal-scroll::-webkit-scrollbar{width:4px}
    .mas-modal-scroll::-webkit-scrollbar-thumb{background:#2a2a35;border-radius:999px}
    select option { background: #111118; }
  `;
  document.head.appendChild(el);
}

/* ─── MODAL ICON — SVG per app ───────────────────────────────── */
const MODAL_ICONS = {
  calculator: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="4" y="2" width="16" height="20" rx="3"/><line x1="8" y1="7" x2="16" y2="7"/></svg>,
  notes:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  timer:       <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="13" r="8"/><polyline points="12 9 12 13 15 15"/></svg>,
  url_shortener:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>,
  task_scheduler:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><polyline points="9 16 11 18 15 14"/></svg>,
  smart_notes: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>,
  unit_converter:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/></svg>,
  expense_tracker:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  focus_mode:  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/></svg>,
  file_organizer:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>,
  system_monitor:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
  music_player:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  weather:     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/></svg>,
  password_vault:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
  network_scanner:<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/></svg>,
};

const CAT_COLORS = { productivity:'#7c6cff', tools:'#60a5fa', security:'#f87171', games:'#4ade80' };

/* ─── MAIN MODAL ─────────────────────────────────────────────── */
export default function RunModal({ app, onClose }) {
  const UI    = APP_COMPONENTS[app.name];
  const color = CAT_COLORS[app.category] || T.accent;
  const icon  = MODAL_ICONS[app.name];

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.75)', backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:500, padding:16 }}
      onClick={onClose}>
      <div className="mas-modal-lg" onClick={e=>e.stopPropagation()}
        style={{ background:'#0d0d18', border:`1px solid ${color}28`, borderRadius:24, width:'100%', boxShadow:`0 24px 60px rgba(0,0,0,0.6), 0 0 0 1px ${color}14`, animation:'modalIn 0.3s cubic-bezier(0.175,0.885,0.32,1.275)' }}>
        <style>{`@keyframes modalIn{from{opacity:0;transform:translateY(20px)scale(0.97)}to{opacity:1;transform:none}}`}</style>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', gap:'0.85rem', padding:'20px 24px 18px', borderBottom:`1px solid ${T.border}` }}>
          <div style={{ width:42, height:42, borderRadius:12, background:`linear-gradient(135deg,${color}22,${color}0a)`, border:`1.5px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', color, flexShrink:0 }}>
            <span style={{ width:22, height:22, display:'flex', alignItems:'center', justifyContent:'center' }}>{icon || <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="3"/></svg>}</span>
          </div>
          <div style={{ flex:1 }}>
            <h2 style={{ color:T.text, fontWeight:700, fontSize:'1.05rem', margin:0 }}>{app.title}</h2>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:2 }}>
              <span style={{ background:`${color}18`, border:`1px solid ${color}28`, color, borderRadius:999, padding:'1px 8px', fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.08em' }}>{app.category}</span>
              <span style={{ fontFamily:"'Space Mono',monospace", fontSize:'0.65rem', color:T.muted }}>v{app.version}</span>
            </div>
          </div>
          <button onClick={onClose}
            style={{ background:'transparent', border:`1px solid ${T.border}`, color:T.muted, width:32, height:32, borderRadius:8, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.15s' }}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=T.red;e.currentTarget.style.color=T.red;}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=T.border;e.currentTarget.style.color=T.muted;}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        {/* Body */}
        <div className="mas-modal-scroll" style={{ padding:'20px 24px' }}>
          {UI ? UI(app) : <div style={{ color:T.muted, textAlign:'center', padding:'3rem' }}>No interface available.</div>}
        </div>
      </div>
    </div>
  );
}