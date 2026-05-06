import urllib.request, json

def _fetch(city):
    url = f'https://wttr.in/{city.replace(" ", "+")}?format=j1'
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'MiniStore/1.0'})
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read().decode())
    except Exception:
        return None

def run(action='current', city='London'):
    if not city:
        raise ValueError("'city' is required")

    if action in ('current', 'forecast'):
        data = _fetch(city)
        if not data:
            # Demo fallback
            return {
                'city':        city,
                'temperature': '22°C',
                'feels_like':  '20°C',
                'description': 'Partly Cloudy (demo — no internet)',
                'humidity':    '60%',
                'wind':        '15 km/h',
            }
        current = data['current_condition'][0]
        result = {
            'city':        city,
            'temperature': f"{current['temp_C']}°C",
            'feels_like':  f"{current['FeelsLikeC']}°C",
            'description': current['weatherDesc'][0]['value'],
            'humidity':    f"{current['humidity']}%",
            'wind':        f"{current['windspeedKmph']} km/h",
        }
        if action == 'forecast':
            days = data.get('weather', [])
            result['forecast'] = [
                {
                    'date':    d['date'],
                    'max':     f"{d['maxtempC']}°C",
                    'min':     f"{d['mintempC']}°C",
                    'desc':    d['hourly'][4]['weatherDesc'][0]['value'],
                }
                for d in days[:3]
            ]
        return result

    else:
        raise ValueError(f"Unknown action '{action}'. Use: current, forecast")