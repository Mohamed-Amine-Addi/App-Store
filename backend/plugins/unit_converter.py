CONVERSIONS = {
    'length': {
        'km':   1000, 'm': 1, 'cm': 0.01, 'mm': 0.001,
        'mile': 1609.34, 'yard': 0.9144, 'foot': 0.3048, 'inch': 0.0254
    },
    'weight': {
        'kg': 1, 'g': 0.001, 'mg': 0.000001,
        'lb': 0.453592, 'oz': 0.0283495, 'ton': 1000
    },
    'temperature': {},  # handled separately
    'speed': {
        'km/h': 1, 'm/s': 3.6, 'mph': 1.60934, 'knot': 1.852
    },
    'data': {
        'B': 1, 'KB': 1024, 'MB': 1024**2, 'GB': 1024**3, 'TB': 1024**4
    },
}

def _convert_temp(value, from_unit, to_unit):
    # Normalize to Celsius first
    if from_unit == 'C':   c = value
    elif from_unit == 'F': c = (value - 32) * 5/9
    elif from_unit == 'K': c = value - 273.15
    else: raise ValueError(f"Unknown temperature unit '{from_unit}'")

    if to_unit == 'C':   return round(c, 4)
    elif to_unit == 'F': return round(c * 9/5 + 32, 4)
    elif to_unit == 'K': return round(c + 273.15, 4)
    else: raise ValueError(f"Unknown temperature unit '{to_unit}'")

def run(category='length', value=1, from_unit='m', to_unit='km'):
    value = float(value)

    if category == 'temperature':
        result = _convert_temp(value, from_unit, to_unit)
        return {
            'category':   category,
            'from':       f'{value} {from_unit}',
            'to':         f'{result} {to_unit}',
            'result':     result,
            'expression': f'{value}°{from_unit} = {result}°{to_unit}',
        }

    if category not in CONVERSIONS:
        raise ValueError(f"Unknown category. Use: {', '.join(CONVERSIONS)}")

    units = CONVERSIONS[category]
    if from_unit not in units:
        raise ValueError(f"Unknown unit '{from_unit}' for {category}. Available: {', '.join(units)}")
    if to_unit not in units:
        raise ValueError(f"Unknown unit '{to_unit}' for {category}. Available: {', '.join(units)}")

    base   = value * units[from_unit]
    result = round(base / units[to_unit], 6)

    return {
        'category':   category,
        'from':       f'{value} {from_unit}',
        'to':         f'{result} {to_unit}',
        'result':     result,
        'expression': f'{value} {from_unit} = {result} {to_unit}',
    }