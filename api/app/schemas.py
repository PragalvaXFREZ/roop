"""
Request and response shapes for the API.

Money is an integer in the smallest currency unit.
Times go out as UTC with a time zone, so that browsers show local time.
"""

import re
from datetime import UTC, datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, EmailStr, Field, field_validator

from app.models import OrderStatus


def _as_utc(value: datetime) -> datetime:
    return value.replace(tzinfo=UTC) if value.tzinfo is None else value


UTCTime = Annotated[datetime, AfterValidator(_as_utc)]

# Keep emails in lower case. Thus, the same email matches the same customer.
Email = Annotated[EmailStr, AfterValidator(str.lower)]


def clean_phone(value: str) -> str:
    """Remove spaces and dashes. Keep a leading plus. Reject numbers that are too short or long."""
    digits = re.sub(r"\D", "", value)
    if not 7 <= len(digits) <= 15:
        raise ValueError("Enter a valid phone number")
    return ("+" if value.strip().startswith("+") else "") + digits


class Out(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# Catalog


class CategoryOut(Out):
    id: int
    name: str
    slug: str


class VariantOut(Out):
    id: int
    size: str
    color: str
    stock: int


class ImageOut(Out):
    id: int
    url: str


class ProductCard(Out):
    id: int
    name: str
    slug: str
    price: int
    image: str | None
    category: CategoryOut | None


class ProductDetail(ProductCard):
    description: str
    embroidery: str
    fabric: str
    care: str
    variants: list[VariantOut]
    images: list[ImageOut]


class CatalogFilters(BaseModel):
    categories: list[CategoryOut]
    sizes: list[str]
    colors: list[str]


# Checkout and tracking


class OrderItemIn(BaseModel):
    variant_id: int
    quantity: int = Field(ge=1, le=20)


class OrderIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str
    email: Email | None = None
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=80)
    note: str = Field(default="", max_length=1000)
    items: list[OrderItemIn] = Field(min_length=1, max_length=50)

    _phone = field_validator("phone")(clean_phone)


class OrderItemOut(Out):
    product_name: str
    size: str
    color: str
    unit_price: int
    quantity: int


class StatusEventOut(Out):
    status: OrderStatus
    created_at: UTCTime


class OrderReceipt(Out):
    number: str
    status: OrderStatus
    total: int
    created_at: UTCTime
    items: list[OrderItemOut]
    events: list[StatusEventOut]


class TrackIn(BaseModel):
    number: str
    phone: str

    _phone = field_validator("phone")(clean_phone)


# Admin


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class AdminOut(Out):
    id: int
    email: str
    name: str


class NoteIn(BaseModel):
    body: str = Field(min_length=1, max_length=4000)


class NoteOut(Out):
    id: int
    body: str
    created_at: UTCTime
    admin: AdminOut


class AdminEventOut(StatusEventOut):
    admin: AdminOut | None


class OrderRow(Out):
    id: int
    number: str
    status: OrderStatus
    name: str
    phone: str
    city: str
    total: int
    created_at: UTCTime


class OrderDetail(OrderRow):
    customer_id: int
    email: str | None
    address: str
    customer_note: str
    items: list[OrderItemOut]
    events: list[AdminEventOut]
    notes: list[NoteOut]


class OrderPage(BaseModel):
    items: list[OrderRow]
    total: int


class OrderContactIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    phone: str
    email: Email | None = None
    address: str = Field(min_length=5, max_length=500)
    city: str = Field(min_length=2, max_length=80)

    _phone = field_validator("phone")(clean_phone)


class StatusIn(BaseModel):
    status: OrderStatus


class CustomerRow(Out):
    id: int
    name: str
    phone: str
    email: str | None
    city: str
    order_count: int
    lifetime_value: int
    last_order_at: UTCTime | None


class CustomerDetail(CustomerRow):
    address: str
    created_at: UTCTime
    orders: list[OrderRow]
    notes: list[NoteOut]


class VariantIn(BaseModel):
    id: int | None = None
    size: str = Field(min_length=1, max_length=20)
    color: str = Field(min_length=1, max_length=40)
    stock: int = Field(ge=0)


class ProductIn(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    slug: str = Field(pattern=r"^[a-z0-9]+(-[a-z0-9]+)*$", max_length=160)
    description: str = ""
    embroidery: str = ""
    fabric: str = ""
    care: str = ""
    price: int = Field(gt=0)
    category_id: int | None = None
    is_published: bool = False
    is_featured: bool = False
    variants: list[VariantIn] = []


class AdminProduct(ProductDetail):
    category_id: int | None
    is_published: bool
    is_featured: bool


class Dashboard(BaseModel):
    orders_today: int
    orders_week: int
    orders_month: int
    revenue_month: int
    by_status: dict[OrderStatus, int]
    recent: list[OrderRow]
