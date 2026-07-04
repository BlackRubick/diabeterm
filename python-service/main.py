from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import uvicorn

from thermal_analyzer import full_pipeline, compute_risk

app = FastAPI(title="Diabeterm Thermal Analysis Service", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)


class AnalysisRequest(BaseModel):
    pieIzquierdo: Optional[str] = None  # ruta absoluta al archivo
    pieDerecho: Optional[str] = None    # ruta absoluta al archivo
    respuestas: dict = {}


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/analyze")
def analyze(req: AnalysisRequest):
    if not req.pieIzquierdo and not req.pieDerecho:
        raise HTTPException(status_code=400, detail="Se requiere al menos una imagen")

    left = full_pipeline(req.pieIzquierdo, "Pie izquierdo") if req.pieIzquierdo else None
    right = full_pipeline(req.pieDerecho, "Pie derecho") if req.pieDerecho else None

    result = compute_risk(left, right, req.respuestas)

    return {
        "success": True,
        "data": {
            **result,
            "thermalData": {
                "pieIzquierdo": left,
                "pieDerecho": right,
            },
        },
    }


if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
