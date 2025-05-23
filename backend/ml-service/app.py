import sys
import os

PROJECT_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from flask import Flask
from flask_cors import CORS
from routes.prediction import prediction_bp

app = Flask(__name__)

# Configuración de CORS más explícita
# Esto permite solicitudes desde cualquier origen a cualquier ruta de tu aplicación.
# supports_credentials=True es útil si en el futuro necesitas enviar cookies o cabeceras de autorización.
# origins='*' permite cualquier origen. Para producción, querrás restringirlo a tu dominio de frontend.
# methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"] explícitamente lista los métodos.
# allow_headers=["Content-Type", "Authorization", "X-Requested-With"] (puedes añadir más si los usas)
cors = CORS(app, 
            resources={r"/*": {"origins": "*"}}, 
            methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Content-Type", "Authorization", "X-Requested-With", "Accept"], # Añadí Accept
            supports_credentials=True,
            expose_headers=["Content-Type"] # Exponer cabeceras si es necesario
           )
# Alternativamente, si solo quieres aplicar CORS al blueprint específico:
# CORS(prediction_bp, resources={r"/api/prediction/*": {"origins": "http://localhost:3000"}})
# Pero para desarrollo, aplicar a toda la app con origins="*" es más sencillo para empezar.

app.register_blueprint(prediction_bp) # Tu blueprint ya tiene el prefijo /api/prediction

if __name__ == '__main__':
    # Para desarrollo, es bueno escuchar en 0.0.0.0 para asegurar accesibilidad
    # si alguna vez accedes desde una IP diferente a localhost (ej. una VM o un dispositivo móvil en la misma red)
    app.run(host='0.0.0.0', port=5000, debug=True)