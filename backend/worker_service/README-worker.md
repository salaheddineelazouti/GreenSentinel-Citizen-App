# GreenSentinel Worker Service

The GreenSentinel Worker Service is an asynchronous microservice that processes events published by the main FastAPI backend via RabbitMQ. It handles tasks such as notification dispatch, analytics tracking, and administrative alerts when fire incidents are validated.

## Features

- Asynchronous consumption of RabbitMQ messages
- Message resilience with acknowledgments and delivery guarantees
- Automatic retry mechanism for failed processing
- Dead letter queue (DLQ) for messages that failed after maximum retries
- Structured JSON logging
- Simulated push notifications (would integrate with FCM in production)
- Analytics and metrics tracking

## Architecture

The worker service follows a microservice architecture pattern and communicates with the main backend through RabbitMQ message queues:

```
FastAPI Backend → RabbitMQ → Worker Service → Notifications/Analytics
```

Events flow:
1. Backend validates an incident as fire
2. Backend publishes an `IncidentValidated` event to RabbitMQ
3. Worker consumes the event and performs:
   - Push notification dispatch (simulated)
   - Analytics tracking
   - Logging for administrative purposes

## Configuration

The worker service can be configured through environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `RABBITMQ_URL` | `amqp://rabbit:rabbit@rabbitmq:5672/` | RabbitMQ connection URL |
| `DATABASE_URL` | `postgresql+asyncpg://gs_user:gs_pass@db:5432/greensentinel` | Database connection URL |
| `WORKER_NAME` | `greensentinel-worker` | Worker name for identification in logs |
| `MAX_RETRIES` | `3` | Maximum number of retry attempts |
| `RETRY_DELAY_MS` | `5000` | Delay between retry attempts (milliseconds) |

## Running Locally

### With Docker Compose

The worker service is included in the main docker-compose.yml file and will start automatically:

```bash
cd backend
docker compose up -d
```

### Standalone Mode

```bash
cd backend/worker_service
pip install -r requirements.txt
python -m app.main
```

## Message Format

The worker consumes `IncidentValidated` events with the following format:

```json
{
  "id": 123,
  "lat": 48.8566,
  "lon": 2.3522,
  "created_at": "2025-06-19T01:23:45Z",
  "severity": 3
}
```

## Error Handling

- Failed messages are automatically retried with increasing back-off
- After maximum retries, messages are moved to a dead-letter queue
- All errors are logged with structured data for easier debugging
- The worker can handle RabbitMQ connection disruptions and will automatically reconnect

## Development

### Adding New Consumers

1. Create a new consumer class in `app/consumers.py`
2. Register it in the `WorkerService` class in `app/main.py`

### Running Tests

```bash
cd backend/worker_service
pip install -r requirements.txt
python -m unittest discover tests
```
