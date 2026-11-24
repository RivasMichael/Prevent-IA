# PreventIA MVP

El repositorio reúne la aplicación web de demostración y los notebooks del proyecto académico. Para revisar la lectura del dataset, el preprocesamiento y el entrenamiento, consulta [notebooks/README.md](notebooks/README.md).

## Archivos del proyecto académico

- [Notebook para VS Code / Jupyter](notebooks/PreventIA_MLP.ipynb): incluye salidas de la ejecución local y selección manual de regiones con Tkinter.
- [Notebook para Google Colab](notebooks/PreventIA_MLP_Colab.ipynb): conecta Google Drive y permite subir una fotografía y marcar regiones en el navegador. [Abrir en Colab](https://colab.research.google.com/github/RivasMichael/Prevent-IA/blob/main/notebooks/PreventIA_MLP_Colab.ipynb).
- [Informe adaptado](docs/PreventIA_Informe_Adaptado.pdf).
- [Explicación del código paso a paso](docs/PreventIA_Explicacion_del_codigo_paso_a_paso.pdf).

**Versiones y resultados:** el notebook local y los dos PDF corresponden a la MLP de una capa oculta de 32 neuronas, con 1.679 aciertos de 2.269 recortes de validación (74,00 %). La copia para Colab conserva esa configuración y debe ejecutarse para obtener sus resultados. La aplicación web preexistente usa otro modelo exportado: su archivo `public/assets/model-info.json` registra 70,91 %. El 74,00 % del notebook no debe atribuirse a la aplicación web.

La prueba con 64 neuronas y 75,63 % comunicada por el equipo en Colab no se incluye como ejecución verificada: su notebook ejecutado y sus pesos no están en esta entrega. Estos archivos tampoco contienen un resultado confirmado del 80 %.

El dataset completo se mantiene fuera de GitHub por su tamaño. Consulta [las instrucciones de datos y ejecución](notebooks/README.md) para usarlo en local o desde Drive.

## Aplicación web existente

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

