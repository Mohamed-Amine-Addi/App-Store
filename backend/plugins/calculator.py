OPERATIONS = {
    'add':      (lambda a, b: a + b, '+'),
    'subtract': (lambda a, b: a - b, '-'),
    'multiply': (lambda a, b: a * b, '×'),
    'divide':   (lambda a, b: a / b, '÷'),
}

def run(operation='add', a=0, b=0):
    operation = operation.lower()
    if operation not in OPERATIONS:
        raise ValueError(f"Unknown operation. Use: {', '.join(OPERATIONS)}")
    if operation == 'divide' and float(b) == 0:
        raise ValueError("Division by zero is not allowed.")
    func, symbol = OPERATIONS[operation]
    result = func(float(a), float(b))
    display = int(result) if result == int(result) else round(result, 10)
    return {'result': display, 'expression': f'{a} {symbol} {b} = {display}'}