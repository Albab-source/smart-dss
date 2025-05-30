from fastapi import FastAPI, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse
import os

app = FastAPI()

# Tentukan path absolut ke direktori templates dan static
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TEMPLATES_DIR = os.path.join(BASE_DIR, "templates")
STATIC_DIR = os.path.join(BASE_DIR, "static")

# Mount static files
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Setup Jinja2 templates
templates = Jinja2Templates(directory=TEMPLATES_DIR)

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    """
    Menyajikan halaman utama aplikasi DSS.
    """
    return templates.TemplateResponse("index.html", {"request": request})

if __name__ == "__main__":
    import uvicorn
    # Jalankan aplikasi dengan Uvicorn. Port bisa disesuaikan.
    # Perintah untuk menjalankan dari terminal: uvicorn main:app --reload
    uvicorn.run(app, host="0.0.0.0", port=8000)
