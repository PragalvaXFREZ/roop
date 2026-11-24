"""
Admin routes: sign-in, dashboard, orders, customers and products.

Every route except login needs a signed-in admin.
"""

import uuid
from datetime import datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException, Response, UploadFile
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, selectinload

from app.auth import COOKIE, check_password, current_admin, limit_login, make_token
from app.config import settings
from app.db import get_db
from app.models import (
    AdminUser,
    Category,
    Customer,
    Note,
    Order,
    OrderStatus,
    Product,
    ProductImage,
    ProductVariant,
    now,
)
from app.orders import set_status
from app.schemas import (
    AdminOut,
    AdminProduct,
    CategoryOut,
    CustomerDetail,
    CustomerRow,
    Dashboard,
    LoginIn,
    NoteIn,
    NoteOut,
    OrderContactIn,
    OrderDetail,
    OrderPage,
    OrderRow,
    ProductIn,
    StatusIn,
)

router = APIRouter(prefix="/api/admin")
guarded = APIRouter(prefix="/api/admin", dependencies=[Depends(current_admin)])

IMAGE_TYPES = {"image/jpeg": ".jpg", "image/png": ".png", "image/webp": ".webp"}
MAX_IMAGE_BYTES = 5 * 1024 * 1024


# Sign-in


@router.post("/login", response_model=AdminOut, dependencies=[Depends(limit_login)])
def login(data: LoginIn, response: Response, db: Session = Depends(get_db)):
    admin = db.scalar(select(AdminUser).where(AdminUser.email == data.email.lower()))
    if not admin or not check_password(data.password, admin.password_hash):
        raise HTTPException(401, "Email or password is wrong")
    response.set_cookie(
        COOKIE,
        make_token(admin.id),
        max_age=settings.jwt_hours * 3600,
        httponly=True,
        secure=settings.cookie_secure,
        samesite="lax",
    )
    return admin


@router.post("/logout", status_code=204)
def logout(response: Response):
    response.delete_cookie(COOKIE)


@guarded.get("/me", response_model=AdminOut)
def me(admin: AdminUser = Depends(current_admin)):
    return admin


# Dashboard


@guarded.get("/dashboard", response_model=Dashboard)
def dashboard(db: Session = Depends(get_db)):
    today = now().replace(hour=0, minute=0, second=0, microsecond=0)
    month = today.replace(day=1)

    def count_since(start: datetime) -> int:
        return db.scalar(select(func.count(Order.id)).where(Order.created_at >= start))

    revenue = db.scalar(
        select(func.coalesce(func.sum(Order.total), 0)).where(
            Order.created_at >= month, Order.status != OrderStatus.CANCELLED
        )
    )
    by_status = dict(db.execute(select(Order.status, func.count()).group_by(Order.status)).all())
    recent = db.scalars(select(Order).order_by(Order.created_at.desc()).limit(8)).all()
    return Dashboard(
        orders_today=count_since(today),
        orders_week=count_since(today - timedelta(days=today.weekday())),
        orders_month=count_since(month),
        revenue_month=revenue,
        by_status={s: by_status.get(s, 0) for s in OrderStatus},
        recent=[OrderRow.model_validate(o) for o in recent],
    )


# Orders


@guarded.get("/orders", response_model=OrderPage)
def list_orders(
    status: OrderStatus | None = None,
    q: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    page: int = 1,
    db: Session = Depends(get_db),
):
    query = select(Order)
    if status:
        query = query.where(Order.status == status)
    if q:
        term = f"%{q.strip()}%"
        number = q.strip().upper().removeprefix("RP-")
        match = [Order.name.ilike(term), Order.phone.ilike(term), Order.email.ilike(term)]
        if number.isdigit():
            match.append(Order.id == int(number))
        query = query.where(or_(*match))
    if date_from:
        query = query.where(Order.created_at >= date_from)
    if date_to:
        query = query.where(Order.created_at < date_to)
    total = db.scalar(select(func.count()).select_from(query.subquery()))
    rows = db.scalars(
        query.order_by(Order.created_at.desc()).offset((max(page, 1) - 1) * 25).limit(25)
    ).all()
    return OrderPage(items=[OrderRow.model_validate(o) for o in rows], total=total)


def get_order(db: Session, order_id: int) -> Order:
    order = db.get(Order, order_id)
    if not order:
        raise HTTPException(404, "Order not found")
    return order


@guarded.get("/orders/{order_id}", response_model=OrderDetail)
def order_detail(order_id: int, db: Session = Depends(get_db)):
    return get_order(db, order_id)


@guarded.patch("/orders/{order_id}", response_model=OrderDetail)
def update_order_contact(order_id: int, data: OrderContactIn, db: Session = Depends(get_db)):
    order = get_order(db, order_id)
    for field, value in data.model_dump().items():
        setattr(order, field, value)
    db.commit()
    return order


@guarded.post("/orders/{order_id}/status", response_model=OrderDetail)
def change_status(
    order_id: int,
    data: StatusIn,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(current_admin),
):
    return set_status(db, get_order(db, order_id), data.status, admin)


@guarded.post("/orders/{order_id}/notes", response_model=NoteOut, status_code=201)
def add_order_note(
    order_id: int,
    data: NoteIn,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(current_admin),
):
    note = Note(order_id=get_order(db, order_id).id, admin_id=admin.id, body=data.body)
    db.add(note)
    db.commit()
    return note


# Customers


@guarded.get("/customers", response_model=list[CustomerRow])
def list_customers(q: str | None = None, db: Session = Depends(get_db)):
    query = select(Customer).options(selectinload(Customer.orders))
    if q:
        term = f"%{q.strip()}%"
        query = query.where(
            or_(Customer.name.ilike(term), Customer.phone.ilike(term), Customer.email.ilike(term))
        )
    customers = db.scalars(query).all()
    return sorted(customers, key=lambda c: c.last_order_at or c.created_at, reverse=True)


@guarded.get("/customers/{customer_id}", response_model=CustomerDetail)
def customer_detail(customer_id: int, db: Session = Depends(get_db)):
    customer = db.get(Customer, customer_id)
    if not customer:
        raise HTTPException(404, "Customer not found")
    return customer


@guarded.post("/customers/{customer_id}/notes", response_model=NoteOut, status_code=201)
def add_customer_note(
    customer_id: int,
    data: NoteIn,
    db: Session = Depends(get_db),
    admin: AdminUser = Depends(current_admin),
):
    if not db.get(Customer, customer_id):
        raise HTTPException(404, "Customer not found")
    note = Note(customer_id=customer_id, admin_id=admin.id, body=data.body)
    db.add(note)
    db.commit()
    return note


# Products


@guarded.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).order_by(Category.name)).all()


@guarded.get("/products", response_model=list[AdminProduct])
def list_admin_products(db: Session = Depends(get_db)):
    return db.scalars(select(Product).order_by(Product.created_at.desc())).all()


def get_product(db: Session, product_id: int) -> Product:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(404, "Product not found")
    return product


def save_product(db: Session, product: Product, data: ProductIn) -> Product:
    """Copy the form data to the product. Keep variants by id, add new ones, remove the rest."""
    fields = data.model_dump(exclude={"variants"})
    for field, value in fields.items():
        setattr(product, field, value)
    current = {v.id: v for v in product.variants}
    kept = []
    for item in data.variants:
        variant = current.get(item.id) if item.id else None
        variant = variant or ProductVariant()
        variant.size, variant.color, variant.stock = item.size, item.color, item.stock
        kept.append(variant)
    product.variants = kept
    db.add(product)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(409, "Another product uses this slug") from None
    return product


@guarded.get("/products/{product_id}", response_model=AdminProduct)
def admin_product(product_id: int, db: Session = Depends(get_db)):
    return get_product(db, product_id)


@guarded.post("/products", response_model=AdminProduct, status_code=201)
def create_product(data: ProductIn, db: Session = Depends(get_db)):
    return save_product(db, Product(), data)


@guarded.put("/products/{product_id}", response_model=AdminProduct)
def update_product(product_id: int, data: ProductIn, db: Session = Depends(get_db)):
    return save_product(db, get_product(db, product_id), data)


@guarded.delete("/products/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    db.delete(get_product(db, product_id))
    db.commit()


@guarded.post("/products/{product_id}/images", response_model=AdminProduct, status_code=201)
async def upload_image(product_id: int, file: UploadFile, db: Session = Depends(get_db)):
    product = get_product(db, product_id)
    suffix = IMAGE_TYPES.get(file.content_type or "")
    if not suffix:
        raise HTTPException(400, "Use a JPEG, PNG or WebP image")
    content = await file.read(MAX_IMAGE_BYTES + 1)
    if len(content) > MAX_IMAGE_BYTES:
        raise HTTPException(400, "The image must be 5 MB or smaller")
    name = f"{uuid.uuid4().hex}{suffix}"
    settings.upload_dir.mkdir(parents=True, exist_ok=True)
    (settings.upload_dir / name).write_bytes(content)
    product.images.append(ProductImage(url=f"/api/uploads/{name}", position=len(product.images)))
    db.commit()
    return product


@guarded.delete("/products/{product_id}/images/{image_id}", response_model=AdminProduct)
def delete_image(product_id: int, image_id: int, db: Session = Depends(get_db)):
    product = get_product(db, product_id)
    image = next((i for i in product.images if i.id == image_id), None)
    if not image:
        raise HTTPException(404, "Image not found")
    product.images.remove(image)
    (settings.upload_dir / image.url.rsplit("/", 1)[-1]).unlink(missing_ok=True)
    db.commit()
    return product
