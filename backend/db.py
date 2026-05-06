import sqlite3, os

DB_PATH = os.path.join(os.path.dirname(__file__), '..', 'database', 'appstore.db')

def get_connection():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_connection()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS users (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            username     TEXT    NOT NULL,
            email        TEXT    UNIQUE NOT NULL,
            password_hash TEXT   NOT NULL,
            avatar_color TEXT    NOT NULL DEFAULT '#7c6cff',
            avatar_emoji TEXT    NOT NULL DEFAULT '👤',
            bio          TEXT    NOT NULL DEFAULT '',
            verified     INTEGER NOT NULL DEFAULT 0,
            verify_code  TEXT,
            created_at   DATETIME DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS apps (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            name        TEXT UNIQUE NOT NULL,
            title       TEXT NOT NULL,
            description TEXT NOT NULL,
            category    TEXT NOT NULL DEFAULT 'tools',
            version     TEXT NOT NULL DEFAULT '1.0.0',
            icon        TEXT NOT NULL DEFAULT '🧩',
            installed   INTEGER NOT NULL DEFAULT 0
        );
        CREATE TABLE IF NOT EXISTS installs (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id      INTEGER NOT NULL,
            app_id       INTEGER NOT NULL,
            installed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (app_id)  REFERENCES apps(id)
        );
        CREATE TABLE IF NOT EXISTS usage_history (
            id     INTEGER PRIMARY KEY AUTOINCREMENT,
            app_id INTEGER NOT NULL,
            ran_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (app_id) REFERENCES apps(id)
        );
    """)
    c.executemany("""
        INSERT OR IGNORE INTO apps (name,title,description,category,version,icon) VALUES(?,?,?,?,?,?)
    """, [
        ('calculator',     'Calculator',        'Perform arithmetic: add, subtract, multiply, divide.',           'productivity','1.0.0','🧮'),
        ('notes',          'Quick Notes',       'Create and retrieve personal notes instantly.',                  'productivity','1.2.0','📝'),
        ('timer',          'Timer',             'Countdown timer and stopwatch with presets.',                    'productivity','1.0.0','⏱️'),
        ('url_shortener',  'URL Shortener',     'Shorten long URLs and manage your links easily.',                'productivity','1.0.0','🌐'),
        ('task_scheduler', 'Task Scheduler',    'Plan and manage your daily tasks efficiently.',                  'productivity','1.2.0','📅'),
        ('smart_notes',    'Smart Notes AI',    'Take notes with smart suggestions and auto-formatting.',         'productivity','1.3.0','🧠'),
        ('unit_converter', 'Unit Converter',    'Convert between units: length, weight, temperature, speed.',     'productivity','1.0.0','📐'),
        ('expense_tracker','Expense Tracker',   'Track your daily expenses and manage your budget.',              'productivity','1.0.0','🧾'),
        ('focus_mode',     'Focus Mode',        'Pomodoro timer to block distractions and stay focused.',         'productivity','1.0.0','⏳'),
        ('file_organizer', 'File Organizer',    'Automatically organize files into folders by type.',             'tools',       '1.0.0','🗂️'),
        ('system_monitor', 'System Monitor',    'Monitor CPU, RAM, and disk usage in real time.',                 'tools',       '1.1.0','📊'),
        ('music_player',   'Music Player',      'Play local audio files with playlist and controls.',             'tools',       '1.0.0','🎵'),
        ('weather',        'Weather Dashboard', 'Get real-time weather updates for any city.',                    'tools',       '1.0.0','🌍'),
        ('password_vault', 'Password Vault',    'Securely store and manage your passwords with encryption.',      'security',    '1.0.0','🔐'),
        ('network_scanner','Network Scanner',   'Scan your local network and detect connected devices.',          'security',    '1.1.0','📡'),
        ('snake',          'Snake',             'Classic snake game — eat food, grow longer, avoid walls!',       'games',       '1.0.0','🐍'),
        ('tetris',         'Tetris',            'Stack falling blocks and clear lines in this timeless puzzle.',  'games',       '1.0.0','🧱'),
        ('memory',         'Memory Cards',      'Flip cards and find all matching pairs to win.',                 'games',       '1.0.0','🃏'),
    ])
    conn.commit()
    conn.close()
