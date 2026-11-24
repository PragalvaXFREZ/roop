"""
Product tests: admin CRUD, image upload and the public catalog.
"""

from datetime import timedelta

import pytest

from app.config import settings
from app.main import app
from app.models import Category, Product, ProductVariant, now

PNG = bytes.fromhex("89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c489")


def product_body(slug="fern-shirt", variants=()):
    return {"name": "Fern Shirt", "slug": slug, "price": 480000, "variants": list(variants)}


def test_product_crud(admin_client, client, product, checkout):
    r = admin_client.post(
        "/api/admin/products",
        json=product_body(variants=[{"size": "S", "color": "Sky", "stock": 2}] * 2),
    )
    assert r.status_code == 201
    created = r.json()
    keep, drop = created["variants"]

    variants = [keep | {"stock": 9}, {"size": "XL", "color": "Sky", "stock": 1}]
    r = admin_client.put(
        f"/api/admin/products/{created['id']}", json=product_body(variants=variants)
    )
    assert r.status_code == 200
    saved = r.json()["variants"]
    assert saved[0] == keep | {"stock": 9}
    assert saved[1]["size"] == "XL"
    assert drop["id"] not in {v["id"] for v in saved}

    # A slug that another product uses gives 409 on create and on update.
    assert (
        admin_client.post("/api/admin/products", json=product_body("marigold-kurta")).status_code
        == 409
    )
    r = admin_client.put(
        f"/api/admin/products/{created['id']}", json=product_body("marigold-kurta")
    )
    assert r.status_code == 409

    # Old orders keep their lines when staff delete the product.
    checkout([{"variant_id": product.variants[0].id, "quantity": 1}])
    assert admin_client.delete(f"/api/admin/products/{product.id}").status_code == 204
    assert admin_client.get(f"/api/admin/products/{product.id}").status_code == 404
    assert admin_client.get("/api/admin/orders/1").json()["items"][0]["size"] == "M"


def test_image_upload(admin_client, client, product, tmp_path, monkeypatch):
    # The app mounts the upload folder at import. Point the mount at tmp_path too.
    mount = next(r for r in app.routes if getattr(r, "path", "") == "/api/uploads")
    monkeypatch.setattr(settings, "upload_dir", tmp_path)
    monkeypatch.setattr(mount.app, "all_directories", [tmp_path])
    url = f"/api/admin/products/{product.id}/images"

    r = admin_client.post(url, files={"file": ("notes.txt", b"hello", "text/plain")})
    assert r.status_code == 400

    r = admin_client.post(url, files={"file": ("photo.png", PNG, "image/png")})
    assert r.status_code == 201
    image = r.json()["images"][0]["url"]
    assert image.startswith("/api/uploads/") and image.endswith(".png")
    served = client.get(image)
    assert served.status_code == 200
    assert served.content == PNG


@pytest.fixture
def catalog(new_session, product, hidden):
    """Add a newer, cheaper shirt beside the kurta. The kurta is the featured product."""
    with new_session() as db:
        db.add(
            Product(
                name="Fern Shirt",
                slug="fern-shirt",
                price=480000,
                is_published=True,
                created_at=now() + timedelta(minutes=1),
                category=Category(name="Shirts", slug="shirts"),
                variants=[ProductVariant(size="S", color="White", stock=2)],
            )
        )
        db.commit()


@pytest.mark.parametrize(
    "params,slugs",
    [
        ({}, ["fern-shirt", "marigold-kurta"]),
        ({"category": "kurtas"}, ["marigold-kurta"]),
        ({"size": "S"}, ["fern-shirt"]),
        ({"color": "Rust"}, ["marigold-kurta"]),
        # Size and color must match on the same variant.
        ({"size": "M", "color": "Rust"}, []),
        ({"min_price": 480001}, ["marigold-kurta"]),
        ({"max_price": 480000}, ["fern-shirt"]),
        ({"q": "MARIGOLD"}, ["marigold-kurta"]),
        ({"sort": "price_asc"}, ["fern-shirt", "marigold-kurta"]),
        ({"sort": "price_desc"}, ["marigold-kurta", "fern-shirt"]),
        ({"featured": "true"}, ["marigold-kurta"]),
        ({"size": "XXL"}, []),
        ({"q": "secret"}, []),
    ],
)
def test_catalog_filters(client, catalog, params, slugs):
    r = client.get("/api/products", params=params)
    assert [p["slug"] for p in r.json()] == slugs


def test_unpublished_product_is_hidden(client, catalog):
    assert client.get("/api/products/secret-shawl").status_code == 404
    filters = client.get("/api/filters").json()
    assert filters["sizes"] == ["S", "M", "L"]
    assert "Gold" not in filters["colors"]
