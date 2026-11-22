# PreventIA MVP

Aplicación web del Grupo 5 para clasificar regiones dañadas del pavimento. La persona dibuja un rectángulo sobre la fotografía, o escribe sus coordenadas. El modelo devuelve una de cuatro clases y las probabilidades de la MLP. La demostración incluye cuatro ejemplos de validación con sus regiones ya seleccionadas, uno por clase. Se eligieron para ilustrar la interfaz. Las métricas se calculan sobre todo el conjunto de validación.

La aplicación usa los pesos exportados de la MLP de `IA - pf/PreventIA_MLP.ipynb`. El recorte se convierte a escala de grises, se redimensiona a 32 × 32 mediante interpolación bilineal y se normaliza entre 0 y 1. Los pesos se incluyen en `model.npz`. El modelo carga al iniciar y la app puede ejecutarse con estos archivos directamente.

## Ejecutar en Windows

Abre PowerShell en esta carpeta.

```powershell
python -m pip install -r requirements.txt
python app.py
```

Abre http://127.0.0.1:8000. Pulsa **Clasificar región** para probar el ejemplo o **Elegir foto** para cargar una propia. Las fotografías se procesan en memoria y el servidor no las guarda.

## Publicar en Render

1. Sube el **contenido de esta carpeta** a la raíz de un repositorio de GitHub. Incluye `model.npz`, `public/`, `render.yaml` y `.python-version`.
2. En Render, selecciona **New → Blueprint**, conecta el repositorio y aplica la configuración. El archivo `render.yaml` declara el servicio, el servidor Gunicorn y la ruta de salud `/health`.
3. Abre la URL asignada y prueba **Clasificar región** antes de la exposición.

Si prefieres crear el servicio manualmente, usa el runtime Python, el comando de compilación `pip install -r requirements.txt` y el de inicio `gunicorn --bind 0.0.0.0:$PORT --workers 1 --threads 2 app:app`. En Railway puedes usar esos mismos comandos y una URL pública.

El plan gratuito de Render suspende el servicio tras 15 minutos sin tráfico. En la primera visita después de una pausa, espera a que vuelva a iniciar. [Documentación oficial de Render](https://render.com/docs/free)

## Datos y evaluación

Los resultados corresponden a 2 269 recortes de validación del subconjunto de Estados Unidos. La MLP se entrenó con 8 745 recortes. Las fotos de ejemplo proceden de RDD2022, de Arya et al., y se convirtieron de JPG a PNG. [Datos y licencia CC BY 4.0](https://doi.org/10.6084/m9.figshare.21431547)

