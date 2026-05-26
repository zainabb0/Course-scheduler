# ================================================================
#  backend/tests/test_integration.py
#
#  Integration tests — hit real FastAPI endpoints end-to-end.
#  Requires: running PostgreSQL + seed_data applied.
#
#  Run: pytest tests/test_integration.py -v
#
#  Note: These tests use httpx AsyncClient with the FastAPI app.
#        They need a test DB or the dev DB with seed data.
# ================================================================

import pytest
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

import asyncio
from httpx import AsyncClient, ASGITransport

# ── Skip if no DB configured ─────────────────────────────────────
pytestmark = pytest.mark.skipif(
    not os.getenv("POSTGRES_USER"),
    reason="Integration tests require POSTGRES_USER env var"
)


@pytest.fixture(scope="module")
def event_loop():
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()


@pytest.fixture(scope="module")
async def client():
    """Async HTTP client pointed at the FastAPI app."""
    from main import app
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test",
    ) as c:
        yield c


@pytest.fixture(scope="module")
async def admin_token(client):
    """Login as admin and return JWT token."""
    resp = await client.post("/auth/login", json={
        "email": "admin@cs.edu",
        "password": "Password@123",
    })
    assert resp.status_code == 200, f"Login failed: {resp.text}"
    return resp.json()["access_token"]


@pytest.fixture(scope="module")
async def instructor_token(client):
    """Login as instructor and return JWT token."""
    resp = await client.post("/auth/login", json={
        "email": "sara@cs.edu",
        "password": "Password@123",
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]


@pytest.fixture(scope="module")
async def student_token(client):
    """Login as student and return JWT token."""
    resp = await client.post("/auth/login", json={
        "email": "ali@student.cs.edu",
        "password": "Password@123",
    })
    assert resp.status_code == 200
    return resp.json()["access_token"]


def auth(token):
    return {"Authorization": f"Bearer {token}"}


# ================================================================
#  AUTH TESTS
# ================================================================

class TestAuth:
    @pytest.mark.asyncio
    async def test_login_admin_success(self, client):
        resp = await client.post("/auth/login", json={
            "email": "admin@cs.edu", "password": "Password@123"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "access_token" in data
        assert data["role"] == "admin"

    @pytest.mark.asyncio
    async def test_login_wrong_password(self, client):
        resp = await client.post("/auth/login", json={
            "email": "admin@cs.edu", "password": "wrongpassword"
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_login_unknown_email(self, client):
        resp = await client.post("/auth/login", json={
            "email": "nobody@cs.edu", "password": "Password@123"
        })
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_get_me_with_valid_token(self, client, admin_token):
        resp = await client.get("/auth/me", headers=auth(admin_token))
        assert resp.status_code == 200
        assert resp.json()["role"] == "admin"

    @pytest.mark.asyncio
    async def test_get_me_without_token(self, client):
        resp = await client.get("/auth/me")
        assert resp.status_code == 401

    @pytest.mark.asyncio
    async def test_instructor_login(self, client, instructor_token):
        resp = await client.get("/auth/me", headers=auth(instructor_token))
        assert resp.status_code == 200
        assert resp.json()["role"] == "instructor"


# ================================================================
#  DEPARTMENTS TESTS
# ================================================================

class TestDepartments:
    @pytest.mark.asyncio
    async def test_list_departments(self, client, admin_token):
        resp = await client.get("/departments", headers=auth(admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert len(data) >= 1
        assert data[0]["code"] == "CS"

    @pytest.mark.asyncio
    async def test_get_department_with_years(self, client, admin_token):
        # Get CS department
        resp = await client.get("/departments", headers=auth(admin_token))
        dept_id = resp.json()[0]["id"]

        resp = await client.get(f"/departments/{dept_id}", headers=auth(admin_token))
        assert resp.status_code == 200
        data = resp.json()
        assert "study_years" in data
        assert len(data["study_years"]) == 4

    @pytest.mark.asyncio
    async def test_create_and_delete_department(self, client, admin_token):
        # Create
        resp = await client.post("/departments", headers=auth(admin_token), json={
            "name": "Test Department", "code": "TESTDEPT",
        })
        assert resp.status_code == 201
        dept_id = resp.json()["id"]

        # Delete
        resp = await client.delete(f"/departments/{dept_id}", headers=auth(admin_token))
        assert resp.status_code == 204

    @pytest.mark.asyncio
    async def test_non_admin_cannot_create_department(self, client, instructor_token):
        resp = await client.post("/departments", headers=auth(instructor_token), json={
            "name": "Unauthorized Dept", "code": "UNAUTH",
        })
        assert resp.status_code == 403


# ================================================================
#  CLASSROOMS TESTS
# ================================================================

class TestClassrooms:
    @pytest.mark.asyncio
    async def test_list_classrooms(self, client, admin_token):
        resp = await client.get("/classrooms", headers=auth(admin_token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 8

    @pytest.mark.asyncio
    async def test_filter_by_type(self, client, admin_token):
        resp = await client.get("/classrooms?room_type=lab", headers=auth(admin_token))
        assert resp.status_code == 200
        for room in resp.json():
            assert room["room_type"] == "lab"

    @pytest.mark.asyncio
    async def test_create_classroom(self, client, admin_token):
        depts = await client.get("/departments", headers=auth(admin_token))
        dept_id = depts.json()[0]["id"]

        resp = await client.post("/classrooms", headers=auth(admin_token), json={
            "name": "Test Room", "code": "TEST-R99",
            "capacity": 40, "room_type": "lecture",
            "department_id": dept_id,
        })
        assert resp.status_code == 201
        assert resp.json()["code"] == "TEST-R99"

        # Cleanup
        room_id = resp.json()["id"]
        await client.delete(f"/classrooms/{room_id}", headers=auth(admin_token))


# ================================================================
#  COURSES TESTS
# ================================================================

class TestCourses:
    @pytest.mark.asyncio
    async def test_list_courses(self, client, admin_token):
        resp = await client.get("/courses", headers=auth(admin_token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 16

    @pytest.mark.asyncio
    async def test_courses_have_correct_fields(self, client, admin_token):
        resp = await client.get("/courses", headers=auth(admin_token))
        course = resp.json()[0]
        required = ['id','name','code','credit_hours','has_lab','has_sections']
        for field in required:
            assert field in course, f"Missing field: {field}"


# ================================================================
#  INSTRUCTORS TESTS
# ================================================================

class TestInstructors:
    @pytest.mark.asyncio
    async def test_list_instructors(self, client, admin_token):
        resp = await client.get("/instructors", headers=auth(admin_token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 8

    @pytest.mark.asyncio
    async def test_instructor_can_update_own_preferences(self, client, instructor_token):
        # Get own instructor ID
        me = await client.get("/auth/me", headers=auth(instructor_token))
        email = me.json()["email"]

        instructors = await client.get("/instructors", headers=auth(instructor_token))
        mine = next((i for i in instructors.json() if i["email"] == email), None)
        assert mine is not None

        resp = await client.put(
            f"/instructors/{mine['id']}/preferences",
            headers=auth(instructor_token),
            json={"preferred_time": "morning", "max_consecutive_hrs": 3},
        )
        assert resp.status_code == 200
        assert resp.json()["preferred_time"] == "morning"

    @pytest.mark.asyncio
    async def test_instructor_cannot_update_others_preferences(self, client, instructor_token):
        # Get all instructors and find one that is NOT the logged-in user
        me = await client.get("/auth/me", headers=auth(instructor_token))
        my_email = me.json()["email"]

        instructors = await client.get("/instructors", headers=auth(instructor_token))
        other = next((i for i in instructors.json() if i["email"] != my_email), None)

        if other:
            resp = await client.put(
                f"/instructors/{other['id']}/preferences",
                headers=auth(instructor_token),
                json={"preferred_time": "afternoon"},
            )
            assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_get_availability(self, client, admin_token):
        instructors = await client.get("/instructors", headers=auth(admin_token))
        inst_id = instructors.json()[0]["id"]

        resp = await client.get(f"/instructors/{inst_id}/availability", headers=auth(admin_token))
        assert resp.status_code == 200
        assert len(resp.json()) > 0


# ================================================================
#  COURSE SECTIONS TESTS
# ================================================================

class TestCourseSections:
    @pytest.mark.asyncio
    async def test_list_assignments(self, client, admin_token):
        resp = await client.get(
            "/course-sections/assignments?academic_year=2024-2025",
            headers=auth(admin_token),
        )
        assert resp.status_code == 200
        assert len(resp.json()) >= 23

    @pytest.mark.asyncio
    async def test_list_sections(self, client, admin_token):
        resp = await client.get("/course-sections/sections", headers=auth(admin_token))
        assert resp.status_code == 200
        assert len(resp.json()) >= 22


# ================================================================
#  TIME SLOTS TESTS
# ================================================================

class TestTimeSlots:
    @pytest.mark.asyncio
    async def test_get_time_slots(self, client, admin_token):
        resp = await client.get("/ai/time-slots", headers=auth(admin_token))
        assert resp.status_code == 200
        slots = resp.json()
        assert len(slots) == 25  # 5 days × 5 slots
        days = {s["day"] for s in slots}
        assert days == {"sunday","monday","tuesday","wednesday","thursday"}


# ================================================================
#  ROLE GUARD TESTS
# ================================================================

class TestRoleGuards:
    @pytest.mark.asyncio
    async def test_student_cannot_access_admin_endpoints(self, client, student_token):
        resp = await client.get("/students", headers=auth(student_token))
        assert resp.status_code == 403

    @pytest.mark.asyncio
    async def test_instructor_cannot_delete_courses(self, client, instructor_token):
        resp = await client.delete("/courses/some-id", headers=auth(instructor_token))
        assert resp.status_code in [403, 404]  # 404 if ID doesn't exist

    @pytest.mark.asyncio
    async def test_unauthenticated_cannot_access_protected(self, client):
        for endpoint in ["/departments", "/courses", "/instructors", "/students"]:
            resp = await client.get(endpoint)
            assert resp.status_code == 401, f"{endpoint} should require auth"