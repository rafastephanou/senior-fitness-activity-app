from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.orm import Session

from ..core import security
from ..core.database import get_db
from ..models.user import User

_bearer = HTTPBearer(auto_error=False)


def get_current_user(
    creds: HTTPAuthorizationCredentials | None = Depends(_bearer),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Not authenticated")
    try:
        payload = security.decode_token(creds.credentials)
        user_id = int(payload["sub"])
    except Exception:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    user = db.get(User, user_id)
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user


def require_senior(user: User = Depends(get_current_user)) -> User:
    """Guard for senior-only endpoints."""
    if user.role != "senior":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Seniors only")
    return user


def require_tutor(user: User = Depends(get_current_user)) -> User:
    """Guard for tutor-only endpoints."""
    if user.role != "tutor":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Tutors only")
    return user
