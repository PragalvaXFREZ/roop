"""
Order rules.

The server calculates every total. It does not use prices from the browser.
Stock decreases when a customer places an order.
Stock increases again when staff cancel the order.
Delivered and cancelled orders are final. Staff cannot change their status.
"""

import re

from fastapi import HTTPException
from sqlalchemy import or_, select
from sqlalchemy.orm import Session

from app.models import (
    AdminUser,
    Customer,
    Order,
    OrderItem,
    OrderStatus,
    OrderStatusEvent,
    ProductVariant,
)
from app.schemas import OrderIn

FINAL = {OrderStatus.DELIVERED, OrderStatus.CANCELLED}
# Nine digits or fewer fit in every database integer column.
NUMBER = re.compile(r"(?:RP-)?([0-9]{1,9})", re.IGNORECASE)


def parse_number(number: str) -> int | None:
    """Read the order id from "RP-00042", "rp-42" or "42". Return None for other text."""
    match = NUMBER.fullmatch(number.strip())
    return int(match[1]) if match else None


def find_or_create_customer(db: Session, data: OrderIn) -> Customer:
    """Match a customer by phone, then by email. Update the record with the newest details."""
    match = [Customer.phone == data.phone]
    if data.email:
        match.append(Customer.email == data.email)
    customer = db.scalars(
        select(Customer).where(or_(*match)).order_by(Customer.phone != data.phone)
    ).first()
    if not customer:
        customer = Customer(phone=data.phone)
        db.add(customer)
    customer.name = data.name
    customer.email = data.email or customer.email
    customer.address = data.address
    customer.city = data.city
    return customer


def place_order(db: Session, data: OrderIn) -> Order:
    order = Order(
        name=data.name,
        phone=data.phone,
        email=data.email,
        address=data.address,
        city=data.city,
        customer_note=data.note,
        total=0,
    )
    # Join repeated lines for the same variant before the stock check.
    wanted: dict[int, int] = {}
    for line in data.items:
        wanted[line.variant_id] = wanted.get(line.variant_id, 0) + line.quantity

    variants = db.scalars(
        select(ProductVariant).where(ProductVariant.id.in_(wanted)).with_for_update()
    ).all()
    by_id = {v.id: v for v in variants}

    for variant_id, qty in wanted.items():
        variant = by_id.get(variant_id)
        if not variant or not variant.product.is_published:
            raise HTTPException(400, "An item in your cart is no longer available")
        if variant.stock < qty:
            name = variant.product.name
            left = f"Only {variant.stock} left of" if variant.stock else "Sold out:"
            raise HTTPException(409, f"{left} {name} ({variant.size}, {variant.color})")
        variant.stock -= qty
        order.items.append(
            OrderItem(
                variant_id=variant.id,
                product_name=variant.product.name,
                size=variant.size,
                color=variant.color,
                unit_price=variant.product.price,
                quantity=qty,
            )
        )
        order.total += variant.product.price * qty

    order.customer = find_or_create_customer(db, data)
    order.events.append(OrderStatusEvent(status=OrderStatus.PENDING))
    db.add(order)
    db.commit()
    return order


def set_status(db: Session, order: Order, status: OrderStatus, admin: AdminUser) -> Order:
    if order.status in FINAL:
        raise HTTPException(400, f"This order is {order.status}. You cannot change it.")
    if status == order.status:
        return order
    if status == OrderStatus.CANCELLED:
        for item in order.items:
            variant = db.get(ProductVariant, item.variant_id) if item.variant_id else None
            if variant:
                variant.stock += item.quantity
    order.status = status
    order.events.append(OrderStatusEvent(status=status, admin_id=admin.id))
    db.commit()
    return order
