from datetime import datetime, timezone

def _fmt(seconds):
    s = int(abs(seconds))
    h, r = divmod(s, 3600)
    m, s = divmod(r, 60)
    if h: return f'{h}h {m:02d}m {s:02d}s'
    if m: return f'{m}m {s:02d}s'
    return f'{s}s'

def run(action='start', seconds=60, started_at=''):
    now = datetime.now(timezone.utc)
    if action == 'start':
        seconds = float(seconds)
        if seconds <= 0: raise ValueError("seconds must be > 0")
        return {'duration': seconds, 'started_at': now.isoformat(),
                'ends_at': now.timestamp() + seconds, 'formatted': _fmt(seconds),
                'message': f'Timer set for {_fmt(seconds)}'}
    elif action == 'format':
        return {'seconds': seconds, 'formatted': _fmt(float(seconds))}
    else:
        raise ValueError(f"Unknown action '{action}'. Use: start, format")