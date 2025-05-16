from flask import Blueprint, request, jsonify
from controllers.prediction_controller import predecir_reingreso

prediction_bp = Blueprint('prediction', __name__, url_prefix='/api/prediction')

@prediction_bp.route('/predict', methods=['POST'])
def predict():
    data = request.json
    resultado = predecir_reingreso(data)
    return jsonify(resultado)
