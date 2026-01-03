import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.schemas import RoadmapCreate

client = TestClient(app)

def test_generate_roadmap():
    request_data = {
        "subject": "Quantum Computing",
        "goal": "Understand the basics of quantum computing",
        "time_value": 2,
        "time_unit": "weeks",
    }
    response = client.post("/roadmaps/generate", json=request_data)
    assert response.status_code == 200
    roadmap = response.json()
    assert roadmap["title"] is not None
    assert roadmap["description"] is not None
    assert roadmap["roadmap_plan"] is not None
    assert len(roadmap["roadmap_plan"]["modules"]) > 0
