import json, os, random
from datetime import datetime

SCORES_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'memory_scores.json')

CARD_SETS = {
    'animals': ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐸'],
    'food':    ['🍎','🍊','🍋','🍇','🍓','🍑','🥝','🍒','🥭','🍍','🥥','🍌'],
    'sports':  ['⚽','🏀','🏈','⚾','🥎','🎾','🏐','🏉','🎱','🏓','🏸','🥊'],
}

def _load():
    if not os.path.exists(SCORES_FILE): return []
    with open(SCORES_FILE) as f: return json.load(f)

def _save(data):
    with open(SCORES_FILE, 'w') as f: json.dump(data, f, indent=2)

def run(action='start', theme='animals', pairs=8, moves=0, time_s=0):
    if action == 'start':
        cards = CARD_SETS.get(theme, CARD_SETS['animals'])[:int(pairs)]
        deck = cards * 2
        random.shuffle(deck)
        return {'deck': deck, 'pairs': int(pairs), 'theme': theme, 'themes': list(CARD_SETS.keys())}
    elif action == 'save_score':
        scores = _load()
        entry = {'moves': int(moves), 'time_s': int(time_s), 'pairs': int(pairs),
                 'date': datetime.now().strftime('%Y-%m-%d %H:%M')}
        scores.append(entry)
        scores.sort(key=lambda x: (x['moves'], x['time_s']))
        scores = scores[:10]
        _save(scores)
        return {'message': f'Completed in {moves} moves!', 'entry': entry}
    elif action == 'leaderboard':
        return {'leaderboard': _load()}
    else:
        raise ValueError("Unknown action. Use: start, save_score, leaderboard")