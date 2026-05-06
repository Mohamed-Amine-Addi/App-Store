from flask import Blueprint, jsonify, request
from db import get_connection
from models import app_to_dict

apps_bp = Blueprint('apps', __name__)

@apps_bp.route('/apps', methods=['GET'])
def list_apps():
    category = request.args.get('category')
    conn = get_connection()
    if category:
        rows = conn.execute('SELECT * FROM apps WHERE category = ?', (category,)).fetchall()
    else:
        rows = conn.execute('SELECT * FROM apps').fetchall()
    conn.close()
    return jsonify([app_to_dict(r) for r in rows])

@apps_bp.route('/apps/categories', methods=['GET'])
def list_categories():
    conn = get_connection()
    rows = conn.execute('SELECT DISTINCT category FROM apps').fetchall()
    conn.close()
    return jsonify([r['category'] for r in rows])