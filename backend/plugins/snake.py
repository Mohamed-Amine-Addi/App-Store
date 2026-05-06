import json, os
from datetime import datetime

SCORES_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'snake_scores.json')

def _load():
    if not os.path.exists(SCORES_FILE): return []
    with open(SCORES_FILE) as f: return json.load(f)

def _save(data):
    with open(SCORES_FILE, 'w') as f: json.dump(data, f, indent=2)

def run(action='start', score=0, level=1):
    if action == 'start':
        return {
            'config': {'grid_size': 20, 'initial_speed': 150, 'points_per_food': 10},
            'message': 'Use arrow keys to move. Eat food to grow!'
        }
    elif action == 'save_score':
        scores = _load()
        entry = {'score': int(score), 'level': int(level), 'date': datetime.now().strftime('%Y-%m-%d %H:%M')}
        scores.append(entry)
        scores.sort(key=lambda x: x['score'], reverse=True)
        scores = scores[:10]
        _save(scores)
        return {'message': f'Score {score} saved!', 'entry': entry}
    elif action == 'leaderboard':
        return {'leaderboard': _load()}
    else:
        raise ValueError("Unknown action. Use: start, save_score, leaderboard")