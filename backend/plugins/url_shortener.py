import json, os, hashlib
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'urls.json')

def _load():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)

def _save(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def _shorten(url):
    return hashlib.md5(url.encode()).hexdigest()[:6].upper()

def run(action='shorten', url=''):
    links = _load()

    if action == 'shorten':
        if not url:
            raise ValueError("'url' is required")
        if not url.startswith('http'):
            url = 'https://' + url
        code = _shorten(url)
        existing = next((l for l in links if l['code'] == code), None)
        if existing:
            return {'message': 'Already shortened', 'short': f'mini.app/{code}', 'original': url}
        entry = {
            'id':         len(links) + 1,
            'code':       code,
            'original':   url,
            'short':      f'mini.app/{code}',
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M'),
            'clicks':     0,
        }
        links.append(entry)
        _save(links)
        return {'message': 'URL shortened!', 'short': entry['short'], 'original': url, 'code': code}

    elif action == 'list':
        return {'links': links, 'total': len(links)}

    elif action == 'delete':
        if not url:
            raise ValueError("'url' (code) is required")
        before = len(links)
        links = [l for l in links if l['code'] != url]
        _save(links)
        return {'message': 'Deleted', 'removed': before - len(links)}

    else:
        raise ValueError(f"Unknown action. Use: shorten, list, delete")