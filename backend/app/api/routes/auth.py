from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...core import security
from ...core.database import get_db
from ...models.user import User
from ...schemas.auth import LoginRequest, LoginResponse, UserOut
from ..deps import get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/login", response_model=LoginResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    email = payload.email.strip().lower()
    user = db.scalar(select(User).where(User.email == email))
    if user is None or not security.verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="E-mail ou senha incorretos.",
        )
    token = security.create_access_token(user.id, user.role)
    return LoginResponse(
        access_token=token,
        user=UserOut(id=user.id, name=user.name, initials=user.initials, role=user.role),
    )


@router.get("/me", response_model=UserOut)
def me(user: User = Depends(get_current_user)):
    return UserOut(id=user.id, name=user.name, initials=user.initials, role=user.role)
