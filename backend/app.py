import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from flask import Flask
from flask_cors import CORS
from db import init_db
from routes.apps    import apps_bp
from routes.install import install_bp
from routes.run     import run_bp
from routes.auth    import auth_bp

def create_app():
    app = Flask(__name__)
    CORS(app, origins=['http://localhost:3000'])

    app.register_blueprint(apps_bp,    url_prefix='/api')
    app.register_blueprint(install_bp, url_prefix='/api')
    app.register_blueprint(run_bp,     url_prefix='/api')
    app.register_blueprint(auth_bp,    url_prefix='/api')

    @app.route('/api/health')
    def health():
        return {'status': 'ok'}

    return app

if __name__ == '__main__':
    init_db()
    app = create_app()
    app.run(debug=True, port=5000)

