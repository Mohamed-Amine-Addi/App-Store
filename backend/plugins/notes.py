import json, os
from datetime import datetime

NOTES_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'notes.json')

def _load():
    if not os.path.exists(NOTES_FILE):
        return []
    with open(NOTES_FILE) as f:
        return json.load(f)

def _save(notes):
    with open(NOTES_FILE, 'w') as f:
        json.dump(notes, f, indent=2)

def run(action='list', content=''):
    notes = _load()
    if action == 'add':
        if not content:
            raise ValueError("'content' is required for action=add")
        note = {'id': len(notes)+1, 'content': content, 'created_at': datetime.now().strftime('%Y-%m-%d %H:%M')}
        notes.append(note)
        _save(notes)
        return {'message': 'Note saved', 'note': note, 'total': len(notes)}
    elif action == 'list':
        return {'notes': notes, 'total': len(notes)}
    elif action == 'clear':
        count = len(notes)
        _save([])
        return {'message': 'All notes cleared', 'deleted': count}
    else:
        raise ValueError(f"Unknown action '{action}'. Use: add, list, clear")