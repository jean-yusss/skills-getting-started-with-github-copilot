import pytest
from httpx import AsyncClient
from src.app import app

import asyncio

@pytest.mark.asyncio
async def test_list_activities():
    # Arrange
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Act
        response = await ac.get("/activities")
    # Assert
    assert response.status_code == 200
    assert isinstance(response.json(), dict)
    assert "Chess Club" in response.json()

@pytest.mark.asyncio
async def test_signup_and_prevent_duplicate():
    # Arrange
    activity = "Chess Club"
    email = "student1@example.com"
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Act
        signup_resp = await ac.post(f"/activities/{activity}/signup", params={"email": email})
        # Assert
        assert signup_resp.status_code == 200
        # Act (try duplicate signup)
        dup_resp = await ac.post(f"/activities/{activity}/signup", params={"email": email})
        # Assert
        assert dup_resp.status_code == 400
        assert "Already signed up" in dup_resp.json()["detail"]

@pytest.mark.asyncio
async def test_unregister_participant():
    # Arrange
    activity = "Chess Club"
    email = "student2@example.com"
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Act (sign up)
        await ac.post(f"/activities/{activity}/signup", params={"email": email})
        # Act (unregister)
        unregister_resp = await ac.post(f"/activities/{activity}/unregister", params={"email": email})
        # Assert
        assert unregister_resp.status_code == 200
        # Act (unregister again)
        unregister_again = await ac.post(f"/activities/{activity}/unregister", params={"email": email})
        # Assert
        assert unregister_again.status_code == 400
        assert "not registered" in unregister_again.json()["detail"]

@pytest.mark.asyncio
async def test_signup_nonexistent_activity():
    # Arrange
    activity = "Nonexistent Club"
    email = "ghost@example.com"
    async with AsyncClient(app=app, base_url="http://test") as ac:
        # Act
        resp = await ac.post(f"/activities/{activity}/signup", params={"email": email})
    # Assert
    assert resp.status_code == 404
    assert "not found" in resp.json()["detail"].lower()
