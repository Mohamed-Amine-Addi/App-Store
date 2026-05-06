import json, os
from datetime import datetime

DATA_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'tasks.json')

def _load():
    if not os.path.exists(DATA_FILE):
        return []
    with open(DATA_FILE) as f:
        return json.load(f)

def _save(data):
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def run(action='list', title='', deadline='', priority='medium', task_id=None):
    tasks = _load()

    if action == 'add':
        if not title:
            raise ValueError("'title' is required")
        task = {
            'id':         len(tasks) + 1,
            'title':      title,
            'deadline':   deadline or 'No deadline',
            'priority':   priority,
            'done':       False,
            'created_at': datetime.now().strftime('%Y-%m-%d %H:%M'),
        }
        tasks.append(task)
        _save(tasks)
        return {'message': 'Task added', 'task': task, 'total': len(tasks)}

    elif action == 'list':
        pending  = [t for t in tasks if not t['done']]
        done     = [t for t in tasks if t['done']]
        return {'pending': pending, 'done': done, 'total': len(tasks)}

    elif action == 'complete':
        if not task_id:
            raise ValueError("'task_id' is required")
        task = next((t for t in tasks if t['id'] == int(task_id)), None)
        if not task:
            raise ValueError(f"Task #{task_id} not found")
        task['done'] = True
        task['completed_at'] = datetime.now().strftime('%Y-%m-%d %H:%M')
        _save(tasks)
        return {'message': f'Task "{task["title"]}" marked as done'}

    elif action == 'delete':
        if not task_id:
            raise ValueError("'task_id' is required")
        before = len(tasks)
        tasks = [t for t in tasks if t['id'] != int(task_id)]
        _save(tasks)
        return {'message': 'Deleted', 'removed': before - len(tasks)}

    elif action == 'clear':
        _save([])
        return {'message': 'All tasks cleared'}

    else:
        raise ValueError(f"Unknown action. Use: add, list, complete, delete, clear")