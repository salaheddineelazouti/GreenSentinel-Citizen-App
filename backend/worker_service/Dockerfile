FROM python:3.12-slim

WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY ./app /app/app

# Create a non-root user and switch to it
RUN adduser --disabled-password --gecos "" worker
USER worker

# Run the worker service
CMD ["python", "-m", "app.main"]
