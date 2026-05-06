import json, os, base64, hashlib
from datetime import datetime

VAULT_FILE = os.path.join(os.path.dirname(__file__), '..', '..', 'database', 'vault.json')

def _encode(text, key):
    """Simple XOR encoding — not production crypto, but functional for local demo."""
    key_bytes = hashlib.md5(key.encode()).digest()
    encoded = bytes(c ^ key_bytes[i % len(key_bytes)] for i, c in enumerate(text.encode()))
    return base64.b64encode(encoded).decode()

def _decode(encoded, key):
    key_bytes = hashlib.md5(key.encode()).digest()
    decoded = base64.b64decode(encoded.encode())
    return bytes(c ^ key_bytes[i % len(key_bytes)] for i, c in enumerate(decoded)).decode()

def _load():
    if not os.path.exists(VAULT_FILE):
        return []
    with open(VAULT_FILE) as f:
        return json.load(f)

def _save(data):
    with open(VAULT_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def run(action='list', account='', password='', master_key='default123', search=''):
    vault = _load()

    if action == 'add':
        if not account or not password:
            raise ValueError("'account' and 'password' are required")
        entry = {
            'id':         len(vault) + 1,
            'account':    account,
            'password':   _encode(password, master_key),
            'added_at':   datetime.now().strftime('%Y-%m-%d %H:%M'),
        }
        vault.append(entry)
        _save(vault)
        return {'message': f'Password saved for "{account}"', 'total': len(vault)}

    elif action == 'list':
        return {
            'accounts': [{'id': e['id'], 'account': e['account'], 'added_at': e['added_at']} for e in vault],
            'total': len(vault)
        }

    elif action == 'get':
        if not account:
            raise ValueError("'account' is required")
        entry = next((e for e in vault if e['account'].lower() == account.lower()), None)
        if not entry:
            raise ValueError(f'No entry found for "{account}"')
        return {'account': entry['account'], 'password': _decode(entry['password'], master_key)}

    elif action == 'search':
        if not search:
            raise ValueError("'search' is required")
        results = [{'id': e['id'], 'account': e['account']} for e in vault if search.lower() in e['account'].lower()]
        return {'results': results, 'count': len(results)}

    elif action == 'delete':
        if not account:
            raise ValueError("'account' is required")
        before = len(vault)
        vault = [e for e in vault if e['account'].lower() != account.lower()]
        _save(vault)
        return {'message': f'Deleted', 'removed': before - len(vault)}

    else:
        raise ValueError(f"Unknown action. Use: add, list, get, search, delete")