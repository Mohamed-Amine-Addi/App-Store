import os, jwt, bcrypt
from datetime import datetime, timedelta, timezone
from flask import Blueprint, jsonify, request
from db import get_connection

auth_bp = Blueprint('auth', __name__)

JWT_SECRET  = os.environ.get('JWT_SECRET', 'ministore_super_secret_2024')
JWT_EXPIRES = 7

def _make_token(user_id, email):
    payload = {
        'sub':   user_id,
        'email': email,
        'exp':   datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRES),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def _verify_token(token):
    try:
        return jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
    except Exception:
        return None

def get_current_user():
    auth = request.headers.get('Authorization', '')
    if not auth.startswith('Bearer '):
        return None
    payload = _verify_token(auth[7:])
    if not payload:
        return None
    conn = get_connection()
    user = conn.execute('SELECT * FROM users WHERE id=?', (payload['sub'],)).fetchone()
    conn.close()
    return user

def _user_dict(u):
    return {
        'id':           u['id'],
        'username':     u['username'],
        'email':        u['email'],
        'avatar_color': u['avatar_color'],
        'avatar_emoji': u['avatar_emoji'],
        'bio':          u['bio'],
        'verified':     bool(u['verified']),
        'created_at':   u['created_at'],
    }

# ── ROUTES ─────────────────────────────────────────────────────────────────

@auth_bp.route('/auth/register', methods=['POST'])
def register():
    d = request.get_json()
    username = (d.get('username') or '').strip()
    email    = (d.get('email')    or '').strip().lower()
    password = (d.get('password') or '').strip()

    if not username or not email or not password:
        return jsonify({'error': 'All fields are required.'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters.'}), 400
    if '@' not in email or '.' not in email.split('@')[-1]:
        return jsonify({'error': 'Invalid email address.'}), 400

    conn = get_connection()
    existing = conn.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'An account with this email already exists.'}), 409

    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn.execute("""
        INSERT INTO users (username, email, password_hash, verified)
        VALUES (?, ?, ?, 1)
    """, (username, email, pw_hash))
    conn.commit()

    user = conn.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
    conn.close()

    token = _make_token(user['id'], email)
    return jsonify({
        'token':   token,
        'user':    _user_dict(user),
        'message': 'Account created successfully!'
    }), 201


@auth_bp.route('/auth/login', methods=['POST'])
def login():
    d = request.get_json()
    email    = (d.get('email')    or '').strip().lower()
    password = (d.get('password') or '').strip()

    if not email or not password:
        return jsonify({'error': 'Email and password are required.'}), 400

    conn = get_connection()
    user = conn.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
    conn.close()

    if not user:
        return jsonify({'error': 'No account found with this email.'}), 404
    if not bcrypt.checkpw(password.encode(), user['password_hash'].encode()):
        return jsonify({'error': 'Incorrect password.'}), 401

    token = _make_token(user['id'], email)
    return jsonify({'token': token, 'user': _user_dict(user)})


@auth_bp.route('/auth/me', methods=['GET'])
def me():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401
    return jsonify({'user': _user_dict(user)})


@auth_bp.route('/auth/update', methods=['PUT'])
def update_profile():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    d = request.get_json()
    username     = (d.get('username')     or '').strip() or user['username']
    bio          = (d.get('bio')          or '').strip()
    avatar_emoji = (d.get('avatar_emoji') or '').strip() or user['avatar_emoji']
    avatar_color = (d.get('avatar_color') or '').strip() or user['avatar_color']

    conn = get_connection()
    conn.execute("""
        UPDATE users SET username=?, bio=?, avatar_emoji=?, avatar_color=? WHERE id=?
    """, (username, bio, avatar_emoji, avatar_color, user['id']))
    conn.commit()
    updated = conn.execute('SELECT * FROM users WHERE id=?', (user['id'],)).fetchone()
    conn.close()
    return jsonify({'user': _user_dict(updated), 'message': 'Profile updated!'})


@auth_bp.route('/auth/change-password', methods=['PUT'])
def change_password():
    user = get_current_user()
    if not user:
        return jsonify({'error': 'Unauthorized'}), 401

    d = request.get_json()
    current  = (d.get('current_password') or '').strip()
    new_pass = (d.get('new_password')     or '').strip()

    if not bcrypt.checkpw(current.encode(), user['password_hash'].encode()):
        return jsonify({'error': 'Current password is incorrect.'}), 400
    if len(new_pass) < 6:
        return jsonify({'error': 'New password must be at least 6 characters.'}), 400

    new_hash = bcrypt.hashpw(new_pass.encode(), bcrypt.gensalt()).decode()
    conn = get_connection()
    conn.execute('UPDATE users SET password_hash=? WHERE id=?', (new_hash, user['id']))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Password changed successfully!'})