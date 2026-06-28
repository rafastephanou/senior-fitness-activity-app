# Single-image build for the public demo: build the React app, then serve it
# (and the API) from one FastAPI process. Used by Render (see render.yaml).
# Local development still uses docker-compose.yml with separate services.

# ---- Stage 1: build the frontend ----
FROM node:20-slim AS frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# ---- Stage 2: backend runtime that also serves the built frontend ----
FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /code

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .
# Built SPA goes where app/main.py looks for it (../static relative to app/).
COPY --from=frontend /app/dist ./static

# Render provides $PORT; default to 8000 for local `docker build` runs.
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
