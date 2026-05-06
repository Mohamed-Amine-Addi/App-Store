import json, os
from datetime import datetime

SCORES_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'tetris_scores.json')

def _load():
    if not os.path.exists(SCORES_FILE): return []
    with open(SCORES_FILE) as f: return json.load(f)

def _save(data):
    with open(SCORES_FILE, 'w') as f: json.dump(data, f, indent=2)

def run(action='start', score=0, lines=0, level=1):
    if action == 'start':
        return {
            'config': {'cols': 10, 'rows': 20, 'initial_speed': 800, 'speed_per_level': 70,
                       'points': {'1': 100, '2': 300, '3': 500, '4': 800}},
            'message': 'Arrow keys to move, Up/Space to rotate!'
        }
    elif action == 'save_score':
        scores = _load()
        entry = {'score': int(score), 'lines': int(lines), 'level': int(level),
                 'date': datetime.now().strftime('%Y-%m-%d %H:%M')}
        scores.append(entry)
        scores.sort(key=lambda x: x['score'], reverse=True)
        scores = scores[:10]
        _save(scores)
        return {'message': f'Score {score} saved!', 'entry': entry}
    elif action == 'leaderboard':
        return {'leaderboard': _load()}
    else:
        raise ValueError("Unknown action. Use: start, save_score, leaderboard")