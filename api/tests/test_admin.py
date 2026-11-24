"""
Admin tests: sign-in, the session guard, orders, customers and the dashboard.
"""

import re
from datetime import timedelta

import pytest

from app.models import Order, now
from app.routes.admin import guarded
from tests.conftest import ADMIN_EMAIL, ADMIN_PASSWORD

GUARDED = [(m, re.sub(r"{\w+}", "1", r.path)) for r in guarded.routes for m in r.methods]


@pytest.fixture
def order(product, checkout):
    """A pending order for 2 of the M variant. One M remains in stock."""
    r = checkout([{"variant_id": product.variants[0].id, "quantity": 2}], email="asha@example.com")
    return r.json()


def set_status(admin_client, order_id, status):
    return admin_client.post(f"/api/admin/orders/{order_id}/status", json={"status": status})


# An empty list would make the next test pass with no checks.
def test_guard_list_is_not_empty():
    assert GUARDED


@pytest.mark.parametrize("method,path", GUARDED)
def test_guarded_route_needs_cookie(client, method, path):
    assert client.request(method, path).status_code == 401


def test_bad_cookie_is_rejected(client, admin):
    client.cookies.set("roop_session", "not-a-token")
    assert client.get("/api/admin/me").status_code == 401


def test_login(client, admin):
    def login(password):
        return client.post("/api/admin/login", json={"email": ADMIN_EMAIL, "password": password})

    assert login("wrong").status_code == 401
    r = login(ADMIN_PASSWORD)
    assert r.status_code == 200
    cookie = r.headers["set-cookie"]
    assert cookie.startswith("roop_session=")
    assert "httponly" in cookie.lower()
    assert client.get("/api/admin/me").json()["email"] == ADMIN_EMAIL

    for _ in range(3):
        login("wrong")
    # This is the sixth attempt in one minute.
    assert login(ADMIN_PASSWORD).status_code == 429


def test_status_change_records_admin(admin_client, order):
    r = set_status(admin_client, 1, "confirmed")
    assert r.status_code == 200
    events = r.json()["events"]
    assert [e["status"] for e in events] == ["pending", "confirmed"]
    assert events[0]["admin"] is None
    assert events[1]["admin"]["name"] == "Sita"


def test_same_status_is_noop(admin_client, order):
    r = set_status(admin_client, 1, "pending")
    assert r.status_code == 200
    assert len(r.json()["events"]) == 1


def test_cancel_restores_stock(admin_client, client, order):
    set_status(admin_client, 1, "cancelled")
    variants = client.get("/api/products/marigold-kurta").json()["variants"]
    assert variants[0]["stock"] == 3


@pytest.mark.parametrize("final", ["delivered", "cancelled"])
def test_final_status_is_locked(admin_client, order, final):
    set_status(admin_client, 1, final)
    assert set_status(admin_client, 1, "shipped").status_code == 400
    assert set_status(admin_client, 1, final).status_code == 400
    assert admin_client.get("/api/admin/orders/1").json()["status"] == final


@pytest.mark.parametrize(
    "q,found",
    [("rp-00001", 1), ("1", 1), ("asha", 1), ("asha@example", 1), ("99999999999999999999", 0)],
)
def test_order_search(admin_client, order, q, found):
    r = admin_client.get("/api/admin/orders", params={"q": q})
    assert r.json()["total"] == found


def test_edit_contact(admin_client, order):
    contact = {
        "name": "Asha Gurung",
        "phone": "98 0000 0000",
        "email": None,
        "address": "Baneshwor, Kathmandu",
        "city": "Kathmandu",
    }
    r = admin_client.patch("/api/admin/orders/1", json=contact)
    assert r.status_code == 200
    saved = {k: r.json()[k] for k in contact}
    assert saved == contact | {"phone": "9800000000"}


def test_notes(admin_client, order):
    r = admin_client.post("/api/admin/orders/1/notes", json={"body": "Wants gift wrap"})
    assert r.status_code == 201
    assert r.json()["admin"]["name"] == "Sita"
    notes = admin_client.get("/api/admin/orders/1").json()["notes"]
    assert [n["body"] for n in notes] == ["Wants gift wrap"]

    r = admin_client.post("/api/admin/customers/1/notes", json={"body": "Prefers calls"})
    assert r.status_code == 201
    customer = admin_client.get("/api/admin/customers/1").json()
    assert [n["body"] for n in customer["notes"]] == ["Prefers calls"]
    assert admin_client.post("/api/admin/customers/9/notes", json={"body": "x"}).status_code == 404


def test_customer_totals_skip_cancelled(admin_client, order, checkout, product):
    checkout([{"variant_id": product.variants[1].id, "quantity": 1}])
    set_status(admin_client, 2, "cancelled")
    [row] = admin_client.get("/api/admin/customers").json()
    assert row["order_count"] == 1
    assert row["lifetime_value"] == 2 * 680000


def test_dashboard(admin_client, new_session, order, checkout, product):
    checkout([{"variant_id": product.variants[1].id, "quantity": 1}])
    checkout([{"variant_id": product.variants[0].id, "quantity": 1}])
    set_status(admin_client, 2, "cancelled")
    # Move order 3 outside this month.
    with new_session() as db:
        db.get(Order, 3).created_at = now() - timedelta(days=40)
        db.commit()

    d = admin_client.get("/api/admin/dashboard").json()
    assert (d["orders_today"], d["orders_week"], d["orders_month"]) == (2, 2, 2)
    assert d["revenue_month"] == 2 * 680000
    assert {k: v for k, v in d["by_status"].items() if v} == {"pending": 2, "cancelled": 1}
    assert [o["number"] for o in d["recent"]] == ["RP-00002", "RP-00001", "RP-00003"]
