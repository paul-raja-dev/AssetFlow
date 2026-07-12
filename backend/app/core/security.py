from datetime import datetime, timedelta, timezone

import bcrypt
from jose import JWTError, jwt

from app.core.config import settings

# ---------- bcrypt ----------
# Uses the bcrypt library directly: passlib 1.7.4 is incompatible with
# bcrypt >= 4.1 (crashes during backend detection). Hash format ($2b$)
# is identical, so existing hashes keep verifying.


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8")[:72], bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8")[:72], hashed.encode("utf-8"))
    except ValueError:
        return False


# ---------- JWT ----------
ALGORITHM = "HS256"


def create_access_token(subject: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.jwt_expire_hours)
    payload = {"sub": subject, "exp": expire}
    return jwt.encode(payload, settings.jwt_secret, algorithm=ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and return the JWT payload. Raises JWTError on any failure."""
    return jwt.decode(token, settings.jwt_secret, algorithms=[ALGORITHM])
