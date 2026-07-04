# Diabeterm — Servicio de Análisis Térmico

Microservicio Python para análisis de imágenes térmicas de pie diabético.
Se inicia automáticamente con `npm run dev` desde la raíz del proyecto.

## Dependencias

Todo se instala vía `pip`, sin dependencias del sistema operativo.

| Paquete | Uso |
|---------|-----|
| fastapi + uvicorn | API REST |
| opencv-python | Procesamiento de imagen |
| numpy | Álgebra vectorizada |
| Pillow | Carga de imágenes |
| easyocr | OCR de valores de temperatura (100% Python) |

## Endpoints

- `GET  /health`  — Estado del servicio
- `POST /analyze` — Analiza imagen(es) térmica(s)

### Body de /analyze
```json
{
  "pieIzquierdo": "/ruta/absoluta/imagen_izq.jpg",
  "pieDerecho":   "/ruta/absoluta/imagen_der.jpg",
  "respuestas":   { "...cuestionario médico..." }
}
```

## Algoritmo

1. Detecta la barra de color lateral (~12% derecho de la imagen)
2. EasyOCR lee los valores de temperatura máx/mín de la barra
3. Construye una LUT (lookup table) de 512 muestras: color → temperatura
4. Convierte cada píxel del pie a su temperatura real en °C
5. Analiza: asimetría entre pies (umbral ≥2.2°C), hipertermia, isquemia
6. Combina con el cuestionario clínico → nivel de riesgo BAJO/MEDIO/ALTO/CRITICO
