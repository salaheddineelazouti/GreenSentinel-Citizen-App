# GreenSentinel Vision Service

Service de détection d'incendies par vision par ordinateur pour GreenSentinel.

## Fonctionnalités

- Détection d'incendies avec YOLOv8
- API REST pour l'analyse d'images via URLs
- Compatible avec MinIO et stockage S3
- Utilisation de CUDA pour accélération GPU

## Prérequis

- Docker
- NVIDIA GPU avec pilotes CUDA (optionnel, pour accélération GPU)

## Démarrage rapide

### Construction de l'image Docker

```bash
docker compose build vision
```

### Lancement du service

```bash
docker compose up -d vision
```

Le service sera disponible sur http://localhost:9001

## Utilisation de l'API

### Détection d'incendie

**Endpoint:** `POST /predict`

**Entrée:**
```json
{
  "image_url": "http://minio:9000/citizen-reports/image.jpg"
}
```

**Sortie:**
```json
{
  "is_fire": true,
  "confidence": 0.87,
  "boxes": [
    {
      "class": 0,
      "confidence": 0.87,
      "x1": 100,
      "y1": 200,
      "x2": 300,
      "y2": 400
    }
  ]
}
```

### Vérification de l'état

**Endpoint:** `GET /health`

## Variables d'environnement

- `MODEL_VARIANT`: Variante du modèle (par défaut: "fire")
- `DETECTION_THRESHOLD`: Seuil de confiance (par défaut: 0.4)
