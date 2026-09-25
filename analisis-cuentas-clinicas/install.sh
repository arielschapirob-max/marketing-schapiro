#!/usr/bin/env bash
set -e

echo "== Instalación de analisis-cuentas-clinicas =="

if ! command -v python3 &> /dev/null; then
    echo "Error: no se encontró python3. Instale Python 3.12 antes de continuar."
    exit 1
fi

python3 -m venv .venv
# shellcheck disable=SC1091
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

mkdir -p data/casos

if [ ! -f .env ]; then
    cp .env.example .env
    echo "Se creó el archivo .env a partir de .env.example. Revise su configuración antes de continuar."
fi

echo ""
echo "Instalación completada."
echo "Recuerde instalar Tesseract OCR y Poppler para el reconocimiento de documentos escaneados:"
echo "  macOS:  brew install tesseract tesseract-lang poppler"
echo "  Linux:  sudo apt-get install tesseract-ocr tesseract-ocr-spa poppler-utils"
echo ""
echo "Para iniciar la aplicación ejecute:"
echo "  source .venv/bin/activate"
echo "  streamlit run app.py"
