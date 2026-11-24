"""
Public routes: the catalog, checkout and order tracking.

These routes show published products only.
"""

from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db import get_db
from app.models import Category, Order, Product, ProductVariant
from app.orders import order_id, place_order
from app.schemas import (
    CatalogFilters,
    CategoryOut,
    OrderIn,
    OrderReceipt,
    ProductCard,
    ProductDetail,
    TrackIn,
)

router = APIRouter(prefix="/api")

SORTS = {
    "newest": Product.created_at.desc(),
    "price_asc": Product.price.asc(),
    "price_desc": Product.price.desc(),
}


@router.get("/products", response_model=list[ProductCard])
def list_products(
    category: str | None = None,
    size: str | None = None,
    color: str | None = None,
    min_price: int | None = None,
    max_price: int | None = None,
    q: str | None = None,
    featured: bool = False,
    sort: Literal["newest", "price_asc", "price_desc"] = "newest",
    db: Session = Depends(get_db),
):
    query = (
        select(Product)
        .where(Product.is_published)
        .options(selectinload(Product.images), selectinload(Product.category))
        .order_by(SORTS[sort])
    )
    if category:
        query = query.join(Product.category).where(Category.slug == category)
    if size or color:
        has = select(ProductVariant.product_id)
        if size:
            has = has.where(ProductVariant.size == size)
        if color:
            has = has.where(ProductVariant.color == color)
        query = query.where(Product.id.in_(has))
    if min_price is not None:
        query = query.where(Product.price >= min_price)
    if max_price is not None:
        query = query.where(Product.price <= max_price)
    if q:
        query = query.where(Product.name.ilike(f"%{q.strip()}%"))
    if featured:
        query = query.where(Product.is_featured)
    return db.scalars(query).all()


@router.get("/products/{slug}", response_model=ProductDetail)
def get_product(slug: str, db: Session = Depends(get_db)):
    product = db.scalar(select(Product).where(Product.slug == slug, Product.is_published))
    if not product:
        raise HTTPException(404, "Product not found")
    return product


@router.get("/filters", response_model=CatalogFilters)
def catalog_filters(db: Session = Depends(get_db)):
    live = select(Product.id).where(Product.is_published)
    variants = select(ProductVariant).where(ProductVariant.product_id.in_(live))
    rows = db.scalars(variants).all()
    return CatalogFilters(
        categories=[CategoryOut.model_validate(c) for c in db.scalars(select(Category))],
        sizes=sorted({v.size for v in rows}, key=size_order),
        colors=sorted({v.color for v in rows}),
    )


def size_order(size: str) -> tuple[int, str]:
    order = ["XS", "S", "M", "L", "XL", "XXL", "Free"]
    return (order.index(size) if size in order else len(order), size)


@router.post("/orders", response_model=OrderReceipt, status_code=201)
def create_order(data: OrderIn, db: Session = Depends(get_db)):
    return place_order(db, data)


@router.post("/orders/track", response_model=OrderReceipt)
def track_order(data: TrackIn, db: Session = Depends(get_db)):
    """Find an order by its number and phone. The phone stops people from guessing numbers."""
    number = order_id(data.number)
    order = db.get(Order, number) if number else None
    if not order or order.phone != data.phone:
        raise HTTPException(404, "No order matches that number and phone")
    return order
