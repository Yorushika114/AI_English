from fastapi import FastAPI
from pydantic import BaseModel
import base64
import numpy as np

try:
    import pyworld
    PYWORLD_AVAILABLE = True
except ImportError:
    PYWORLD_AVAILABLE = False

try:
    import cmudict as _cmudict
    _CMU_DICT = _cmudict.dict()
except Exception:
    _CMU_DICT = {}

app = FastAPI()


class AnalyzeRequest(BaseModel):
    audio_base64: str
    text: str
    sample_rate: int = 16000


@app.get("/health")
def health():
    return {"status": "ok", "pyworld": PYWORLD_AVAILABLE, "cmudict_words": len(_CMU_DICT)}


@app.post("/analyze")
def analyze(req: AnalyzeRequest):
    pcm_bytes = base64.b64decode(req.audio_base64)
    samples = np.frombuffer(pcm_bytes, dtype=np.int16).astype(np.float64) / 32768.0

    intonation = {"pattern": "level", "f0Mean": 0.0, "f0Trend": 0.0}

    if PYWORLD_AVAILABLE and len(samples) > req.sample_rate * 0.3:
        try:
            f0, _, _ = pyworld.wav2world(samples, float(req.sample_rate))
            voiced = f0[f0 > 0]
            if len(voiced) > 10:
                xs = np.arange(len(voiced), dtype=np.float64)
                trend = float(np.polyfit(xs, voiced, 1)[0])
                pattern = "rising" if trend > 3.0 else "falling" if trend < -3.0 else "level"
                intonation = {
                    "pattern": pattern,
                    "f0Mean": float(np.mean(voiced)),
                    "f0Trend": trend,
                }
        except Exception:
            pass

    # CMU Dict: expected stress and phones for each word
    words = req.text.lower().split()
    stress_results = []
    for w in words:
        clean = "".join(c for c in w if c.isalpha())
        if clean and clean in _CMU_DICT:
            phones = _CMU_DICT[clean][0]
            expected_stress = [i for i, p in enumerate(phones) if p[-1] in "12"]
            stress_results.append({
                "word": w,
                "expectedStress": expected_stress,
                "phones": [p.lower() for p in phones],
            })

    return {"intonation": intonation, "wordStress": stress_results}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001)
