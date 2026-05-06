import json, os
from datetime import datetime, timezone

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'focus.json')

def _load():
    if not os.path.exists(DATA_FILE):
        return {'sessions': [], 'current': None}
    with open(DATA_FILE) as f:
        return json.load(f)

def _save(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def _fmt(seconds):
    m, s = divmod(int(seconds), 60)
    return f'{m}m {s:02d}s'

def run(action='start', duration=25, label='Focus session'):
    state = _load()
    now   = datetime.now(timezone.utc)

    if action == 'start':
        duration = int(duration)
        if duration <= 0:
            raise ValueError("duration must be > 0")
        session = {
            'id':         len(state['sessions']) + 1,
            'label':      label,
            'duration_m': duration,
            'started_at': now.isoformat(),
            'ends_at':    now.timestamp() + duration * 60,
            'done':       False,
        }
        state['current'] = session
        _save(state)
        return {
            'status':    '🎯 Focus started',
            'label':     label,
            'duration':  f'{duration} min',
            'ends_at':   session['ends_at'],
            'formatted': _fmt(duration * 60),
            'message':   f'Stay focused for {duration} minutes!',
        }

    elif action == 'status':
        current = state.get('current')
        if not current:
            return {'status': 'No active session'}
        remaining = current['ends_at'] - now.timestamp()
        if remaining <= 0:
            current['done'] = True
            state['sessions'].append(current)
            state['current'] = None
            _save(state)
            return {'status': '✅ Session complete!', 'label': current['label']}
        return {
            'status':    '⏳ In progress',
            'label':     current['label'],
            'remaining': _fmt(remaining),
            'ends_at':   current['ends_at'],
        }

    elif action == 'stop':
        state['current'] = None
        _save(state)
        return {'status': 'Session stopped'}

    elif action == 'history':
        return {'sessions': state['sessions'], 'total': len(state['sessions'])}

    else:
        raise ValueError(f"Unknown action. Use: start, status, stop, history")