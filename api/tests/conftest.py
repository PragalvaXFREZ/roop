"""
Shared test fixtures.

Each test gets a new SQLite database in a temporary file.
The app opens one session for each request, as in production.
Read state back through the API or a new session, not through fixture objects.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import sessionmaker

from app import auth
from app.config import settings
from app.db import Base, get_db, make_engine
from app.main import app
from app.models import AdminUser, Category, Product, ProductVariant

ADMIN_EMAIL = "staff@roop.com.np"
ADMIN_PASSWORD = "correct horse battery"
# Hash the password one time. bcrypt is slow.
ADMIN_HASH = auth.hash_password(ADMIN_PASSWORD)

settings.jwt_secret = "test-secret-that-is-long-enough-for-hs256"


@pytest.fixture
def new_session(tmp_path):
    engine = make_engine(f"sqlite:///{tmp_path / 'test.db'}")
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override():
        with factory() as db:
            yield db

    app.dependency_overrides[get_db] = override
    auth._attempts.clear()
    yield factory
    app.dependency_overrides.clear()
    engine.dispose()


@pytest.fixture
def client(new_session):
    return TestClient(app)


@pytest.fixture
def admin(new_session):
    with new_session() as db:
        user = AdminUser(email=ADMIN_EMAIL, name="Sita", password_hash=ADMIN_HASH)
        db.add(user)
        db.commit()
        return user


@pytest.fixture
def admin_client(admin):
    c = TestClient(app)
    r = c.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200
    return c


@pytest.fixture
def product(new_session):
    """A published kurta in two variants. The price is 6800 rupees (680000 paisa)."""
    with new_session() as db:
        item = Product(
            name="Marigold Kurta",
            slug="marigold-kurta",
            price=680000,
            is_published=True,
            is_featured=True,
            category=Category(name="Kurtas", slug="kurtas"),
            variants=[
                ProductVariant(size="M", color="Ivory", stock=3),
                ProductVariant(size="L", color="Rust", stock=1),
            ],
        )
        db.add(item)
        db.commit()
        return item


@pytest.fixture
def hidden(new_session):
    """An unpublished product. Its size and color occur on no other product."""
    with new_session() as db:
        item = Product(
            name="Secret Shawl",
            slug="secret-shawl",
            price=100000,
            variants=[ProductVariant(size="XXL", color="Gold", stock=5)],
        )
        db.add(item)
        db.commit()
        return item


@pytest.fixture
def checkout(client):
    """Return a function that places an order through the public API."""

    def place(items, **contact):
        body = {
            "name": "Asha Rai",
            "phone": "9841234567",
            "address": "Jhamsikhel, Lalitpur",
            "city": "Lalitpur",
            "items": items,
        } | contact
        return client.post("/api/orders", json=body)

    return place
