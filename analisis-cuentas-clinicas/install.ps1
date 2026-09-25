Write-Host "== Instalación de analisis-cuentas-clinicas =="

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "Error: no se encontró Python. Instale Python 3.12 antes de continuar." -ForegroundColor Red
    exit 1
}

python -m venv .venv
.\.venv\Scripts\Activate.ps1

pip install --upgrade pip
pip install -r requirements.txt

New-Item -ItemType Directory -Force -Path "data\casos" | Out-Null

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Se creó el archivo .env a partir de .env.example. Revise su configuración antes de continuar."
}

Write-Host ""
Write-Host "Instalación completada."
Write-Host "Instale Tesseract OCR y Poppler para Windows y configure TESSERACT_CMD y POPPLER_PATH en el archivo .env."
Write-Host ""
Write-Host "Para iniciar la aplicación ejecute:"
Write-Host "  .\.venv\Scripts\Activate.ps1"
Write-Host "  streamlit run app/ui/Inicio.py"
