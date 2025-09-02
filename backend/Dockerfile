# Production Dockerfile for Cloud Run deployment
FROM python:3.10-slim

WORKDIR /app

ENV PYTHONPATH=/app
ENV PORT=8080

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
COPY start.sh ./start.sh
COPY start_production.sh ./start_production.sh
COPY start_fast_production.sh ./start_fast_production.sh

# Make start scripts executable
RUN chmod +x ./start.sh ./start_production.sh ./start_fast_production.sh

# Use fast production startup for quick deployments
CMD ["./start_production.sh"]
