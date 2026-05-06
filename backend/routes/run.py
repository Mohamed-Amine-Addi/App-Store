import importlib.util
import os
from flask import Blueprint, jsonify, request
from db import get_connection

run_bp = Blueprint('run', __name__)
PLUGINS_DIR = os.path.join(os.path.dirname(__file__), '..', 'plugins')

def load_plugin(name):
    path = os.path.join(PLUGINS_DIR, f'{name}.py')
    if not os.path.exists(path):
        return None
    spec = importlib.util.spec_from_file_location(f'plugins.{name}', path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def record_usage(app_name):
    conn = get_connection()
    row = conn.execute('SELECT id FROM apps WHERE name = ?', (app_name,)).fetchone()
    if row:
        conn.execute('INSERT INTO usage_history (app_id) VALUES (?)', (row['id'],))
        conn.commit()
    conn.close()

@run_bp.route('/run/<string:app_name>', methods=['POST'])
def run_app(app_name):
    conn = get_connection()
    row = conn.execute('SELECT * FROM apps WHERE name = ? AND installed = 1', (app_name,)).fetchone()
    conn.close()
    if not row:
        return jsonify({'error': f"App '{app_name}' not installed"}), 404

    plugin = load_plugin(app_name)
    if not plugin or not hasattr(plugin, 'run'):
        return jsonify({'error': 'Plugin has no run() function'}), 500

    kwargs = request.get_json(silent=True) or {}
    try:
        result = plugin.run(**kwargs)
        record_usage(app_name)
        return jsonify({'app': app_name, 'result': result})
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@run_bp.route('/history', methods=['GET'])
def usage_history():
    conn = get_connection()
    rows = conn.execute("""
        SELECT uh.id, a.title, a.icon, uh.ran_at
        FROM usage_history uh JOIN apps a ON a.id = uh.app_id
        ORDER BY uh.ran_at DESC LIMIT 20
    """).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])