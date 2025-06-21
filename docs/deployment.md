# GreenSentinel Deployment Guide

This guide explains how to deploy the GreenSentinel application stack using Docker Compose in both development and production environments.

## Prerequisites

- Docker Engine ≥ 24.0
- Docker Compose ≥ 2.0
- Make utility
- For local HTTPS in development: `mkcert` tool

## Quick Start

### Development Environment

1. **Prepare environment files**:
   ```bash
   cp .env.dev.example .env.dev
   # Edit .env.dev to set appropriate values
   ```

2. **Start the development stack**:
   ```bash
   make dev
   ```
   This will start all services with hot-reload enabled and expose their ports to localhost.

### Production Environment

1. **Prepare environment files**:
   ```bash
   cp .env.prod.example .env.prod
   # Edit .env.prod and set secure passwords and domain information
   ```

2. **Start the production stack**:
   ```bash
   make prod
   ```
   This will start all services in detached mode with Traefik handling HTTPS.

## Environment Configuration

### Development (.env.dev)

Development mode provides:
- Direct port exposure for all services
- Volume mounts for hot-reloading code changes
- Non-production credentials (change for security)

### Production (.env.prod)

Production mode provides:
- HTTPS with automatic Let's Encrypt certificates
- Traefik reverse proxy for all services
- Subdomain routing (`api.`, `dashboard.`, `pro.`, etc.)
- Secured credentials (must be changed from examples)

## Host Configuration

## Monitoring & Observability

The GreenSentinel stack includes a full monitoring solution:

- **Grafana**: Access at http://localhost:3001 in development or https://grafana.greensentinel.local in production
  - Default credentials: admin/admin (dev) or admin/[custom password] (prod)
  - Pre-configured dashboards for infrastructure and incidents pipeline

- **Prometheus**: Metrics storage for system and business metrics
  - Available at http://localhost:9090 in dev mode for direct queries

- **Loki**: Log aggregation from all containers
  - Accessed through Grafana's Explore section

See [monitoring.md](monitoring.md) for detailed information on available metrics, dashboards, and how to add custom metrics.


## Lancer la démo

Le script `demo.sh` permet de démarrer rapidement l'environnement avec des données de démonstration :

```bash
# Lancer en mode développement avec hot-reload
./demo.sh dev

# Lancer en mode production avec Traefik
./demo.sh prod

# Purger les volumes Docker avant de lancer
./demo.sh dev --reset
```

Ce script :

1. Arrête et purge la pile précédente (avec `--reset`)  
2. Recrée les volumes propres  
3. Applique les migrations et charge un jeu de données démo (3 utilisateurs + 8 incidents)  
4. Démarre l'ensemble en mode développement ou production  
5. Affiche les URLs d'accès aux différentes interfaces

### Identifiants de démo

Le script crée les utilisateurs suivants :

| Email | Mot de passe | Rôle |
|-------|-------------|------|
| citizen@greensentinel.org | citizen123 | Citoyen |
| firefighter@greensentinel.org | firefighter123 | Pompier |
| admin@greensentinel.org | admin123 | Administrateur |

Pour local development with subdomains, add these entries to your hosts file:
```
127.0.0.1 api.greensentinel.local
127.0.0.1 dashboard.greensentinel.local
127.0.0.1 pro.greensentinel.local
127.0.0.1 s3.greensentinel.local
127.0.0.1 s3-console.greensentinel.local
127.0.0.1 queue.greensentinel.local
127.0.0.1 traefik.greensentinel.local
127.0.0.1 grafana.greensentinel.local
```

## HTTPS in Development (Optional)

For local HTTPS:

1. **Install mkcert**:
   ```bash
   # On Ubuntu/Debian
   apt install mkcert libnss3-tools
   # On macOS
   brew install mkcert nss
   # On Windows
   choco install mkcert
   ```

2. **Generate certificates**:
   ```bash
   mkcert -install
   mkcert "*.greensentinel.local"
   ```

3. **Configure Traefik** (if needed in dev mode):
   Modify docker-compose.dev.yml to add a Traefik service with local certificate paths.

## Common Operations

- **Stop all services**: `make down`
- **Clean Docker images**: `make clean`
- **View logs**: `docker compose logs -f [service]`
- **Restart a service**: `docker compose restart [service]`
- **Access services**:
  - API: http://localhost:8000 (dev) or https://api.greensentinel.local (prod)
  - Admin Dashboard: http://localhost:3000 (dev) or https://dashboard.greensentinel.local (prod)
  - Pro App: http://localhost:5173 (dev) or https://pro.greensentinel.local (prod)
  - MinIO Console: http://localhost:9001 (dev) or https://s3-console.greensentinel.local (prod)
  - RabbitMQ: http://localhost:15672 (dev) or https://queue.greensentinel.local (prod)

## Troubleshooting

- **Network issues**: Ensure no port conflicts with other applications
- **Database errors**: Check connection strings and credentials
- **Container failures**: Check logs with `docker compose logs [service]`
