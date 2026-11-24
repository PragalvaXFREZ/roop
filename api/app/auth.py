"""
Admin sign-in.

The API keeps the session token in an httpOnly cookie.
Browser scripts cannot read the cookie.
"""

import time
from collections import defaultdict, deque
from datetime import UTC, datetime, timedelta

import bcrypt
import jwt
from fastapi import Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.config import settings
from app.db import get_db
from app.models import AdminUser

COOKIE = "roop_session"
LOGIN_LIMIT = 5  # attempts
LOGIN_WINDOW = 60  # seconds

_attempts: dict[str, deque[float]] = defaultdict(deque)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())


def make_token(admin_id: int) -> str:
    expires = datetime.now(UTC) + timedelta(hours=settings.jwt_hours)
    return jwt.encode({"sub": str(admin_id), "exp": expires}, settings.jwt_secret, "HS256")


# The limit counts failed attempts for each email.
# All requests come through the web proxy, so the client address is the same for all staff.
def check_login_limit(email: str) -> None:
    """Stop sign-in after LOGIN_LIMIT failed attempts in LOGIN_WINDOW seconds."""
    tries = _attempts[email]
    while tries and time.monotonic() - tries[0] > LOGIN_WINDOW:
        tries.popleft()
    if len(tries) >= LOGIN_LIMIT:
        raise HTTPException(429, "Too many attempts. Wait one minute.")


def record_failed_login(email: str) -> None:
    _attempts[email].append(time.monotonic())


def clear_failed_logins(email: str) -> None:
    _attempts.pop(email, None)


def current_admin(request: Request, db: Session = Depends(get_db)) -> AdminUser:
    token = request.cookies.get(COOKIE)
    if not token:
        raise HTTPException(401, "Not signed in")
    try:
        admin_id = int(jwt.decode(token, settings.jwt_secret, ["HS256"])["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise HTTPException(401, "Session is not valid") from None
    admin = db.get(AdminUser, admin_id)
    if not admin:
        raise HTTPException(401, "Session is not valid")
    return admin
