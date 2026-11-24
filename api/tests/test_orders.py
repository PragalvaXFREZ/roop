"""
Checkout and order tracking tests.

These tests use the public API only. The stock values come from the product page.
"""

import pytest


def stock(client) -> list[int]:
    variants = client.get("/api/products/marigold-kurta").json()["variants"]
    return [v["stock"] for v in variants]


# The client sends a price and a total. The server must ignore both.
def test_order_total_comes_from_server(client, product, checkout):
    med, large = product.variants
    r = checkout(
        [
            {"variant_id": med.id, "quantity": 2, "price": 1},
            {"variant_id": large.id, "quantity": 1, "unit_price": 1},
        ],
        total=1,
    )
    assert r.status_code == 201
    order = r.json()
    assert order["total"] == 3 * 680000
    assert {i["unit_price"] for i in order["items"]} == {680000}
    assert order["number"] == "RP-00001"
    assert order["status"] == "pending"
    assert stock(client) == [1, 0]


def test_repeated_lines_merge(client, product, checkout):
    med = product.variants[0]
    r = checkout([{"variant_id": med.id, "quantity": 2}, {"variant_id": med.id, "quantity": 2}])
    assert r.status_code == 409
    r = checkout([{"variant_id": med.id, "quantity": 1}, {"variant_id": med.id, "quantity": 2}])
    assert r.status_code == 201
    assert [(i["quantity"], i["size"]) for i in r.json()["items"]] == [(3, "M")]
    assert stock(client) == [0, 1]


# The first line fits and the second does not. The stock must not change.
def test_short_stock_changes_nothing(client, product, checkout):
    med, large = product.variants
    r = checkout([{"variant_id": med.id, "quantity": 1}, {"variant_id": large.id, "quantity": 2}])
    assert r.status_code == 409
    assert stock(client) == [3, 1]


@pytest.mark.parametrize("which", ["unknown", "unpublished"])
def test_unavailable_variant(client, product, hidden, checkout, which):
    variant_id = 999 if which == "unknown" else hidden.variants[0].id
    r = checkout([{"variant_id": variant_id, "quantity": 1}])
    assert r.status_code == 400


# Match a customer by phone first, then by email in any letter case.
def test_customer_dedupe(admin_client, product, checkout):
    med, large = product.variants
    line = [{"variant_id": med.id, "quantity": 1}]
    checkout(line, phone="9841234567", email="asha@example.com")
    checkout(line, phone="98 4123 4567")
    checkout(line, phone="9800000000", email="Asha@Example.com", name="Asha R.")
    checkout([{"variant_id": large.id, "quantity": 1}], phone="9811111111")

    customers = admin_client.get("/api/admin/customers").json()
    assert len(customers) == 2
    asha = next(c for c in customers if c["phone"] == "9841234567")
    assert asha["order_count"] == 3
    assert asha["name"] == "Asha R."
    assert asha["email"] == "asha@example.com"


def test_tracking(client, product, checkout):
    checkout([{"variant_id": product.variants[0].id, "quantity": 1}], phone="98-4123-4567")

    def track(number, phone):
        return client.post("/api/orders/track", json={"number": number, "phone": phone})

    r = track("RP-00001", "9841234567")
    assert r.status_code == 200
    assert r.json()["events"][0]["status"] == "pending"
    assert track("rp-00001", "98 4123 4567").status_code == 200
    assert track("RP-00001", "+977 984-1234567").status_code == 200
    assert track("RP-00001", "9800000000").status_code == 404
    for number in ["RP-00002", "nonsense", "RP-99999999999999999999", "RP-²"]:
        assert track(number, "9841234567").status_code == 404
