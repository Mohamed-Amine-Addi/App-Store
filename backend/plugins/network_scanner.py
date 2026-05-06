import socket, subprocess, platform, re
from datetime import datetime

def _ping(host):
    param = '-n' if platform.system().lower() == 'windows' else '-c'
    try:
        result = subprocess.run(['ping', param, '1', '-W', '1', host],
                                capture_output=True, text=True, timeout=3)
        return result.returncode == 0
    except Exception:
        return False

def _get_local_ip():
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except Exception:
        return '192.168.1.100'

def run(action='info', target=''):
    if action == 'info':
        local_ip = _get_local_ip()
        hostname = socket.gethostname()
        return {
            'hostname':  hostname,
            'local_ip':  local_ip,
            'subnet':    '.'.join(local_ip.split('.')[:3]) + '.0/24',
            'scanned_at': datetime.now().strftime('%Y-%m-%d %H:%M'),
        }

    elif action == 'ping':
        if not target:
            raise ValueError("'target' (IP or hostname) is required")
        alive = _ping(target)
        return {
            'target': target,
            'status': 'alive ✓' if alive else 'unreachable ✗',
            'alive':  alive,
        }

    elif action == 'scan':
        local_ip = _get_local_ip()
        base = '.'.join(local_ip.split('.')[:3])
        alive = []
        # Scan only a small range for speed (demo)
        for i in [1, 2, 100, 101, 102, 200, 254]:
            host = f'{base}.{i}'
            if _ping(host):
                try:
                    name = socket.gethostbyaddr(host)[0]
                except Exception:
                    name = 'Unknown'
                alive.append({'ip': host, 'hostname': name})
        return {
            'subnet':  f'{base}.0/24',
            'found':   len(alive),
            'devices': alive,
            'note':    'Quick scan (sampled IPs). Full scan may take longer.'
        }

    else:
        raise ValueError(f"Unknown action. Use: info, ping, scan")