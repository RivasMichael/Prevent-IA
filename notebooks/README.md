# Notebooks de PreventIA

El experimento clasifica **regiones seleccionadas** de pavimento en D00 (grieta longitudinal), D10 (transversal), D20 (tipo cocodrilo) y D40 (bache). Usa una sola MLP de scikit-learn. No detecta automáticamente la ubicación del daño y no tiene una categoría de pavimento sano.

## Flujo del código

1. Leer las fotografías y sus anotaciones XML del subconjunto de Estados Unidos de RDD2022.
2. Comprobar correspondencia de archivos, clases y coordenadas.
3. Recortar cada objeto anotado, convertirlo a grises, redimensionarlo a 32 × 32 píxeles y dividir sus valores entre 255.
4. Aplanar cada recorte a 1.024 entradas y separar aproximadamente 80/20 de los grupos de fotografías. Todos los recortes de la misma fotografía y de fotografías con píxeles idénticos permanecen juntos.
5. Entrenar una MLP con una capa oculta de 32 neuronas, ReLU, Adam, `alpha=0.01`, `max_iter=300` y `random_state=42`.
6. Calcular el porcentaje de aciertos en validación y probar regiones marcadas manualmente en una fotografía.

## Datos

Descarga el subconjunto de Estados Unidos de [RDD2022, de Arya et al.](https://doi.org/10.6084/m9.figshare.21431547), o utiliza la copia compartida por el grupo en Google Drive. El repositorio no incluye el dataset completo ni un enlace privado de Drive.

La copia utilizada contiene 4.805 fotografías de `train` con sus XML y 1.200 fotografías de `test` sin XML locales. Se obtienen 11.014 recortes: 8.745 para entrenar y 2.269 para validar. Ambos conjuntos proceden de `train`; `test` se puede utilizar para la demostración, pero no para calcular aciertos sin sus etiquetas.

## VS Code / Jupyter en Windows

1. Abre la carpeta `notebooks` como carpeta de trabajo en VS Code.
2. Instala las dependencias en el Python que usarás como kernel:

   ```powershell
   python -m pip install -r requirements.txt
   ```

3. Coloca el dataset junto al notebook con esta estructura:

   ```text
   notebooks/
   ├── PreventIA_MLP.ipynb
   └── United_States/
       └── United_States/
           ├── train/
           │   ├── images/
           │   └── annotations/
           │       └── xmls/
           └── test/
               └── images/
   ```

   El código también admite un único nivel `United_States/train`. Si el dataset está en otra ubicación, cambia `DATOS` por su ruta. Se usa la carpeta de trabajo de Python, que no siempre coincide con la ubicación del notebook.

4. Abre `PreventIA_MLP.ipynb`, selecciona el kernel con esas dependencias y ejecuta las celdas en orden.
5. Al final, elige una fotografía en la ventana de Tkinter, arrastra para marcar daños y pulsa **Terminar**. Tkinter normalmente viene incluido con Python para Windows; necesita un escritorio gráfico.

## Google Colab y Drive

[Abrir PreventIA_MLP_Colab.ipynb en Colab](https://colab.research.google.com/github/RivasMichael/Prevent-IA/blob/main/notebooks/PreventIA_MLP_Colab.ipynb).

1. Guarda una copia del notebook en tu Drive si quieres conservar cambios y resultados.
2. Coloca la carpeta exterior `United_States` en **Mi unidad**. Si otro integrante la compartió, añade un acceso directo de esa carpeta exterior directamente a Mi unidad, conservando su nombre.
3. Ejecuta la primera celda de código y autoriza `drive.mount` con la cuenta que tiene acceso al dataset.
4. El código espera esta ruta:

   ```python
   DATOS = Path('/content/drive/MyDrive/United_States/United_States')
   ```

   Si usas otra organización, ajusta esa línea. Dentro de `DATOS` deben estar `train` y `test`.

5. Ejecuta la lectura, el preprocesamiento y el entrenamiento. La lectura de miles de archivos directamente desde Drive puede tardar; esa celda imprime el resumen al terminar.
6. Ejecuta las dos últimas celdas de código. Selecciona una sola fotografía desde tu computadora, marca una o varias regiones en la imagen del notebook y pulsa **Terminar** para obtener las predicciones. También puedes borrar las selecciones o cancelar.

Mientras el selector espera tus acciones, la celda permanece ejecutándose. Para probar otra fotografía, vuelve a ejecutar la última celda. Esta versión usa el navegador y no necesita Tkinter.

Cada compañero debe tener permiso de lectura sobre el dataset y conectar su propia cuenta. Compartir el notebook no comparte el modelo entrenado en memoria ni la sesión de Python.

## Resultados y límites

El notebook local conserva una ejecución con **1.679 / 2.269 aciertos = 74,00 %**. Las clases tienen cantidades desiguales: D00 6.750, D10 3.295, D20 834 y D40 135 recortes. El porcentaje global no implica igual rendimiento para las cuatro clases.

El notebook de Colab se entrega sin salidas guardadas. Mantiene el mismo preprocesamiento y configuración; el resultado que se reporte debe ser el de su ejecución real. Las versiones de las bibliotecas y el entorno pueden afectar la reproducibilidad.

Los documentos de `docs/` describen la configuración de 32 neuronas y el 74,00 %. Una prueba con 64 neuronas y 75,63 % fue comunicada por el equipo, pero el archivo ejecutado correspondiente no forma parte de estas copias. La aplicación web de la raíz conserva su modelo anterior y sus propias métricas (70,91 %).

Las etiquetas reales de validación no se entregan como entrada a `predict`. La selección de regiones de la demostración es manual. Las fotos idénticas permanecen juntas, pero no se garantiza separación por carretera. Si seleccionas una región sana, la MLP igualmente devolverá una de las cuatro clases de daño.

## Memoria y exposición

Estos notebooks no guardan automáticamente el modelo entrenado. Si reinicias el kernel o termina la sesión de Colab, debes repetir la preparación y el entrenamiento para usar sus celdas de predicción.

La aplicación web ya existente en la raíz sí carga pesos desde `model.npz` y puede funcionar sin el dataset completo. Sus pesos y resultados corresponden a su versión previa, no a una exportación de estos notebooks.
