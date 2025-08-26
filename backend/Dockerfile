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
COPY start.sh ./start.sh

# Make start script executable
RUN chmod +x ./start.sh

# Use our custom start script
CMD ["./start.sh"]
