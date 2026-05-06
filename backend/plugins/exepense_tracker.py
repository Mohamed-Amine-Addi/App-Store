import json, os
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'expenses.json')

CATEGORIES = ['food', 'transport', 'housing', 'health', 'entertainment', 'shopping', 'other']

def _load():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)

def _save(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def run(action='list', title='', amount=0, category='other'):
    expenses = _load()

    if action == 'add':
        if not title:
            raise ValueError("'title' is required")
        if float(amount) <= 0:
            raise ValueError("'amount' must be greater than 0")
        if category not in CATEGORIES:
            category = 'other'
        entry = {
            'id':       len(expenses) + 1,
            'title':    title,
            'amount':   round(float(amount), 2),
            'category': category,
            'date':     datetime.now().strftime('%Y-%m-%d'),
        }
        expenses.append(entry)
        _save(expenses)
        return {'message': 'Expense added', 'entry': entry}

    elif action == 'list':
        total = round(sum(e['amount'] for e in expenses), 2)
        return {'expenses': expenses, 'total': total, 'count': len(expenses)}

    elif action == 'stats':
        by_cat = {}
        for e in expenses:
            by_cat[e['category']] = round(by_cat.get(e['category'], 0) + e['amount'], 2)
        total = round(sum(by_cat.values()), 2)
        return {
            'total':      total,
            'by_category': by_cat,
            'count':      len(expenses),
            'categories': CATEGORIES,
        }

    elif action == 'clear':
        _save([])
        return {'message': 'All expenses cleared'}

    else:
        raise ValueError(f"Unknown action. Use: add, list, stats, clear")