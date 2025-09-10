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

# Install psycopg2-binary FIRST to prevent conflicts
RUN pip install --no-cache-dir psycopg2-binary==2.9.7

# Install remaining dependencies while forcing psycopg2 usage
ENV PIP_NO_BUILD_ISOLATION=1
RUN pip install --no-cache-dir -r requirements.txt && \
    pip uninstall -y psycopg psycopg[binary] psycopg3 || true && \
    pip list | grep psycopg

# Copy application code
COPY app/ ./
COPY alembic.ini ./
COPY alembic/ ./alembic/
COPY start_production.sh ./start_production.sh

# Make start script executable
RUN chmod +x ./start_production.sh

# Use fast production startup for quick deployments
CMD ["./start_production.sh"]
