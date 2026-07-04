import re
from typing import Optional, Tuple

import cv2
import numpy as np
import easyocr
from PIL import Image

# Se inicializa una sola vez al arrancar el servicio
_ocr_reader: Optional[easyocr.Reader] = None

def _get_ocr_reader() -> easyocr.Reader:
    global _ocr_reader
    if _ocr_reader is None:
        print("[ThermalAnalyzer] Inicializando EasyOCR...")
        _ocr_reader = easyocr.Reader(['en'], gpu=False, verbose=False)
        print("[ThermalAnalyzer] EasyOCR listo")
    return _ocr_reader


def load_image(path: str) -> np.ndarray:
    img = cv2.imread(path)
    if img is None:
        raise FileNotFoundError(f"No se pudo cargar: {path}")
    return cv2.cvtColor(img, cv2.COLOR_BGR2RGB)


def detect_colorbar(img: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    """
    Separa la imagen en región del pie y barra de color lateral.
    Busca la barra en el 20% derecho de la imagen buscando una franja
    con gradiente vertical uniforme (característica de las barras de color).
    """
    h, w = img.shape[:2]

    best_start = int(w * 0.88)  # fallback al 12% derecho
    best_score = -1.0

    # Escanear franjas candidatas en el 25% derecho
    for pct in [0.92, 0.90, 0.88, 0.86, 0.84]:
        x = int(w * pct)
        strip = img[:, x:, :].astype(np.float32)
        col = strip.mean(axis=1)          # (h, 3) — promedio horizontal
        # Gradiente vertical: una barra de color tiene cambio de color continuo
        grad = float(np.mean(np.abs(np.diff(col, axis=0))))
        if grad > best_score:
            best_score = grad
            best_start = x

    print(f"[ThermalAnalyzer] Barra detectada en x={best_start} (score={best_score:.2f})")
    return img[:, :best_start], img[:, best_start:]


def read_temperature_labels(img: np.ndarray) -> Tuple[float, float]:
    """
    Usa EasyOCR para leer los valores de temperatura de la barra lateral.
    Devuelve (temp_max, temp_min).
    """
    h, w = img.shape[:2]
    label_region = img[:, int(w * 0.78):, :]

    reader = _get_ocr_reader()
    results = reader.readtext(label_region)

    all_found = [(text, conf) for (_, text, conf) in results]
    print(f"[ThermalAnalyzer] OCR encontró: {all_found}")

    temps = []
    for (_, text, confidence) in results:
        if confidence < 0.2:
            continue
        # Buscar números con posible decimal y símbolo de grado
        numbers = re.findall(r"(\d+\.?\d*)", text.replace(",", "."))
        for n in numbers:
            try:
                t = float(n)
                if 10.0 <= t <= 60.0:
                    temps.append(t)
            except ValueError:
                continue

    print(f"[ThermalAnalyzer] Temperaturas OCR: {temps}")

    if len(temps) >= 2:
        t_max, t_min = max(temps), min(temps)
        print(f"[ThermalAnalyzer] Rango leído: {t_min}°C – {t_max}°C")
        return t_max, t_min
    if len(temps) == 1:
        t = temps[0]
        print(f"[ThermalAnalyzer] Solo un valor OCR ({t}°C), estimando rango ±5°C")
        return t + 5.0, t - 5.0

    print("[ThermalAnalyzer] OCR sin resultado, usando fallback 36/25°C")
    return 36.0, 25.0


def build_colorbar_lut(
    colorbar: np.ndarray,
    temp_max: float,
    temp_min: float,
    n_samples: int = 512,
) -> Tuple[np.ndarray, np.ndarray]:
    h, w = colorbar.shape[:2]
    x0, x1 = int(w * 0.20), int(w * 0.80)
    y0, y1 = int(h * 0.04), int(h * 0.96)

    strip = colorbar[y0:y1, x0:x1, :]
    bar_colors = strip.mean(axis=1)

    h_eff = bar_colors.shape[0]
    idx = np.linspace(0, h_eff - 1, n_samples, dtype=int)
    colors_lut = bar_colors[idx].astype(np.float32)
    temps_lut = np.linspace(temp_max, temp_min, n_samples, dtype=np.float32)

    return colors_lut, temps_lut


def pixels_to_temperature(
    region: np.ndarray,
    colors_lut: np.ndarray,
    temps_lut: np.ndarray,
    chunk_size: int = 8000,
) -> np.ndarray:
    h, w = region.shape[:2]
    pixels = region.reshape(-1, 3).astype(np.float32)
    n = pixels.shape[0]
    temp_flat = np.empty(n, dtype=np.float32)

    for i in range(0, n, chunk_size):
        chunk = pixels[i : i + chunk_size]
        diff = chunk[:, np.newaxis, :] - colors_lut[np.newaxis, :, :]
        dist_sq = np.einsum("ijk,ijk->ij", diff, diff)
        nearest = np.argmin(dist_sq, axis=1)
        temp_flat[i : i + chunk_size] = temps_lut[nearest]

    return temp_flat.reshape(h, w)


def analyze_region(temp_map: np.ndarray, label: str) -> dict:
    t_mean = float(np.mean(temp_map))
    t_std  = float(np.std(temp_map))
    t_max  = float(np.max(temp_map))
    t_min  = float(np.min(temp_map))

    hot_pct  = float(np.mean(temp_map > t_mean + 2.0 * t_std) * 100)
    cold_pct = float(np.mean(temp_map < t_mean - 2.0 * t_std) * 100)

    print(
        f"[ThermalAnalyzer] {label}: media={t_mean:.2f}°C  "
        f"std={t_std:.2f}  max={t_max:.2f}  "
        f"hot={hot_pct:.1f}%  cold={cold_pct:.1f}%"
    )

    return {
        "label": label,
        "mean":  round(t_mean, 2),
        "std":   round(t_std,  2),
        "max":   round(t_max,  2),
        "min":   round(t_min,  2),
        "hot_spot_pct":  round(hot_pct,  2),
        "cold_spot_pct": round(cold_pct, 2),
    }


def full_pipeline(image_path: str, label: str = "pie") -> Optional[dict]:
    """
    Pipeline completo. Registra cada paso para facilitar el debug.
    """
    print(f"[ThermalAnalyzer] Procesando: {image_path}")
    try:
        img = load_image(image_path)
        print(f"[ThermalAnalyzer] Imagen cargada: {img.shape[1]}x{img.shape[0]}px")

        foot_region, colorbar = detect_colorbar(img)
        print(f"[ThermalAnalyzer] Región pie: {foot_region.shape[1]}x{foot_region.shape[0]}px | Barra: {colorbar.shape[1]}px ancho")

        temp_max, temp_min = read_temperature_labels(img)

        colors_lut, temps_lut = build_colorbar_lut(colorbar, temp_max, temp_min)
        temp_map = pixels_to_temperature(foot_region, colors_lut, temps_lut)

        result = analyze_region(temp_map, label)
        result["temp_range"] = {"max": round(temp_max, 1), "min": round(temp_min, 1)}
        result["fuente"] = "imagen_termica"
        return result

    except Exception as e:
        print(f"[ThermalAnalyzer] ERROR en {label}: {type(e).__name__}: {e}")
        return None


def compute_risk(
    left: Optional[dict],
    right: Optional[dict],
    questionnaire: dict,
) -> dict:
    score = 0.0
    findings = []
    fuente = "cuestionario"

    # --- Hallazgos térmicos reales ---
    if left or right:
        fuente = "imagen_termica"

        # Mostrar siempre los valores reales medidos, no solo cuando hay anomalía
        for analysis in filter(None, [left, right]):
            findings.append(
                f"{analysis['label']}: temperatura media {analysis['mean']}°C "
                f"(rango {analysis['min']}–{analysis['max']}°C)"
            )

        # Asimetría entre pies
        if left and right:
            diff = abs(left["mean"] - right["mean"])
            if diff >= 2.2:
                findings.append(
                    f"Asimetría térmica significativa: {diff:.1f}°C entre ambos pies "
                    f"(umbral clínico ≥ 2.2°C — indica posible neuropatía o inflamación)"
                )
                score += 25
            elif diff >= 1.5:
                findings.append(
                    f"Asimetría térmica moderada: {diff:.1f}°C entre ambos pies"
                )
                score += 12
            else:
                findings.append(
                    f"Simetría térmica normal entre pies (diferencia: {diff:.1f}°C)"
                )

        # Hot spots e hipotermia por pie
        for analysis in filter(None, [left, right]):
            if analysis["hot_spot_pct"] > 5:
                findings.append(
                    f"{analysis['label']}: {analysis['hot_spot_pct']:.1f}% del área "
                    f"con hipertermia local (T_max={analysis['max']}°C) — posible inflamación"
                )
                score += 15
            if analysis["cold_spot_pct"] > 5:
                findings.append(
                    f"{analysis['label']}: {analysis['cold_spot_pct']:.1f}% del área "
                    f"con hipotermia (T_min={analysis['min']}°C) — posible isquemia periférica"
                )
                score += 20

    # --- Factores del cuestionario ---
    q = questionnaire
    if q.get("ulceraEnPie"):            score += 20
    if q.get("perdidaSensibilidad"):    score += 15
    if q.get("amputaciones"):           score += 25
    if q.get("cambiosTemperatura"):     score += 10
    if q.get("diagnosticoPrevio"):      score += 15
    anos = q.get("anosEvolucion") or 0
    if anos > 10:                       score += 15
    elif anos > 5:                      score += 8
    if q.get("enfermedadesVasculares"): score += 12
    if q.get("ulcerasAnteriores"):      score += 18
    if q.get("infeccionesPies"):        score += 15
    if q.get("hipertension"):           score += 8
    if q.get("obesidad"):               score += 8
    if not q.get("planAlimentacion"):   score += 5
    if q.get("frecuenciaEjercicio") == "Nunca": score += 8

    score = min(score, 100.0)

    if score < 25:    riesgo = "BAJO"
    elif score < 50:  riesgo = "MEDIO"
    elif score < 75:  riesgo = "ALTO"
    else:             riesgo = "CRITICO"

    recs = ["Inspección diaria de los pies en busca de lesiones, ampollas o cambios de color"]
    if riesgo in ("ALTO", "CRITICO"):
        recs.append("Consulta urgente con endocrinología y podología especializada")
        recs.append("Control glucémico estricto con monitoreo frecuente")
    if q.get("perdidaSensibilidad"):
        recs.append("Evaluación neurológica de sensibilidad periférica")
    if not q.get("planAlimentacion"):
        recs.append("Iniciar plan de alimentación supervisado por nutriólogo")
    if q.get("hipertension"):
        recs.append("Control regular de presión arterial")
    if q.get("obesidad"):
        recs.append("Plan de reducción de peso supervisado")
    recs += [
        "Usar calzado cómodo, transpirable y sin costuras interiores",
        "No caminar descalzo en ningún momento",
        "Mantener los pies limpios y bien hidratados",
    ]

    return {
        "riesgo":          riesgo,
        "probabilidad":    round(score, 1),
        "hallazgos":       findings,
        "recomendaciones": recs,
        "fuente":          fuente,
    }
