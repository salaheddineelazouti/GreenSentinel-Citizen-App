"""
Tests for Firebase Cloud Messaging (FCM) push notifications.
"""
import asyncio
import json
import os
import sys
from pathlib import Path
from typing import Dict, Any
from unittest.mock import patch, MagicMock, Mock

import pytest
from structlog import get_logger

# Ajout du chemin du worker_service au PYTHONPATH pour permettre les imports corrects
root_dir = str(Path(__file__).parent.parent)
if root_dir not in sys.path:
    sys.path.insert(0, root_dir)

logger = get_logger("test_push")


# Mock les modules firebase_admin avec une approche qui permet l'import imbriqué
class MockMessaging:
    def __init__(self):
        self.send = MagicMock(return_value="test-message-id-123")
        self.Message = MagicMock()
        self.Notification = MagicMock()

class MockCredentials:
    @staticmethod
    def Certificate(path):
        return MagicMock()

# Créer un module mock complet avec sous-modules accessibles
mock_firebase_admin = type('MockFirebaseAdmin', (), {
    '_apps': {'[DEFAULT]': MagicMock()},
    'messaging': MockMessaging(),
    'credentials': MockCredentials(),
    '__name__': 'firebase_admin'
})

# Mettre en place les mocks dans sys.modules
sys.modules['firebase_admin'] = mock_firebase_admin

# Définir les attributs messaging et credentials comme des modules pour permettre
# l'import direct "from firebase_admin import messaging, credentials"
mock_firebase_admin.messaging.__name__ = 'firebase_admin.messaging'
mock_firebase_admin.credentials.__name__ = 'firebase_admin.credentials'
sys.modules['firebase_admin.messaging'] = mock_firebase_admin.messaging
sys.modules['firebase_admin.credentials'] = mock_firebase_admin.credentials


@pytest.fixture
def reset_mocks():
    """Réinitialiser les mocks avant chaque test"""
    mock_firebase_admin._apps = {'[DEFAULT]': MagicMock()}
    mock_firebase_admin.messaging.send.reset_mock()
    mock_firebase_admin.messaging.Message.reset_mock()
    mock_firebase_admin.messaging.Notification.reset_mock()
    yield


@pytest.mark.asyncio
async def test_send_push(reset_mocks):
    """Test send_push function sends FCM notification correctly."""
    # Import push module après avoir configuré les mocks globaux
    from app import push
    
    # Test data
    title = "Test Title"
    body = "Test Body"
    data = {"incident_id": "123", "severity": 3}
    
    # Call send_push function
    message_id = await push.send_push(title, body, data)
    
    # Verify message was sent
    assert message_id == "test-message-id-123"
    assert mock_firebase_admin.messaging.send.called
    
    # Verify message was created correctly
    assert mock_firebase_admin.messaging.Message.called
    
    # Verify notification was created with correct arguments
    mock_firebase_admin.messaging.Notification.assert_called_once_with(title=title, body=body)


@pytest.mark.asyncio
async def test_send_push_with_no_firebase():
    """Test send_push gracefully handles missing Firebase initialization."""
    # Sauvegarder la valeur originale
    original_apps = mock_firebase_admin._apps
    
    # Bien réinitialiser le compteur d'appels
    mock_firebase_admin.messaging.send.reset_mock()
    
    # Simuler Firebase non initialisé
    mock_firebase_admin._apps = {}
    
    try:
        # Import push avec Firebase non initialisé
        from app import push
        
        # Test data
        title = "Test Title"
        body = "Test Body"
        data = {"incident_id": "123"}
        
        # Appeler send_push
        with patch.object(mock_firebase_admin.messaging, 'send') as mock_send:
            # La fonction ne devrait jamais appeler messaging.send 
            message_id = await push.send_push(title, body, data)
            
            # Vérifier que la fonction retourne None
            assert message_id is None
            # Vérifier que send n'est pas appelé
            assert not mock_send.called
    finally:
        # Restaurer la valeur originale
        mock_firebase_admin._apps = original_apps


@pytest.mark.asyncio
async def test_consumer_send_push(reset_mocks):
    """Test that IncidentConsumer calls send_push for validated incidents."""
    # Import push et mock sa fonction send_push
    from app import push
    
    # Garder une référence à la fonction originale
    original_send_push = push.send_push
    
    # Créer un mock asynchrone pour send_push
    async def mock_async_send_push(title, body, data):
        return "mock-message-id"
    
    send_push_mock = MagicMock(side_effect=mock_async_send_push)
    push.send_push = send_push_mock
    
    # Patcher module 'app.services.ws_manager' pour éviter l'import error
    sys.modules['app.services.ws_manager'] = MagicMock()
    sys.modules['app.services.ws_manager'].broadcast_incident = MagicMock()
    
    try:
        # Forcer la variable 'websocket_available' à False pour contourner le broadcast
        import app.consumers
        app.consumers.websocket_available = False
        
        # Importer le consumer après avoir patché les modules requis
        from app.consumers import IncidentConsumer
        
        # Créer un consumer de test
        test_consumer = IncidentConsumer("amqp://localhost/")
        
        # Données d'incident de test
        incident_data = {
            "id": 123,
            "lat": 48.8566,
            "lon": 2.3522,
            "created_at": "2025-06-19T03:00:00Z",
            "severity": 3
        }
        
        # Appeler la méthode de traitement
        await test_consumer._handle_incident_validated(incident_data)
        
        # Vérifier que send_push a été appelé
        send_push_mock.assert_called_once()
        
        # Vérifier l'appel de la fonction en inspectant call_args_list
        call_args = send_push_mock.call_args_list[0]
        
        # Vérifier que les arguments sont bien passés
        # Essayer d'abord comme arguments positionnels
        if len(call_args[0]) >= 1:
            # Arguments positionnels
            assert "Incendie détecté" in call_args[0][0]
            assert isinstance(call_args[0][2], dict)  # data est un dictionnaire
            assert call_args[0][2].get("incident_id") == "123"
        else:
            # Arguments nommés (kwargs)
            kwargs = call_args[1]
            assert "Incendie détecté" in kwargs.get("title", "")
            assert isinstance(kwargs.get("data"), dict)
            assert kwargs.get("data", {}).get("incident_id") == "123"
    finally:
        # Restaurer la fonction originale
        push.send_push = original_send_push
        
        # Nettoyer le mock de ws_manager
        if 'app.services.ws_manager' in sys.modules:
            del sys.modules['app.services.ws_manager']
