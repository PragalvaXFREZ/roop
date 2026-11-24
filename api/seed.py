"""
Load sample data.

This script adds one admin user, the categories and about twelve products.
Run it after the migrations: uv run python seed.py
The script does not add products again if products exist.
The admin email and password come from SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD.
"""

from sqlalchemy import func, select

from app.auth import hash_password
from app.config import settings
from app.db import SessionLocal
from app.models import AdminUser, Category, Product, ProductVariant

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
        False,
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
            db.commit()
            print("Products exist. Skipped products.")
            return

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
                    variants=[
                        ProductVariant(size=s, color=c, stock=4) for c in colors for s in sizes
                    ],
                )
            )
        db.commit()
        print(f"Added {len(CATEGORIES)} categories and {len(PRODUCTS)} products")


if __name__ == "__main__":
    seed()
