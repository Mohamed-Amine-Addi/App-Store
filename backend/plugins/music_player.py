import os, json
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'playlist.json')
AUDIO_EXTS = {'.mp3', '.wav', '.flac', '.aac', '.ogg', '.m4a'}

def _load():
    if not os.path.exists(DATA_FILE):
        return {'playlist': [], 'current': None, 'volume': 80}
    with open(DATA_FILE) as f:
        return json.load(f)

def _save(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def run(action='playlist', path='', volume=80):
    state = _load()

    if action == 'playlist':
        if not state['playlist']:
            # Demo playlist
            state['playlist'] = [
                {'id': 1, 'title': 'Lofi Hip Hop Beat',     'duration': '3:24'},
                {'id': 2, 'title': 'Chill Acoustic Guitar', 'duration': '4:10'},
                {'id': 3, 'title': 'Jazz Evening',          'duration': '5:02'},
            ]
        return {'playlist': state['playlist'], 'current': state['current'], 'volume': state['volume']}

    elif action == 'add':
        if not path:
            raise ValueError("'path' is required")
        if not any(path.endswith(e) for e in AUDIO_EXTS):
            raise ValueError(f"Unsupported format. Use: {', '.join(AUDIO_EXTS)}")
        title = os.path.basename(path)
        entry = {'id': len(state['playlist']) + 1, 'title': title, 'path': path}
        state['playlist'].append(entry)
        _save(state)
        return {'message': f'Added "{title}" to playlist', 'total': len(state['playlist'])}

    elif action == 'play':
        if not state['playlist']:
            return {'message': 'Playlist is empty'}
        idx = 0 if not state['current'] else state['current']
        track = state['playlist'][idx % len(state['playlist'])]
        state['current'] = idx
        _save(state)
        return {'status': '▶ Playing', 'track': track, 'volume': state['volume']}

    elif action == 'volume':
        state['volume'] = max(0, min(100, int(volume)))
        _save(state)
        return {'message': f'Volume set to {state["volume"]}%', 'volume': state['volume']}

    elif action == 'scan':
        if not path or not os.path.exists(path):
            raise ValueError("Provide a valid directory path")
        found = [f for f in os.listdir(path) if os.path.splitext(f)[1].lower() in AUDIO_EXTS]
        return {'found': len(found), 'files': found}

    else:
        raise ValueError(f"Unknown action. Use: playlist, add, play, volume, scan")