import os, json
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'file_organizer.json')

CATEGORIES = {
    'images':    ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp'],
    'documents': ['.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx', '.csv'],
    'videos':    ['.mp4', '.avi', '.mov', '.mkv', '.wmv', '.flv'],
    'audio':     ['.mp3', '.wav', '.flac', '.aac', '.ogg'],
    'archives':  ['.zip', '.tar', '.gz', '.rar', '.7z'],
    'code':      ['.py', '.js', '.html', '.css', '.json', '.ts', '.jsx'],
}

def _get_category(ext):
    for cat, exts in CATEGORIES.items():
        if ext.lower() in exts:
            return cat
    return 'others'

def _load():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)

def _save(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def run(action='scan', path=''):
    if action == 'scan':
        if not path:
            # Simulate a scan with fake files for demo
            fake_files = [
                'photo.jpg', 'report.pdf', 'video.mp4', 'notes.txt',
                'archive.zip', 'script.py', 'music.mp3', 'data.csv',
                'image2.png', 'document.docx'
            ]
            result = {}
            for f in fake_files:
                ext = os.path.splitext(f)[1]
                cat = _get_category(ext)
                result.setdefault(cat, []).append(f)
            return {
                'action': 'scan',
                'path': path or '~/Downloads (demo)',
                'found': sum(len(v) for v in result.values()),
                'breakdown': result,
                'message': 'Scan complete (demo mode — provide a real path to scan actual files)'
            }

        if not os.path.exists(path):
            raise ValueError(f"Path not found: {path}")

        result = {}
        for fname in os.listdir(path):
            fpath = os.path.join(path, fname)
            if os.path.isfile(fpath):
                ext = os.path.splitext(fname)[1]
                cat = _get_category(ext)
                result.setdefault(cat, []).append(fname)

        history = _load()
        history.append({'path': path, 'scanned_at': datetime.now().strftime('%Y-%m-%d %H:%M'), 'found': sum(len(v) for v in result.values())})
        _save(history)

        return {
            'action': 'scan',
            'path': path,
            'found': sum(len(v) for v in result.values()),
            'breakdown': result,
        }

    elif action == 'history':
        return {'history': _load()}

    elif action == 'duplicates':
        # Demo : detect duplicates by name similarity
        fake = ['photo.jpg', 'photo(1).jpg', 'photo_copy.jpg', 'report.pdf', 'report_final.pdf']
        return {
            'action': 'duplicates',
            'potential_duplicates': fake,
            'message': 'Demo mode — provide a real path for actual duplicate detection'
        }

    else:
        raise ValueError(f"Unknown action '{action}'. Use: scan, history, duplicates")