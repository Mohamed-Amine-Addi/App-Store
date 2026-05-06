from flask import Blueprint, jsonify, request
from db import get_connection
from models import app_to_dict

install_bp = Blueprint('install', __name__)
DEFAULT_USER_ID = 1

@install_bp.route('/install', methods=['POST'])
def install_app():
    data = request.get_json()
    app_id = data.get('app_id')
    if not app_id:
        return jsonify({'error': 'app_id is required'}), 400

    conn = get_connection()
    row = conn.execute('SELECT * FROM apps WHERE id = ?', (app_id,)).fetchone()
    if not row:
        conn.close()
        return jsonify({'error': 'App not found'}), 404

    conn.execute('UPDATE apps SET installed = 1 WHERE id = ?', (app_id,))
    conn.execute('INSERT INTO installs (user_id, app_id) VALUES (?, ?)', (DEFAULT_USER_ID, app_id))
    conn.commit()
    updated = conn.execute('SELECT * FROM apps WHERE id = ?', (app_id,)).fetchone()
    conn.close()
    return jsonify({'message': 'Installed successfully', 'app': app_to_dict(updated)}), 201

@install_bp.route('/uninstall', methods=['DELETE'])
def uninstall_app():
    data = request.get_json()
    app_id = data.get('app_id')
    conn = get_connection()
    conn.execute('UPDATE apps SET installed = 0 WHERE id = ?', (app_id,))
    conn.execute('DELETE FROM installs WHERE user_id = ? AND app_id = ?', (DEFAULT_USER_ID, app_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Uninstalled successfully'})

@install_bp.route('/installed', methods=['GET'])
def installed_apps():
    conn = get_connection()
    rows = conn.execute('SELECT * FROM apps WHERE installed = 1').fetchall()
    conn.close()
    return jsonify([app_to_dict(r) for r in rows])