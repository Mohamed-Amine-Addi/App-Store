import json, os, re
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'smart_notes.json')

KEYWORDS = ['todo', 'important', 'urgent', 'meeting', 'deadline', 'idea', 'reminder', 'follow up']

def _load():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)

def _save(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def _format(content):
    """Auto-format: capitalize sentences, detect lists."""
    lines = content.strip().split('\n')
    formatted = []
    for line in lines:
        line = line.strip()
        if line:
            line = line[0].upper() + line[1:]
            if not line.endswith(('.', '!', '?', ':')):
                line += '.'
        formatted.append(line)
    return ' '.join(formatted)

def _extract_keywords(content):
    found = [kw for kw in KEYWORDS if kw.lower() in content.lower()]
    words = re.findall(r'\b[A-Z][a-z]{3,}\b', content)
    return list(set(found + words[:3]))

def run(action='list', content='', search=''):
    notes = _load()

    if action == 'add':
        if not content:
            raise ValueError("'content' is required")
        formatted  = _format(content)
        keywords   = _extract_keywords(content)
        note = {
            'id':         len(notes) + 1,
            'content':    formatted,
            'original':   content,
            'keywords':   keywords,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M'),
        }
        notes.append(note)
        _save(notes)
        return {'message': 'Note saved with auto-format', 'note': note}

    elif action == 'list':
        return {'notes': notes, 'total': len(notes)}

    elif action == 'search':
        if not search:
            raise ValueError("'search' is required")
        results = [n for n in notes if search.lower() in n['content'].lower() or search.lower() in [k.lower() for k in n.get('keywords', [])]]
        return {'results': results, 'count': len(results)}

    elif action == 'clear':
        _save([])
        return {'message': 'All notes cleared'}

    else:
        raise ValueError(f"Unknown action. Use: add, list, search, clear")