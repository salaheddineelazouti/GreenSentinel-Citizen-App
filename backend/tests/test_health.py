from fastapi.testclient import TestClient


def test_health_endpoint(client: TestClient) -> None:
    """Test health endpoint returns correct response."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}
