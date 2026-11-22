import json
import os
from io import BytesIO
from pathlib import Path
from wsgiref.simple_server import make_server

import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError

ROOT = Path(__file__).resolve().parent
PUBLIC = ROOT / "public"
MAX_BYTES = 8 * 1024 * 1024
MAX_PIXELS = 20_000_000
with np.load(ROOT / "model.npz", allow_pickle=False) as weights:
    W0, W1, B0, B1, CLASSES = (weights[key] for key in ("w0", "w1", "b0", "b1", "clases"))

ASSETS = {
    "/": ("index.html", "text/html; charset=utf-8"),
    "/style.css": ("style.css", "text/css; charset=utf-8"),
    "/app.js": ("app.js", "text/javascript; charset=utf-8"),
    "/assets/ejemplo.png": ("assets/ejemplo.png", "image/png"),
    **{f"/assets/ejemplo-{code}.png": (f"assets/ejemplo-{code}.png", "image/png")
       for code in ("d10", "d20", "d40")},
    "/assets/model-info.json": ("assets/model-info.json", "application/json"),
}


def predict(data, box):
    with Image.open(BytesIO(data), formats=("JPEG", "PNG", "WEBP")) as original:
        if original.width * original.height > MAX_PIXELS:
            raise ValueError("La fotografía supera los 20 megapíxeles.")
        photo = ImageOps.exif_transpose(original)
        left, top, right, bottom = box
        if not (0 <= left < right <= photo.width and 0 <= top < bottom <= photo.height):
            raise ValueError("El rectángulo debe estar dentro de la fotografía.")
        region = photo.crop(box).convert("RGB").convert("L")
        pixels = np.asarray(region.resize((32, 32), Image.Resampling.BILINEAR),
                            dtype=np.float32).reshape(-1) / 255.0

    hidden = np.maximum(pixels @ W0 + B0, 0)
    scores = hidden @ W1 + B1
    exponentials = np.exp(scores - scores.max())
    probabilities = exponentials / exponentials.sum()
    return {"code": str(CLASSES[probabilities.argmax()]),
            "probabilities": dict(zip(CLASSES.tolist(), probabilities.tolist()))}


def respond(start, status, body, content_type):
    start(status, [("Content-Type", content_type), ("Content-Length", str(len(body))),
                   ("X-Content-Type-Options", "nosniff"), ("Cache-Control", "no-store"),
                   ("Content-Security-Policy", "default-src 'self'; img-src 'self' blob:; style-src 'self'; object-src 'none'; frame-ancestors 'none'")])
    return [body]


def json_response(start, status, payload):
    return respond(start, status, json.dumps(payload, ensure_ascii=False).encode(),
                   "application/json; charset=utf-8")


def app(environ, start):
    path, method = environ["PATH_INFO"], environ["REQUEST_METHOD"]
    if method == "GET" and path in ASSETS:
        filename, content_type = ASSETS[path]
        return respond(start, "200 OK", (PUBLIC / filename).read_bytes(), content_type)
    if method == "GET" and path == "/health":
        return json_response(start, "200 OK", {"status": "ok"})
    if method != "POST" or path != "/api/classify":
        return json_response(start, "404 Not Found", {"error": "Ruta no encontrada."})

    try:
        size = int(environ.get("CONTENT_LENGTH") or 0)
        box = tuple(map(int, environ.get("HTTP_X_REGION", "").split(",")))
        if len(box) != 4 or size <= 0:
            raise ValueError("Selecciona una región y una fotografía.")
        if size > MAX_BYTES:
            return json_response(start, "413 Payload Too Large", {"error": "El archivo supera los 8 MB."})
        data = environ["wsgi.input"].read(size)
        if len(data) != size:
            raise ValueError("No se recibió la fotografía completa.")
        result = predict(data, box)
    except (UnidentifiedImageError, OSError, Image.DecompressionBombError):
        return json_response(start, "400 Bad Request", {"error": "Usa una imagen JPG, PNG o WebP válida."})
    except ValueError as error:
        return json_response(start, "400 Bad Request", {"error": str(error)})
    return json_response(start, "200 OK", result)


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    print(f"PreventIA disponible en http://127.0.0.1:{port}", flush=True)
    with make_server("127.0.0.1", port, app) as server:
        server.serve_forever()
