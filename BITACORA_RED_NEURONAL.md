# Cómo funciona el análisis de imágenes en Diabeterm Evalúa

## De qué va esto

La app analiza fotos térmicas de pies de pacientes diabéticos. Una cámara térmica no toma fotos normales, sino que captura el calor del cuerpo: lo que está caliente se ve en rojo o naranja, y lo frío se ve en azul o morado. Eso es útil en medicina porque el calor en los pies puede indicar inflamación, infección o mala circulación.

El objetivo del sistema es revisar esas imágenes, extraer información de temperatura y combinarla con un cuestionario del paciente para decir si tiene riesgo bajo, medio, alto o crítico de complicaciones.

---

## Cómo está armado

Hay dos partes. Una es la app web que ve el médico, y la otra es un servicio en Python que corre por atrás y hace todo el análisis pesado de imágenes. Cuando el médico sube una foto, la app le manda esa imagen al servicio de Python, que la analiza y regresa los resultados.

El servicio tiene dos archivos principales: `main.py` que es el servidor que recibe las fotos, y `thermal_analyzer.py` que tiene toda la lógica del análisis.

---

## Cómo se analiza la imagen, paso a paso

### Abrir la imagen

Lo primero es abrir la foto con OpenCV, que es una librería de Python para trabajar con imágenes. Se convierte el formato de colores de BGR a RGB porque OpenCV los lee al revés por defecto.

```python
img = cv2.imread(path)
img = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
```

### Separar el pie de la barra de temperatura

Las imágenes térmicas siempre traen una barra de colores a un lado que funciona como leyenda, diciendo qué temperatura representa cada color. Antes de analizar el pie hay que separar esa barra del resto de la imagen.

Para encontrar dónde está la barra, el sistema revisa franjas del lado derecho de la imagen y busca la que tenga un cambio de color más gradual de arriba a abajo, que es justo como luce una barra de temperatura.

```python
for pct in [0.92, 0.90, 0.88, 0.86, 0.84]:
    x = int(w * pct)
    strip = img[:, x:, :].astype(np.float32)
    col = strip.mean(axis=1)
    grad = float(np.mean(np.abs(np.diff(col, axis=0))))
    if grad > best_score:
        best_score = grad
        best_start = x
```

### Leer los números de temperatura con IA

La barra trae números escritos, tipo "36.5" arriba y "24.0" abajo. El sistema necesita leerlos para saber el rango de temperaturas de la imagen.

Para eso usa **EasyOCR**, que es una herramienta de inteligencia artificial que puede leer texto dentro de imágenes. Por dentro usa una red neuronal llamada CRNN, que básicamente tiene dos partes: una que analiza la forma visual de cada carácter (como distinguir un 3 de un 8 por su forma) y otra que los une en orden para formar números completos.

Este modelo ya venía entrenado, no se entrenó desde cero para el proyecto.

```python
reader = easyocr.Reader(['en'], gpu=False)
results = reader.readtext(label_region)

for (_, text, confidence) in results:
    numbers = re.findall(r"(\d+\.?\d*)", text.replace(",", "."))
    for n in numbers:
        t = float(n)
        if 10.0 <= t <= 60.0:
            temps.append(t)
```

Si no puede leer nada (imagen borrosa o mala calidad), usa 36°C y 25°C como valores de respaldo.

### Armar la tabla color → temperatura

Ya con el rango de temperaturas, se toman 512 muestras de color de la barra y a cada una se le asigna una temperatura proporcional. Queda algo como una tabla que dice "este tono de rojo = 35°C, este azul = 26°C", etc.

```python
colors_lut = bar_colors[idx]
temps_lut = np.linspace(temp_max, temp_min, n_samples, dtype=np.float32)
```

### Convertir cada píxel a temperatura

Con esa tabla ya armada, el sistema recorre cada píxel del pie, busca el color más parecido en la tabla y le asigna la temperatura que le corresponde. Al final se tiene un mapa completo de temperatura de toda la imagen, píxel por píxel.

Se procesa en bloques de 8000 píxeles a la vez para no usar demasiada memoria.

```python
for i in range(0, n, chunk_size):
    chunk = pixels[i : i + chunk_size]
    diff = chunk[:, np.newaxis, :] - colors_lut[np.newaxis, :, :]
    dist_sq = np.einsum("ijk,ijk->ij", diff, diff)
    nearest = np.argmin(dist_sq, axis=1)
    temp_flat[i : i + chunk_size] = temps_lut[nearest]
```

### Sacar los datos clínicos

Con el mapa de temperatura se calculan los datos que le interesan al médico:

- Temperatura promedio del pie
- Zonas muy calientes (más de 2 desviaciones estándar arriba del promedio), que pueden indicar inflamación
- Zonas muy frías (más de 2 desviaciones estándar abajo), que pueden indicar mala circulación
- Diferencia de temperatura entre pie izquierdo y derecho (si hay más de 2.2°C de diferencia es señal de alerta)

```python
t_mean = float(np.mean(temp_map))
t_std  = float(np.std(temp_map))
hot_pct  = float(np.mean(temp_map > t_mean + 2.0 * t_std) * 100)
cold_pct = float(np.mean(temp_map < t_mean - 2.0 * t_std) * 100)
```

---

## El cálculo del riesgo

Una vez que se tienen los datos térmicos, se combinan con las respuestas del cuestionario que llena el paciente. Cada factor suma puntos según qué tan grave es clínicamente hablando. Al final se suma todo y se clasifica:

- 0 a 24 puntos → Riesgo bajo
- 25 a 49 → Riesgo medio
- 50 a 74 → Riesgo alto
- 75 a 100 → Riesgo crítico

Los factores que más pesan son cosas como haber tenido amputaciones antes (+25 puntos), úlcera activa en el pie (+20), o mucha asimetría térmica entre ambos pies (+25). Los factores del cuestionario y los térmicos se mezclan en la misma puntuación final.

```python
if q.get("amputaciones"):           score += 25
if q.get("ulceraEnPie"):            score += 20
if q.get("perdidaSensibilidad"):    score += 15
if q.get("diagnosticoPrevio"):      score += 15
anos = q.get("anosEvolucion") or 0
if anos > 10:                       score += 15
elif anos > 5:                      score += 8
# ... y así con el resto de factores

score = min(score, 100.0)
```

Con el nivel de riesgo calculado, el sistema también genera recomendaciones específicas para ese paciente según sus respuestas.

---

## El servidor que lo conecta todo

El archivo `main.py` es el servidor que recibe las imágenes desde la app web. Cuando el médico sube una foto, este servidor la recibe, llama al pipeline de análisis para cada pie, calcula el riesgo y regresa todo el resultado.

```python
@app.post("/analyze")
def analyze(req: AnalysisRequest):
    left  = full_pipeline(req.pieIzquierdo, "Pie izquierdo") if req.pieIzquierdo else None
    right = full_pipeline(req.pieDerecho,   "Pie derecho")   if req.pieDerecho   else None

    result = compute_risk(left, right, req.respuestas)

    return {
        "success": True,
        "data": {
            **result,
            "thermalData": {
                "pieIzquierdo": left,
                "pieDerecho":   right,
            },
        },
    }
```

---

## Librerías que se usaron

- **FastAPI** — para hacer el servidor que recibe las imágenes
- **OpenCV** — para abrir y procesar las imágenes
- **NumPy** — para los cálculos matemáticos sobre los píxeles
- **EasyOCR** — la parte de inteligencia artificial, lee los números de temperatura en la imagen
- **Pillow** — soporte extra para distintos formatos de imagen

---

## Una aclaración

La parte de inteligencia artificial del sistema es EasyOCR, que usa una red neuronal pre-entrenada para reconocer texto en imágenes. El análisis térmico y el cálculo de riesgo se hacen con fórmulas matemáticas y reglas clínicas, no con machine learning propio. El sistema quedó listo para que en un futuro se pueda reemplazar esa parte por un modelo entrenado con casos reales de pacientes.
