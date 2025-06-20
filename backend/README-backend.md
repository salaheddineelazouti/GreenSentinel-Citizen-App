# GreenSentinel Backend

FastAPI-based backend for the GreenSentinel environmental reporting platform.

## Features

- Health check endpoint
- Mock authentication
- FastAPI with OpenAPI documentation
- Modern Python 3.12 with type hints
- Poetry for dependency management
- PostgreSQL with PostGIS for spatial data
- SQLAlchemy 2.0 ORM with async support
- Alembic for database migrations
- Incident reporting with geospatial coordinates
- MinIO S3-compatible storage for citizen-submitted images
- Multipart form upload for image reports
- YOLOv8 vision integration for fire detection
- OpenAI GPT-4o integration for description validation
- Event-driven architecture with RabbitMQ message broker
- Asynchronous worker service for notifications and analytics

## Getting Started

### Installation

1. **Installer les dépendances**
```bash
# Avec Poetry (recommandé)
poetry install

# Alternative avec pip
pip install -r requirements.txt
```

2. **Configurer l'environnement**
Copier le fichier .env.example vers .env et ajuster les valeurs selon votre environnement local.
```bash
cp .env.example .env
```

**Important:** Pour utiliser la modération LLM, vous devez configurer les variables OpenAI suivantes dans votre fichier .env:

```
OPENAI_API_KEY=votre_clé_api
OPENAI_API_BASE=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
```

Obtenir une clé API sur [OpenAI Platform](https://platform.openai.com/account/api-keys)

### RabbitMQ & Worker Service

1. **Lancer RabbitMQ avec Docker**
```bash
docker-compose up -d rabbitmq
```

2. **Accéder à la console d'administration RabbitMQ**
Ouvrir http://localhost:15672 dans votre navigateur
Identifiants par défaut: `rabbit` / `rabbit`

3. **Lancer le worker service**
```bash
docker-compose up -d worker
```

4. **Configurer l'URL RabbitMQ**
Assurez-vous que la variable `RABBITMQ_URL` est correctement configurée dans votre fichier `.env`:
```
RABBITMQ_URL=amqp://rabbit:rabbit@rabbitmq:5672/
```

### Base de données PostgreSQL + PostGIS

1. **Lancer PostgreSQL avec Docker**
```bash
docker-compose up -d db
```

2. **Appliquer les migrations avec Alembic**
```bash
# Avec Poetry
poetry run alembic upgrade head

# Alternative avec pip
alembic upgrade head
```

### MinIO (stockage d'images)

1. **Lancer MinIO avec Docker**
```bash
docker-compose up -d minio
```

2. **Accéder à la console MinIO**
Ouvrir http://localhost:9090 dans votre navigateur
Identifiants par défaut: `minio` / `minio123`

3. **Créer le bucket**
Le bucket `citizen-reports` sera automatiquement créé par l'application, mais vous pouvez aussi le créer manuellement via la console MinIO.

### Prerequisites

- Python 3.12+
- Poetry (dependency management)

### Installation

1. Install dependencies with Poetry:

```bash
poetry install
```

2. Set up environment variables:

```bash
cp .env.example .env
```

3. Edit `.env` file with your configuration values.

### Development Server

Run the development server with auto-reload:

```bash
poetry run uvicorn app.main:app --reload
```

Visit OpenAPI documentation at http://localhost:8000/docs

### Testing

Run the test suite:

```bash
poetry run pytest
```

## Project Structure

- `app/` - Main application code
  - `main.py` - FastAPI application instance
  - `config.py` - Configuration settings
  - `api/` - API routes organized by version
  - `core/` - Core utilities (security, models)
- `tests/` - Test suite

## Architecture événementielle

Le backend GreenSentinel utilise une architecture événementielle pour les opérations asynchrones :

1. **Publication d'événements** : Lorsqu'un incident est validé comme étant un incendie, un événement `IncidentValidated` est publié sur RabbitMQ.

2. **Worker asynchrone** : Un service worker consomme ces événements et exécute des actions comme l'envoi de notifications et la mise à jour des métriques.

3. **Tolérance aux pannes** : Le système utilise des acquittements (ACK), des mécanismes de retry et une queue de lettres mortes (DLQ) pour assurer la fiabilité des messages.

**Structure des événements** :
```json
{
  "id": 123,
  "lat": 48.8566, 
  "lon": 2.3522,
  "created_at": "2025-06-19T01:23:45Z",
  "severity": 3
}
```

**Flux de traitement** :
```
Validation d'incident → Publication événement → RabbitMQ → Worker → Notifications/Analytics/WebSocket
```

### WebSocket incidents

Les clients (dashboard admin, application pompiers, etc.) peuvent recevoir des mises à jour en temps réel des incidents validés via WebSocket :

- **URL** : `ws://<host>:8000/ws/incidents`
- **Protocol** : WebSocket via `fastapi-websocket-pubsub`
- **Connexion** : 
  1. Établir une connexion WebSocket à l'URL
  2. Envoyer un message de souscription au format JSON :
    ```json
    {
      "id": "client-unique-id",
      "type": "subscribe",
      "topics": ["INCIDENT_VALIDATED"]
    }
    ```
  3. Recevoir les messages au format :
    ```json
    {
      "type": "message",
      "data": {
        "payload": "{ ... incident data ... }"
      },
      "topic": "INCIDENT_VALIDATED"
    }
    ```

Le service maintient automatiquement les connexions avec ping/pong, gère les reconnexions et distribue les messages à tous les clients abonnés.

## Future Implementations

- JWT authentication with proper token handling
- Role-based access control
- Machine learning pour l'analyse des tendances d'incidents

### Notifications Push FCM

Le worker service peut envoyer des notifications push aux équipes d'intervention via Firebase Cloud Messaging (FCM) :

1. **Configurer le compte de service Firebase**
   - Créez un compte de service dans la console Firebase
   - Téléchargez le fichier JSON de clé du compte de service

2. **Monter le fichier de clés dans Docker**
   ```bash
   docker compose up -d \
     -e FCM_CREDENTIALS_JSON=/run/secrets/fcm.json \
     --secret source=fcm.json,target=/run/secrets/fcm.json
   ```

3. **Configuration**
   - Les messages sont envoyés sur le topic défini par `FCM_TOPIC` (par défaut : `firefighters`)
   - Les clients mobiles doivent s'abonner à ce topic pour recevoir les notifications
   - Si le fichier de clés est absent, le service continue à fonctionner mais se limite à journaliser un avertissement

## Docker Deployment

Build and run with Docker:

```bash
docker build -t greensentinel-api .
docker run -p 8000:8000 greensentinel-api
```
