FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["bash", "-c", "python -c 'from app.main import app; print(\"Import OK\")' && exec uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
