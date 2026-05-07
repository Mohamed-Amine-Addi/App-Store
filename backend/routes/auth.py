import os, random, string, smtplib, jwt, bcrypt
from datetime import datetime, timedelta, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from flask import Blueprint, jsonify, request
from db import get_connection

auth_bp = Blueprint('auth', __name__)

# ── JWT config (change SECRET in production) ───────────────────────────────
JWT_SECRET  = os.environ.get('JWT_SECRET', 'ministore_super_secret_2024')
JWT_EXPIRES = 7  # days

# ── Email config — set via env vars or fill defaults for testing ───────────
SMTP_HOST   = os.environ.get('SMTP_HOST',  'smtp.gmail.com')
SMTP_PORT   = int(os.environ.get('SMTP_PORT', 587))
SMTP_USER   = os.environ.get('SMTP_USER',  '')   # your Gmail
SMTP_PASS   = os.environ.get('SMTP_PASS',  '')   # Gmail App Password

def _gen_code():
    return ''.join(random.choices(string.digits, k=6))

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
    """Extract user from Authorization header. Returns user row or None."""
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

def _send_email(to_email, subject, html_body):
    if not SMTP_USER or not SMTP_PASS:
        # Extract code from HTML for dev display
        import re
        match = re.search(r'letter-spacing:10px[^>]*>(\d{6})<', html_body)
        code_found = match.group(1) if match else '??????'
        print(f"\n{'='*50}")
        print(f"📧 EMAIL TO: {to_email}")
        print(f"📌 SUBJECT:  {subject}")
        print(f"🔑 CODE:     {code_found}")
        print(f"{'='*50}\n")
        return
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From']    = f'MiniStore <{SMTP_USER}>'
        msg['To']      = to_email
        msg.attach(MIMEText(html_body, 'html'))
        with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as s:
            s.starttls()
            s.login(SMTP_USER, SMTP_PASS)
            s.sendmail(SMTP_USER, to_email, msg.as_string())
    except Exception as e:
        print(f"[EMAIL ERROR] {e}")
def _welcome_email(username, code):
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:24px;border:1px solid #2a2a35;overflow:hidden;">
        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#7c6cff,#a78bfa);padding:40px 40px 32px;text-align:center;">
          <div style="font-size:48px;margin-bottom:12px;">◈</div>
          <div style="color:#fff;font-size:28px;font-weight:800;letter-spacing:-0.5px;">MiniStore</div>
          <div style="color:rgba(255,255,255,0.75);font-size:14px;margin-top:6px;">Your personal app universe</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="padding:40px;">
          <div style="color:#e8e8f0;font-size:20px;font-weight:700;margin-bottom:8px;">Welcome, {username}! 🎉</div>
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;margin:0 0 32px;">
            Your account has been created. Use the verification code below to activate it.
          </p>
          <!-- Code box -->
          <div style="background:#0a0a0f;border:2px dashed #7c6cff55;border-radius:16px;padding:32px;text-align:center;margin-bottom:32px;">
            <div style="color:#6b6b80;font-size:12px;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px;">Verification Code</div>
            <div style="font-family:'Courier New',monospace;font-size:40px;font-weight:900;letter-spacing:10px;color:#7c6cff;text-shadow:0 0 30px #7c6cff66;">{code}</div>
            <div style="color:#6b6b80;font-size:12px;margin-top:12px;">Expires in 15 minutes</div>
          </div>
          <p style="color:#6b6b80;font-size:13px;line-height:1.6;margin:0;">
            If you didn't create this account, you can safely ignore this email.
          </p>
        </td></tr>
        <!-- Footer -->
        <tr><td style="border-top:1px solid #2a2a35;padding:24px 40px;text-align:center;">
          <div style="color:#6b6b80;font-size:12px;">© 2024 MiniStore · Made with ◈</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

def _success_email(username):
    return f"""
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0f;font-family:'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0f;padding:40px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#111118;border-radius:24px;border:1px solid #2a2a35;overflow:hidden;">
        <tr><td style="background:linear-gradient(135deg,#4ade80,#22c55e);padding:40px;text-align:center;">
          <div style="font-size:56px;margin-bottom:12px;">🎉</div>
          <div style="color:#000;font-size:26px;font-weight:800;">Account Activated!</div>
          <div style="color:rgba(0,0,0,0.65);font-size:14px;margin-top:8px;">You're all set, {username}</div>
        </td></tr>
        <tr><td style="padding:40px;text-align:center;">
          <p style="color:#9ca3af;font-size:15px;line-height:1.7;">
            Welcome to <strong style="color:#e8e8f0;">MiniStore</strong> — your personal app universe.<br>
            Discover, install and run mini applications instantly.
          </p>
          <div style="margin-top:32px;color:#6b6b80;font-size:13px;">
            Start exploring the store →<br>
            <span style="color:#7c6cff;">http://localhost:3000</span>
          </div>
        </td></tr>
        <tr><td style="border-top:1px solid #2a2a35;padding:20px 40px;text-align:center;">
          <div style="color:#6b6b80;font-size:12px;">© 2024 MiniStore · Made with ◈</div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>"""

# ── ROUTES ──────────────────────────────────────────────────────────────────

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
    if '@' not in email:
        return jsonify({'error': 'Invalid email address.'}), 400

    conn = get_connection()
    existing = conn.execute('SELECT id FROM users WHERE email=?', (email,)).fetchone()
    if existing:
        conn.close()
        return jsonify({'error': 'An account with this email already exists.'}), 409

    code = _gen_code()
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

    conn.execute("""
        INSERT INTO users (username, email, password_hash, verify_code, verified)
        VALUES (?, ?, ?, ?, 0)
    """, (username, email, pw_hash, code))
    conn.commit()
    conn.close()

    _send_email(email, '🔐 Your MiniStore verification code', _welcome_email(username, code))
    return jsonify({'message': 'Account created! Check your email for the verification code.'}), 201


@auth_bp.route('/auth/verify', methods=['POST'])
def verify():
    d = request.get_json()
    email = (d.get('email') or '').strip().lower()
    code  = (d.get('code')  or '').strip()

    if not email or not code:
        return jsonify({'error': 'Email and code are required.'}), 400

    conn = get_connection()
    user = conn.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
    if not user:
        conn.close()
        return jsonify({'error': 'Account not found.'}), 404
    if user['verified']:
        conn.close()
        return jsonify({'error': 'Account already verified.'}), 400
    if user['verify_code'] != code:
        conn.close()
        return jsonify({'error': 'Invalid verification code.'}), 400

    conn.execute('UPDATE users SET verified=1, verify_code=NULL WHERE email=?', (email,))
    conn.commit()

    updated = conn.execute('SELECT * FROM users WHERE email=?', (email,)).fetchone()
    conn.close()

    _send_email(email, '🎉 Welcome to MiniStore!', _success_email(user['username']))

    token = _make_token(updated['id'], email)
    return jsonify({
        'token': token,
        'user':  _user_dict(updated),
        'message': 'Account verified! Welcome to MiniStore 🎉'
    })


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
    if not user['verified']:
        return jsonify({'error': 'Please verify your email before logging in.', 'needs_verify': True, 'email': email}), 403

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