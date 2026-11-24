"""
Load sample data.

This script adds one admin user, the categories and about twelve products.
It also adds photos from seed_images/ to each sample product that has no photo.
Run it after the migrations: uv run python seed.py
The script does not add products again if products exist. Thus, you can run it again safely.
The admin email and password come from SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.
"""

import shutil
import uuid
from pathlib import Path

from sqlalchemy import func, select

from app.auth import hash_password
from app.config import settings
from app.db import SessionLocal
from app.models import AdminUser, Category, Product, ProductImage, ProductVariant

CATEGORIES = {"kurtas": "Kurtas", "shirts": "Shirts", "dresses": "Dresses", "shawls": "Shawls"}

# (name, category, price in rupees, embroidery, fabric, colours, sizes, featured)
PRODUCTS = [
    (
        "Marigold Kurta",
        "kurtas",
        6800,
        "Marigold vines in silk thread along the yoke.",
        "Handloom cotton",
        ["Ivory", "Rust"],
        ["S", "M", "L", "XL"],
        True,
    ),
    (
        "Rhododendron Kurta",
        "kurtas",
        7400,
        "Rhododendron sprays on the hem and cuffs.",
        "Cotton linen",
        ["Ivory", "Indigo"],
        ["S", "M", "L"],
        True,
    ),
    (
        "Lotus Yoke Kurta",
        "kurtas",
        7900,
        "A lotus border in chain stitch around the neck.",
        "Khadi cotton",
        ["Sand", "Black"],
        ["M", "L", "XL"],
        False,
    ),
    (
        "Courtyard Kurta",
        "kurtas",
        5900,
        "Small scattered buti across the front panel.",
        "Mulmul cotton",
        ["White", "Sage"],
        ["XS", "S", "M", "L"],
        False,
    ),
    (
        "Fern Collar Shirt",
        "shirts",
        4800,
        "Fern fronds on the collar points.",
        "Cotton poplin",
        ["White", "Sky"],
        ["S", "M", "L", "XL"],
        True,
    ),
    (
        "Sparrow Pocket Shirt",
        "shirts",
        4500,
        "One sparrow on the chest pocket.",
        "Linen",
        ["Natural", "Olive"],
        ["M", "L", "XL"],
        False,
    ),
    (
        "Monsoon Shirt",
        "shirts",
        5200,
        "Rain lines in running stitch down the placket.",
        "Cotton linen",
        ["Indigo", "Grey"],
        ["S", "M", "L"],
        False,
    ),
    (
        "Garden Wrap Dress",
        "dresses",
        9800,
        "A full garden border on the wrap edge.",
        "Cotton voile",
        ["Ivory", "Rose"],
        ["XS", "S", "M", "L"],
        True,
    ),
    (
        "Terai Midi Dress",
        "dresses",
        8900,
        "Paddy stalks in satin stitch on the bodice.",
        "Handloom cotton",
        ["Ochre", "Black"],
        ["S", "M", "L"],
        True,
    ),
    (
        "Prayer Flag Dress",
        "dresses",
        10500,
        "Five-colour bands at the sleeves.",
        "Linen",
        ["Natural"],
        ["S", "M", "L"],
        False,
    ),
    (
        "Himal Shawl",
        "shawls",
        12500,
        "Mountain outlines in wool thread along both ends.",
        "Pashmina blend",
        ["Charcoal", "Oat"],
        ["Free"],
        True,
    ),
    (
        "Kantha Throw Shawl",
        "shawls",
        8200,
        "Kantha running stitch over the whole cloth.",
        "Layered cotton",
        ["Madder", "Indigo"],
        ["Free"],
        False,
    ),
]

DESCRIPTION = (
    "Made to order in small batches. Each piece is embroidered by hand, "
    "so the stitches vary a little from one garment to the next."
)
CARE = "Hand wash cold. Dry in shade. Iron on the reverse side."


PHOTOS = Path(__file__).parent / "seed_images"
# Each product gets its own photo, then one embroidery close-up for the gallery.
DETAILS = ["rose", "bouquet", "flower", "black", "lace", "vase"]


def slugify(name: str) -> str:
    return name.lower().replace(" ", "-")


def seed() -> None:
    with SessionLocal() as db:
        email = settings.seed_admin_email.lower()
        if not db.scalar(select(AdminUser).where(AdminUser.email == email)):
            db.add(
                AdminUser(
                    email=email,
                    name="Admin",
                    password_hash=hash_password(settings.seed_admin_password),
                )
            )
            print(f"Added admin {email}")

        if db.scalar(select(func.count(Product.id))):
            print("Products exist. Skipped products.")
        else:
            add_products(db)
        add_photos(db)
        db.commit()


def add_products(db) -> None:
    categories = {slug: Category(slug=slug, name=name) for slug, name in CATEGORIES.items()}
    db.add_all(categories.values())
    for name, cat, rupees, embroidery, fabric, colors, sizes, featured in PRODUCTS:
        db.add(
            Product(
                name=name,
                slug=slugify(name),
                description=DESCRIPTION,
                embroidery=embroidery,
                fabric=fabric,
                care=CARE,
                price=rupees * 100,
                category=categories[cat],
                is_published=True,
                is_featured=featured,
                variants=[ProductVariant(size=s, color=c, stock=4) for c in colors for s in sizes],
            )
        )
    db.flush()
    print(f"Added {len(CATEGORIES)} categories and {len(PRODUCTS)} products")


def add_photos(db) -> None:
    """Copy the sample photos to the upload folder. Skip products that have photos."""
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    added = 0
    for i, product in enumerate(db.scalars(select(Product).order_by(Product.id))):
        main = PHOTOS / f"{product.slug}-1.jpg"
        if product.images or not main.exists():
            continue
        detail = PHOTOS / f"detail-{DETAILS[i % len(DETAILS)]}.jpg"
        for position, source in enumerate([main, detail]):
            name = f"{uuid.uuid4().hex}.jpg"
            shutil.copyfile(source, settings.upload_dir / name)
            product.images.append(ProductImage(url=f"/api/uploads/{name}", position=position))
        added += 1
    print(f"Added photos to {added} product(s)")


if __name__ == "__main__":
    seed()
