FROM pytorch/pytorch:2.3.0-cuda12.1-cudnn8-runtime

WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables
ENV MODEL_VARIANT=fire
ENV DETECTION_THRESHOLD=0.4

# Expose port
EXPOSE 9001

# Run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "9001"]
