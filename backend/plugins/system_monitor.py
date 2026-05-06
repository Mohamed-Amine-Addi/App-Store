import os, platform

def _get_cpu():
    # Cross-platform CPU approximation without psutil
    try:
        import subprocess
        if platform.system() == 'Linux':
            result = subprocess.run(['grep', 'cpu MHz', '/proc/cpuinfo'], capture_output=True, text=True)
            lines = result.stdout.strip().split('\n')
            if lines and lines[0]:
                return {'cores': len(lines), 'platform': platform.processor() or 'Unknown'}
        return {'cores': os.cpu_count(), 'platform': platform.processor() or 'Unknown'}
    except Exception:
        return {'cores': os.cpu_count(), 'platform': 'Unknown'}

def _get_memory():
    try:
        import subprocess
        if platform.system() == 'Linux':
            with open('/proc/meminfo') as f:
                lines = {l.split(':')[0]: int(l.split(':')[1].strip().split()[0]) for l in f if ':' in l}
            total = lines.get('MemTotal', 0) // 1024
            available = lines.get('MemAvailable', 0) // 1024
            used = total - available
            percent = round(used / total * 100, 1) if total else 0
            return {'total_mb': total, 'used_mb': used, 'available_mb': available, 'percent': percent}
    except Exception:
        pass
    return {'total_mb': 8192, 'used_mb': 4096, 'available_mb': 4096, 'percent': 50.0, 'note': 'demo values'}

def _get_disk():
    try:
        stat = os.statvfs('/')
        total = stat.f_blocks * stat.f_frsize // (1024 ** 3)
        free  = stat.f_bfree  * stat.f_frsize // (1024 ** 3)
        used  = total - free
        percent = round(used / total * 100, 1) if total else 0
        return {'total_gb': total, 'used_gb': used, 'free_gb': free, 'percent': percent}
    except Exception:
        return {'total_gb': 256, 'used_gb': 128, 'free_gb': 128, 'percent': 50.0, 'note': 'demo values'}

def run(action='all'):
    if action == 'cpu':
        return {'cpu': _get_cpu()}
    elif action == 'memory':
        return {'memory': _get_memory()}
    elif action == 'disk':
        return {'disk': _get_disk()}
    elif action == 'all':
        return {
            'platform': platform.system(),
            'cpu':    _get_cpu(),
            'memory': _get_memory(),
            'disk':   _get_disk(),
        }
    else:
        raise ValueError(f"Unknown action '{action}'. Use: all, cpu, memory, disk")