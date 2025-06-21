# GreenSentinel Monitoring & Observability

## Overview

GreenSentinel includes a comprehensive monitoring stack consisting of:

- **Prometheus** - Metrics collection and storage
- **Grafana** - Visualization and dashboards
- **Loki** - Log aggregation and querying
- **Promtail** - Log forwarding to Loki
- **cAdvisor** - Container metrics collection

## Access Points

| Service | Development URL | Production URL | Default Credentials |
|---------|----------------|---------------|-----------------|
| Grafana | http://localhost:3001 | https://grafana.greensentinel.local | admin / admin (dev)<br>admin / [from env] (prod) |
| Prometheus | http://localhost:9090 | Internal only | None |
| Loki | http://localhost:3100 | Internal only | None |

## Available Dashboards

### Infrastructure Overview
- Container CPU usage
- Container memory usage
- RabbitMQ queue metrics
- Running container count

### Incidents Pipeline
- Incident creation time (95th and 50th percentiles)
- Total processing time from alert to validation
- Hourly validation/rejection count
- Validation rate

## Backend Metrics

The backend exposes metrics at `/metrics` endpoint via prometheus-fastapi-instrumentator, including:

- HTTP request count
- HTTP request duration
- HTTP request size
- Response status codes
- Custom business metrics

## Adding Custom Metrics

To add custom metrics to the FastAPI backend:

```python
from prometheus_client import Counter

# Create metric
INCIDENTS_VALIDATED = Counter('incidents_validated', 'Number of validated incidents', ['region'])

# Use in code
INCIDENTS_VALIDATED.labels(region="north").inc()
```

## Log Querying

From Grafana, select the Loki data source and use LogQL to query container logs:

```
{container="greensentinel-backend"} |= "ERROR"
```