# Production Dockerfile for Render deployment
FROM python:3.10-slim

WORKDIR /app

ENV PYTHONPATH=/app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    libpq-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.prod.txt ./requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY app/ ./
COPY alembic.ini ./
COPY alembic/ ./alembic/

# Use PORT environment variable (required by Render)
CMD python -m uvicorn main:app --host 0.0.0.0 --port $PORT
