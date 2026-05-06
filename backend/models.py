def app_to_dict(row):
    return {
        'id':          row['id'],
        'name':        row['name'],
        'title':       row['title'],
        'description': row['description'],
        'category':    row['category'],
        'version':     row['version'],
        'icon':        row['icon'],
        'installed':   bool(row['installed']),
    }