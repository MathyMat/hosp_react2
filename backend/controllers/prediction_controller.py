import pandas as pd
import os
import sys
from joblib import load # Importar load de joblib

# Obtener la ruta absoluta al directorio donde se encuentra este archivo (controllers)
CONTROLLER_DIR = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.dirname(CONTROLLER_DIR)

# Nombres de archivo .joblib
MODEL_FILENAME = 'modelo_reingreso.joblib'  
COLUMNS_FILENAME = 'model_columns.joblib'

MODEL_PATH = os.path.join(BACKEND_DIR, 'ml-service', 'models', MODEL_FILENAME)
COLUMNS_PATH = os.path.join(BACKEND_DIR, 'ml-service', 'models', COLUMNS_FILENAME)

# Carga el modelo y columnas al iniciar usando joblib
try:
    print(f"INFO: Python version en el controlador: {sys.version.split(' ')[0]}")
    print(f"INFO: Pandas version en el controlador: {pd.__version__}")
    try:
        import sklearn
        print(f"INFO: scikit-learn version en el controlador: {sklearn.__version__}")
    except ImportError:
        print("WARNING: scikit-learn no pudo ser importado para verificar versión.")
    try:
        import joblib
        print(f"INFO: joblib version en el controlador: {joblib.__version__}")
    except ImportError:
        print("WARNING: joblib no pudo ser importado para verificar versión.")


    print(f"INFO: Intentando cargar modelo desde: {MODEL_PATH} (usando joblib)")
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"El archivo de modelo {MODEL_PATH} no existe.")
    model = load(MODEL_PATH) # Usar load() de joblib
    print("INFO: Modelo cargado exitosamente con joblib.")

    print(f"INFO: Intentando cargar columnas desde: {COLUMNS_PATH} (usando joblib)")
    if not os.path.exists(COLUMNS_PATH):
        raise FileNotFoundError(f"El archivo de columnas {COLUMNS_PATH} no existe.")
    columnas = load(COLUMNS_PATH) # Usar load() de joblib
    print(f"INFO: Columnas cargadas exitosamente con joblib. Columnas (primeras 10): {list(columnas)[:10]}...")

except FileNotFoundError as e:
    print(f"CRITICAL ERROR: No se encontró el archivo del modelo o columnas (.joblib).")
    print(f"Detalles: {e}")
    models_dir_path = os.path.join(BACKEND_DIR, 'ml-service', 'models')
    if os.path.exists(models_dir_path) and os.path.isdir(models_dir_path):
        print(f"Contenido del directorio de modelos ({models_dir_path}): {os.listdir(models_dir_path)}")
    else:
        print(f"ERROR: El directorio de modelos esperado ({models_dir_path}) no existe o no es un directorio.")
    raise
# No necesitamos el except pickle.UnpicklingError específico aquí si solo usamos joblib
except Exception as e: # Captura otras excepciones de carga de joblib o generales
    print(f"CRITICAL ERROR: Ocurrió un error inesperado al cargar los modelos con joblib: {e}")
    import traceback
    traceback.print_exc()
    raise


def predecir_reingreso(data_json):
    print(f"DEBUG: Datos JSON recibidos para predicción: {data_json}")
    # 'columnas' ya es una lista cargada por joblib
    data = dict.fromkeys(columnas, 0)

    try:
        data['edad'] = float(data_json.get('edad', 0))
        data['tiempo_ultima_atencion_dias'] = float(data_json.get('tiempo_ultima_atencion_dias', 0))
        data['visitas_ultimos_30_dias'] = float(data_json.get('visitas_ultimos_30_dias', 0))
        data['visitas_ultimos_6_meses'] = float(data_json.get('visitas_ultimos_6_meses', 0))
        data['hospitalizaciones_ultimo_anio'] = float(data_json.get('hospitalizaciones_ultimo_anio', 0))
    except (ValueError, TypeError) as e:
        print(f"ERROR: Problema al convertir datos numéricos: {e}. Datos JSON: {data_json}")
        raise ValueError(f"Formato de dato numérico inválido: {e}")

    # El preprocesamiento de género y enfermedad para crear las claves dummy
    # debe coincidir EXACTAMENTE con cómo se crearon las 'columnas' guardadas.
    # El script de Colab ahora guarda las columnas dummy directamente.
    genero_raw = data_json.get('genero', '').strip().lower()
    key_genero = f'genero_{genero_raw}' # Asume que el script de Colab creó columnas como 'genero_masculino'
    if key_genero in data:
        data[key_genero] = 1
    else:
        print(f"WARNING: La clave de género '{key_genero}' (derivada de '{genero_raw}') no es una columna válida. Columnas de género disponibles: {[col for col in columnas if col.startswith('genero_')]}")

    enfermedad_raw = data_json.get('enfermedad', '').strip().lower()
    key_enfermedad = f'enfermedad_{enfermedad_raw}' # Asume que el script de Colab creó columnas como 'enfermedad_diabetes'
    if key_enfermedad in data:
        data[key_enfermedad] = 1
    else:
        print(f"WARNING: La clave de enfermedad '{key_enfermedad}' (derivada de '{enfermedad_raw}') no es una columna válida. Columnas de enfermedad disponibles: {[col for col in columnas if col.startswith('enfermedad_')]}")

    try:
        # 'columnas' es la lista de nombres de columnas en el orden correcto, cargada desde el archivo .joblib
        df_input = pd.DataFrame([data], columns=columnas)
    except Exception as e:
        print(f"ERROR: Creando DataFrame para el modelo: {e}")
        print(f"       'data' usado (primeros 10 items): {dict(list(data.items())[:10])}")
        print(f"       'columnas' del modelo (primeras 10): {list(columnas)[:10]}")
        raise

    try:
        prediccion = model.predict(df_input)[0]
        if hasattr(model, 'classes_') and hasattr(model, 'predict_proba'):
            probabilidad_array = model.predict_proba(df_input)
            try:
                # Encuentra el índice de la clase positiva (asumimos que es 1)
                # model.classes_ podría ser [0, 1] o [False, True] o strings, etc.
                # Convertimos a lista y buscamos '1' o True.
                clases_lista = model.classes_.tolist()
                if 1 in clases_lista:
                    positive_class_index = clases_lista.index(1)
                elif True in clases_lista: # En caso de que las clases sean booleanas
                    positive_class_index = clases_lista.index(True)
                else:
                    # Si la clase '1' o True no está, tomamos la última como heurística (común para clase positiva)
                    # o podrías definir una lógica diferente o lanzar un error.
                    print(f"WARNING: Clase '1' o True no encontrada explícitamente en model.classes_ ({model.classes_}). Asumiendo que la última clase es la positiva.")
                    positive_class_index = len(clases_lista) - 1

                probabilidad = probabilidad_array[0, positive_class_index]
            except ValueError:
                 print(f"ERROR: No se pudo determinar el índice de la clase positiva en model.classes_ ({model.classes_}).")
                 probabilidad = 0.0 # O algún valor por defecto / error
            # print(f"DEBUG: Clases del modelo: {model.classes_}")
        else:
            print("WARNING: El modelo no tiene 'classes_' o 'predict_proba'. Probabilidad establecida a 0.0.")
            probabilidad = 0.0

    except Exception as e:
        print(f"ERROR: Al realizar la predicción o calcular probabilidades: {e}")
        print(f"       DataFrame de entrada (head): \n{df_input.head()}")
        raise

    return {
        "prediccion": int(prediccion),
        "probabilidad": float(probabilidad)
    }