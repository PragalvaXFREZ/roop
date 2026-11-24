"""
Database tables.

All money values are integers in the smallest currency unit (paisa for NPR).
All times are UTC. The database keeps them without a time zone.
An order keeps a copy of the customer and product data at checkout time.
Thus, later changes to a product or a customer do not change old orders.
"""

from datetime import UTC, datetime
from enum import StrEnum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


def now() -> datetime:
    return datetime.now(UTC).replace(tzinfo=None)


class OrderStatus(StrEnum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PRODUCTION = "in_production"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


class AdminUser(Base):
    __tablename__ = "admin_users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(255), unique=True)
    name: Mapped[str] = mapped_column(String(120))
    password_hash: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(default=now)


class Category(Base):
    __tablename__ = "categories"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    slug: Mapped[str] = mapped_column(String(80), unique=True)


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(160))
    slug: Mapped[str] = mapped_column(String(160), unique=True)
    description: Mapped[str] = mapped_column(Text, default="")
    embroidery: Mapped[str] = mapped_column(Text, default="")
    fabric: Mapped[str] = mapped_column(Text, default="")
    care: Mapped[str] = mapped_column(Text, default="")
    price: Mapped[int]
    is_published: Mapped[bool] = mapped_column(default=False)
    is_featured: Mapped[bool] = mapped_column(default=False)
    category_id: Mapped[int | None] = mapped_column(ForeignKey("categories.id"))
    created_at: Mapped[datetime] = mapped_column(default=now)

    category: Mapped[Category | None] = relationship()
    variants: Mapped[list["ProductVariant"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="ProductVariant.id"
    )
    images: Mapped[list["ProductImage"]] = relationship(
        back_populates="product", cascade="all, delete-orphan", order_by="ProductImage.position"
    )

    @property
    def image(self) -> str | None:
        return self.images[0].url if self.images else None


class ProductVariant(Base):
    __tablename__ = "product_variants"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    size: Mapped[str] = mapped_column(String(20))
    color: Mapped[str] = mapped_column(String(40))
    stock: Mapped[int] = mapped_column(default=0)

    product: Mapped[Product] = relationship(back_populates="variants")


class ProductImage(Base):
    __tablename__ = "product_images"

    id: Mapped[int] = mapped_column(primary_key=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id", ondelete="CASCADE"))
    url: Mapped[str] = mapped_column(String(500))
    position: Mapped[int] = mapped_column(default=0)

    product: Mapped[Product] = relationship(back_populates="images")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(30), unique=True)
    email: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(Text, default="")
    city: Mapped[str] = mapped_column(String(80), default="")
    created_at: Mapped[datetime] = mapped_column(default=now)

    orders: Mapped[list["Order"]] = relationship(
        back_populates="customer", order_by="Order.created_at.desc()"
    )
    notes: Mapped[list["Note"]] = relationship(order_by="Note.created_at.desc()")

    # These totals ignore cancelled orders.
    @property
    def order_count(self) -> int:
        return sum(o.status != OrderStatus.CANCELLED for o in self.orders)

    @property
    def lifetime_value(self) -> int:
        return sum(o.total for o in self.orders if o.status != OrderStatus.CANCELLED)

    @property
    def last_order_at(self) -> datetime | None:
        return self.orders[0].created_at if self.orders else None


class Order(Base):
    __tablename__ = "orders"

    id: Mapped[int] = mapped_column(primary_key=True)
    customer_id: Mapped[int] = mapped_column(ForeignKey("customers.id"))
    status: Mapped[OrderStatus] = mapped_column(String(20), default=OrderStatus.PENDING)
    name: Mapped[str] = mapped_column(String(120))
    phone: Mapped[str] = mapped_column(String(30))
    email: Mapped[str | None] = mapped_column(String(255))
    address: Mapped[str] = mapped_column(Text)
    city: Mapped[str] = mapped_column(String(80))
    customer_note: Mapped[str] = mapped_column(Text, default="")
    total: Mapped[int]
    created_at: Mapped[datetime] = mapped_column(default=now)

    customer: Mapped[Customer] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order", cascade="all, delete-orphan"
    )
    events: Mapped[list["OrderStatusEvent"]] = relationship(
        back_populates="order", cascade="all, delete-orphan", order_by="OrderStatusEvent.id"
    )
    notes: Mapped[list["Note"]] = relationship(
        cascade="all, delete-orphan", order_by="Note.created_at.desc()"
    )

    @property
    def number(self) -> str:
        return f"RP-{self.id:05d}"


class OrderItem(Base):
    __tablename__ = "order_items"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    variant_id: Mapped[int | None] = mapped_column(
        ForeignKey("product_variants.id", ondelete="SET NULL")
    )
    product_name: Mapped[str] = mapped_column(String(160))
    size: Mapped[str] = mapped_column(String(20))
    color: Mapped[str] = mapped_column(String(40))
    unit_price: Mapped[int]
    quantity: Mapped[int]

    order: Mapped[Order] = relationship(back_populates="items")


class OrderStatusEvent(Base):
    __tablename__ = "order_status_events"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    status: Mapped[OrderStatus] = mapped_column(String(20))
    admin_id: Mapped[int | None] = mapped_column(ForeignKey("admin_users.id"))
    created_at: Mapped[datetime] = mapped_column(default=now)

    order: Mapped[Order] = relationship(back_populates="events")
    admin: Mapped[AdminUser | None] = relationship()


class Note(Base):
    """An internal staff note. A note is attached to an order or to a customer."""

    __tablename__ = "notes"

    id: Mapped[int] = mapped_column(primary_key=True)
    order_id: Mapped[int | None] = mapped_column(ForeignKey("orders.id", ondelete="CASCADE"))
    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id", ondelete="CASCADE"))
    admin_id: Mapped[int] = mapped_column(ForeignKey("admin_users.id"))
    body: Mapped[str] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(default=now)

    admin: Mapped[AdminUser] = relationship()
